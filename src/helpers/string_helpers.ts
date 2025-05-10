/*
 * String manipulation helpers.
 */
import { Account } from "fedialgo";

export const DEMO_APP = "DEMO APP";
const DEFAULT_LOCALE = "en-US";
const NBSP_REGEX = /&nbsp;/g;
const ACCOUNT_JOINER = '  ●  '


// Returns HTML combining the Account.note property with the followers and toots count
export const accountTooltipTxt = (account: Account): string => {
    let txt = account.note.replace(NBSP_REGEX, " ");  // Remove non-breaking spaces so we can wrap the text
    const createdAt = new Date(account.createdAt);

    const accountStats = [
        `Created ${createdAt.toLocaleDateString(browserLocale(), {year: "numeric", month: "short", day:"numeric"})}`,
        `${account.followersCount.toLocaleString()} Followers`,
        `${account.statusesCount.toLocaleString()} Toots`,
    ]

    return `${txt}<br /><p style="font-weight: bold; font-size: 13px;">[${accountStats.join(ACCOUNT_JOINER)}]</p>`;
};


// Locale
export const browserLocale = () => navigator?.language || DEFAULT_LOCALE;
export const browserLanguage = () => browserLocale().split('-')[0];
export const browserCountry = () => browserLocale().split('-')[1];

// Log the browser's locale information to the console
export const logLocaleInfo = (): void => {
    const locale = navigator?.language;
    const localeParts = locale.split('-');
    const region = localeParts[1] || '';

    const msg = [
        `locale="${browserLocale()}"`,
        `language="${browserLanguage()}"`,
        `country="${browserCountry()}"`,
    ];

    logMsg(`${msg.join(", ")}`);
};


// for use with sort()
export const compareStr = (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase());


// Remove http:// or https:// from the server URL, Remove everything after slash
export function sanitizeServerUrl(server: string): string {
    server = server.replace(/^https?:\/\//, '').split('/')[0];
    return `https://${server}`;
};


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


const DATE_FORMAT = Intl.DateTimeFormat(
    browserLocale(),
    {weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric"}
);


export const timestampString = (_timestamp: string): string => {
    const timestamp = new Date(_timestamp);
    const ageInSeconds = (Date.now() - timestamp.getTime()) / 1000;
    const isToday = timestamp.getDate() == new Date().getDate();
    let str: string;

    if (isToday && ageInSeconds < (3600 * 48)) {
        str = `Today ${timestamp.toLocaleTimeString(browserLocale())}`;
    } else if (ageInSeconds < (3600 * 6 * 24)) {
        str = timestamp.toLocaleTimeString(browserLocale(), { weekday: "short" });
    } else {
        str = DATE_FORMAT.format(timestamp);
    }

    return str;
};


// Log helpers
export const debugMsg = (message: string, ...args: unknown[]) => console.debug(`[${DEMO_APP}] ${message}`, ...args);
export const infoMsg = (message: string, ...args: unknown[]) => console.info(`[${DEMO_APP}] ${message}`, ...args);
export const logMsg = (message: string, ...args: unknown[]) => console.log(`[${DEMO_APP}] ${message}`, ...args);
export const warnMsg = (message: string, ...args: unknown[]) => console.warn(`[${DEMO_APP}] ${message}`, ...args);
export const errorMsg = (message: string, ...args: unknown[]) => console.error(`[${DEMO_APP}] ${message}`, ...args);
