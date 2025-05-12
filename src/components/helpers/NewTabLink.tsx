/*
 * Simple component for links that open in a new tab.
 */

import React, { CSSProperties, ReactElement } from "react";

interface LinkProps {
    children: React.ReactNode;
    className?: string;
    href: string;
    style?: CSSProperties;
}


export default function ProtectedRoute(props: LinkProps): ReactElement {
    const { children, className, href } = props;
    const style = props.style || {};

    return (
        <a
            className={className || "no_specified_class"}
            href={href}
            rel="noreferrer"
            style={style}
            target="_blank"
        >
            {children}
        </a>
    );
};
