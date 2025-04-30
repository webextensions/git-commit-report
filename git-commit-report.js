#!/usr/bin/env node

const { execSync } = require('node:child_process');
const path = require('node:path');
const { parseArgs } = require('node:util');

const chalk = require('chalk');

// Parse command line arguments using Node.js native utility
const options = {
    options: {
        verbose: {
        type: 'boolean',
            default: false
        },
        version: {
            short: 'v',
            type: 'boolean',
            default: false
        },
        help: {
            short: 'h',
            type: 'boolean',
            default: false
        }
    }
};

const showHelp = () => {
    const scriptName = path.basename(process.argv[1]);

    console.log(chalk.gray('Format:   ' + scriptName + ' [--help/-h] [--version/-v] [--verbose] [commit-identifier (default: HEAD)]'));
    console.log(chalk.gray('Examples: ' + scriptName));
    console.log(chalk.gray('          ' + scriptName + ' HEAD~4'));
    console.log(chalk.gray('          ' + scriptName + ' my-branch'));
    console.log(chalk.gray('          ' + scriptName + ' a0c98cd'));
    console.log(chalk.gray('          ' + scriptName + ' --verbose v1.0.0'));
    console.log(chalk.gray('          ' + scriptName + ' --help'));
    console.log(chalk.gray('          ' + scriptName + ' --version'));
};

let values,
    positionals;

try {
    ({ values, positionals } = parseArgs({
        args: process.argv.slice(2),
        options: options.options,
        allowPositionals: true,
        strict: true
    }));
} catch (err) {
    console.log('');
    console.error(chalk.red('Error parsing arguments:'), err.message);
    console.log('');
    showHelp();
    console.log('');
    process.exit(1);
}

const verbose = values.verbose;
const version = values.version;
const help = values.help;
let commitIdentifiers = positionals.length > 0 ? positionals : ['HEAD'];

if (version) {
    const {
        name: appName,
        version: appVersion
    } = require('./package.json');

    console.log('');
    console.log(chalk.blue(`${appName} version: `) + chalk.green(`v${appVersion}`));
    console.log('');
    process.exit(0);
}

const naturalSort = (a, b) => {
    return a.localeCompare(b, undefined, { numeric: true });
};

if (help) {
    console.log('');
    showHelp();
    console.log('');
    process.exit(0);
}

if (positionals.length === 0) {
    console.log('');
    showHelp();
}

console.log('');

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
        } catch (err) {
            console.log(chalk.red(`Encountered an error in running command:\n    $ ${cmdTag}`));
            console.error(chalk.red(err.message.trim()));
            console.log('');
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
        } catch (err) {
            console.log(chalk.red(`Encountered an error in running command:\n    $ ${cmdBranch}`));
            console.error(chalk.red(err.message.trim()));
            console.log('');
            process.exit(1);
        }

        // Good to know: 'git rev-parse --abbrev-ref HEAD' (to display the name of the currently checked-out branch)
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
    const sha = String(execSync('git log -n 1 ' + commitIdentifier + ' --format="%H"'));
    process.stdout.write(chalk.blue('SHA: ') + sha);

    const subject = String(execSync('git log -n 1 ' + commitIdentifier + ' --format="%s"')).trim();
    process.stdout.write(chalk.blue('Subject: ') + subject);

    console.log('');
    console.log('');
}
