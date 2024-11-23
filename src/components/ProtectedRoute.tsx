import React from "react";
import { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";


export default function ProtectedRoute(props: { children: ReactElement }): ReactElement {
    const { user } = useAuth();

    if (!user) {  // then user is not authenticated
        return <Navigate to="/login" />;
    }

    return props.children;
};
