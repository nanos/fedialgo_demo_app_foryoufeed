/*
 * Loading spinner.
 */
import React from 'react';
import Spinner from 'react-bootstrap/esm/Spinner';

export const DEFAULT_LOADING_MESSAGE = "Loading (this can take a while the first time)";


export default function FullPageIsLoading({message = DEFAULT_LOADING_MESSAGE}: {message: string}) {
    return (
        <div style={{
            alignItems: "center",
            display: 'flex',
            flex: 1,
            height: "100vh",
            justifyContent: "center",
            verticalAlign: "center",
        }}>
            <Spinner animation="border" />

            <div style={{marginLeft: "15px"}}>
                <p>{message}...</p>
            </div>
        </div>
    );
};
