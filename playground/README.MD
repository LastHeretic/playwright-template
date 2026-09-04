Почему именно эти assertions
toBeVisible vs toBeHidden
await expect(page.locator('#network-error')).toBeVisible();
await expect(page.locator('#network-error')).toBeHidden();

toBeVisible — проверяет что элемент есть в DOM и виден пользователю. Учитывает hidden, display:none, visibility:hidden, opacity:0, нулевые размеры.

toBeHidden — противоположное. Подходит для нашего случая потому что мы используем атрибут hidden на элементах ошибок.

Почему не not.toBeVisible()?
Это одно и то же что toBeHidden() — просто менее читаемо. Playwright рекомендует позитивные формы.



toHaveText vs toContainText
// Точное совпадение
await expect(page.locator('#nickname-error')).toHaveText('Минимум 3 символа');

// Частичное совпадение
await expect(page.locator('#success-message')).toContainText('успешно');

toHaveText — строгое совпадение всего текста элемента. Используем для сообщений об ошибках — текст должен быть точным, иначе пользователь получит непонятное сообщение.

toContainText — достаточно что подстрока присутствует. Используем для success-message потому что там есть эмодзи ✅ и нам не важен точный текст — важен факт успеха.



toHaveAttribute vs CSS селектор
await expect(page.locator('#nickname')).toHaveAttribute('aria-invalid', 'true');
await expect(page.locator('#nickname')).not.toHaveAttribute('aria-invalid', 'true');

Проверяем именно aria-invalid а не CSS класс — по трём причинам:

1. Это то что реально влияет на доступность — скринридеры читают этот атрибут

2. CSS классы могут меняться при рефакторинге, aria-invalid — семантический контракт

3. Именно его проверяет наш JS в showError() / clearError()



toBeDisabled vs toHaveAttribute('disabled')
await expect(page.locator('#submit-btn')).toBeDisabled();
await expect(page.locator('#submit-btn')).toBeEnabled();

toBeDisabled() — умнее чем проверка атрибута. Учитывает:
• атрибут disabled
• pointer-events: none
• родительский fieldset[disabled]

Для кнопки submit это важно — мы хотим проверить что пользователь не может нажать, а не просто что атрибут есть.



Почему page.on('request', ...) а не waitForRequest
// Используем
let postCalled = false;
page.on('request', (req) => {
    if (req.url().includes('/users') && req.method() === 'POST') {
        postCalled = true;
    }
});
// ...
expect(postCalled).toBe(false);

// Не используем
await page.waitForRequest('**/users'); // ← зависнет если запроса нет

waitForRequest — ждёт запроса и зависает если он не приходит. Для проверки отсутствия запроса это не подходит — тест будет висеть до таймаута.

page.on('request') — пассивный слушатель. Просто фиксируем факт. После действия проверяем флаг — быстро и надёжно.



Порядок assertions в тестах на занятый никнейм
await expect(page.locator('#nickname-error')).toHaveText('Этот никнейм уже занят');
await expect(page.locator('#nickname')).toHaveAttribute('aria-invalid', 'true');
await expect(page.locator('#network-error')).toBeHidden();
expect(postCalled).toBe(false);

Порядок намеренный — от самого важного к менее важному:

1. Текст ошибки — пользователь это видит
2. Визуальная подсветка поля — пользователь это видит
3. Общий блок скрыт — проверяем что ошибка в правильном месте
4. POST не ушёл — технический факт, важный но не видимый

Если тест упадёт — первый упавший assert сразу скажет что сломалось.



Почему нет await page.waitForTimeout()
Нигде в тестах нет waitForTimeout(500) — это антипаттерн. Вместо этого:

// Ждём конкретного состояния UI
await expect(page.locator('#success-message')).toBeVisible();

// Playwright сам ждёт до defaultTimeout (обычно 5000мс)
// и ретраит assertion пока условие не выполнится

Playwright автоматически ретраит все expect() assertions. Это надёжнее фиксированных задержек — тест не будет ни слишком медленным ни флакающим.



Почему delay в моке а не waitForTimeout в тесте
// В моке
await mockNicknameCheck(page, { available: true }, { delay: 300 });

// В тесте просто кликаем и сразу проверяем
await page.click('#submit-btn');
await expect(page.locator('#submit-btn')).toBeDisabled();

Задержка на стороне мока — потому что нам нужно контролируемое окно для проверки промежуточного состояния. Если задержку ставить в тесте через waitForTimeout — это гонка: запрос может завершиться раньше или позже.



Почему page.route() переопределяется внутри теста а не в beforeEach
// beforeEach — дефолт
await page.route(API_CHECK, (route) =>
    route.fulfill({ body: JSON.stringify({ available: true }) })
);

// Внутри теста — переопределяем только то что нужно
await mockNicknameCheck(page, { available: false });

Playwright обрабатывает маршруты в порядке последний зарегистрированный — первый обработанный. Это значит:

• beforeEach регистрирует дефолт
• тест регистрирует своё поведение поверх
• запрос уходит в обработчик теста, дефолт не вызывается

Альтернатива — page.unroute() перед переопределением. Но это лишний код. Стек маршрутов работает как нужно из коробки.



Почему route.continue() для не-POST запросов в mockRegister
await page.route(API_USERS, async (route) => {
    if (route.request().method() !== 'POST') {
        await route.continue(); // ← пропускаем GET
        return;
    }
    // обрабатываем только POST
});

Паттерн **/users матчит любой запрос к /users — включая GET /users/check. Без route.continue() мы бы перехватили проверку никнейма и вернули бы ответ регистрации.

route.continue() говорит Playwright — передай запрос следующему обработчику в стеке. Там его поймает дефолтный мок из beforeEach.



Почему toHaveLength(0) а не toBe(false) для проверки запросов
// Для массива запросов
expect(apiRequests).toHaveLength(0);

// Для булевого флага
expect(postCalled).toBe(false);

Разные инструменты для разных задач:

toHaveLength(0) — когда собираем все запросы в массив. Если тест упадёт, Playwright покажет содержимое массива — сразу видно какие запросы ушли.

toBe(false) — когда нас интересует только факт конкретного запроса. Проще и читаемее чем заводить массив ради одного флага.



Почему проверяем и текст ошибки и aria-invalid отдельно
await expect(page.locator('#nickname-error')).toHaveText('Этот никнейм уже занят');
await expect(page.locator('#nickname')).toHaveAttribute('aria-invalid', 'true');

Это два независимых факта — один может сломаться без другого:

• Текст ошибки есть, но aria-invalid не выставлен → поле не подсвечено красным, пользователь не видит где ошибка
• aria-invalid выставлен, но текст пустой → поле красное, но непонятно почему

Оба assert нужны потому что оба влияют на UX. Один тест — несколько assertions — это нормально когда они проверяют одно поведение с разных сторон.



Итоговая философия assertions в этих тестах
Каждый assert отвечает на вопрос:
"Что именно увидит или не увидит пользователь?"

Не "что вернул сервер"     — это тестирует бэкенд
Не "какой метод вызвался"  — это unit тест
А именно "что произошло в UI"

Поэтому нет проверок вроде expect(fetchMock).toHaveBeenCalledWith(...) — это детали реализации. Если завтра fetch заменят на axios — тесты не должны сломаться.
