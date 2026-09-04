import { Browser, chromium } from '@playwright/test';
import { join } from 'path';

async function run() {
    const browser: Browser = await chromium.launch({
        headless: false,
        executablePath: join('C:', 'chrome', 'chrome.exe'),
    });

    const page = await browser.newPage();
    page.goto('http://google.com');
}

run();