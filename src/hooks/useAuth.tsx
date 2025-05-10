/*
 * Authorization context for the app.
 */
import axios from "axios";
import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { logMsg } from "../helpers/string_helpers";
import { useAppStorage, useUserStorage } from "./useLocalStorage";
import { User } from "../types";

const logThis = (msg: string, ...args: any[]) => logMsg(`<AuthProvider> ${msg}`, ...args);

const AuthContext = createContext({
    user: null,
    loginUser: async (_user: User) => {},
    logout: () => {}
});


export default function AuthProvider(props: PropsWithChildren) {
    const [app, _setApp] = useAppStorage({ keyName: "app", defaultValue: null })
    const [user, setUser] = useUserStorage({ keyName: "user", defaultValue: null })
    const navigate = useNavigate();

    // NOTE: this doesn't actually authenticate the user, it just sets the user object in local storage
    // call this function when you want to authenticate the user. User object looks like this:
    // {
    //     access_token: "xyssdsfdnffdwf"
    //     id: "10936317990452342342"
    //     profilePicture: "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/dfnwodfnow.jpg"
    //     server: "https://universeodon.com"
    //     username: "cryptadamus"
    // }
    const loginUser = async (user: User) => {
        // This contains secret keys, don't log it unsanitized
        // logThis("loginUser() called while 'app' state var is:", app, `\nuser:`, user);
        setUser(user);
        navigate("/");
    };

    // call this function to sign out logged in user
    const logout = async (): Promise<void> => {
        logThis("logout() called...")
        const oauthRevokeURL = user.server + '/oauth/revoke';
        const body = new FormData();
        body.append("token", user.access_token);
        body.append("client_id", app.clientId)
        body.append("client_secret", app.clientSecret);

        try {
            // Throws errors but seems to yield a 200 OK status so it works?
            // error: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://universeodon.com/oauth/revoke. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing). Status code: 200.""
            // Tried to set "Access-Control-Allow-Origin" header in the request but it doesn't work.
            // console.log(`fetching "${oauthRevokeURL}", window.location.origin:`, window.location.origin);
            const resp = await axios.post(oauthRevokeURL, body);
        } catch (error) {
            console.error(`Error while trying to logout "${error}":`, error);
        }

        setUser(null);
        navigate("/login", { replace: true });
    };

    const value = useMemo(
        () => ({ user, loginUser, logout }),
        [user]
    );

    return (
        <AuthContext.Provider value={value}>
            {props.children}
        </AuthContext.Provider>
    );
};


export const useAuthContext = () => {
    return useContext(AuthContext);
};
