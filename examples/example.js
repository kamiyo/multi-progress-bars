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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multi_progress_bars_1 = require("multi-progress-bars");
const chalk_1 = __importDefault(require("chalk"));
let timerId, timeoutId;
const testBasic = (anchor) => __awaiter(void 0, void 0, void 0, function* () {
    const task1 = 'Build App';
    const task2 = 'Build Server';
    const taskInf = 'Watcher';
    const mpb = new multi_progress_bars_1.MultiProgressBars({
        initMessage: ' $ Example Fullstack Build ',
        anchor,
        persist: true,
        progressWidth: 40,
        numCrawlers: 7,
        border: true,
    });
    process.on('SIGINT', () => {
        clearInterval(timerId);
        clearTimeout(timeoutId);
        process.exit();
    });
    mpb.addTask(task1, { type: 'percentage', barTransformFn: chalk_1.default.yellow, nameTransformFn: chalk_1.default.green });
    mpb.addTask(task2, { type: 'percentage', barTransformFn: chalk_1.default.blue, nameTransformFn: chalk_1.default.yellow });
    mpb.addTask(taskInf, { type: 'indefinite', barTransformFn: chalk_1.default.magenta, message: 'Linting started.' });
    let timerCount = 0;
    timerId = setInterval(() => {
        if (timerCount % 2 === 0) {
            mpb.incrementTask(task1, { percentage: 0.05 });
            console.log("[Frontend] log: ", timerCount);
        }
        if (timerCount % 8 === 0) {
            console.log(chalk_1.default.yellow("[Backend] warning: ", timerCount));
        }
        if (timerCount % 16 === 0) {
            console.log("[Frontend] info:\n  app.js:%d:%d\n  Missing stuff.\n  Fixit!", timerCount % 16, timerCount % 23);
        }
        mpb.incrementTask(task2, { percentage: 0.04 });
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
    yield mpb.promise;
    clearInterval(timerId);
    mpb.close();
    console.log("Build exited.");
});
const testOverflow = (anchor) => __awaiter(void 0, void 0, void 0, function* () {
    const mpb = new multi_progress_bars_1.MultiProgressBars({
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
    yield mpb.promise;
    mpb.close();
});
const testRemove = (anchor) => __awaiter(void 0, void 0, void 0, function* () {
    const mpb = new multi_progress_bars_1.MultiProgressBars({
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
    yield mpb.promise;
    mpb.close();
});
const testBorders = (anchor) => __awaiter(void 0, void 0, void 0, function* () {
    const mpb = new multi_progress_bars_1.MultiProgressBars({
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
            }
            else {
                mpb.setHeader({ pattern: '*' });
                mpb.setFooter({ pattern: '.' });
            }
        }
    }, 200);
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    let anchor = 'top';
    if (process.argv.includes('--bottom')) {
        anchor = 'bottom';
    }
    if (process.argv.includes('--basic') || process.argv.includes('-b')
        || process.argv.includes('--all') || process.argv.includes('-a')
        || process.argv.length === 2) {
        yield testBasic(anchor);
    }
    if (process.argv.includes('--overflow') || process.argv.includes('-o')
        || process.argv.includes('--all') || process.argv.includes('-a')
        || process.argv.length === 2) {
        yield testOverflow(anchor);
    }
    if (process.argv.includes('--remove') || process.argv.includes('-r')
        || process.argv.includes('--all') || process.argv.includes('-a')
        || process.argv.length === 2) {
        yield testRemove(anchor);
    }
    if (process.argv.includes('--borders') || process.argv.includes('-e')
        || process.argv.includes('--all') || process.argv.includes('-a')
        || process.argv.length === 2) {
        yield testBorders(anchor);
    }
}))();
