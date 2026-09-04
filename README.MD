1. Установка: 
   - Обновляем Git - нужно последний
   - выставляем Node.js 24 версии
   - npm i в корне
   - качаем последний стабильный браузер тестовый браузер - [test-chrome](https://googlechromelabs.github.io/chrome-for-testing/#stable) 

2. Структура: 
    - Используем playwright как просто либу через код в [run.ts](./playground/run.ts), `executablePath:` <путь к браузеру в системе> - команда запуска -> `npm run start:ui`
    - Используем как тестовый фреймворк для тестов через конфиг [config](./playwright.config.ts), `executablePath:` <путь к браузеру в системе> - команда запуска -> `npm run start:simple`. В примере теста  [demo.test.ts](./tests/demo.test.ts) написаны базовые примеры по работе.

3. Allure
   - чтобы посмотреть репорт -> сделать allure репорт из allure-results `npm i allure`  -> открыть репорт `npm i allure:open` 