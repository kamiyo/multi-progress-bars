import * as chalk from 'chalk';
import { WriteStream } from 'tty';
import * as path from 'path';

export type TaskType = 'percentage' | 'indefinite';

export interface Task {
    name: string;
    index: number;
    type: TaskType;
    message: string;
    barColorFn: (bar: string) => string;
    percentage?: number;
    done: boolean;
}

export type UpdateOptions = { percentage?: number} & Partial<Pick<Task, 'message' | 'barColorFn'>>;

export interface Tasks {
    [key: string]: Task;
}

/**
 * Function for generating the indefinite spinner
 *
 * @param t     Current timestep
 * @param width Width of the spinner
 *
 * @returns     String of length "width"
 */
export type SpinnerGenerator = (t: number, width: number) => string;

/**
 * Constructor Options
 * @param stream            A node TTY stream
 * @param spinnerFPS        FPS to run the indefinite spinner
 * @param numCrawlers       Optional: Number of crawlers for the indefinite spinner
 * @param progressWidth     Width of the progress bar
 * @param spinnerGenerator  See SpinnerGenerator type
 */
export interface CtorOptions {
    stream: WriteStream;
    spinnerFPS: number;
    numCrawlers: number;
    progressWidth: number;
    spinnerGenerator: SpinnerGenerator;
    initMessage?: string;
}

export class MultiProgressBar {
    private tasks: Tasks = {};
    private stream: WriteStream;
    private spinnerFPS: number;
    private initialLines: number;
    private progressWidth: number;
    private CHARS = ['\u258F', '\u258E', '\u258D', '\u258C', '\u258B', '\u258A', '\u2589', '\u2588'];
    private SPACE_FILLING_1 = ['\u2801', '\u2809', '\u2819', '\u281B', '\u281E', '\u2856', '\u28C6', '\u28E4',
                     '\u28E0', '\u28A0', '\u2820'];
    private SPACE_FILLING_2 = ['\u2804', '\u2844', '\u28C4', '\u28E4', '\u28F0', '\u28B2', '\u2833', '\u281B', '\u280B',
                     '\u2809', '\u2808'];
    private FRAC_CHARS = this.CHARS.slice(0, this.CHARS.length - 1);
    private FULL_CHAR = this.CHARS[this.CHARS.length - 1];
    private intervalID: NodeJS.Timeout;
    private numCrawlers: number;
    private longestNameLength = 0;
    private t = 0;
    private resolve: () => void;
    private spinnerGenerator: SpinnerGenerator;
    public promise: Promise<void>;

    /**
     *
     * @param options   See CtorOptions type
     */
    public constructor(options?: Partial<CtorOptions>) {
        const {
            stream = process.stdout,
            spinnerFPS = 10,
            spinnerGenerator = this.hilbertSpinner,
        } = options || {};
        let {
            progressWidth = 40,
            numCrawlers = 4,
            initMessage,
         } = options || {};
        this.stream = stream;
        this.spinnerFPS = Math.min(spinnerFPS, 60);
        this.spinnerGenerator = spinnerGenerator;

        if (progressWidth % 2 !== 0) {
            progressWidth += 1;
        }
        if (progressWidth % numCrawlers !== 0) {
            for(let i = numCrawlers - 1; i > 0; i++) {
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

    private init(message: string) {
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

    public addTask(name: string, type: TaskType, barColorFn: (b: string) => string, index: number) {
       if (this.tasks[name] !== undefined) {
            this.tasks[name] = {
                ...this.tasks[name],
                name,
                type,
                barColorFn,
                done: false,
            };
        } else {
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
        } else if (type === 'percentage') {
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

    private progressString(
        name: string,
        percentage: number,
        message: string,
        barColorFn: (b: string) => string
            = (b: string) => b,
    ) {
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

    private writeTask(task: Task) {
        this.stream.cursorTo(0, this.initialLines + task.index);
        this.stream.write(this.progressString(task.name, task.percentage, task.message, task.barColorFn));
        this.stream.clearLine(1);
        this.stream.cursorTo(0, Object.entries(this.tasks).length + this.initialLines);
    }

    public updateTask(name: string, { ...options }: UpdateOptions) {
        const task = this.tasks[name];

        this.tasks[name] = {
            ...task,
            ...options,
        };

        if (task.type === 'indefinite') {
            return;
        }

        this.writeTask(this.tasks[name]);
    }

    public done(name: string, message = chalk.green('Finished')) {
        if (this.tasks[name] === undefined) throw new ReferenceError('Task does not exist.')
        this.tasks[name] = {
            ...this.tasks[name],
            done: true,
            percentage: 1,
            message,
        };

        const task = this.tasks[name];

        this.stream.cursorTo(0, this.initialLines + task.index);

        const bar = task.barColorFn(this.FULL_CHAR.repeat(this.progressWidth));

        // TODO customizable format. Maybe unify this with writeTask
        this.stream.write(name.padStart(this.longestNameLength) + ': ' + bar + ' ' + message);

        this.stream.clearLine(1);
        this.stream.cursorTo(0, Object.entries(this.tasks).length + this.initialLines);

        // Stop animation if all tasks are done, and resolve the promise.
        if (Object.entries(this.tasks).reduce((prev, [_, curr]) => {
            return prev && curr.done
        }, true)) {
            clearInterval(this.intervalID);
            this.intervalID = null;
            this.resolve();
        }
    }

    private hilbertSpinner(t: number, width: number) {
        // Each cell takes 8 steps to go through (plus 3 for trailing).
        const cycle = 8 * width / this.numCrawlers;

        t = t % cycle;

        const spinner = Array(width).fill(' ').map((_, idx) => {
            const adjId = -8 * (idx % (width / this.numCrawlers)) + t;
            const leftOver = -cycle + 8
            if (idx % 2 === 0) {
                if (adjId >= leftOver && adjId < leftOver + 3) {
                    return this.SPACE_FILLING_1[cycle + adjId];
                }
                if (adjId < 0 || adjId >= this.SPACE_FILLING_1.length) return ' ';
                return this.SPACE_FILLING_1[adjId];
            } else {
                if (adjId >= leftOver && adjId < leftOver + 3) {
                    return this.SPACE_FILLING_2[cycle + adjId];
                }
                if (adjId < 0 || adjId >= this.SPACE_FILLING_2.length) return ' ';
                return this.SPACE_FILLING_2[adjId];
            }
        });

        return spinner.join('');
    }

    private renderIndefinite() {
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
