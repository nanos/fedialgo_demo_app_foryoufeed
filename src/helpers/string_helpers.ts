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
        `Created ${createdAt.toLocaleDateString('en-us', {year: "numeric", month: "short", day:"numeric"})}`,
        `${account.followersCount.toLocaleString()} Followers`,
        `${account.statusesCount.toLocaleString()} Toots`,
    ]

    return `${txt}<br /><p style="font-weight: bold; font-size: 13px;">[${accountStats.join(ACCOUNT_JOINER)}]</p>`;
};


// Extract the language from the browser's locale
export function browserLanguage(): string {
    const locale = navigator?.language || DEFAULT_LOCALE;
    return locale.split('-')[0];
};


// for use with sort()
export const compareStr = (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase());


export function debugMsg(message: string, ...args: unknown[]): void {
    console.debug(`[${DEMO_APP}] ${message}`, ...args);
};

export function errorMsg(message: string, ...args: unknown[]): void {
    console.error(`[${DEMO_APP}] ${message}`, ...args);
};

export function logMsg(message: string, ...args: unknown[]): void {
    console.log(`[${DEMO_APP}] ${message}`, ...args);
};

export function warnMsg(message: string, ...args: unknown[]): void {
    console.warn(`[${DEMO_APP}] ${message}`, ...args);
};


export const logLocaleInfo = (): void => {
    // if (process.env.NODE_ENV === "production") inject();
    const locale = navigator?.language;
    const localeParts = locale.split('-');
    const language = localeParts[0];
    const region = localeParts[1] || '';
    let msg = [];

    // if (process.env.NODE_ENV) {
    //     msg.push(`NODE_ENV="${process?.env?.NODE_ENV}"`);
    // }

    msg = msg.concat([
        `locale="${locale}"`,
        `language="${language}"`,
        `region="${region}"`,
    ]);

    logMsg(`${msg.join(", ")}`);
};


export function sanitizeServerUrl(server: string): string {
    // Remove http:// or https:// from the server URL, Remove everything after slash
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
