import { test } from '@playwright/test';
import { connectCDP, disconnectCDP } from '../connect-cdp.mjs';
let pageCDP;
let browserCDP;
test.beforeEach(async () => {
    const { page, browser } = await connectCDP();
    pageCDP = page;
    browserCDP = browser;
});
test.afterEach(async () => {
    await disconnectCDP();
});
const d = 'sdf';
test('создание статьи', async () => {
    await pageCDP.goto('https://demo.realworld.show/');
    await pageCDP.pause();
});
function f(sdf) {
}
