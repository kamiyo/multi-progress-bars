import { default as stringWidth } from 'string-width';

const ESC = '\x1B';
const CSI = ESC + '[';
export const RESET = CSI + '0m'

const numberTo1StringHelper = (number: number) =>
    (number !== undefined) ? (number + 1).toFixed(0) : '';

const numberTo0StringHelper = (number: number) =>
    (number !== undefined) ? number.toFixed(0) : '';

/** CUrsor Position
 *
 * @param row (required) 0-index absolute row
 * @param column (optional) 0-index absolute column
 */
export const CUP = (row: number, column?: number) =>
    `${CSI}${numberTo1StringHelper(row)};${numberTo1StringHelper(column)}H`;

/** Cursor Horizonal Absolute
 *
 * @param column (optional) 0-index absolute column
 */
export const CHA = (column: number) => `${CSI}${numberTo1StringHelper(column)}G`;

/** CUrsor Up
 *
 * @param number (optional) 0-index rows to move up
 */
export const CUU = (number: number) => `${CSI}${numberTo0StringHelper(number)}A`;

/** CUrsor Down
 *
 * @param number (optional) 0-index rows to move down
 */
export const CUD = (number: number) => `${CSI}${numberTo0StringHelper(number)}B`;

/** CUrsor Forward
 *
 * @param number (optional) 0-index rows to move right
 */
export const CUF = (number: number) => `${CSI}${numberTo0StringHelper(number)}C`;

/** CUrsor Back
*
* @param number (optional) 0-index rows to move left
*/
export const CUB = (number: number) => `${CSI}${numberTo0StringHelper(number)}D`;

/**
 *
 * @param rows (required) 0-index rows to move down (can be negative for moving up)
 * @param columns (optional) 0-index columns to move to the right (negative for left)
 */
export const MoveCursor = (rows: number, columns?: number) => {
    let command = '';
    if (rows === 0 && columns === 0) return;
    // deal with rows first
    if (rows > 0) {
        command += CUD(rows);
    } else if (rows < 0) {
        command += CUU(rows);
    }
    if (columns > 0) {
        command += CUF(columns);
    } else if (columns < 0) {
        command += CUB(columns);
    }
    return command;
}

export enum EL_MODE {
    TO_END = 0,
    TO_BEGINNING = 1,
    ENTIRE_LINE = 2
};

/** Erase Line
 *
 * @param mode  EL_MODE.TO_END, .TO_BEGINNING, or .ENTIRE_LINE
 */
export const EL = (mode: EL_MODE = EL_MODE.TO_END) => {
    return `${CSI}${mode.toString()}K`;
};

export enum ED_MODE {
    TO_END = 0,
    TO_BEGINNING = 1,
    ENTIRE_SCREEN = 2,
    ENTIRE_SCREEN_DELETE_SCROLLBACK = 3,
};

/** Erase Display
 *
 * @param mode  ED_MORE.TO_END, .TO_BEGINNING, ENTIRE_SCREEN, or .ENTIRE_SCREEN_DELETE_SCROLLBACK
 */
export const ED = (mode: ED_MODE = ED_MODE.TO_END) => {
    return `${CSI}${mode.toString()}J`;
};

// Anyways, probably don't want any styling codes to linger past one line.
export const clampString = (message: string, width: number) => {
    while (stringWidth(message) > width) {
        // Can't be sure we are slicing off a character vs a control sequence or colors
        // so do it this way, checking each time.
        message = message.slice(0, message.length - 1);
    }
    return message;
};

// Split by newlines, and then split the resulting lines if they run longer than width.
export const splitLinesAndClamp = (writeString: string, maxWidth: number) => {
    return writeString.split('\n').reduce<string[]>((prev, curr) => {
        const clamped = [];
        do {
            let width = curr.length;
            let front = curr;
            while (stringWidth(front) > maxWidth) {
                front = curr.slice(0, width)
                width--;
            }
            curr = curr.slice(width);
            clamped.push(front);
        } while (curr.length > 0)
        return [...prev, ...clamped];
    }, []);
};