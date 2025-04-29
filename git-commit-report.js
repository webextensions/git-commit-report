#!/usr/bin/env node

const path = require('node:path');
const { execSync } = require('node:child_process');
const { parseArgs } = require('node:util');

const chalk = require('chalk');

const scriptName = path.basename(process.argv[1]);

// Show help information
console.log(chalk.gray('\nFormat:   ' + scriptName + ' [--verbose] [commit-identifier (default: HEAD)]'));
console.log(chalk.gray('Examples: ' + scriptName));
console.log(chalk.gray('          ' + scriptName + ' HEAD~4'));
console.log(chalk.gray('          ' + scriptName + ' my-branch'));
console.log(chalk.gray('          ' + scriptName + ' a0c98cd'));
console.log(chalk.gray('          ' + scriptName + ' --verbose v1.0.0'));
console.log('');

// Parse command line arguments using Node.js native utility
const options = {
    options: {
        verbose: {
        type: 'boolean',
            default: false
        }
    }
};

const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: options.options,
    allowPositionals: true
});

const verbose = values.verbose;
let commitIdentifiers = positionals.length > 0 ? positionals : ['HEAD'];

const naturalSort = (a, b) => {
    return a.localeCompare(b, undefined, { numeric: true });
};

for (let i = 0; i < commitIdentifiers.length; i++) {
    const commitIdentifier = commitIdentifiers[i];

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
                    .sort(naturalSort)
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
            const tagOrTags = tags.split(', ').length === 1 ? 'Tag' : 'Tags';
            if (commitIdentifier === 'HEAD') {
                process.stdout.write(chalk.blue(`${tagOrTags}: `) + tags);
            } else {
                process.stdout.write(chalk.blue(`${tagOrTags}: `) + chalk.yellow(tags));
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

                    // // Approach 1
                    // .replace('origin/HEAD -> origin/master', '')
                    // .replace('origin/HEAD -> origin/main', '')

                    // // Approach 2 (More generic)
                    // .replace(/origin\/HEAD -> origin\/\S+/g, '')

                    // Approach 3 (Even more generic)
                    .replace(/\S+\/HEAD -> \S+\/\S+/g, '')

                    .trim()
                    .replace(/\s+/g, ' ')
                    .replace(/origin\//g, '')
                    .split(' ')
                    .sort(naturalSort)
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
            const branchOrBranches = branches.split(', ').length === 1 ? 'Branch' : 'Branches';
            if (commitIdentifier === 'HEAD') {
                process.stdout.write(chalk.blue(`${branchOrBranches}: `) + branches);
            } else {
                process.stdout.write(chalk.blue(`${branchOrBranches}: `) + chalk.yellow(branches));
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
