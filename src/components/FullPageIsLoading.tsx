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
            <Spinner animation="border" />

            <div style={{marginLeft: "15px"}}>
                <p>Loading (this can take a while the first time)...</p>
            </div>
        </div>
    );
};
