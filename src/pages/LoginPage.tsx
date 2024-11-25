import React from 'react';
import { usePersistentState } from "react-persistent-state"

import Button from 'react-bootstrap/esm/Button';
import Form from 'react-bootstrap/esm/Form';
import { createRestAPIClient } from 'masto';
import { stringifyQuery } from 'ufo'

import { useLocalStorage, AppStorage } from "../hooks/useLocalStorage";

const DEFAULT_MASTODON_SERVER = "universeodon.com";  // Home of George Takei!


export default function LoginPage() {
    const [server, setServer] = usePersistentState<string>(DEFAULT_MASTODON_SERVER, "server");
    const [_app, setApp] = useLocalStorage({ keyName: "app", defaultValue: {} } as AppStorage);

    const loginRedirect = async (): Promise<void> => {
        const sanitized_server = server.replace("https://", "").replace("http://", "");
        const api = await createRestAPIClient({url: `https://${sanitized_server}`});
        const scope = "read write:favourites write:statuses write:follows";
        const redirectUri = window.location.origin + "/callback";

        const app = await api.v1.apps.create({
            clientName: "ForYouFeed",
            redirectUris: redirectUri,
            scopes: scope,
            website: `https://${sanitized_server}`,
        });

        setApp({ ...app, redirectUri });

        const query = stringifyQuery({
            client_id: app.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scope,
        });

        window.location.href = `https://${sanitized_server}/oauth/authorize?${query}`;
    };

    return (
        <div className='vh-100' style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: "center",
        }}>
            <img
                src={"/assets/Showcase.png"}
                style={{
                    border: "5px solid #DDD",
                    borderRadius: "12px",
                    boxShadow: "3px 3px 5px black",
                    maxHeight: "550px",
                }}
            />

            <div>
                <p style={{ lineHeight: 1.3, marginBottom: "10px", marginTop: "10px", textAlign: "center" }}>
                    Fedi-Feed features a customizable algorithm for sorting your feed.<br />
                    You can choose which factors influence the sorting of your timeline.<br />
                    <span style={{color: "magenta"}}>
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
