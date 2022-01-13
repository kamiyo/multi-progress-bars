import { format } from 'util';
import { WriteStream } from 'tty';
import {
    CUP, clampString, ED, ED_MODE, EL, EL_MODE, splitLinesAndClamp
} from './utils';

export interface VirtualConsoleCtorOptions {
    stream: WriteStream;
    anchor?: 'top' | 'bottom';
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
    private height: number;

    /** Progress section height, will not exceed total terminal height
     * As opposed to progressBuffer.length, which is unbounded
     */
    private progressHeight: number;

    private consoleBuffer: string[];
    /* Console section height, will not exceed total terminal height
     * This will always match consoleBuffer.length.
     * consoleHeight + progressHeight = height
     */
    private consoleHeight: number;

    private topBorder: string;
    private bottomBorder: string;

    private originalConsole: Console;
    private stream: WriteStream;
    private getOutString: (bufferStartIndex: number, topLines: string[]) => string;

    public width: number;
    warn: Console['warn'];
    error: Console['error'];

    constructor(options: VirtualConsoleCtorOptions) {

        this.originalConsole = console;
        this.stream = options.stream;
        this.width = this.stream.columns;
        this.height = this.stream.rows;

        this.stream.on('resize', () => {
            this.resize();
        });

        this.progressHeight = 0;
        this.progressBuffer = [];

        this.consoleBuffer = [];
        this.consoleHeight = this.height;

        const anchor = options.anchor || 'top';
        this.getOutString = (anchor === 'top') ?
            this.getOutStringTop : this.getOutStringBottom;

        if (!process.stdout.isTTY) {
            this.log = console.log;
        }

        this.warn = this.log;
        this.error = this.log;

        (console as any) = this;

        this.init();

        this.refresh?.();
    }

    init() {
        const blank = '\n'.repeat(this.stream.rows) + CUP(0) + ED(ED_MODE.TO_END);
        this.stream?.write(blank);
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
        this.progressHeight =
                Math.min(
                    this.progressHeight,
                    this.height
                );
        this.consoleHeight = this.height - this.progressHeight;
        this.refresh?.();
    }

    done() {
        if (this.progressBuffer.length > this.height) {
            this.dumpProgressBuffer();
        } else {
            this.stream?.write('\x1b[0m\n');
        }
        (console as any) = this.originalConsole;
        this.originalConsole = null;
    }

    /* Prints out the buffers as they are */
    refresh() {
        // pop top of consoleBuffer if longer than consoleHeight
        const topLines =
            (this.consoleBuffer.length > this.consoleHeight) ?
                this.consoleBuffer.splice(0, this.consoleBuffer.length - this.consoleHeight) : [];

        // If progress buffer is larger than screen height - borders, then truncate top
        const bufferStartIndex = Math.max(this.progressBuffer.length - this.currentHeightMinusBorders(), 0);
        this.stream?.write(CUP(0) + this.getOutString(bufferStartIndex, topLines));
    }

    getOutStringTop(bufferStartIndex: number, topLines: string[]) {
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
            (this.consoleBuffer.length) ?
                this.consoleBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n')
                + ED(ED_MODE.TO_END)
                : null,    // Logs
        ].filter((v) => {
            return (v !== undefined) && (v !== '') && (v !== null);                 // Remove falsey/empty values
        }).join('\n');                                                              // Join with newlines
    }

    getOutStringBottom(bufferStartIndex: number, topLines: string[]) {
        const fillerCount = Math.max(0, this.consoleHeight - this.consoleBuffer.length);
        return [
            topLines.map((val) => val + EL(EL_MODE.TO_END)).join('\n'),
            this.consoleBuffer.map((val) => val + EL(EL_MODE.TO_END)).join('\n'),
            (fillerCount) ?
                (new Array(fillerCount).fill(EL(EL_MODE.ENTIRE_LINE))).join('\n')
                : null,                                                             // Empty space between console and progress
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
    }

    log(...data: any[]) {
        // Format incoming strings and split into lines and clamp.
        if (data.length !== 0) {
            const writeString = format(...data);
            const clampedLines = splitLinesAndClamp(writeString, this.width);

            this.consoleBuffer.push(...clampedLines);
        }

        this.refresh();
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

    setTopBorder(border: string) {
        if (this.topBorder === undefined) {
            this.progressHeight = Math.min(this.height, this.progressHeight + 1);
            this.consoleHeight = this.height - this.progressHeight;
        }
        this.topBorder = border;
    }

    removeTopBorder() {
        if (this.topBorder !== undefined) {
            this.topBorder = undefined;
            this.progressHeight =
                Math.min(
                    Math.max(this.progressHeight - 1, this.progressBuffer.length),
                    this.height
                );
            this.consoleHeight = this.height - this.progressHeight;
        }
    }

    setBottomBorder(border: string) {
        if (this.bottomBorder === undefined) {
            this.progressHeight = Math.min(this.height, this.progressHeight + 1);
            this.consoleHeight = this.height - this.progressHeight;
        }
        this.bottomBorder = border;
    }

    removeBottomBorder() {
        if (this.bottomBorder !== undefined) {
            this.bottomBorder = undefined;
            this.progressHeight =
                Math.min(
                    Math.max(this.progressHeight - 1, this.progressBuffer.length),
                    this.height
                );
            this.consoleHeight = this.height - this.progressHeight;
        }
    }

    removeProgressSlot() {
        if (this.progressHeight === 0 || this.progressBuffer.length === 0) {
            return;
        }
        this.progressBuffer.length--;
        this.progressHeight = Math.min(
            Math.max(this.progressHeight - 1, this.progressBuffer.length),
            this.height
        );

        this.consoleHeight = this.height - this.progressHeight;
    }

    private currentHeightMinusBorders() {
        return this.progressHeight -
            (this.topBorder === undefined ? 0 : 1) -
            (this.bottomBorder === undefined ? 0 : 1);
    }

    dumpProgressBuffer() {
        const outString = [
            this.topBorder,
            this.progressBuffer
                .join('\n'),
            this.bottomBorder,
        ].filter((v) => (v !== undefined) || (v !== ''))
            .join('\n');

        this.stream?.write('' + CUP(0) + ED(0) + '\x1b[0m' + outString);
    }

    getBuffer() {
        return this.progressBuffer;
    }
}
