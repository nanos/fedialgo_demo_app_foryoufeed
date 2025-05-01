/*
 * Handles the incoming call that is part of OAuth 2.0 authorization code flow.
 */
import React, { useEffect } from 'react';

import { createOAuthAPIClient, createRestAPIClient, mastodon } from "masto"
import { useSearchParams } from 'react-router-dom';

import { logMsg } from '../helpers/string_helpers';
import { OAUTH_SCOPE_STR } from './LoginPage';
import { sanitizeServerUrl } from '../helpers/string_helpers';
import { useAppStorage } from '../hooks/useLocalStorage';
import { useAuthContext } from '../hooks/useAuth';
import { User } from '../types';

// const GRANT_TYPE = "password";  // TODO: this is not used anywhere/doesn't workon universeodon.com
const GRANT_TYPE = "authorization_code";
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
    const code = searchParams.get('code');
    const logThis = (msg: string, ...args: any[]) => logMsg(`<CallbackPage> ${msg}`, ...args);
    logThis(`constructor, current value of 'app':`, app, `\n current value of 'user':`, user, `\n current value of 'code': "${code}`);

    useEffect(() => {
        if (code !== null && !user) {
            oAuth(code);
        }
    }, [code]);

    // From token.spec.ts in masto.js project
    // curl -H 'Authorization: Bearer <USER_ACCESS_TOKEN>' https://universeodon.com/api/v1/apps/verify_credentials
    // const tryOauthApp = async (code: string): Promise<void> => {
    //     try {
    //         const sanitizedServer = sanitizeServerUrl("universeodon.com");
    //         logThis(`tryOauthApp() called, sanitizedServer="${sanitizedServer}"`);
    //         const oauth = createOAuthAPIClient({url: sanitizedServer});
    //         logThis(`tryOauthApp() SUCCESS created oauth:`, oauth);
    //         const redirectUri = window.location.origin + "/callback";

    //         // const oAuthResult = await fetch(`${app.website}/oauth/token`, {method: 'POST', body});
    //         const tokenArgs = {
    //             clientId: app.clientId,
    //             clientSecret: app.clientSecret,
    //             username: "admin@localhost",
    //             password: "mastodonadmin",
    //             scope: "read",
    //             redirectUri: redirectUri,
    //             code: code,
    //         };

    //         // TODO: can also try "code" and "client_credentials" grant types
    //         // https://github.com/neet/masto.js/commit/1f6b3caed3e892c7d30bf6280f6c847e8aad6f4d
    //         logThis("tryOauthApp() oauth.token.create() args:", {...tokenArgs, grantType: GRANT_TYPE});

    //         const token = await oauth.token.create({
    //             grantType: GRANT_TYPE,
    //             ...tokenArgs,
    //             // redirectUri: "urn:ietf:wg:oauth:2.0:oob",  // From masto.js token.spec.ts
    //         });

    //         logThis("tryOauthApp() oauth.token.create() SUCCESS, token:", token);
    //     } catch (error) {
    //         console.error(`[DEMO APP] <LoginPage> tryOauthApp(), oauth.token.create() failed, error:`, error);
    //     }
    // }


    const oAuth = async (code: string) => {
        const body = new FormData();
        logThis(`oAuth() called with code: ${code}\nCurrent value of 'app':`, app);
        body.append('grant_type', 'authorization_code');
        body.append('client_id', app.clientId)
        body.append('client_secret', app.clientSecret)
        body.append('redirect_uri', app.redirectUri)
        body.append('code', code);
        body.append('scope', OAUTH_SCOPE_STR);

        const oAuthResult = await fetch(`${app.website}/oauth/token`, {method: 'POST', body});
        const json = await oAuthResult.json()
        const accessToken = json["access_token"];
        const api = createRestAPIClient({accessToken: accessToken, url: app.website});

        api.v1.accounts.verifyCredentials().then((user) => {
            logThis(`oAuth() api.v1.accounts.verifyCredentials() succeeded, user:`, user);

            const userData: User = {
                access_token: accessToken,
                id: user.id,
                profilePicture: user.avatar,
                server: app.website,
                username: user.username,
            };

            loginUser(userData).then(() => logThis(`Logged in '${userData.username}' successfully!`));
        }).catch((error) => {
            console.error(`[DEMO APP] <CallbackPage> Login verifyCredentials() error:`, error);
            setError(error.toString());
        });

        // TODO: this is working now!
        api.v1.apps.verifyCredentials().then((verifyResponse) => {
            logThis(`oAuth() api.v1.apps.verifyCredentials() succeeded, verifyResponse:`, verifyResponse);
        }).catch((error) => {
            console.error(`[DEMO APP] <CallbackPage> App verifyCredentials() error:`, error);
        })

        // await tryOauthApp(code);
    };

    return (
        <div>
            <h1>Validating ....</h1>
            {error && <p>{error}</p>}
        </div>
    );
};
