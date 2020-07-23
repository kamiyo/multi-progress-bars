import { MultiProgressBars } from '../';
import * as chalk from 'chalk';

let timerId: NodeJS.Timeout, timeoutId: NodeJS.Timeout;

const main = async () => {
    const task1 = 'Task 1';
    const task2 = 'Task 2';
    const taskInf = 'Task \u221e';
    const mpb = new MultiProgressBars({
        initMessage: '$ node build-stuff.js'
    });

    mpb.addTask(task1, { type: 'percentage', index: 0, barColorFn: chalk.yellow });
    mpb.addTask(task2, { type: 'percentage', index: 1, barColorFn: chalk.blue });
    mpb.addTask(taskInf, { type: 'indefinite', index: 2, barColorFn: chalk.magenta });

    let timerCount = 0;
    timerId = setInterval(() => {
        if (timerCount % 2 === 0) {
            mpb.incrementTask(task1);
        }
        mpb.incrementTask(task2);
        timerCount++;
    }, 50);

    timeoutId = setTimeout(() => {
        mpb.done(taskInf);
        timeoutId = setTimeout(() => {
            // or mpb.restart or mpb.addTask with same name;
            mpb.updateTask(taskInf, { message: 'Restarted' });
            timeoutId = setTimeout(() => {
                mpb.done(taskInf);
            }, 3000);
        }, 2000);
    }, 5000);

    await mpb.promise;
    clearInterval(timerId);
};

(process as NodeJS.Process).on('SIGINT', () => {
    clearInterval(timerId);
    clearTimeout(timeoutId);
    process.kill(process.pid);
})

main();