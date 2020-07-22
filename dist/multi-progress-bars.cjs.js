'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var chalk = require('chalk');
var path = require('path');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

class MultiProgressBar {
    /**
     *
     * @param options   See CtorOptions type
     */
    constructor(options) {
        this.tasks = {};
        this.CHARS = ['\u258F', '\u258E', '\u258D', '\u258C', '\u258B', '\u258A', '\u2589', '\u2588'];
        this.SPACE_FILLING_1 = ['\u2801', '\u2809', '\u2819', '\u281B', '\u281E', '\u2856', '\u28C6', '\u28E4',
            '\u28E0', '\u28A0', '\u2820'];
        this.SPACE_FILLING_2 = ['\u2804', '\u2844', '\u28C4', '\u28E4', '\u28F0', '\u28B2', '\u2833', '\u281B', '\u280B',
            '\u2809', '\u2808'];
        this.FRAC_CHARS = this.CHARS.slice(0, this.CHARS.length - 1);
        this.FULL_CHAR = this.CHARS[this.CHARS.length - 1];
        this.longestNameLength = 0;
        this.t = 0;
        const { stream = process.stdout, spinnerFPS = 10, spinnerGenerator = this.hilbertSpinner, } = options || {};
        let { progressWidth = 40, numCrawlers = 4, initMessage, } = options || {};
        this.stream = stream;
        this.spinnerFPS = Math.min(spinnerFPS, 60);
        this.spinnerGenerator = spinnerGenerator;
        if (progressWidth % 2 !== 0) {
            progressWidth += 1;
        }
        if (progressWidth % numCrawlers !== 0) {
            for (let i = numCrawlers - 1; i > 0; i++) {
                if (progressWidth % i === 0) {
                    numCrawlers = i;
                    break;
                }
            }
        }
        this.numCrawlers = numCrawlers;
        this.progressWidth = progressWidth;
        if (initMessage === undefined) {
            initMessage = '$ ' + process.argv.map((arg) => {
                const name = path.parse(arg).name;
                return (name === 'node') ? '' : name;
            }).join(' ');
        }
        this.init(initMessage);
    }
    init(message) {
        const splitMessage = message.split('\n').map((str) => str.length);
        const cols = this.stream.columns;
        const eachCols = splitMessage.map((msg) => Math.ceil(msg / cols));
        this.initialLines = eachCols.reduce((prev, curr) => prev + curr, 0);
        const blank = '\n'.repeat(this.stream.rows);
        this.stream.write(blank);
        this.stream.cursorTo(0);
        this.stream.clearScreenDown();
        this.stream.write(message);
        const blankMinInit = '\n'.repeat(this.stream.rows - this.initialLines);
        this.stream.write(blankMinInit);
    }
    addTask(name, type, barColorFn, index) {
        if (this.tasks[name] !== undefined) {
            this.tasks[name] = Object.assign(Object.assign({}, this.tasks[name]), { name,
                type,
                barColorFn, done: false });
        }
        else {
            this.tasks[name] = {
                name,
                index: (index === undefined) ? Object.entries(this.tasks).length : index,
                type,
                message: '',
                barColorFn,
                done: false,
            };
        }
        // If the added task is an indefinite task, and the animation update has previous stopped,
        // Restart it.
        if (type === 'indefinite' && !this.intervalID) {
            this.t = 0;
            this.intervalID = setInterval(() => this.renderIndefinite(), 1000 / this.spinnerFPS);
        }
        else if (type === 'percentage') {
            this.tasks[name].percentage = 0;
            this.writeTask(this.tasks[name]);
        }
        // Calculated longest name to pad other names to.
        this.longestNameLength = Math.max(this.longestNameLength, name.length);
        // Reset promise for end hook
        this.promise = new Promise((res, _) => this.resolve = res);
        // Rerender previously finished tasks so that the task names are padded correctly.
        // Do this by calling done() again.
        Object.entries(this.tasks).forEach(([name, { done, type, message }]) => {
            if (done && type === 'indefinite') {
                this.done(name, message);
            }
        });
        // Go to bottom of tasks and clear downwards.
        this.stream.cursorTo(0, Object.entries(this.tasks).length + this.initialLines);
        this.stream.clearScreenDown();
    }
    progressString(name, percentage, message, barColorFn = (b) => b) {
        // scale progress bar to percentage of total width
        const scaled = percentage * this.progressWidth;
        // scaledInt gives you the number of full blocks
        const scaledInt = Math.floor(scaled);
        // scaledFrac gives you the fraction of a full block
        const scaledFrac = Math.floor(this.CHARS.length * (scaled % 1));
        const fullChar = this.FULL_CHAR;
        const fracChar = (scaledFrac > 0)
            ? this.FRAC_CHARS[scaledFrac - 1]
            : ((scaledInt === this.progressWidth)
                ? ''
                : ' ');
        // combine full blocks with partial block
        const bar = barColorFn(fullChar.repeat(scaledInt) + fracChar);
        // fill the rest of the space until progressWidth
        const rest = (scaledInt < this.progressWidth - 1)
            ? ' '.repeat(this.progressWidth - (scaledInt + 1))
            : '';
        // TODO: make this formattable
        // Currently, returns the name of the task, padded to the length of the longest name,
        // the bar, space padding, percentage padded to 3 characters, and the custom message.
        return name.padStart(this.longestNameLength)
            + ': '
            + bar
            + rest
            + ' '
            + (percentage * 100).toFixed(0).padStart(3)
            + '% | '
            + message;
    }
    writeTask(task) {
        this.stream.cursorTo(0, this.initialLines + task.index);
        this.stream.write(this.progressString(task.name, task.percentage, task.message, task.barColorFn));
        this.stream.clearLine(1);
        this.stream.cursorTo(0, Object.entries(this.tasks).length + this.initialLines);
    }
    updateTask(name, _a) {
        var options = __rest(_a, []);
        const task = this.tasks[name];
        this.tasks[name] = Object.assign(Object.assign({}, task), options);
        if (task.type === 'indefinite') {
            return;
        }
        this.writeTask(this.tasks[name]);
    }
    done(name, message = chalk.green('Finished')) {
        if (this.tasks[name] === undefined)
            throw new ReferenceError('Task does not exist.');
        this.tasks[name] = Object.assign(Object.assign({}, this.tasks[name]), { done: true, percentage: 1, message });
        const task = this.tasks[name];
        this.stream.cursorTo(0, this.initialLines + task.index);
        const bar = task.barColorFn(this.FULL_CHAR.repeat(this.progressWidth));
        // TODO customizable format. Maybe unify this with writeTask
        this.stream.write(name.padStart(this.longestNameLength) + ': ' + bar + ' ' + message);
        this.stream.clearLine(1);
        this.stream.cursorTo(0, Object.entries(this.tasks).length + this.initialLines);
        // Stop animation if all tasks are done, and resolve the promise.
        if (Object.entries(this.tasks).reduce((prev, [_, curr]) => {
            return prev && curr.done;
        }, true)) {
            clearInterval(this.intervalID);
            this.intervalID = null;
            this.resolve();
        }
    }
    hilbertSpinner(t, width) {
        // Each cell takes 8 steps to go through (plus 3 for trailing).
        const cycle = 8 * width / this.numCrawlers;
        t = t % cycle;
        const spinner = Array(width).fill(' ').map((_, idx) => {
            const adjId = -8 * (idx % (width / this.numCrawlers)) + t;
            const leftOver = -cycle + 8;
            if (idx % 2 === 0) {
                if (adjId >= leftOver && adjId < leftOver + 3) {
                    return this.SPACE_FILLING_1[cycle + adjId];
                }
                if (adjId < 0 || adjId >= this.SPACE_FILLING_1.length)
                    return ' ';
                return this.SPACE_FILLING_1[adjId];
            }
            else {
                if (adjId >= leftOver && adjId < leftOver + 3) {
                    return this.SPACE_FILLING_2[cycle + adjId];
                }
                if (adjId < 0 || adjId >= this.SPACE_FILLING_2.length)
                    return ' ';
                return this.SPACE_FILLING_2[adjId];
            }
        });
        return spinner.join('');
    }
    renderIndefinite() {
        const spinner = this.spinnerGenerator(this.t, this.progressWidth);
        Object.entries(this.tasks).forEach(([name, task]) => {
            if (task.type === 'indefinite' && task.done === false) {
                this.stream.cursorTo(0, this.initialLines + task.index);
                this.stream.write(name.padStart(this.longestNameLength) + ': ' + task.barColorFn(spinner) + ' ' + task.message);
                this.stream.clearLine(1);
            }
        });
        this.t = this.t + 1;
    }
}

exports.MultiProgressBar = MultiProgressBar;
