import type { mastodon } from 'masto'
import { TheAlgorithm } from "fedialgo";


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

export type UserAlgo = {
    currentUser: mastodon.v1.Account;
    algo: TheAlgorithm;
};
