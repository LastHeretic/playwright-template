// helpers/cdp.ts
import { Browser, BrowserContext, Page } from '@playwright/test';
import { chromium } from 'playwright';

let browser: Browser;
let context: BrowserContext;
let page: Page;

export async function connectCDP(): Promise<{ page: Page; browser: Browser }> {
    browser = await chromium.connectOverCDP('');
    context = browser.contexts()[0];
    page = context.pages()[0];
    return { page, browser };
}

export async function disconnectCDP() {
    await browser.close();
}

export function getPage(): Page {
    return page;
}
