// Намеренно vanilla JS без фреймворков —
// чтобы тесты были про тестирование, а не про фреймворк.
// Форма намеренно простая: никнейм + email + пароль.
// Валидация на клиенте — синхронная, сразу при вводе.
// Сетевые запросы — два: проверка уникальности никнейма и регистрация.

const API_BASE = 'https://api.example.com';

// ─── DOM refs ────────────────────────────────────────────────────────────────

const form = document.getElementById('register-form');
const nicknameEl = document.getElementById('nickname');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const successMsg = document.getElementById('success-message');

// ─── Validation rules ────────────────────────────────────────────────────────

// Правила вынесены отдельно — их легко читать и легко тестировать вручную.
// Каждое правило возвращает строку ошибки или null если всё ок.

const rules = {
    nickname: (value) => {
        if (!value) return 'Никнейм обязателен';
        if (value.length < 3) return 'Минимум 3 символа';
        if (value.length > 20) return 'Максимум 20 символов';
        // Только латиница, цифры, подчёркивание
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Только латиница, цифры и _';
        return null;
    },
    email: (value) => {
        if (!value) return 'Email обязателен';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный email';
        return null;
    },
    password: (value) => {
        if (!value) return 'Пароль обязателен';
        if (value.length < 8) return 'Минимум 8 символов';
        // Хотя бы одна цифра
        if (!/\d/.test(value)) return 'Пароль должен содержать цифру';
        // Хотя бы одна заглавная
        if (!/[A-Z]/.test(value)) return 'Пароль должен содержать заглавную букву';
        return null;
    },
};

// ─── UI helpers ──────────────────────────────────────────────────────────────

function showError(inputEl, message) {
    // data-атрибут на инпуте — удобно для селекторов в тестах
    inputEl.setAttribute('aria-invalid', 'true');
    // Ищем соседний элемент ошибки по соглашению: id = `${inputId}-error`
    const errorEl = document.getElementById(`${inputEl.id}-error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
    }
}

function clearError(inputEl) {
    inputEl.removeAttribute('aria-invalid');
    const errorEl = document.getElementById(`${inputEl.id}-error`);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
    }
}

function showNetworkError(message) {
    const el = document.getElementById('network-error');
    el.textContent = message;
    el.hidden = false;
}

function clearNetworkError() {
    const el = document.getElementById('network-error');
    el.textContent = '';
    el.hidden = true;
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Загрузка...' : 'Зарегистрироваться';
}

// ─── Inline validation (при вводе) ───────────────────────────────────────────

// Валидация при blur — стандартная UX практика.
// При input — только если поле уже было помечено как невалидное (убираем ошибку сразу).

[nicknameEl, emailEl, passwordEl].forEach((el) => {
    el.addEventListener('blur', () => {
        const error = rules[el.id]?.(el.value.trim());
        if (error) showError(el, error);
        else clearError(el);
    });

    el.addEventListener('input', () => {
        // Если ошибка уже показана — проверяем на каждый символ
        if (el.getAttribute('aria-invalid')) {
            const error = rules[el.id]?.(el.value.trim());
            if (!error) clearError(el);
            else showError(el, error);
        }
    });
});

// ─── Network ─────────────────────────────────────────────────────────────────

async function checkNicknameUnique(nickname) {
    // GET /users/check?nickname=...
    // 200 { available: true }  — никнейм свободен
    // 200 { available: false } — занят
    const res = await fetch(
        `${API_BASE}/users/check?nickname=${encodeURIComponent(nickname)}`
    );
    if (!res.ok) throw new Error('Ошибка проверки никнейма');
    return res.json(); // { available: boolean }
}

async function registerUser(data) {
    // POST /users
    // 201 { id, nickname, email } — успех
    // 409 { error: 'nickname_taken' } — никнейм занят (race condition)
    // 422 { error: 'validation_error', fields: [...] } — невалидные данные
    // 500 — серверная ошибка
    const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (res.status === 409) throw new Error('Никнейм уже занят');
    if (res.status === 422) throw new Error('Данные не прошли проверку сервера');
    if (!res.ok) throw new Error('Ошибка сервера. Попробуйте позже');

    return res.json();
}

// ─── Submit ───────────────────────────────────────────────────────────────────

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearNetworkError();

    const nickname = nicknameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;

    // Валидируем все поля перед отправкой
    const errors = {
        nickname: rules.nickname(nickname),
        email: rules.email(email),
        password: rules.password(password),
    };

    let hasErrors = false;
    if (errors.nickname) { showError(nicknameEl, errors.nickname); hasErrors = true; }
    if (errors.email) { showError(emailEl, errors.email); hasErrors = true; }
    if (errors.password) { showError(passwordEl, errors.password); hasErrors = true; }
    if (hasErrors) return;

    setLoading(true);

    try {
        // Шаг 1: проверяем уникальность никнейма
        const { available } = await checkNicknameUnique(nickname);
        if (!available) {
            showError(nicknameEl, 'Этот никнейм уже занят');
            return;
        }

        // Шаг 2: регистрируем
        await registerUser({ nickname, email, password });

        // Успех
        form.hidden = true;
        successMsg.hidden = false;

    } catch (err) {
        showNetworkError(err.message);
    } finally {
        setLoading(false);
    }
});
