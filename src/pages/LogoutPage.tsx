import React, { useEffect } from 'react';

import { logMsg } from '../helpers/string_helpers';
import { useAuthContext } from '../hooks/useAuth';


export default function LogoutPage() {
    const { logout } = useAuthContext();

    // TODO; this seems to be preemptively logging out the user?
    useEffect(() => {
        logMsg("LogoutPage useEffect() called. Skipping call to logout()");
        // logout();
    }, [])

    logMsg(`<LogoutPage> constructor called`);

    return (
        <div>
            <h1>Logging Out</h1>
        </div>
    );
};
