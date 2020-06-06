#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');

const chalk = require('chalk');

const scriptName = path.basename(process.argv[1]);

console.log(chalk.gray('\nFormat:   ' + scriptName + ' [commit-identifier (default: HEAD)]'));
console.log(chalk.gray('Examples: ' + scriptName));
console.log(chalk.gray('          ' + scriptName + ' HEAD~4'));
console.log(chalk.gray('          ' + scriptName + ' my-branch'));
console.log(chalk.gray('          ' + scriptName + ' a0c98cd704c56840576eefd8c863ef714a82b23b'));
console.log('');

const args = Array.from(process.argv);
args.shift();
args.shift();

if (!args.length) {
    args.push('HEAD');
}

for (let i = 0; i < args.length; i++) {
    const commitIdentifier = args[i];

    const cmd = 'git branch -r --contains ' + commitIdentifier;
    let branch;
    try {
        branch = (
            execSync(cmd, {stdio : 'pipe' })
                .toString()
                .replace('origin/HEAD -> origin/master', '')
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/origin\//g, '')
                .split(' ')
                .join(', ')
        );
    } catch (e) {
        console.log(chalk.red(`Encountered an error in running command:\n    $ ${cmd}`));
        console.error(e);
        process.exit(1);
    }

    // Good to know: 'git rev-parse --abbrev-ref HEAD'
    if (branch === '') {
        process.stdout.write(chalk.blue('Branch: ') + chalk.red('This commit is not available in any of the remote branches.'));
    } else {
        if (commitIdentifier === 'HEAD') {
            process.stdout.write(chalk.blue('Branch: ') + branch);
        } else {
            process.stdout.write(chalk.blue('Branch: ') + chalk.yellow(branch));
        }
    }
    console.log('');

    // https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History
    const sha = execSync('git log -n 1 ' + commitIdentifier + ' --format="%H"').toString();
    process.stdout.write(chalk.blue('SHA: ') + sha);

    const subject = execSync('git log -n 1 ' + commitIdentifier + ' --format="%s"').toString();
    process.stdout.write(chalk.blue('Subject: ') + subject);

    console.log('');
}
