import React, { CSSProperties } from 'react';
import { usePersistentState } from "react-persistent-state"

import Button from 'react-bootstrap/esm/Button';
import Form from 'react-bootstrap/esm/Form';
import { createRestAPIClient, createOAuthAPIClient, mastodon } from 'masto';
import { stringifyQuery } from 'ufo'

import { AppStorage, useLocalStorage } from "../hooks/useLocalStorage";
import { logMsg, sanitizeServerUrl } from '../helpers/string_helpers';

// Mastodon OAuth scopes: https://docs.joinmastodon.org/api/oauth-scopes/
const OAUTH_SCOPES = [
    "read",
    "write:bookmarks",
    "write:favourites",
    "write:statuses",
    "write:follows",
];

export const OAUTH_SCOPE_STR = OAUTH_SCOPES.join(" ");
const DEFAULT_MASTODON_SERVER = "universeodon.com";  // Home of George Takei!
const APP_NAME = "FediAlgo Demo";  // Name of the app that will be created on the server


export default function LoginPage() {
    const [server, setServer] = usePersistentState<string>(DEFAULT_MASTODON_SERVER, "server");
    // TODO: why is this not using useAppStorage?
    const [_app, setApp] = useLocalStorage({keyName: "app", defaultValue: {}} as AppStorage);
    const logThis = (msg: string, ...args: any[]) => logMsg(`<LoginPage> ${msg}`, ...args);
    logThis("LoginPage constructor, current value of 'app':", _app);

    const loginRedirect = async (): Promise<void> => {
        const sanitizedServer = sanitizeServerUrl(server);
        logThis(`loginRedirect sanitizedServer="${sanitizedServer}"`);
        const api = createRestAPIClient({url: sanitizedServer});
        const redirectUri = window.location.origin + "/callback";

        const app = await api.v1.apps.create({
            clientName: APP_NAME,
            redirectUris: redirectUri,
            scopes: OAUTH_SCOPE_STR,
            website: sanitizedServer,
        });

        logThis("loginRedirect() api.v1.apps.create() response obj 'app':", app);
        const newApp = { ...app, redirectUri };
        setApp(newApp);
        // await tryOauthApp(app);

        // TODO: this gets closer to working the 2nd time you run the app, when the OAuth token
        // TODO: After mastodon versino 4.3.0 you can use a URL like this to find the Oauth config:
        //       https://defcon.social/.well-known/oauth-authorization-server
        // is already authorized.
        // try {
        //     // TODO: this isn't sending the Authorization="Bearer <TOKEN>" header correctly
        //     // TODO: See https://docs.joinmastodon.org/methods/apps/#headers
        //     // TODO: try it with the user access token instead?
        //     const response = await api.v1.apps.verifyCredentials(
        //         // {
        //         //     requestInit: {
        //         //         // headers: {Authorization: `Bearer ${app.clientSecret}`}  // NOPE,
        //         //         headers: {Authorization: `Bearer ${app.clientId}`},
        //         //     }
        //         // }
        //     );

        //     logThis(`loginRedirect(), verifyCredentials() succeeded, response`, response);
        // } catch (error) {
        //     console.error(`[DEMO APP] <LoginPage> loginRedirect() api.v1.apps.verifyCredentials() failed, error:`, error);
        // }

        const query = stringifyQuery({
            client_id: app.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: OAUTH_SCOPE_STR,
        });

        const newUrl = `${sanitizedServer}/oauth/authorize?${query}`;
        logThis(`loginRedirect() redirecting to "${newUrl}"...`);
        window.location.href = newUrl;
    };

    return (
        <div className='vh-100' style={loginContainer}>
            <img src={"/assets/Showcase.png"} style={previewImage}/>

            <div>
                <p style={{ lineHeight: 1.3, marginBottom: "10px", marginTop: "13px", textAlign: "center" }}>
                    Fedi-Feed features a customizable algorithm for sorting your feed.<br />
                    You can choose which factors influence the sorting of your timeline.<br />

                    <span style={privacyText}>
                        All calculations are done in your browser. None of your data leaves your machine.
                    </span>
                    <br /><br />

                    To get started enter your Mastodon server in the form: <code>{DEFAULT_MASTODON_SERVER}</code>
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '5px', marginTop: '5px' }}>
                <Form.Group className="mb-0">
                    <Form.Control
                        id="mastodon_server"
                        onChange={(e) => setServer(e.target.value)}
                        placeholder={DEFAULT_MASTODON_SERVER}
                        type="url"
                        value={server}
                    />
                </Form.Group>

                <div style={{ display: 'flex', justifyContent: 'center', marginLeft: '10px' }}>
                    <Button onClick={loginRedirect}>Login</Button>
                </div>
            </div>
        </div>
    );
};


const loginContainer: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: "center",
};

const previewImage: CSSProperties = {
    border: "5px solid #DDD",
    borderRadius: "12px",
    boxShadow: "3px 3px 5px black",
    maxHeight: "550px",
};

const privacyText: CSSProperties = {
    color: "magenta",
    fontSize: 17,
    marginTop: "3px",
    marginBottom: "20px",
};
