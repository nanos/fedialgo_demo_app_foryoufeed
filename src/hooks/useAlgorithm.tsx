/*
 * Context to hold the TheAlgorithm variable
 */
import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";

import { GET_FEED_BUSY_MSG, TheAlgorithm, Toot } from "fedialgo";
import { createRestAPIClient, mastodon } from "masto";

import { browserLanguage } from "../helpers/string_helpers";
import { errorMsg, logMsg, warnMsg } from "../helpers/string_helpers";
import { useAuthContext } from "./useAuth";

interface AlgoContext {
    algorithm?: TheAlgorithm,
    api?: mastodon.rest.Client,
    isLoading?: boolean,
    timeline?: Toot[],
    triggerLoad?: () => void,
};

interface AlgorithmContextProps {
    children: ReactNode,
    setError?: (error: string) => void,
};

const AlgorithmContext = createContext<AlgoContext>({});
export const useAlgorithmContext = () => useContext(AlgorithmContext);


export default function AlgorithmProvider(props: AlgorithmContextProps) {
    const { children, setError } = props;
    const { user, logout } = useAuthContext();

    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeline, setTimeline] = useState<Toot[]>([]);  // contains timeline Toots

    // TODO: this doesn't make any API calls yet, right?
    const api: mastodon.rest.Client = createRestAPIClient({url: user.server, accessToken: user.access_token});
    const triggerLoad = () => triggerAlgoLoad(algorithm, setError, setIsLoading);

    // Initial load of the feed (can be re-triggered by changing the value of triggerReload)
    useEffect(() => {
        if (!user) {
            console.warn(`constructFeed() useEffect called without user, skipping initial load`);
            return;
        }

        // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
        const constructFeed = async (): Promise<void> => {
            logMsg(`constructFeed() called with user ID ${user?.id} (feed already has ${timeline.length} toots)`);
            let currentUser: mastodon.v1.Account;

            // TODO: this belongs in AuthContext
            try {
                currentUser = await api.v1.accounts.verifyCredentials();
            } catch (err) {
                console.error(`Failed to verifyCredentials() with error:`, err);
                logout();
                return;
            }

            const algo = await TheAlgorithm.create({
                api: api,
                user: currentUser,
                setTimelineInApp: setTimeline,
                language: browserLanguage()
            });

            setAlgorithm(algo);
            triggerAlgoLoad(algo, setError, setIsLoading);
        };

        constructFeed();
    }, [setAlgorithm, user]);  // TODO: add setError and setIsLoading to this list of dependencies?

    return (
        <AlgorithmContext.Provider value={{ algorithm, api, isLoading, timeline, triggerLoad }}>
            {children}
        </AlgorithmContext.Provider>
    );
};


// Trigger the algorithm to load new data
export const triggerAlgoLoad = (
    algorithm: TheAlgorithm,
    setError?: (error: string) => void,
    setIsLoading?: (isLoading: boolean) => void,
) => {
    logMsg(`triggerAlgoLoad() called. algorithm exists?: ${!!algorithm}`);
    if (!algorithm) return;
    setIsLoading?.(true);

    algorithm.triggerFeedUpdate()
        .then(() => logMsg(`triggerLoad() finished`))
        .catch((err) => {
            if (err.message.includes(GET_FEED_BUSY_MSG)) {
                warnMsg(`triggerLoad() Load already in progress, please wait a moment and try again`);
            } else {
                errorMsg(`Failed to triggerLoad() with error:`, err);
                setError?.(`Failed to triggerLoad: ${err}`);
            }
        })
        .finally(() => setIsLoading?.(false));
};
