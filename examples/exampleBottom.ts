import { MultiProgressBars } from '../';
import * as chalk from 'chalk';

let timerId: NodeJS.Timeout, timeoutId: NodeJS.Timeout;

const testBasic = async () => {

    const task1 = 'Task 1';
    const task2 = chalk.yellow('Task 2');
    const taskInf = 'Task \u221e';
    const mpb = new MultiProgressBars({
        initMessage: '$ node build-stuff.js',
        // anchor: 'bottom', <- this is default
        persist: true,
        border: '.*-^-*',
    });

    (process as NodeJS.Process).on('SIGINT', () => {
        clearInterval(timerId);
        clearTimeout(timeoutId);
        process.exit();
    });

    mpb.addTask(task1, { type: 'percentage', index: 0, barColorFn: chalk.yellow, message: 'I move slowwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww' });
    mpb.addTask(task2, { type: 'percentage', index: 2, barColorFn: chalk.blue, message: chalk.blue('I move fasterrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr') });   // Testing skipping one row
    mpb.addTask(taskInf, { type: 'indefinite', barColorFn: chalk.magenta, message: 'I go forever until stopped' });     // Make sure that the next one added without index goes after the previous last one.

    let timerCount = 0;
    timerId = setInterval(() => {
        if (timerCount % 2 === 0) {
            mpb.incrementTask(task1);
            console.log("Console log:", timerCount);
        }
        if (timerCount % 8 === 0) {
            // console.log("Long log! ".repeat(20));
        }
        if (timerCount % 16 === 0) {
            // console.log("Multiline comment!\nSecond Line\nThird Line");
        }
        mpb.incrementTask(task2);
        timerCount++;
    }, 50);

    timeoutId = setTimeout(() => {
        mpb.done(taskInf);
        timeoutId = setTimeout(() => {
            // or mpb.restart or mpb.addTask with same name;
            mpb.updateTask(taskInf, { message: 'Restarted indefinite task.' });
            timeoutId = setTimeout(() => {
                console.log(mpb.getIndex(taskInf));
                console.log(mpb.getName(3));
                mpb.done(taskInf);
            }, 3000);
        }, 2000);
    }, 5000);

    await mpb.promise;
    clearInterval(timerId);
    mpb.close();
    console.log("Final Status Message!");
};

const testOverflow = async () => {
    const mpb = new MultiProgressBars({
        initMessage: ' Overflow ',
        anchor: 'bottom',
        persist: true,
        border: true,
    });

    let count = 0;
    const addTaskTimerId = setInterval(() => {
        const taskName = 'Task ' + count;
        mpb.addTask(taskName, { type: 'percentage', percentage: 0 });
        const innerTimerId = setInterval(() => {
            mpb.incrementTask(taskName, { percentage: 0.05 });
            if (mpb.isDone(taskName)) {
                // mpb.removeTask(taskName);
                clearInterval(innerTimerId);
            }
        }, 100);
        count++;
        if (count == 40) {
            clearInterval(addTaskTimerId);
        }
        if (count % 5 === 0) {
            console.log(count);
        }
    }, 200);
    console.log('1\n2\n3\n4\n5');

    await mpb.promise;
    mpb.close();
}

(async () => {
    console.log('Basic Bottom Anchor Functionality Test');
    await testBasic();
    console.log('Bottom Overflow Test');
    await testOverflow();
})();