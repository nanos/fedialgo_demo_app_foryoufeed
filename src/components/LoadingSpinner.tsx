/*
 * Loading spinner.
 */
import React, { CSSProperties } from 'react';
import Spinner from 'react-bootstrap/esm/Spinner';

interface LoadingSpinnerProps {
    message?: string,
    isFullPage?: boolean,
    style?: CSSProperties,
};


export default function LoadingSpinner(props: LoadingSpinnerProps) {
    let { isFullPage, message, style } = props;
    style ||= {};

    return (
        <div style={{...(isFullPage ? fullPageCenteredSpinner : inlineSpinner), ...style}}>
            <Spinner animation="border" />

            <div style={{marginLeft: "15px"}}>
                <p>{`Loading ${message}...`}</p>
            </div>
        </div>
    );
};


const centeredSpinner: CSSProperties = {
    alignItems: "center",
    display: 'flex',
    justifyContent: "center",
    verticalAlign: "center",
};

const inlineSpinner: CSSProperties = {
    ...centeredSpinner,
    height: "20px",
    marginTop: "5px",
};

const fullPageCenteredSpinner: CSSProperties = {
    ...centeredSpinner,
    flex: 1,
    height: "100vh",
};
