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
