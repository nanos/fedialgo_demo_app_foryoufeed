import type { mastodon } from 'masto'


export interface settingsType {
    [key: string]: boolean;
};

export interface App extends mastodon.v1.Client {
    redirectUri: string;
    [key: string]: unknown;
};

export type User = {
    access_token: string;
    id: string;
    profilePicture?: string;
    username: string;
    server: string;
};
