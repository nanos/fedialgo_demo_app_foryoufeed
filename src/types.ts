import type { mastodon } from 'masto'

export interface weightsType {
    [key: string]: number; // Replace 'any' with the desired value type (e.g., string, number, etc.)
}

export interface settingsType {
    [key: string]: boolean; // Replace 'any' with the desired value type (e.g., string, number, etc.)
}

// TODO: can't this be imported from the fedialgo package?
export interface StatusType extends mastodon.v1.Status {
    topPost?: boolean;
    recommended?: boolean;
    scores?: weightsType;
    value?: number;
    reblog?: StatusType;
    reblogBy?: string;
    timeDiscount?: number;
    rawScore?: number;
}

export interface App extends mastodon.v1.Client {
    redirectUri: string;
    [key: string]: unknown;
}

export type User = {
    access_token: string;
    id: string;
    profilePicture?: string;
    username: string;
    server: string;
}
