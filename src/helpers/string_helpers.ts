/*
 * String manipulation helpers.
 */
const DEMO_APP = "DEMO APP";


// Converts a number to a string with the number of decimal places dependent on the value.
export const scoreString = (score: number | null): string => {
    if (!score && score != 0) return "?";
    let decimalPlaces = 1;

    // find the number of decimal places before a non-zero digit
    if (score < 0.0000001) {
        decimalPlaces = 10;
    } else if (score < 0.0001) {
        decimalPlaces = 7;
    } else if (score < 0.001) {
        decimalPlaces = 5;
    } else if (score < 0.01) {
        decimalPlaces = 4;
    } else if (score < 0.1) {
        decimalPlaces = 3;
    } else if (score < 1) {
        decimalPlaces = 2;
    }

    return `${score.toFixed(decimalPlaces)}`;
};


export const logMsg = (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${DEMO_APP}] ${message}`, ...args);
    }
};
