import { format } from 'util';
import { WriteStream } from 'tty';
import {
    CUP, clampString, ED, ED_MODE, EL, EL_MODE, splitLinesAndClamp
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
    protected progressBuffer: string[];
    protected height: number;

    /** Progress section height, will not exceed total terminal height
     * As opposed to progressBuffer.length, which is unbounded
     */
    protected progressHeight: number;

    protected topBorder: string;
    protected bottomBorder: string;

    protected originalConsole: Console;
    protected stream: WriteStream;
    public width: number;
    warn: Console['warn'];
    error: Console['error'];

    constructor(options: VirtualConsoleCtorOptions) {
        this.originalConsole = console;
        this.stream = options.stream;
        this.width = this.stream.columns;
        this.height = this.stream.rows;

        this.stream.on('resize', this.resize);

        this.progressHeight = 0;
        this.progressBuffer = [];

        if (!process.stdout.isTTY) {
            this.log = console.log;
        }

        this.warn = this.log;
        this.error = this.log;

        (console as any) = this;
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
        this.refresh?.();
    }

    done() {
        throw new Error('Must Implement in Derived Class!');
    }

    refresh() {
        throw new Error('Must Implement in Derived Class');
    }

    log(..._: any[]) {
        throw new Error('Must Implement in Derived Class');
    }

    upsertProgress(_: AddProgressOptions) {
        throw new Error('Must Implement in Dervied Class');
    }

    init() {
        const blank = '\n'.repeat(this.stream.rows) + CUP(0) + ED(ED_MODE.TO_END);
        this.stream?.write(blank);
    }

    setTopBorder(border: string) {
        this.topBorder = border;
        this.progressHeight += 1;
    }

    setBottomBorder(border: string) {
        this.bottomBorder = border;
        this.progressHeight += 1;
    }

    protected currentHeightMinusBorders() {
        return this.progressHeight - (this.topBorder === undefined ? 0 : 1) - (this.bottomBorder === undefined ? 0 : 1);
    }

    dumpBuffer() {
        const outString = ''
            + CUP(0)
            + ED(0)
            + '\x1b[0m'
            + ((this.topBorder === undefined) ? '' : (this.topBorder + '\n'))
            + this.progressBuffer
                .join('\n')
            + ((this.bottomBorder === undefined) ? '' : ('\n' + this.bottomBorder));

        this.stream?.write(outString);
    }

    getBuffer() {
        return this.progressBuffer;
    }
}

export class VirtualConsoleTop extends VirtualConsole {
    private consoleBuffer: string[];
    /* Console section height, will not exceed total terminal height
     * This will always match consoleBuffer.length.
     * consoleHeight + progressHeight = height
     */
    private consoleHeight: number;

    constructor(options: VirtualConsoleCtorOptions) {
        super(options);
        this.consoleBuffer = [];
        this.consoleHeight = this.height;
        this.init();
        this.refresh?.();
    }

    setTopBorder(border: string) {
        super.setTopBorder(border);
        this.consoleHeight -= 1;
    }

    setBottomBorder(border: string) {
        super.setBottomBorder(border);
        this.consoleHeight -= 1;
    }

    done() {
        if (this.progressBuffer.length > this.height) {
            this.dumpBuffer();
        } else {
            this.stream?.write('\x1b[0m\n');
        }
        (console as any) = this.originalConsole;
        this.originalConsole = null;
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
        if (numToExtend <= 0) {
            return;
        }

        // Extend the progress bars section, and reduce the corresponding console buffer height.
        this.progressHeight = Math.min(this.progressHeight + numToExtend, this.height);
        this.consoleHeight = Math.max(this.consoleHeight - numToExtend, 0);
    }

    getOutString(bufferStartIndex: number, topLines: string[]) {
        return [
            topLines.map((val) => val + EL(EL_MODE.TO_END)).join('\n'),             // Popped lines
            ((this.topBorder === undefined) ?                                       // Top border or null
                null
                : (this.topBorder + EL(EL_MODE.TO_END))),
            this.progressBuffer                                                     // Progress bars
                .slice(bufferStartIndex)
                .map((val) => val + EL(EL_MODE.TO_END))
                .join('\n'),
            ((this.bottomBorder === undefined) ?                                    // Bottom border or null
                null
                : (this.bottomBorder + EL(EL_MODE.TO_END))),
            this.consoleBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')    // Logs
        ].filter((v) => {
            return (v !== undefined) && (v !== '') && (v !== null);                 // Remove falsey/empty values
        }).join('\n');                                                              // Join with newlines
    }

    /* Prints out the buffers as they are */
    refresh() {
        // pop top of consoleBuffer if longer than consoleHeight
        const topLines =
            (this.consoleBuffer.length > this.consoleHeight) ?
                this.consoleBuffer.splice(0, this.consoleBuffer.length - this.consoleHeight) : [];

        const bufferStartIndex = Math.max(this.progressBuffer.length - this.currentHeightMinusBorders(), 0);
        this.stream?.write(CUP(0) + this.getOutString(bufferStartIndex, topLines));
    }

    log(...data: any[]) {
        if (data.length !== 0) {
            const writeString: string = format.apply(null, data);
            const clampedLines = splitLinesAndClamp(writeString, this.width);

            this.consoleBuffer.push(...clampedLines);
        }

        // If the console buffer is higher than console height, remove the top, and print them first.
        const topLines =
            (this.consoleBuffer.length > this.consoleHeight) ?
                this.consoleBuffer.splice(0, this.consoleBuffer.length - this.consoleHeight)
                : [];

        const bufferStartIndex = Math.max(this.progressBuffer.length - this.currentHeightMinusBorders(), 0);
        this.stream?.write(CUP(0) + this.getOutString(bufferStartIndex, topLines));
    }

    /** STUB
     *
     */
    removeProgressSlot() {
        this.progressHeight = Math.max(0, this.progressHeight - 1);
        // this.consoleHeight = Math.min(this.height, this.consoleHeight + 1);
        // KEEP DOING
    }
}

export class VirtualConsoleBottom extends VirtualConsole {
    constructor(options: VirtualConsoleCtorOptions) {
        super(options);
        this.init();
    }

    init() {
        super.init();
        this.stream?.write(CUP(this.height - 1));
        this.refresh?.();
    }

    done() {
        if (this.progressBuffer.length > this.height) {
            this.dumpBuffer();
        } else {
            this.stream?.write(CUP(this.height, this.width) + '\x1b[0m\n');
        }
        (console as any) = this.originalConsole;
        this.originalConsole = null;
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
        if (numToExtend <= 0) {
            return;
        }

        // Extend the progress bars section
        this.progressHeight = Math.min(this.progressHeight + numToExtend, this.height);
    }

    /* Prints out the buffers as they are */
    refresh() {
        const bufferStartIndex = Math.max(this.progressBuffer.length - this.currentHeightMinusBorders(), 0);
        const firstProgressLine = this.height - this.progressHeight;
        const outString = [
            ((this.topBorder === undefined) ?                                       // Top border or null
                null
                : (this.topBorder + EL(EL_MODE.TO_END))),
            this.progressBuffer                                                     // Progress bars or []
                .slice(bufferStartIndex)
                .map((val) => val + EL(EL_MODE.TO_END))
                .join('\n'),
            ((this.bottomBorder === undefined) ?                                    // Bottom border or null
                null
                : (this.bottomBorder + EL(EL_MODE.TO_END))),

        ].filter((v) => {
            return (v !== undefined) && (v !== '') && (v !== null);                 // Remove falsey/empty values
        }).join('\n');

        this.stream?.write(outString + CUP(firstProgressLine));
    }

    log(...data: any[]) {
        let clampedLines: string[] = [];
        if (data.length !== 0) {
            const writeString: string = format.apply(null, data);
            // Split by newlines, and then split the resulting lines if they run longer than width.
            clampedLines = splitLinesAndClamp(writeString, this.width);
        }

        const firstProgressLine = this.height - this.progressHeight;
        const bufferStartIndex = Math.max(this.progressBuffer.length - this.currentHeightMinusBorders(), 0);

        const outString = [
            clampedLines.map((val) => val + EL(EL_MODE.TO_END)).join('\n'),
            ((this.topBorder === undefined) ?                                       // Top border or null
                null
                : (this.topBorder + EL(EL_MODE.TO_END))),
            this.progressBuffer                                                     // Progress bars or []
                .slice(bufferStartIndex)
                .map((val) => val + EL(EL_MODE.TO_END))
                .join('\n'),
            ((this.bottomBorder === undefined) ?                                    // Bottom border or null
                null
                : (this.bottomBorder + EL(EL_MODE.TO_END))),
        ].filter((v) => {
            return (v !== undefined) && (v !== '') && (v !== null);                 // Remove falsey/empty values
        }).join('\n');

        this.stream?.write(outString + CUP(firstProgressLine),);
    }
}