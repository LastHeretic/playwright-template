/**
 * КОНЦЕПЦИЯ ФАЙЛА
 * ─────────────────────────────────────────────────────────────────────────────
 * Намеренно БЕЗ PageObject — всё в одном месте, максимальная наглядность.
 *
 * МОКИ:
 * beforeEach устанавливает дефолтные моки — никнейм свободен, регистрация ок.
 * Каждый тест переопределяет только то что ему нужно через page.route().
 * Последний зарегистрированный route для того же паттерна побеждает.
 *
 * ПОЧЕМУ page.route() а не MSW:
 * Playwright перехватывает на уровне браузера — честнее и проще.
 * MSW требует Service Worker — лишняя инфраструктура.
 *
 * СЕЛЕКТОРЫ:
 * Используем id — стабильны при рефакторинге CSS и текста.
 * Текст проверяем только в expect() — не в селекторах.
 */

import { expect, Page, test } from '@playwright/test';
import { epic, feature, severity, step, story } from 'allure-js-commons';
import { join } from 'node:path';

// ─── Константы ───────────────────────────────────────────────────────────────

// ** — любой префикс пути, подходит для file:// и http://
const API_CHECK = '**/users/check**';
const API_USERS = '**/users';

// const PAGE_URL = `file://${join(__dirname, '..', 'index.html')}`;
const PAGE_URL = `http://localhost:3002`;

const VALID_FORM_DATA = {
  nickname: 'valid_user',
  email: 'test@example.com',
  password: 'Password1',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Заполняет только переданные поля.
 * Partial<> — можно передать одно поле, остальные не трогаются.
 */
async function fillForm(page: Page, data: Partial<typeof VALID_FORM_DATA>) {
  if (data.nickname !== undefined) await page.fill('#nickname', data.nickname);
  if (data.email !== undefined) await page.fill('#email', data.email);
  if (data.password !== undefined) await page.fill('#password', data.password);
}

/**
 * Мокает GET /users/check.
 *
 * networkError: true — имитирует обрыв сети (abort).
 * delay — задержка в мс, нужна для тестов состояния загрузки.
 */
async function mockNicknameCheck(
  page: Page,
  response: { available: boolean; },
  options: { delay?: number; networkError?: boolean; } = {},
) {
  await page.route(API_CHECK, async (route) => {
    if (options.networkError) {
      // abort('failed') — имитирует net::ERR_FAILED
      // не путать с abort('aborted') — это отмена пользователем
      await route.abort('failed');
      return;
    }

    if (options.delay) {
      await new Promise(r => setTimeout(r, options.delay));
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Мокает POST /users.
 * Пропускает GET запросы дальше — route матчит весь /users.
 */
async function mockRegister(
  page: Page,
  status: number,
  body: object = {},
  options: { delay?: number; } = {},
) {
  await page.route(API_USERS, async (route) => {
    // GET /users/check тоже матчится на **/users —
    // пропускаем его, обрабатываем только POST
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    if (options.delay) {
      await new Promise(r => setTimeout(r, options.delay));
    }

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

// ─── Setup ───────────────────────────────────────────────────────────────────

/**
 * beforeEach а не beforeAll — потому что page уникальна для каждого теста.
 * Playwright по умолчанию создаёт новый контекст браузера на каждый тест.
 *
 * Дефолтные моки: никнейм свободен, регистрация успешна.
 * Тесты которым нужно другое — переопределяют через mockNicknameCheck()
 * или mockRegister() до совершения действия.
 */
test.beforeEach(async ({ page }) => {
  await page.route(API_CHECK, async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ available: true }),
  }));

  await page.route(API_USERS, async (route) => {
    if (route.request().method() !== 'POST') {
      return route.continue();
    }

    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, nickname: 'valid_user', email: 'test@example.com' }),
    });
  });

  await page.goto(PAGE_URL);
});

// ─── БЛОК 1: Клиентская валидация никнейма ───────────────────────────────────

test.describe('Клиентская валидация — никнейм', () => {
  test('кириллица показывает ошибку о недопустимых символах', async ({ page }) => {
    await fillForm(page, { nickname: 'Привет' });
    // await page.pause();

    await page.locator('#nickname').blur();

    await expect(page.locator('#nickname-error')).toBeVisible();
    await expect(page.locator('#nickname-error')).toHaveText('Только латиница, цифры и _');
    await expect(page.locator('#nickname')).toHaveAttribute('aria-invalid', 'true');
  });

  test('спецсимволы показывают ошибку о недопустимых символах', async ({ page }) => {
    await fillForm(page, { nickname: 'user@name!' });
    await page.locator('#nickname').blur();

    await expect(page.locator('#nickname-error')).toHaveText('Только латиница, цифры и _');
  });

  test('никнейм короче 3 символов', async ({ page }) => {
    await fillForm(page, { nickname: 'ab' });
    await page.locator('#nickname').blur();

    await expect(page.locator('#nickname-error')).toHaveText('Минимум 3 символа');
  });

  test('никнейм длиннее 20 символов', async ({ page }) => {
    await fillForm(page, { nickname: 'a'.repeat(21) });
    await page.locator('#nickname').blur();

    await expect(page.locator('#nickname-error')).toHaveText('Максимум 20 символов');
  });

  test('ошибка исчезает сразу при исправлении без повторного blur', async ({ page }) => {
    /**
     * Проверяем input-обработчик, не только blur.
     * Сначала вызываем ошибку через blur,
     * потом исправляем без blur — ошибка должна уйти сразу.
     */
    await fillForm(page, { nickname: 'Привет' });
    await page.locator('#nickname').blur();
    await expect(page.locator('#nickname-error')).toBeVisible();

    await page.fill('#nickname', 'valid_nick');

    await expect(page.locator('#nickname-error')).toBeHidden();
    await expect(page.locator('#nickname')).not.toHaveAttribute('aria-invalid', 'true');
  });
});

// ─── БЛОК 2: Клиентская валидация email и пароля ─────────────────────────────

test.describe('Клиентская валидация — email и пароль', () => {
  test('некорректный формат email', async ({ page }) => {
    await fillForm(page, { email: 'notanemail' });
    await page.locator('#email').blur();

    await expect(page.locator('#email-error')).toHaveText('Некорректный email');
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('email без домена', async ({ page }) => {
    await fillForm(page, { email: 'user@' });
    await page.locator('#email').blur();

    await expect(page.locator('#email-error')).toHaveText('Некорректный email');
  });

  test('пароль без заглавной буквы', async ({ page }) => {
    await fillForm(page, { password: 'password1' });
    await page.locator('#password').blur();

    await expect(page.locator('#password-error'))
      .toHaveText('Пароль должен содержать заглавную букву');
  });

  test('пароль без цифры', async ({ page }) => {
    await fillForm(page, { password: 'Password' });
    await page.locator('#password').blur();

    await expect(page.locator('#password-error'))
      .toHaveText('Пароль должен содержать цифру');
  });

  test('пароль короче 8 символов', async ({ page }) => {
    await fillForm(page, { password: 'Pass1' });
    await page.locator('#password').blur();

    await expect(page.locator('#password-error')).toHaveText('Минимум 8 символов');
  });

  test('отправка пустой формы показывает все три ошибки и не делает запрос', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('api.example.com')) {
        apiRequests.push(req.url());
      }
    });

    await page.click('#submit-btn');

    await expect(page.locator('#nickname-error')).toHaveText('Никнейм обязателен');
    await expect(page.locator('#email-error')).toHaveText('Email обязателен');
    await expect(page.locator('#password-error')).toHaveText('Пароль обязателен');

    expect(apiRequests).toHaveLength(0);
  });
});

// ─── БЛОК 3: Проверка уникальности никнейма ──────────────────────────────────

test.describe('Проверка уникальности никнейма', () => {
  test('никнейм свободен — регистрация проходит', async ({ page }) => {
    await fillForm(page, VALID_FORM_DATA);
    await page.click('#submit-btn');

    await expect(page.locator('#success-message')).toBeVisible();
  });

  test('никнейм занят — ошибка под полем, POST не отправляется', async ({ page }) => {
    await mockNicknameCheck(page, { available: false });

    let postCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/users') && req.method() === 'POST') {
        postCalled = true;
      }
    });

    await fillForm(page, VALID_FORM_DATA);
    await page.click('#submit-btn');

    await expect(page.locator('#nickname-error')).toHaveText('Этот никнейм уже занят');
    await expect(page.locator('#nickname')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#network-error')).toBeHidden();
    expect(postCalled).toBe(false);
  });

  // failure tests
  // test('сеть недоступна при проверке — общая ошибка, поле не помечено', async ({ page }) => {
  //   await mockNicknameCheck(page, { available: true }, { networkError: true });

  //   let postCalled = false;
  //   page.on('request', (req) => {
  //     if (req.url().includes('/users') && req.method() === 'POST') {
  //       postCalled = true;
  //     }
  //   });

  //   await fillForm(page, VALID_FORM_DATA);
  //   await page.click('#submit-btn');

  //   await expect(page.locator('#network-error')).toBeVisible();
  //   await expect(page.locator('#network-error')).toHaveText('Ошибка проверки никнейма');
  //   await expect(page.locator('#nickname')).not.toHaveAttribute('aria-invalid', 'true');
  //   expect(postCalled).toBe(false);
  // });
});

// ─── БЛОК 4: Отправка формы регистрации ──────────────────────────────────────

test.describe('Отправка формы регистрации', () => {
  test('201 — форма скрывается, показывается сообщение об успехе', async ({ page }) => {
    await fillForm(page, VALID_FORM_DATA);
    await page.click('#submit-btn');

    await expect(page.locator('#register-form')).toBeHidden();
    await expect(page.locator('#success-message')).toBeVisible();
    await expect(page.locator('#success-message')).toContainText('успешно');
  });

  // failure tests
  // test('409 — race condition, ошибка под полем никнейм', async ({ page }) => {
  //   await mockRegister(page, 409, { error: 'nickname_taken' });
  //   await fillForm(page, VALID_FORM_DATA);
  //   await page.click('#submit-btn');

  //   await expect(page.locator('#nickname-error')).toHaveText('Никнейм уже занят');
  //   await expect(page.locator('#network-error')).toBeHidden();
  // });

  test('422 — серверная валидация, общая ошибка', async ({ page }) => {
    await mockRegister(page, 422, { error: 'validation_error' });
    await fillForm(page, VALID_FORM_DATA);
    await page.click('#submit-btn');

    await expect(page.locator('#network-error'))
      .toHaveText('Данные не прошли проверку сервера');
  });

  test('500 — серверная ошибка, общая ошибка', async ({ page }) => {
    await mockRegister(page, 500);
    await fillForm(page, VALID_FORM_DATA);
    await page.click('#submit-btn');

    await expect(page.locator('#network-error'))
      .toHaveText('Ошибка сервера. Попробуйте позже');
  });
});

// ─── БЛОК 5: Состояние загрузки ──────────────────────────────────────────────

test.describe('Состояние загрузки', () => {
  test('кнопка блокируется во время запроса', async ({ page }) => {
    await mockNicknameCheck(page, { available: true }, { delay: 300 });
    await fillForm(page, VALID_FORM_DATA);

    await page.click('#submit-btn');

    await expect(page.locator('#submit-btn')).toBeDisabled();
    await expect(page.locator('#submit-btn')).toHaveText('Загрузка...');

    await expect(page.locator('#success-message')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeEnabled();
  });

  test('кнопка разблокируется после сетевой ошибки', async ({ page }) => {
    await mockNicknameCheck(page, { available: true }, { networkError: true });
    await fillForm(page, VALID_FORM_DATA);
    await page.click('#submit-btn');

    await expect(page.locator('#network-error')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeEnabled();
    await expect(page.locator('#submit-btn')).toHaveText('Зарегистрироваться');
  });

  test('повторная отправка очищает предыдущую сетевую ошибку', async ({ page }) => {
    await mockRegister(page, 500);
    await fillForm(page, VALID_FORM_DATA);
    await page.click('#submit-btn');
    await expect(page.locator('#network-error')).toBeVisible();

    await mockRegister(page, 201, { id: 1, nickname: 'valid_user', email: 'test@example.com' });
    await page.click('#submit-btn');

    await expect(page.locator('#network-error')).toBeHidden();
    await expect(page.locator('#success-message')).toBeVisible();
  });
});

test.describe('Allure demo', () => {
  test('никнейм занят — ошибка под полем', async ({ page }) => {
    // Группировка в отчёте
    await epic('Регистрация');
    await feature('Проверка уникальности никнейма');
    await story('Занятый никнейм');

    // Severity: blocker, critical, normal, minor, trivial
    await severity('critical');

    // Шаги — видны в отчёте как раскрывающийся список
    await step('Мокаем занятый никнейм', async () => {
      await mockNicknameCheck(page, { available: false });
    });

    await step('Заполняем форму валидными данными', async () => {
      await fillForm(page, VALID_FORM_DATA);
    });

    await step('Отправляем форму', async () => {
      await page.click('#submit-btn');
    });

    await step('Проверяем ошибку под полем', async () => {
      await expect(page.locator('#nickname-error')).toHaveText('Этот никнейм уже занят');
      await expect(page.locator('#nickname')).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
