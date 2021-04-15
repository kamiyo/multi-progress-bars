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
    private progressHeight: number;
    private consoleHeight: number;
    private originalConsole: Console;
    private stream: WriteStream;
    public width: number;
    public anchor: 'top' | 'bottom';
    done: () => void;
    warn: Console['warn'];
    error: Console['error'];
    upsertProgress: (options: UpsertProgressOptions) => void;
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
            this.upsertProgress = this.upsertProgressTop;
            this.writeLines = this.writeLinesTop;
            this.refresh = this.refreshTop;
            this.log = this.logTop;
            this.done = this.cleanup;
        } else {
            this.upsertProgress = this.upsertProgressBottom;
            this.writeLines = this.writeLinesBottom;
            this.refresh = this.refreshBottom;
            this.log = this.logBottom;
            this.done = this.gotoBottom;
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

    // height is one less than rows, because if you print to the last line, the console usually adds a newline
    resize() {
        // see https://github.com/kamiyo/multi-progress-bars/issues/7    
        const stdout = process.stdout.isTTY ? process.stdout : process.stderr;

        this.width = stdout.columns;
        this.height = stdout.rows - 1;
    }

    gotoBottom() {
        this.stream?.write(CUP(this.height + 1) + '\x1b[0m');
        (console as any) = this.originalConsole;
        this.originalConsole = null;
    }

    cleanup() {
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
    upsertProgressTop(options: UpsertProgressOptions) {
        this.checkConsoleIntercept();

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

    upsertProgressBottom(options: UpsertProgressOptions) {
        this.checkConsoleIntercept();

        // If the progress we're upserting exists already, just update.
        if (options.index < this.progressHeight) {
            this.progressBuffer[options.index] = clampString(options.data, this.width);
            if (options.refresh === undefined || options.refresh) this.refresh();
            return;
        }

        // Truncate progress line to console width.
        this.progressBuffer[options.index] = clampString(options.data, this.width);

        // Extend the progress bars section.
        this.progressHeight = Math.max(options.index + 1, this.progressHeight);

        this.refresh();
    }

    updateProgress(options: UpsertProgressOptions) {
        this.checkConsoleIntercept();

        this.progressBuffer[options.index] = clampString(options.data, this.width);
        if (options.refresh) {
            this.refresh();
        }
    }

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
        const outString =
            CUP(0)
            + this.progressBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
            + (this.progressBuffer.length ? '\n' : '')
            + this.consoleBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
            + '\n';

        this.stream?.write(outString);
    }

    refreshBottom() {
        const firstProgressLine = this.height - this.progressHeight;
        const outString =
            this.progressBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
            + (this.progressBuffer.length ? '\n' : '')
            + CUP(firstProgressLine);

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
            + '\n';

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
            + this.progressBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
            + (this.progressBuffer.length ? '\n' : '')
            + CUP(firstProgressLine);

        this.stream?.write(outString);
    }

}
