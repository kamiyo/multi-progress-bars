import { MultiProgressBars } from '../';
import * as chalk from 'chalk';

let timerId: NodeJS.Timeout, timeoutId: NodeJS.Timeout;

const main = async () => {

    const task1 = 'Task 1';
    const task2 = chalk.yellow('Task 2');
    const taskInf = 'Task \u221e';
    const mpb = new MultiProgressBars({
        initMessage: '$ node build-stuff.js',
        anchor: 'top',
        persist: true,
        // border: false,
    });

    (process as NodeJS.Process).on('SIGINT', () => {
        clearInterval(timerId);
        clearTimeout(timeoutId);
        process.exit();
    });

    mpb.addTask(task1, { type: 'percentage', barColorFn: chalk.yellow, message: 'I move slowwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww' });
    mpb.addTask(task2, { type: 'percentage', barColorFn: chalk.blue, message: chalk.blue('I move fasterrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr') });
    mpb.addTask(taskInf, { type: 'indefinite', barColorFn: chalk.magenta, message: 'I go forever until stopped' });

    let timerCount = 0;
    timerId = setInterval(() => {
        if (timerCount % 2 === 0) {
            mpb.incrementTask(task1);
            console.log("Console log:", timerCount);
        }
        if (timerCount % 8 === 0) {
            console.log("Long log! ".repeat(20));
        }
        if (timerCount % 16 === 0) {
            console.log("Multiline comment!\nSecond Line\nThird Line");
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
                mpb.done(taskInf);
            }, 3000);
        }, 2000);
    }, 5000);

    await mpb.promise;
    clearInterval(timerId);
    mpb.close();
    console.log("Final Status Message!");
};

main();