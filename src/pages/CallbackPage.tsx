/*
 * Handles the incoming call that is part of OAuth 2.0 authorization code flow.
 */
import React, { useEffect } from 'react';

import { createOAuthAPIClient, createRestAPIClient, mastodon } from "masto"
import { useSearchParams } from 'react-router-dom';

import { logMsg } from '../helpers/string_helpers';
import { OAUTH_SCOPE_STR } from './LoginPage';
import { useAppStorage } from '../hooks/useLocalStorage';
import { useAuthContext } from '../hooks/useAuth';
import { User } from '../types';

// const GRANT_TYPE = "password";  // TODO: this is not used anywhere/doesn't workon universeodon.com
// const GRANT_TYPE = "authorization_code";
// const GRANT_TYPE = "client_credentials";


export default function CallbackPage() {
    const [error, setError] = React.useState("");
    const [searchParams] = useSearchParams();

    // Example of 'app' object
    // {
    //     clientId: "blahblah",
    //     clientSecret: "blahblahblahblahblahblahblahblah",
    //     id: "519245",
    //     name: "ForYouFeed",
    //     redirectUri: "http://localhost:3000/callback",
    //     vapidKey: "blahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblah",
    //     website: "https://mastodon.social",
    // }
    const [app] = useAppStorage({ keyName: "app", defaultValue: null })
    const { user, loginUser } = useAuthContext();
    const paramsCode = searchParams.get('code');
    const logThis = (msg: string, ...args: any[]) => logMsg(`<CallbackPage> ${msg}`, ...args);

    useEffect(() => {
        if (paramsCode !== null && !user) {
            oAuth(paramsCode);
        }
    }, [paramsCode]);

    // Get an OAuth token for our app using the code we received from the server
    // TODO: this is done manually via fetch() instead of using the mastodon library
    const oAuth = async (code: string) => {
        const body = new FormData();

        body.append('grant_type', 'authorization_code');
        body.append('client_id', app.clientId)
        body.append('client_secret', app.clientSecret)
        body.append('redirect_uri', app.redirectUri)
        body.append('code', code);
        body.append('scope', OAUTH_SCOPE_STR);

        const oauthTokenURI = `${app.website}/oauth/token`;
        logThis(`oAuth() oauthTokenURI: "${oauthTokenURI}"\napp:`, app, `\nuser:`, user, `\ncode: "${code}`);
        const oAuthResult = await fetch(oauthTokenURI, {method: 'POST', body});
        const json = await oAuthResult.json()
        const accessToken = json["access_token"];
        const api = createRestAPIClient({accessToken: accessToken, url: app.website});

        api.v1.accounts.verifyCredentials().then((verifiedUser) => {
            logThis(`oAuth() api.v1.accounts.verifyCredentials() succeeded, user:`, verifiedUser);

            const userData: User = {
                access_token: accessToken,
                id: verifiedUser.id,
                profilePicture: verifiedUser.avatar,
                server: app.website,
                username: verifiedUser.username,
            };

            loginUser(userData).then(() => logThis(`Logged in '${userData.username}'! User object:`, userData));
        }).catch((error) => {
            console.error(`[DEMO APP] <CallbackPage> api.v1.accounts.verifyCredentials() error:`, error);
            setError(error.toString());
        });

        api.v1.apps.verifyCredentials().then((verifyResponse) => {
            logThis(`oAuth() api.v1.apps.verifyCredentials() succeeded, verifyResponse:`, verifyResponse);
        }).catch((error) => {
            console.error(`[DEMO APP] <CallbackPage> oAuth() api.v1.apps.verifyCredentials() failure:`, error);
        })
    };

    return (
        <div>
            <h1>Validating ....</h1>
            {error && <p>{error}</p>}
        </div>
    );
};
