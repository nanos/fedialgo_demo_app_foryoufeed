import type { mastodon } from 'masto';


export interface App extends mastodon.v1.Client {
    redirectUri: string;
    [key: string]: unknown;
};


// TODO: where does this come from?
export type User = {
    access_token: string;
    id: string;
    profilePicture?: string;
    username: string;
    server: string;  // homeserver domain
};
