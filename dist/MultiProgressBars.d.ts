/// <reference types="node" />
import { WriteStream } from 'tty';
export declare type TaskType = 'percentage' | 'indefinite';
export interface Task {
    name: string;
    index: number;
    type: TaskType;
    message: string;
    barColorFn: (bar: string) => string;
    percentage?: number;
    done: boolean;
}
export declare type UpdateOptions = {
    percentage?: number;
} & Partial<Pick<Task, 'message' | 'barColorFn'>>;
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
export declare type SpinnerGenerator = (t: number, width: number) => string;
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
export declare class MultiProgressBar {
    private tasks;
    private stream;
    private spinnerFPS;
    private initialLines;
    private progressWidth;
    private CHARS;
    private SPACE_FILLING_1;
    private SPACE_FILLING_2;
    private FRAC_CHARS;
    private FULL_CHAR;
    private intervalID;
    private numCrawlers;
    private longestNameLength;
    private t;
    private resolve;
    private spinnerGenerator;
    promise: Promise<void>;
    /**
     *
     * @param options   See CtorOptions type
     */
    constructor(options?: Partial<CtorOptions>);
    private init;
    addTask(name: string, type: TaskType, barColorFn: (b: string) => string, index: number): void;
    private progressString;
    private writeTask;
    updateTask(name: string, { ...options }: UpdateOptions): void;
    done(name: string, message?: string): void;
    private hilbertSpinner;
    private renderIndefinite;
}
