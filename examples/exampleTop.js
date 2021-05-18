"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
const chalk = require("chalk");
let timerId, timeoutId;
const testBasic = () => __awaiter(void 0, void 0, void 0, function* () {
    const task1 = 'Task 1';
    const task2 = chalk.yellow('Task 2');
    const taskInf = 'Task \u221e';
    const mpb = new __1.MultiProgressBars({
        initMessage: '$ node build-stuff.js',
        anchor: 'top',
        persist: true,
        // border: false,
    });
    process.on('SIGINT', () => {
        clearInterval(timerId);
        clearTimeout(timeoutId);
        process.exit();
    });
    mpb.addTask(task1, { type: 'percentage', percentage: 0.2, barColorFn: chalk.yellow, message: 'I move slowwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww' });
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
    yield mpb.promise;
    clearInterval(timerId);
    mpb.close();
    console.log("Final Status Message!");
});
const testOverflow = () => __awaiter(void 0, void 0, void 0, function* () {
    const mpb = new __1.MultiProgressBars({
        initMessage: ' Overflow ',
        anchor: 'top',
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
    yield mpb.promise;
    mpb.close();
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Basic Top Anchor Functionality Test');
    yield testBasic();
    console.log('Top Overflow Test');
    yield testOverflow();
}))();
