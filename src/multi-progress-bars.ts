import * as chalk from 'chalk';
import { WriteStream } from 'tty';
import * as path from 'path';
import { default as stringWidth } from 'string-width';
import { VirtualConsole } from './virtual-console';

export type TaskType = 'percentage' | 'indefinite';

type TransformFn = (bar: string) => string;

const defaultTransformFn: TransformFn = (s: string) => s;

export interface Task {
    name: string;
    index: number;
    type: TaskType;
    message: string;
    barColorFn: TransformFn;
    percentage?: number;
    done: boolean;
}

export interface AddOptions {
    index: number;
    type: TaskType;
    message?: string;
    barColorFn?: TransformFn;
}

export type UpdateOptions = Partial<Pick<Task, 'message' | 'barColorFn' | 'percentage'>>;

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
 * @param initMessage       Message to display above the bars
 */
export interface CtorOptions {
    stream: WriteStream;
    spinnerFPS: number;
    numCrawlers: number;
    progressWidth: number;
    spinnerGenerator: SpinnerGenerator;
    initMessage: string;
    anchor: 'top' | 'bottom';
    persist: boolean;
}

export class MultiProgressBars {
    private tasks: Tasks = {};
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
    private persist: boolean;
    private intervalID: NodeJS.Timeout;
    private numCrawlers: number;
    private longestNameLength = 0;
    private t = 0;
    private resolve: () => void;
    private spinnerGenerator: SpinnerGenerator;
    private logger: VirtualConsole;
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
            anchor = 'bottom',
            persist = false,
        } = options || {};
        let {
            progressWidth = 40,
            numCrawlers = 4,
            initMessage,
        } = options || {};

        this.logger = new VirtualConsole({ stream, anchor });

        this.persist = persist;
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
                return path.parse(arg).name;
            }).join(' ');
        }
        this.init(initMessage);
    }

    public cleanup = () => {
        if (this.intervalID) {
            clearInterval(this.intervalID);
        }
    }

    private init(message: string) {

        // setup cleanup
        (process as NodeJS.Process).on('SIGINT', this.cleanup);

        // TODO make this account for lines that wrap
        const splitMessage = message.split('\n');
        splitMessage.forEach((msg, idx) => {
            this.logger.upsertProgress({
                index: idx,
                data: msg,
            });
        });
        this.initialLines = splitMessage.length;
    }

    public addTask(name: string, {
        index,
        ...options
    }: Omit<Task, 'name' | 'done' | 'message'> & Partial<Pick<Task, 'message'>>) {
        // if task exists, update fields
        if (this.tasks[name] !== undefined) {
            Object.keys(options).forEach((key: keyof Partial<Omit<Task, 'index' | 'name' | 'done'>>) => options[key] === undefined && delete options[key])
            this.tasks[name] = {
                ...this.tasks[name],
                ...options,
                percentage: 0,
                name,
                done: false,
            };
        } else {
            // otherwise make a new task
            const {
                type,
                barColorFn = defaultTransformFn,
                percentage = 0,
                message = '',
            } = options;
            this.tasks[name] = {
                type,
                barColorFn,
                percentage,
                message,
                name,
                index,
                done: false,
            };
        }

        // If the added task is an indefinite task, and the animation update has previous stopped,
        // Restart it.
        if (options.type === 'indefinite' && !this.intervalID) {
            this.t = 0;
            this.intervalID = setInterval(() => this.renderIndefinite(), 1000 / this.spinnerFPS);
        } else if (options.type === 'percentage') {
            this.tasks[name].percentage = 0;
            this.writeTask(this.tasks[name]);
        }

        // Calculated longest name to pad other names to.
        this.longestNameLength = Math.max(this.longestNameLength, stringWidth(name));

        // Reset promise for end hook
        this.promise = new Promise((res, _) => this.resolve = res);

        // Rerender previously finished tasks so that the task names are padded correctly.
        // Do this by calling done() again.
        Object.entries(this.tasks).forEach(([name, { done, type, message }]) => {
            if (done && type === 'indefinite') {
                this.done(name, { message });
            }
        });
    }

    private progressString(task: Task) {
        const {
            name,
            barColorFn,
            message,
            percentage,
        } = task;

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

    private indefiniteString(task: Task, spinner: string) {
        const {
            name,
            barColorFn,
            message,
        } = task;
        return name.padStart(this.longestNameLength) + ': ' + barColorFn(spinner) + ' ' + message;
    }

    private writeTask(task: Task) {
        this.logger.upsertProgress({
            index: task.index + this.initialLines,
            data: this.progressString(task),
        });
    }

    public incrementTask(
        name: string,
        {
            percentage = 0.01,
            ...options
        }: UpdateOptions = {}
    ) {
        if (this.tasks[name] === undefined) throw new ReferenceError('Task does not exist.')
        if (this.tasks[name].done) {
            return;
        }
        if (this.tasks[name].percentage + percentage > 1) {
            this.done(name, options);
        } else {
            this.updateTask(name, {
                ...options,
                percentage: this.tasks[name].percentage + percentage,
            });
        }
    }

    public updateTask(name: string, options: UpdateOptions = {}) {
        if (this.tasks[name] === undefined) throw new ReferenceError('Task does not exist.')
        const task = this.tasks[name];

        // Going over 1(00%) calls done
        if (options.percentage !== undefined && options.percentage > 1) {
            this.done(name, options);
            return;
        }
        this.tasks[name] = {
            ...task,
            ...options,
            done: false,
        };

        if (task.type === 'indefinite') {
            if (!this.intervalID) {
                this.t = 0;
                this.intervalID = setInterval(() => this.renderIndefinite(), 1000 / this.spinnerFPS);

                this.promise = new Promise((res, _) => this.resolve = res);
            }
            return;
        }

        this.writeTask(this.tasks[name]);
    }

    public done(name: string, { message = chalk.green('Finished'), ...options }: Pick<UpdateOptions, 'message' | 'barColorFn'> = {}) {
        if (this.tasks[name] === undefined) throw new ReferenceError('Task does not exist.')
        this.tasks[name] = {
            ...this.tasks[name],
            done: true,
            percentage: 1,
            message,
            ...options,
        };

        const task = this.tasks[name];

        const bar = task.barColorFn(this.FULL_CHAR.repeat(this.progressWidth));

        this.logger.upsertProgress({
            index: task.index + this.initialLines,
            data: name.padStart(this.longestNameLength) + ': ' + bar + ' ' + message,
        });

        // Stop animation if all tasks are done, and resolve the promise.
        if (Object.entries(this.tasks).reduce((prev, [_, curr]) => {
            return prev && curr.done
        }, true)) {
            clearInterval(this.intervalID);
            this.intervalID = null;
            this.resolve();
            if (!this.persist) {
                this.logger.done();
            }
        }
    }

    public restart(name: string, options: Pick<UpdateOptions, 'message' | 'barColorFn'>) {
        if (this.tasks[name] === undefined) throw new ReferenceError('Task does not exist.')
        this.tasks[name] = {
            ...this.tasks[name],
            ...options,
            percentage: 0,
            done: false,
        };

        if (this.tasks[name].type === 'indefinite' && !this.intervalID) {
            this.t = 0;
            this.intervalID = setInterval(() => this.renderIndefinite(), 1000 / this.spinnerFPS);

        } else if (this.tasks[name].type === 'percentage') {
            this.tasks[name].percentage = 0;
            this.writeTask(this.tasks[name]);
        }

        this.promise = new Promise((res, _) => this.resolve = res);
    }

    public close() {
        this.logger.done();
    }

    // TODO maybe make this static?
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

        Object.entries(this.tasks).forEach(([_, task]) => {
            if (task.type === 'indefinite' && task.done === false) {
                let progressString = this.indefiniteString(task, spinner);
                this.logger.upsertProgress({
                    index: task.index + this.initialLines,
                    data: progressString,
                    refresh: false,
                });
            }
        });
        this.logger.refresh();
        this.t = this.t + 1;
    }
}
