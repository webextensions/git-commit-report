#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');

const chalk = require('chalk');

const scriptName = path.basename(process.argv[1]);

console.log(chalk.gray('\nFormat:   ' + scriptName + ' [--verbose] [commit-identifier (default: HEAD)]'));
console.log(chalk.gray('Examples: ' + scriptName));
console.log(chalk.gray('          ' + scriptName + ' HEAD~4'));
console.log(chalk.gray('          ' + scriptName + ' my-branch'));
console.log(chalk.gray('          ' + scriptName + ' a0c98cd'));
console.log(chalk.gray('          ' + scriptName + ' --verbose v1.0.0'));
console.log('');

const args = Array.from(process.argv);
args.shift();
args.shift();

let verbose = false;
if (args[0] === '--verbose') {
    args.shift();
    verbose = true;
}

if (!args.length) {
    args.push('HEAD');
}

for (let i = 0; i < args.length; i++) {
    const commitIdentifier = args[i];

    // Block - Tags
    {
        const cmdTag = 'git tag --contains ' + commitIdentifier;
        let tags;
        try {
            if (verbose) {
                console.log(chalk.gray('$ ' + cmdTag));
            }
            tags = (
                execSync(cmdTag, {stdio : 'pipe' })
                    .toString()
                    .trim()
                    .replace(/\s+/g, ' ')
                    .split(' ')
                    .join(', ')
            );
        } catch (e) {
            console.log(chalk.red(`Encountered an error in running command:\n    $ ${cmdTag}`));
            console.error(e);
            process.exit(1);
        }

        if (tags === '') {
            process.stdout.write(chalk.blue('Tags: ') + chalk.red('This commit is not available in any of the tags'));
        } else {
            if (commitIdentifier === 'HEAD') {
                process.stdout.write(chalk.blue('Tags: ') + tags);
            } else {
                process.stdout.write(chalk.blue('Tags: ') + chalk.yellow(tags));
            }
        }
        console.log('');
    }

    // Block - Branches
    {
        const cmdBranch = 'git branch -r --contains ' + commitIdentifier;
        let branches;
        try {
            if (verbose) {
                console.log(chalk.gray('$ ' + cmdBranch));
            }
            branches = (
                execSync(cmdBranch, {stdio : 'pipe' })
                    .toString()
                    .replace('origin/HEAD -> origin/master', '')
                    .trim()
                    .replace(/\s+/g, ' ')
                    .replace(/origin\//g, '')
                    .split(' ')
                    .join(', ')
            );
        } catch (e) {
            console.log(chalk.red(`Encountered an error in running command:\n    $ ${cmdBranch}`));
            console.error(e);
            process.exit(1);
        }

        // Good to know: 'git rev-parse --abbrev-ref HEAD'
        if (branches === '') {
            process.stdout.write(chalk.blue('Branches: ') + chalk.red('This commit is not available in any of the remote branches'));
        } else {
            if (commitIdentifier === 'HEAD') {
                process.stdout.write(chalk.blue('Branches: ') + branches);
            } else {
                process.stdout.write(chalk.blue('Branches: ') + chalk.yellow(branches));
            }
        }
        console.log('');
    }

    // https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History
    const sha = execSync('git log -n 1 ' + commitIdentifier + ' --format="%H"').toString();
    process.stdout.write(chalk.blue('SHA: ') + sha);

    const subject = execSync('git log -n 1 ' + commitIdentifier + ' --format="%s"').toString();
    process.stdout.write(chalk.blue('Subject: ') + subject);

    console.log('');
}
