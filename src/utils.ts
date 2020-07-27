
const ESC = '\x1B';
const CSI = ESC + '[';

export const CUP = (row: number, column?: number) => {
    const rowString = (row !== undefined) ? (row + 1).toFixed(0) : '';
    const columnString = (column !== undefined) ? (column + 1).toFixed(0) : '';
    return CSI + rowString + ';' + columnString + 'H';
};

export const CHA = (column: number) => {
    const columnString = (column !== undefined) ? (column + 1).toFixed(0) : '';
    return CSI + columnString + 'G';
};

export enum EL_MODE {
    TO_END = 0,
    TO_BEGINNING = 1,
    ENTIRE_LINE = 2
};

export const EL = (mode: EL_MODE = EL_MODE.TO_END) => {
    return CSI + mode.toString() + 'K';
};

export enum ED_MODE {
    TO_END = 0,
    TO_BEGINNING = 1,
    ENTIRE_SCREEN = 2,
    ENTIRE_SCREEN_DELETE_SCROLLBACK = 3,
};

export const ED = (mode: ED_MODE = ED_MODE.TO_END) => {
    return CSI + mode.toString() + 'J';
};