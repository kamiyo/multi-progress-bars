import { format } from 'util';
import { WriteStream } from 'tty';
import {
    CUP, clampString, ED, ED_MODE, EL, EL_MODE
} from './utils';

export interface VirtualConsoleCtorOptions {
    stream: WriteStream;
}

export interface AddProgressOptions {
    index: number;
    data: string;
}

export interface UpsertProgressOptions extends AddProgressOptions {
    refresh?: boolean;
}

export class VirtualConsole {
    private progressBuffer: string[];
    private consoleBuffer: string[];
    private width: number;
    private height: number;
    private progressHeight: number;
    private consoleHeight: number;
    private originalConsole: Console;
    private stream: WriteStream;
    warn: Console['warn'];
    error: Console['error'];

    constructor(options: VirtualConsoleCtorOptions) {
        this.originalConsole = console;
        this.stream = options.stream;
        this.width = process.stdout.columns;
        this.height = process.stdout.rows - 1;
        this.progressHeight = 0;
        this.consoleHeight = this.height;
        this.progressBuffer = [];
        this.consoleBuffer = [];
        this.warn = this.log;
        this.error = this.log;
        (console as any) = this;
        this.init();
    }

    cleanup() {
        this.stream?.write('\x1b[0m');
        (console as any) = this.originalConsole;
    }

    init() {
        (process as NodeJS.Process).on('SIGINT', this.cleanup);
        const blank = '\n'.repeat(this.stream.rows) + CUP(0) + ED(ED_MODE.TO_END);
        this.stream?.write(blank);
    }

    /** Add or Update Progress Entry
     *
     * @param options
     * index: number
     * data: string
     */
    upsertProgress(options: UpsertProgressOptions) {

        // If the progress we're upserting exists already, just update.
        if (options.index < this.progressHeight) {
            this.progressBuffer[options.index] = clampString(options.data, this.width);
            if (options.refresh === undefined || options.refresh) this.refresh();
            return;
        }

        // Truncate progress line to console width.
        this.progressBuffer[options.index] = clampString(options.data, this.width);

        // Extend the progress bars section, and reduce the corresponding console buffer height.
        const numToExtend = 1 + options.index - this.progressHeight;
        this.progressHeight = Math.max(options.index + 1, this.progressHeight);
        if (numToExtend > 0) {
            this.consoleHeight -= numToExtend;
            const topLines = this.consoleBuffer.splice(0, numToExtend);
            if (topLines.length) {
                this.log(...topLines);
            } else {
                this.refresh();
            }
        } else {
            this.refresh();
        }
    }

    updateProgress(options: UpsertProgressOptions) {
        this.progressBuffer[options.index] = clampString(options.data, this.width);
        if (options.refresh) {
            this.refresh();
        }
    }

    writeLines(...indexes: number[]) {
        let writeString = indexes.reduce((prev, index) => {
            return prev += CUP(index) + this.progressBuffer[index];
        }, '');
        this.stream?.write(writeString);
    }

    /* Prints out the buffers as they are */
    refresh() {
        const outString =
            CUP(0)
            + this.progressBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
            + (this.progressBuffer.length ? '\n' : '')
            + this.consoleBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
            + '\n';

        this.stream?.write(outString);
    }

    log(...data: any[]) {
        const writeString: string = format.apply(null, data);
        // Split by newlines, and then split the resulting lines if they run longer than width.
        const clampedLines = writeString.split('\n').reduce<string[]>((prev, curr) => {
            const clamped = [];
            do {
                const front = curr.slice(0, this.width);
                curr = curr.slice(this.width);
                clamped.push(front);
            } while (curr.length > 0)
            return [...prev, ...clamped];
        }, []);

        this.consoleBuffer.push(...clampedLines);

        // If the console buffer is higher than console height, remove the top, and print them first.
        const topLines =
            (this.consoleBuffer.length > this.consoleHeight) ?
                this.consoleBuffer.splice(0, this.consoleBuffer.length - this.consoleHeight) : [];

        const outString =
            CUP(0)
            + topLines.map((val) => val + EL(EL_MODE.TO_END)).join('\n')    // print the previously removed top lines
            + (topLines.length ? '\n' : '')                                 // separator
            + this.progressBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')     // progress bars
            + (this.progressBuffer.length ? '\n' : '')
            + this.consoleBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')      // rest of the console log.
            + '\n';

        this.stream?.write(outString);
    }

}