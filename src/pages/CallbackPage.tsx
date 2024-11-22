import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createRestAPIClient as loginMasto } from "masto"
import { useAppStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../hooks/useAuth';
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
    const { user, loginUser } = useAuth();
    const code = searchParams.get('code');

    useEffect(() => {
        if (code !== null && !user) {
            console.log(`Setting code parameter in CallbackPage...`);
            oAuth(code);
        }
    }, [code]);

    const oAuth = async (code: string) => {
        const body = new FormData();
        const scope = "read:favourites read:follows read:search read:accounts read:statuses write:favourites write:statuses write:follows"
        body.append('grant_type', 'authorization_code');
        body.append('client_id', app.clientId)
        body.append('client_secret', app.clientSecret)
        body.append('redirect_uri', app.redirectUri)
        body.append('code', code);
        body.append('scope', scope);

        const result = await fetch(`${app.website}/oauth/token`, {
            method: 'POST',
            body,
        });

        const json = await result.json()
        const api = await loginMasto({
            url: app.website,
            accessToken: json["access_token"],
        });

        api.v1.accounts.verifyCredentials().then((user) => {
            const userData: User = {
                id: user.id,
                username: user.username,
                profilePicture: user.avatar,
                access_token: json["access_token"],
                server: app.website,
            }
            loginUser(userData).then(() => {
                console.log("Logged in!");
            })
        }).catch((error) => {
            console.warn(error)
            setError(error.toString())
        }).finally(() => {
            console.log("finally verified credentials");
        });
    };

    return (
        <div>
            <h1>Validating ....</h1>
            {error && <p>{error}</p>}
        </div>
    )
};
