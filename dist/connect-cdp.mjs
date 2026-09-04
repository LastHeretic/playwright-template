import { chromium } from 'playwright';
let browser;
let context;
let page;
export async function connectCDP() {
    browser = await chromium.connectOverCDP('');
    context = browser.contexts()[0];
    page = context.pages()[0];
    return { page, browser };
}
export async function disconnectCDP() {
    await browser.close();
}
export function getPage() {
    return page;
}
