import chalk from 'chalk';
import { WriteStream } from 'tty';
import * as path from 'path';
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import { VirtualConsole } from './virtual-console';
import { clampString } from './utils';

export type TaskType = 'percentage' | 'indefinite';

const { green } = chalk;

type TransformFn = (bar: string) => string;
type Anchor = 'top' | 'bottom';

const defaultTransformFn: TransformFn = (s: string) => s;

export interface Task {
    name: string;
    index: number;
    type: TaskType;
    message: string;
    barTransformFn: TransformFn;
    nameTransformFn: TransformFn;
    percentage?: number;
    done: boolean;
}

export interface AddOptions {
    index?: number;
    type: TaskType;
    message?: string;
    nameTransformFn?: TransformFn;
    barTransformFn?: TransformFn;
    percentage?: number;
}

export type UpdateOptions = Partial<Pick<Task, 'message' | 'barTransformFn' | 'percentage' | 'nameTransformFn'>>;

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
 * Options for setting the border, all optional
 */
export interface Border {
    message?: string;
    pattern?: string;
    left?: number;
    right?: number;
}

/**
 * Constructor Options
 * @param stream            A node TTY stream
 * @param spinnerFPS        FPS to run the indefinite spinner
 * @param numCrawlers       Optional: Number of crawlers for the indefinite spinner
 * @param progressWidth     Width of the progress bar
 * @param spinnerGenerator  See SpinnerGenerator type
 * @param initMessage       Message to display in the header
 * @param border            boolean or a string for the border design
 * @param anchor            'top' or 'bottom', default 'bottom'
 * @param persist           Keep console override even if all progress bars are 100%
 * @param header            Optional: Border object, string, or boolean. Will override initMessage and border if provided
 * @param footer            Optional: Border object, string, or boolean.
 */
export interface CtorOptions {
    stream: WriteStream;
    spinnerFPS: number;
    numCrawlers: number;
    progressWidth: number;
    spinnerGenerator: SpinnerGenerator;
    initMessage: string;
    anchor: Anchor;
    persist: boolean;
    border: boolean | string;
    header: Border | string | boolean;
    footer: Border | string | boolean;
}

const CHARS = ['\u258F', '\u258E', '\u258D', '\u258C', '\u258B', '\u258A', '\u2589', '\u2588'];
const FRAC_CHARS = CHARS.slice(0, CHARS.length - 1);
const FULL_CHAR = CHARS[CHARS.length - 1];

const SPACE_FILLING_1 = ['\u2801', '\u2809', '\u2819', '\u281B', '\u281E', '\u2856', '\u28C6', '\u28E4',
'\u28E0', '\u28A0', '\u2820'];
const SPACE_FILLING_2 = ['\u2804', '\u2844', '\u28C4', '\u28E4', '\u28F0', '\u28B2', '\u2833', '\u281B', '\u280B',
'\u2809', '\u2808'];

const DEFAULT_BORDER = '\u2500';

export class MultiProgressBars {
    private tasks: Tasks = {};
    private spinnerFPS: number;
    private progressWidth: number;

    private persist: boolean;
    private intervalID: NodeJS.Timeout;
    private numCrawlers: number;
    private longestNameLength = 0;
    private t = 0;
    private resolve: () => void;
    private spinnerGenerator: SpinnerGenerator;
    private logger: VirtualConsole;
    private border: string;
    private bottomBorder: string;
    private endIdx = 0;         // 1 past the last index
    private allFinished = false;

    private headerSettings: Border = {
        pattern: DEFAULT_BORDER,
        left: 4,
    };

    private footerSettings: Border = {
        pattern: DEFAULT_BORDER,
    }

    public promise: Promise<void>;

    /**
     *
     * @param options   {@link CtorOptions | See CtorOptions Type}
     */
    public constructor(options?: Partial<CtorOptions>) {
        // Initialize const options
        const {
            // see https://github.com/kamiyo/multi-progress-bars/issues/7
            stream = process.stdout.isTTY ? process.stdout : process.stderr,
            spinnerFPS = 10,
            spinnerGenerator = this.hilbertSpinner,
            anchor = 'top',
            persist = false,
            border = false,
        } = options || {};

        // Initialize options that might be overwritten
        let {
            progressWidth = 40,
            numCrawlers = 4,
            initMessage,
            header,
            footer,
        } = options || {};

        // New Virtual Console
        this.logger = new VirtualConsole({ stream, anchor });

        this.persist = persist;
        this.spinnerFPS = Math.min(spinnerFPS, 60);    // Just feels right to limit to 60fps
        this.spinnerGenerator = spinnerGenerator;

        this.numCrawlers = numCrawlers;
        this.progressWidth = progressWidth;

        this.processSimpleBorder(initMessage, border, anchor);

        // If constructor was supplied additional header option, process that.
        // Will override initMessage and border options.
        if (header !== undefined) {
            this.setHeader(header);
        }

        // If constructor was supplied additional footer option, process that.
        // Will override initMessage and border options.
        if (footer !== undefined) {
            this.setFooter(footer);
        }

        // Setup cleanup callback for SIGINT
        (process as NodeJS.Process).on('SIGINT', this.cleanup);

        // Make new unresolved promise
        this.promise = new Promise((res, _) => this.resolve = res);
    }

    /** Make simple border from supplied option */
    private processSimpleBorder(initMessage: string, border: boolean | string, anchor: Anchor) {

        // If boolean border option, set either null or DEFAULT_BORDER, otherwise set to supplied border
        if (typeof border === 'boolean') {
            if (!border) {
                this.border = null;
            } else {
                this.border = DEFAULT_BORDER;
            }
        } else {
            this.border = border;
        }

        if (initMessage === undefined) {
            // Create default initMessage if necessary
            initMessage = '$ ' + process.argv.map((arg) => {
                return path.parse(arg).name;
            }).join(' ');
        } else {
            // Sorry, header message should only be 1 line
            initMessage = initMessage.split('\n')[0];
        }

        // Make the border if necessary, or just use initMessage
        if (this.border) {
            this.headerSettings = { ...this.headerSettings, pattern: this.border, message: initMessage };
            initMessage = this.makeBorder(this.headerSettings);
        } else {
            initMessage = clampString(initMessage, this.logger.width);
        }

        if (this.border) {
            this.bottomBorder =
                clampString(
                    this.border.repeat(
                        Math.ceil(this.logger.width / this.border.length)
                    ),
                    this.logger.width
                );
        }

        // Set top border and optional bottom border
        initMessage && this.logger.setTopBorder(initMessage);
        (this.bottomBorder !== undefined) && this.logger.setBottomBorder(this.bottomBorder);
    }

    /** Make border from message, pattern, left, right. Called internally by setHeader and setFooter
     *
     * [message] will be placed within a string surrounded by [pattern] at the specified [left] or [right]
     * Pass undefined or null to [left] if you want [right] to be used.
    */
    private makeBorder(border: Border) {
        let {
            message,
            pattern,
            left,
            right,
        } = border;

        // Build the border with only the pattern first
        const base = pattern
            ? clampString(
                pattern.repeat(
                    Math.ceil(this.logger.width / stringWidth(pattern))
                ), this.logger.width
            )
            : ' '.repeat(this.logger.width);

        if (message === undefined) {
            return base;
        }

        // Clamp message to logger width - 8, because we don't want a potential superwide message
        // to take up the entire line. Also, remove tabs and newlines, taking the first.
        message = clampString(message.split(/[\t\n]/g)[0], this.logger.width - 8);

        // Position from right if supplied
        if (right !== undefined) {
            // Some negative indexing for array.slice
            right = (right <= 0) ? -base.length : Math.floor(right);
            return clampString(
                base.slice(0, -right - stringWidth(message)) + message + base.slice(-right),
                this.logger.width
            );
        }

        // Position from left
        left = Math.max(Math.floor(left), 0);
        return clampString(
            base.slice(0, left) + message + base.slice(left + stringWidth(message)),
            this.logger.width
        );
    }

    public cleanup = () => {
        this.logger?.done();
        if (this.intervalID) {
            clearInterval(this.intervalID);
        }
        // Resolve the promise.
        // Should we reject?
        this.resolve();

        // according to node docs, if there's a handler for SIGINT, default behavior
        // (exiting) is removed, so we have to add it back ourselves.
        process.exit();
    }

    public setHeader(options: Border | string | boolean) {
        if (options !== undefined) {
            if (typeof options === 'boolean') {
                if (!options) {
                    this.logger.removeTopBorder();
                } else {
                    this.logger.setTopBorder(this.makeBorder(this.headerSettings));
                }
            } else if (typeof options === 'string') {
                this.logger.setTopBorder(clampString(options.split('\n')[0], this.logger.width));
            } else {
                this.headerSettings = { ...this.headerSettings, ...options };

                this.logger.setTopBorder(this.makeBorder(this.headerSettings));
            }
        }
    }

    public setFooter(options: Border | string | boolean) {
        if (options !== undefined) {
            if (typeof options === 'boolean') {
                if (!options) {
                    this.logger.removeBottomBorder();
                } else {
                    this.logger.setBottomBorder(this.makeBorder(this.footerSettings))
                }
            } else if (typeof options === 'string') {
                this.logger.setBottomBorder(clampString(options.split('\n')[0], this.logger.width));
            } else {
                this.footerSettings = { ...this.footerSettings, ...options };

                this.logger.setBottomBorder(this.makeBorder(this.footerSettings));
            }
        }
    }

    public removeHeader() {
        this.setHeader(false);
    }

    public removeFooter() {
        this.setFooter(false);
    }

    public addTask(name: string, {
        index,
        ...options
    }: AddOptions) {
        // Restart promise
        this.restartPromiseIfNeeded();
        // Make sure there are no control characters
        name = stripAnsi(name);

        if (this.tasks[name] !== undefined) {
            // if task exists, update fields
            // remove undefined kv's
            Object.keys(options).forEach((key: keyof Partial<Omit<Task, 'index' | 'name' | 'done'>>) =>
                options[key] === undefined && delete options[key]
            );
            // update all other kv's
            this.tasks[name] = {
                ...this.tasks[name],
                ...options,
                percentage: 0,
                done: false,
            };
        } else {
            // otherwise make a new task
            const {
                type,
                barTransformFn = defaultTransformFn,
                nameTransformFn = defaultTransformFn,
                percentage = 0,
                message = '',
            } = options;

            // Auto-increment index if needed
            if (index === undefined) {
                index = this.endIdx;
                this.endIdx++;
            } else if (index >= this.endIdx) {
                this.endIdx = index + 1;
            }

            // Make the new task
            this.tasks[name] = {
                type,
                barTransformFn,
                nameTransformFn,
                percentage,
                message,
                name,
                index,
                done: false,
            };
        }

        // Calculated longest name to pad other names to.
        this.longestNameLength = Math.max(this.longestNameLength, stringWidth(name));

        // If the added task is an indefinite task, and the animation update has previously stopped,
        // Restart it.
        if (options.type === 'indefinite' && !this.intervalID) {
            this.t = 0;
            this.intervalID = setInterval(() => this.renderIndefinite(), 1000 / this.spinnerFPS);
        }

        // Rerender other tasks so that task names are padded correctly.
        Object.values(this.tasks).forEach((task) => {
            if (task.type === 'percentage') {
                this.writeTask(task);
            }
        });

        this.logger.refresh();
    }

    // Call this BEFORE you add a new task to the list
    private restartPromiseIfNeeded() {
        // check if allFinished previously
        // Reset allFinished and make new promise if we need to restart.
        if (this.allFinished) {
            this.allFinished = false;
            this.promise = new Promise((res) => this.resolve = res);
        }
    }

    public isDone(name: string) {
        return this.tasks[stripAnsi(name)].done;
    }

    public removeTask(task: string | number, shift = true) {
        // Do nothing if task doesn't exist
        if ((typeof task === 'string' && this.tasks[stripAnsi(task)] === undefined) ||
            (typeof task === 'number' && this.getName(task) === undefined)) {
            return;
        }

        const idxToRemove = (typeof task === 'string') ? this.tasks[stripAnsi(task)].index : task;

        // Write empty line to the given index
        this.logger.upsertProgress({
            index: idxToRemove,
            data: '',
        });

        // Adjust buffers in virtual console
        if (shift) {
            this.logger.removeProgressSlot();
            this.endIdx--;
        }

        // Remove from list of tasks
        (typeof task === 'string') ? delete this.tasks[stripAnsi(task)] : delete this.tasks[this.getName(task)];

        // Shift up tasks if needed, and also recalculate max task name length for realignment
        this.longestNameLength = Object.entries(this.tasks).reduce((prev, [taskName, { index }]) => {
            // What?! Side-effects in reduce?!
            // Don't worry, we're not functional purists here.
            // Decrement all indexes after the one to remove.
            if (shift && index > idxToRemove) {
                this.tasks[taskName].index--;
            }

            return Math.max(prev, stringWidth(taskName));
        }, 0);

        // Rerender other tasks so that task names are padded correctly.
        Object.values(this.tasks).forEach((t) => {
            this.writeTask(t);
        });

        this.logger.refresh();
    }

    private progressString(task: Task) {
        const {
            name,
            barTransformFn,
            nameTransformFn,
            message,
            percentage,
        } = task;

        // scale progress bar to percentage of total width
        const scaled = percentage * this.progressWidth;

        // scaledInt gives you the number of full blocks
        const scaledInt = Math.floor(scaled);

        // scaledFrac gives you the fraction of a full block
        const scaledFrac = Math.floor(CHARS.length * (scaled % 1));
        const fullChar = FULL_CHAR;
        const fracChar = (scaledFrac > 0)
            ? FRAC_CHARS[scaledFrac - 1]
            : ((scaledInt === this.progressWidth)
                ? ''
                : ' ');

        // combine full blocks with partial block
        const bar = barTransformFn(fullChar.repeat(scaledInt) + fracChar);
        // fill the rest of the space until progressWidth
        const rest = (scaledInt < this.progressWidth - 1)
            ? ' '.repeat(this.progressWidth - (scaledInt + 1))
            : '';
        // TODO: make this formattable
        // Currently, returns the name of the task, padded to the length of the longest name,
        // the bar, space padding, percentage padded to 3 characters, and the custom message.
        const percentString = (percentage * 100).toFixed(0).padStart(3);

        // Compensate for the existence of escape characters in padStart.
        const stringLengthDifference = name.length - stringWidth(name);
        const paddedTaskName = nameTransformFn(name.padStart(this.longestNameLength + stringLengthDifference));

        return `${paddedTaskName}: ${bar}${rest} ${percentString}% | ${message}`;
    }

    private indefiniteString(task: Task, spinner: string) {
        const {
            name,
            barTransformFn,
            nameTransformFn,
            message,
        } = task;
        const stringLengthDifference = name.length - stringWidth(name);
        const paddedTaskName = nameTransformFn(name.padStart(this.longestNameLength + stringLengthDifference));
        return `${paddedTaskName}: ${barTransformFn(spinner)} ${message}`;
    }

    private writeTask(task: Task) {
        this.logger.upsertProgress({
            index: task.index,
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
        name = stripAnsi(name);
        if (this.tasks[name] === undefined) {
            this.logger.error('Error calling incrementTask(): Task does not exist');
            return;
        }
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
        name = stripAnsi(name);
        if (this.tasks[name] === undefined) {
            this.logger.error('Error calling updateTask(): Task does not exist');
            return;
        }
        this.restartPromiseIfNeeded();
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
            }
            return;
        }

        this.writeTask(this.tasks[name]);
        this.logger.refresh();
    }

    public done(name: string, { message = green('Finished'), ...options }: Pick<UpdateOptions, 'message' | 'barTransformFn' | 'nameTransformFn'> = {}) {
        name = stripAnsi(name);
        if (this.tasks[name] === undefined) {
            this.logger.error('Error calling done(): Task does not exist');
            return;
        }

        this.tasks[name] = {
            ...this.tasks[name],
            done: true,
            percentage: 1,
            message,
            ...options,
        };

        const task = this.tasks[name];

        this.writeTask(task);
        this.logger.refresh();

        // Stop animation if all tasks are done, and resolve the promise.
        if (Object.values(this.tasks).reduce((prev, curr) => {
            return prev && curr.done
        }, true)) {
            clearInterval(this.intervalID);
            this.intervalID = null;
            this.allFinished = true;
            this.resolve();
            if (!this.persist) {
                this.logger.done();
            }
        }
    }

    public restartTask(name: string, { percentage = 0, ...options }: Pick<UpdateOptions, 'percentage' | 'message' | 'barTransformFn' | 'nameTransformFn'>) {
        name = stripAnsi(name);
        this.restartPromiseIfNeeded();

        if (this.tasks[name] === undefined) {
            this.logger.error('Error calling restart(): Task does not exist');
            return;
        }

        this.tasks[name] = {
            ...this.tasks[name],
            ...options,
            percentage,
            done: false,
        };

        if (this.tasks[name].type === 'indefinite' && !this.intervalID) {
            this.t = 0;
            this.intervalID = setInterval(() => this.renderIndefinite(), 1000 / this.spinnerFPS);
        } else if (this.tasks[name].type === 'percentage') {
            this.tasks[name].percentage = 0;
            this.writeTask(this.tasks[name]);
            this.logger.refresh();
        }

    }

    public close() {
        if (this.intervalID !== null) {
            clearInterval(this.intervalID);
            this.intervalID = null;
        }
        this.allFinished = true;
        this.resolve();
        this.logger.done();
    }

    // Returns the index of task with supplied name. Returns undefined if name not found.
    public getIndex(taskName: string) {
        return this.tasks[stripAnsi(taskName)]?.index;
    }

    // Returns the name of the task with given index. Returns undefined if name not found.
    public getName(index: number) {
        return Object.entries(this.tasks).find(([_, task]) => task.index === index)?.[0];
    }

    // TODO maybe make this static?
    private hilbertSpinner(t: number, width: number) {
        // Each cell takes 8 steps to go through (plus 3 for trailing).
        const cycle = 8 * Math.floor(width / this.numCrawlers);

        t = t % cycle;

        const spinner = Array(width).fill(' ').map((_, idx) => {
            const adjId = -8 * (idx % Math.floor(width / this.numCrawlers)) + t;
            const leftOver = -cycle + 8
            if (idx % 2 === 0) {
                if (adjId >= leftOver && adjId < leftOver + 3) {
                    return SPACE_FILLING_1[cycle + adjId];
                }
                if (adjId < 0 || adjId >= SPACE_FILLING_1.length) {
                    return ' ';
                }
                return SPACE_FILLING_1[adjId];
            } else {
                if (adjId >= leftOver && adjId < leftOver + 3) {
                    return SPACE_FILLING_2[cycle + adjId];
                }
                if (adjId < 0 || adjId >= SPACE_FILLING_2.length) {
                    return ' ';
                }
                return SPACE_FILLING_2[adjId];
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
                    index: task.index,
                    data: progressString,
                });
            }
        });
        this.logger.refresh();
        this.t = this.t + 1;
    }
}
