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
const dist_1 = require("../dist");
const chalk = require("chalk");
let timerId, timeoutId;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const task1 = 'Task 1';
    const task2 = chalk.yellow('Task 2');
    const taskInf = 'Task \u221e';
    const mpb = new dist_1.MultiProgressBars({
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
    yield mpb.promise;
    clearInterval(timerId);
    mpb.close();
    console.log("Final Status Message!");
});
main();
