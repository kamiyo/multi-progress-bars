import { MultiProgressBars } from 'multi-progress-bars';

import chalk from 'chalk';

let timerId: NodeJS.Timeout, timeoutId: NodeJS.Timeout;

type Anchor = 'top' | 'bottom';

const testBasic = async (anchor: Anchor) => {
    const task1 = 'Build App';
    const task2 = 'Build Server';
    const taskInf = 'Watcher';
    const mpb = new MultiProgressBars({
        initMessage: ' $ Example Fullstack Build ',
        anchor,
        persist: true,
        progressWidth: 40,
        numCrawlers: 7,
        border: true,
    });

    (process as NodeJS.Process).on('SIGINT', () => {
        clearInterval(timerId);
        clearTimeout(timeoutId);
        process.exit();
    });

    mpb.addTask(task1, { type: 'percentage', barTransformFn: chalk.yellow, nameTransformFn: chalk.green });
    mpb.addTask(task2, { type: 'percentage', barTransformFn: chalk.blue, nameTransformFn: chalk.yellow });
    mpb.addTask(taskInf, { type: 'indefinite', barTransformFn: chalk.magenta, message: 'Linting started.' });

    let timerCount = 0;
    timerId = setInterval(() => {
        if (timerCount % 2 === 0) {
            mpb.incrementTask(task1, { percentage: 0.05 });
            console.log("[Frontend] log: ", timerCount);
        }
        if (timerCount % 8 === 0) {
            console.log(chalk.yellow("[Backend] warning: ", timerCount));
        }
        if (timerCount % 16 === 0) {
            console.log("[Frontend] info:\n  app.js:%d:%d\n  Missing stuff.\n  Fixit!", timerCount % 16, timerCount % 23);
        }
        mpb.incrementTask(task2, { percentage: 0.04});
        timerCount++;
    }, 200);

    timeoutId = setTimeout(() => {
        mpb.done(taskInf, { message: 'Linting finished. Output in eslint-output.txt' });
        timeoutId = setTimeout(() => {
            mpb.updateTask(taskInf, { message: 'Linting started.' });
            timeoutId = setTimeout(() => {
                mpb.done(taskInf);
            }, 3000);
        }, 2000);
    }, 5000);

    await mpb.promise;
    clearInterval(timerId);
    mpb.close();
    console.log("Build exited.");
};

const testOverflow = async (anchor: Anchor) => {
    const mpb = new MultiProgressBars({
        initMessage: ' $ Overflow Test ',
        anchor,
        persist: true,
        border: '\u2550',
    });

    let count = 0;
    let done = 0;
    const addTaskTimerId = setInterval(() => {
        const taskName = 'Task ' + count;
        mpb.addTask(taskName, { type: 'percentage', percentage: 0 });
        mpb.setFooter({
            pattern: '\u2550',
            message: ` ${done}/${count} | ${(100 * done / count).toFixed(0)}% `,
            right: 4
        });
        const innerTimerId = setInterval(() => {
            mpb.incrementTask(taskName, { percentage: 0.05 });
            if (mpb.isDone(taskName)) {
                // mpb.removeTask(taskName);
                done++;
                mpb.setFooter({
                    message: ` ${done}/${count} | ${(100 * done / count).toFixed(0)}% `,
                });
                clearInterval(innerTimerId);
            }
        }, 100);
        count++;
        if (count == 40) {
            clearInterval(addTaskTimerId);
        }
        if (count % 5 === 0) {
            console.log('Console log: %d', count);
        }
    }, 200);
    console.log('Initial console logs:\n1\n2\n3\n4\n5');

    await mpb.promise;
    mpb.close();
};

const testRemove = async (anchor: Anchor) => {
    const mpb = new MultiProgressBars({
        anchor,
        persist: true,
        header: { pattern: '*', message: ' Removal Test ' },
        footer: { pattern: '.' },
    });
    let count = 0;
    const addTaskTimerId = setInterval(() => {
        const taskName = 'Task ' + count;
        mpb.addTask(taskName, { type: 'percentage', percentage: 0 });

        const innerTimerId = setInterval(() => {
            mpb.incrementTask(taskName, { percentage: 0.05 });
            if (mpb.isDone(taskName)) {
                setTimeout(() => {
                    mpb.removeTask(taskName);
                }, 1000);
                clearInterval(innerTimerId);
            }
        }, 100);
        count++;
        if (count == 40) {
            clearInterval(addTaskTimerId);
        }
        if (count % 5 === 0) {
            console.log("console log:\n%d", count);
        }
    }, 200);
    console.log('Initial console logs:\n1\n2\n3\n4\n5');

    await mpb.promise;
    mpb.close();
};

const testBorders = async (anchor: Anchor) => {
    const mpb = new MultiProgressBars({
        anchor,
        header: { message: ' Borders Test ', pattern: '*' },
        footer: { pattern: '.' },
        persist: true,
    });

    let count = 0;
    const addTaskTimerId = setInterval(() => {
        const taskName = 'Task ' + count;
        mpb.addTask(taskName, { type: 'percentage', percentage: 0 });

        const innerTimerId = setInterval(() => {
            mpb.incrementTask(taskName, { percentage: 0.05 });
            if (mpb.isDone(taskName)) {
                clearInterval(innerTimerId);
            }
        }, 100);
        count++;
        if (count == 20) {
            clearInterval(addTaskTimerId);
        }
        if (count % 3 === 0) {
            console.log("console log:\n%d", count);
            if (count % 2 === 1) {
                mpb.setHeader({ pattern: ' ' });
                mpb.setFooter({ pattern: ' ' });
            } else {
                mpb.setHeader({ pattern: '*' });
                mpb.setFooter({ pattern: '.' });
            }
        }
    }, 200);
}

(async () => {
    let anchor: Anchor = 'top';
    if (process.argv.includes('--bottom')) {
        anchor = 'bottom';
    }
    if (process.argv.includes('--basic') || process.argv.includes('-b')
        || process.argv.includes('--all') || process.argv.includes('-a')
        || process.argv.length === 2) {
        await testBasic(anchor);
    }
    if (process.argv.includes('--overflow') || process.argv.includes('-o')
        || process.argv.includes('--all') || process.argv.includes('-a')
        || process.argv.length === 2) {
        await testOverflow(anchor);
    }
    if (process.argv.includes('--remove' ) || process.argv.includes('-r')
        || process.argv.includes('--all') || process.argv.includes('-a')
        || process.argv.length === 2) {
        await testRemove(anchor);
    }
    if (process.argv.includes('--borders') || process.argv.includes('-e')
        || process.argv.includes('--all') || process.argv.includes('-a')
        || process.argv.length === 2) {
        await testBorders(anchor);
    }
})();