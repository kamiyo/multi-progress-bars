import { format } from 'util';
import { WriteStream } from 'tty';
import {
    CUP, clampString, ED, ED_MODE, EL, EL_MODE
} from './utils';
import stringWidth from 'string-width';

export interface VirtualConsoleCtorOptions {
    stream: WriteStream;
    anchor: 'top' | 'bottom';
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
    private height: number;

    /** Progress section height, will not exceed total terminal height
     * As opposed to progressBuffer.length, which is unbounded
     */
    private progressHeight: number;

    /** Console section height, will not exceed total terminal height
     * This will always match consoleBuffer.length.
     * consoleHeight + progressHeight = height
     */
    private consoleHeight: number;
    private originalConsole: Console;
    private stream: WriteStream;
    public width: number;
    public anchor: 'top' | 'bottom';
    done: () => void;
    warn: Console['warn'];
    error: Console['error'];
    // upsertProgress: (options: UpsertProgressOptions) => void;
    writeLines: (...indexes: number[]) => void;
    refresh: () => void;
    log: (...data: any[]) => void;

    constructor(options: VirtualConsoleCtorOptions) {
        this.originalConsole = console;
        this.stream = options.stream;
        this.resize();
        this.anchor = options.anchor;
        // These members are only needed for top-anchored progresses
        if (this.anchor === 'top') {
            this.consoleBuffer = [];
            this.consoleHeight = this.height;
        }

        this.stream.on('resize', this.resize);

        this.progressHeight = 0;
        this.progressBuffer = [];

        if (this.anchor === 'top') {
            // this.upsertProgress = this.upsertProgressTop;
            this.writeLines = this.writeLinesTop;
            this.refresh = this.refreshTop;
            this.log = this.logTop;
            this.done = this.cleanupTop;
        } else {
            // this.upsertProgress = this.upsertProgressBottom;
            this.writeLines = this.writeLinesBottom;
            this.refresh = this.refreshBottom;
            this.log = this.logBottom;
            this.done = this.cleanupBottom;
        }
        this.warn = this.log;
        this.error = this.log;

        (console as any) = this;

        this.init();
    }

    checkConsoleIntercept() {
        if (!this.originalConsole) {
            this.originalConsole = console;
            (console as any) = this;
        }
    }

    resize() {
        this.width = this.stream.columns;
        this.height = this.stream.rows;
        this.refresh();
    }

    cleanupBottom() {
        this.originalConsole.log('\n');
        this.stream?.write(CUP(this.height, this.width) + '\x1b[0m');
        if (this.progressBuffer.length > this.height) {
            this.dumpBuffer();
        }
        (console as any) = this.originalConsole;
        console.log('');
        this.originalConsole = null;
    }

    cleanupTop() {
        this.stream?.write('\x1b[0m');
        (console as any) = this.originalConsole;
        this.originalConsole = null;
    }

    init() {
        if (this.anchor === 'top') {
            const blank = '\n'.repeat(this.stream.rows) + CUP(0) + ED(ED_MODE.TO_END);
            this.stream?.write(blank);
        }
    }

    /** Add or Update Progress Entry
     *
     * @param options
     * index: number
     * data: string
     */
    upsertProgress(options: AddProgressOptions) {
        // Reactivate console intercepting
        this.checkConsoleIntercept();

        const numToExtend = 1 + options.index - this.progressBuffer.length;

        // Truncate progress line to console width.
        this.progressBuffer[options.index] = clampString(options.data, this.width);

        // If we're not increasing the progress bars section, we're done.
        if (numToExtend === 0) {
            return;
        }

        // Extend the progress bars section, and reduce the corresponding console buffer height.
        this.progressHeight = Math.min(this.progressHeight + numToExtend, this.height);
        if (numToExtend > 0) {
            this.consoleHeight = Math.max(this.consoleHeight - numToExtend, 0);
            const poppedLines = this.consoleBuffer.splice(0, numToExtend);
            if (poppedLines.length) {
                this.log(...poppedLines);
            }
        }
    }

    removeProgressSlotTop() {
        this.progressHeight = Math.max(0, this.progressHeight - 1);
        this.consoleHeight = Math.min(this.height, this.consoleHeight + 1);
        // KEEP DOING
    }

    /** Add or Update Progress Entry for Bottom-Anchored Progress Bars
     *
     * @param options
     * index: number
     * data: string
     * refresh: boolean
     */
    upsertProgressBottom(options: AddProgressOptions) {
        // Reactivate console intercepting
        this.checkConsoleIntercept();

        const notAppending = options.index < this.progressBuffer.length

        // Truncate progress line to console width.
        this.progressBuffer[options.index] = clampString(options.data, this.width);

        // If we're not increasing the progress bars section, we're done.
        if (notAppending) {
            // if (options.refresh === undefined || options.refresh) this.refresh();
            return;
        }

        // Extend the progress bars section.
        this.progressHeight = Math.min(Math.max(options.index + 1, this.progressHeight), this.height);

        // this.refresh();
    }

    /** Update Progress Entry for given indexed Progress Bar
     *
     * @param options
     * index: number
     * data: string
     * refresh: boolean
     */
    // updateProgress(options: UpsertProgressOptions) {
    //     this.checkConsoleIntercept();

    //     this.progressBuffer[options.index] = clampString(options.data, this.width);
    //     if (options.refresh === undefined || options.refresh) {
    //         this.refresh();
    //     }
    // }

    writeLinesTop(...indexes: number[]) {
        let writeString = indexes.reduce((prev, index) => {
            return prev += CUP(index) + this.progressBuffer[index];
        }, '');
        this.stream?.write(writeString);
    }

    writeLinesBottom(...indexes: number[]) {
        const firstProgressLine = this.height - this.progressHeight;
        let writeString = indexes.reduce((prev, index) => {
            return prev += CUP(firstProgressLine + index) + this.progressBuffer[index];
        }, '');
        this.stream?.write(writeString);
    }

    /* Prints out the buffers as they are */
    refreshTop() {
        const bufferStartIndex = Math.max(this.progressBuffer.length - this.height, 0);
        const outString =
            CUP(0)
            + this.progressBuffer
                .slice(bufferStartIndex)
                .map((val) => val + EL(EL_MODE.TO_END))
                .join('\n')
            + (this.progressBuffer.length && this.consoleBuffer.length ? '\n' : '')
            + this.consoleBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
            // + '\n';

        this.stream?.write(outString);
    }

    /* Prints out the buffers as they are */
    refreshBottom() {
        const bufferStartIndex = Math.max(this.progressBuffer.length - this.height, 0);
        const firstProgressLine = this.height - this.progressHeight;
        const outString =
            this.progressBuffer
                .slice(bufferStartIndex)
                .map((val) => val + EL(EL_MODE.TO_END))
                .join('\n')
            // + (this.progressBuffer.length ? '\n' : '')
            + CUP(firstProgressLine);

        this.stream?.write(outString);
    }

    dumpBuffer() {
        const outString =
            ED(ED_MODE.ENTIRE_SCREEN)
            + this.progressBuffer.join('\n');

        this.stream?.write(outString);
    }

    logTop(...data: any[]) {
        const writeString: string = format.apply(null, data);
        // Split by newlines, and then split the resulting lines if they run longer than width.
        const clampedLines = writeString.split('\n').reduce<string[]>((prev, curr) => {
            const clamped = [];
            do {
                let width = curr.length;
                let front = curr;
                while (stringWidth(front) > this.width) {
                    front = curr.slice(0, width)
                    width--;
                }
                curr = curr.slice(width);
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
            // + '\n';

        this.stream?.write(outString);
    }

    logBottom(...data: any[]) {
        const writeString: string = format.apply(null, data);
        const firstProgressLine = this.height - this.progressHeight;

        const outString =
            this.progressBuffer.map((_) => EL(EL_MODE.ENTIRE_LINE)).join('\n')
            + CUP(firstProgressLine)
            + writeString
            + '\n'
            // + this.progressBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
            + this.progressBuffer.join('\n')
            // + (this.progressBuffer.length ? '\n' : '')
            + CUP(firstProgressLine);

        this.stream?.write(outString);
    }

    getBuffer() {
        return this.progressBuffer;
    }

}
