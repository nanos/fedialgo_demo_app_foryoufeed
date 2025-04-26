/*
 * Handles the incoming call that is part of OAuth 2.0 authorization code flow.
 */
import React, { useEffect } from 'react';

import { createRestAPIClient as loginToMastodon } from "masto"
import { useSearchParams } from 'react-router-dom';

import { OAUTH_SCOPE_STR } from './LoginPage';
import { useAppStorage } from '../hooks/useLocalStorage';
import { useAuthContext } from '../hooks/useAuth';
import { User } from '../types';


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

    useEffect(() => {
        if (code !== null && !user) {
            oAuth(code);
        }
    }, [code]);

    const oAuth = async (code: string) => {
        const body = new FormData();
        body.append('grant_type', 'authorization_code');
        body.append('client_id', app.clientId)
        body.append('client_secret', app.clientSecret)
        body.append('redirect_uri', app.redirectUri)
        body.append('code', code);
        body.append('scope', OAUTH_SCOPE_STR);

        const oAuthResult = await fetch(`${app.website}/oauth/token`, {method: 'POST', body});
        const json = await oAuthResult.json()
        const accessToken = json["access_token"];
        const api = await loginToMastodon({accessToken: accessToken, url: app.website});

        api.v1.accounts.verifyCredentials().then((user) => {
            const userData: User = {
                access_token: accessToken,
                id: user.id,
                profilePicture: user.avatar,
                server: app.website,
                username: user.username,
            };

            loginUser(userData).then(() => console.log(`Logged in '${userData.username}' successfully!`));
        }).catch((error) => {
            console.error(`Login error:`, error);
            setError(error.toString());
        });
    };

    return (
        <div>
            <h1>Validating ....</h1>
            {error && <p>{error}</p>}
        </div>
    );
};
