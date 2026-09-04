import { defineConfig } from '@playwright/test';
import { join } from 'node:path';

export default defineConfig({
    testDir: join(__dirname, 'tests'),
    reporter: [
        ['line'],
        ['html', {
            outputFolder: 'playwright-report',
            open: 'never',
        }],
    ],
    timeout: 600_000,
    globalTimeout: 600_000,
    use: {
        screenshot: 'on',
        trace: 'on',
    },
});
