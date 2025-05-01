/*
 * Loading spinner.
 */
import React, { CSSProperties } from 'react';
import Spinner from 'react-bootstrap/esm/Spinner';

interface LoadingSpinnerProps {
    isFullPage?: boolean,
    message?: string,
    style?: CSSProperties,
};


export default function LoadingSpinner(props: LoadingSpinnerProps) {
    let { isFullPage, message, style } = props;

    return (
        <div style={{...(isFullPage ? fullPageCenteredSpinner : inlineSpinner), ...(style || {})}}>
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
    flexDirection: "row",
    justifyContent: "center",
    verticalAlign: "center",
};

const inlineSpinner: CSSProperties = {
    ...centeredSpinner,
    height: "20px",
    // justifyContent: "flex-start",
    justifyContent: "start",
    marginTop: "5px",
};

const fullPageCenteredSpinner: CSSProperties = {
    ...centeredSpinner,
    flex: 1,
    height: "100vh",
};
