const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


export const timeString = (tootedAt: Date | string): string => {
    tootedAt = typeof tootedAt == 'string' ? new Date(tootedAt) : tootedAt;
    const currentDateNumber = new Date().getDate();

    if (tootedAt.getDate() === currentDateNumber) {
        return tootedAt.toLocaleTimeString();
    } else {
        return `${DAY_NAMES[tootedAt.getDay()]} ${tootedAt.toLocaleDateString()}`;
    }
};


export const scoreString = (score: number | null): string => {
    if (!score && score != 0) return "?";
    let decimalPlaces = 1;

    // find the number of decimal places before a non-zero digit
    if (score < 0.0001) {
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
}
