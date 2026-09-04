import { readFileSync } from 'fs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

function setPreCommitHook() {
    const gitConfigPath = join('.git', 'config');
    const gitConfig = readFileSync(gitConfigPath, 'utf8')
        .toString()
        .split('\n');

    const hasHooksPath = gitConfig.find((str) => str.includes('hooksPath'));
    if (hasHooksPath) {
        return;
    }

    const configWithHooks: string[] = [];
    const customHooksPath = './.git-hooks';
    gitConfig.forEach((str) => {
        configWithHooks.push(str);
        if (str.includes('[core]')) {
            configWithHooks.push('    hooksPath = ' + customHooksPath);
        }
    });

    writeFileSync(gitConfigPath, configWithHooks.join('\n'));
}

setPreCommitHook();

async function name(params:any) {
    const p = new Promise(() => {});
    return p;
}
