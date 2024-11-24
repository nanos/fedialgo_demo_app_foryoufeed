/*
 * Loading spinner.
 */
import React from 'react'
import Spinner from 'react-bootstrap/esm/Spinner'


export default function FullPageIsLoading () {
    return (
        <div style={{
            alignItems: "center",
            display: 'flex',
            flex: 1,
            height: "100vh",
            justifyContent: "center",
            verticalAlign: "center",
        }}>
            <Spinner animation="grow" />
        </div>
    );
};
