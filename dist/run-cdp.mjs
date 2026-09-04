import { exec, execSync } from 'node:child_process';
import { join } from 'node:path';
import waitOn from 'wait-on';
const CHROME_PATH = join('C:', 'chrome-w', 'chrome.exe');
const CDP_PORT = 9222;
async function run() {
    const chrome = exec(`"${CHROME_PATH}" --remote-debugging-port=${CDP_PORT} --remote-allow-origins=* --window-size=1920,1080`);
    await waitOn({ resources: [`http://localhost:${CDP_PORT}`], timeout: 30_000 });
    try {
        execSync('npm run playwright -- test -c ./pw-cdp.config.ts --debug', { stdio: 'inherit' });
    }
    finally {
        chrome.kill();
    }
}
run();
function f(param) {
}
