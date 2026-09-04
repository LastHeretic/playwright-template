1. Установка: 
   - Обновляем Git - нужно последний
   - выставляем Node.js 24 версии
   - npm i в корне
   - качаем последний стабильный браузер, сейчас это 148 - [chromium](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Win_x64/1610489/) это для Win, для других платформ на том же ресурсе
   - все расширения которые я показывал в видео + eslint

2. Структура: 
    - Используем playwright как просто либу через код в [run.ts](./playground/run.ts), `executablePath:` <путь к браузеру в системе> - команда запуска -> `npm run start:ui`
    - Используем как тестовый фреймворк для тестов через конфиг [config](./playwright.config.ts), `executablePath:` <путь к браузеру в системе> - команда запуска -> `npm run start:simple`. В примере теста  [demo.test.ts](./tests/demo.test.ts) написаны базовые примеры по работе.


3. Настройка для VsCode
   - копируем весь текст отсюда [./user-settings.json](./user-settings.json) в локальные настройки vscode -> `ctrl+shift+p` ->  `Preferences: Open User Settings (JSON)`
   - после копирования настроек, vscode будет смотреть на [eslint.config.js](./eslint.config.js) и использовать эти правила для форматирования, то есть `prettier` не нужен. Реагирует на сохранение и `ctrl + shift + f`
   - есть еще мои базовые удобные сниппеты в [snippets](./snippets), если нужно. Текст нужно поместить в -> `ctrl+shift+p` ->  `Snippets: Configure Snippets` -> `typescript.json`
   - Форматирование также срабатывает на создание комита, то есть если будут ошибки которые нужно исправить - то комит не создастся. Убрать это - удалить блок `lint-staged` `package.json` -> [lint-staged](./package.json#38)