import React, { useEffect } from 'react';

import { useAuthContext } from '../hooks/useAuth';


export default function LogoutPage() {
    const { logout } = useAuthContext();

    useEffect(() => {logout()}, [])

    return (
        <div>
            <h1>Logging Out</h1>
        </div>
    );
};
