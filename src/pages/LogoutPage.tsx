import React, { useEffect } from 'react';

import { useAuth } from '../hooks/useAuth';


export default function LogoutPage() {
    const { logout } = useAuth();

    useEffect(() => {
        logout()
    }, [])

    return (
        <div>
            <h1>Logging Out</h1>
        </div>
    );
};
