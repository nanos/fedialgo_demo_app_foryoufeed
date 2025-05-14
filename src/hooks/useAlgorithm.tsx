/*
 * Context to hold the TheAlgorithm variable
 */
import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";

import { GET_FEED_BUSY_MSG, TheAlgorithm, Toot, isAccessTokenRevokedError } from "fedialgo";
import { createRestAPIClient, mastodon } from "masto";

import { errorMsg, logMsg, warnMsg } from "../helpers/string_helpers";
import { useAuthContext } from "./useAuth";

interface AlgoContext {
    algorithm?: TheAlgorithm,
    api?: mastodon.rest.Client,
    isLoading?: boolean,
    shouldAutoUpdate?: boolean,
    setShouldAutoUpdate?: (should: boolean) => void,
    timeline: Toot[],
    triggerLoad?: (moreOldToots?: boolean) => void,
    triggerPullAllUserData?: () => void,
};

interface AlgorithmContextProps {
    children: ReactNode,
    setError?: (error: string) => void,
};

const AlgorithmContext = createContext<AlgoContext>({timeline: []});
export const useAlgorithm = () => useContext(AlgorithmContext);

const FOCUS = "focus";
const VISIBILITY_CHANGE = "visibilitychange";
const RELOAD_IF_OLDER_THAN_MINUTES = 5;
const RELOAD_IF_OLDER_THAN_SECONDS = 60 * RELOAD_IF_OLDER_THAN_MINUTES;


export default function AlgorithmProvider(props: AlgorithmContextProps) {
    const { children, setError } = props;
    const { user, logout } = useAuthContext();

    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [shouldAutoUpdate, setShouldAutoUpdate] = useState<boolean>(false);  // Load new toots on refocus
    const [timeline, setTimeline] = useState<Toot[]>([]);  // contains timeline Toots

    // TODO: this doesn't make any API calls yet, right?
    const api: mastodon.rest.Client = createRestAPIClient({url: user.server, accessToken: user.access_token});
    const triggerLoad = (moreOldToots?: boolean) => triggerAlgoLoad(algorithm, setError, setIsLoading, moreOldToots);

    const triggerPullAllUserData = () => {
        if (!algorithm) return;
        setIsLoading(true);

        algorithm.triggerPullAllUserData()
            .then(() => logMsg(`triggerPullAllUserData() finished`))
            .catch((err) => {
                if (err.message.includes(GET_FEED_BUSY_MSG)) {
                    warnMsg(`triggerPullAllUserData() Load already in progress, please wait a moment and try again`);
                } else {
                    const msg = `Failed to triggerPullAllUserData() with error:`;
                    errorMsg(msg, err);
                    setError(`${msg} ${err}`);
                }
            })
            .finally(() => setIsLoading(false));
    };

    // Initial load of the feed
    useEffect(() => {
        if (!user) {
            console.warn(`constructFeed() useEffect called without user, skipping initial load`);
            return;
        }

        // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
        const constructFeed = async (): Promise<void> => {
            logMsg(`constructFeed() called with user ID ${user?.id} (feed already has ${timeline.length} toots)`);
            let currentUser: mastodon.v1.Account;

            try {
                currentUser = await api.v1.accounts.verifyCredentials();
            } catch (err) {
                if (isAccessTokenRevokedError(err)) {
                    warnMsg(`Access token has been revoked, logging out...`);
                } else {
                    errorMsg(`Logging out, failed to verifyCredentials() with error:`, err);
                }

                logout();
                return;
            }

            const algo = await TheAlgorithm.create({
                api: api,
                user: currentUser,
                setTimelineInApp: setTimeline,
                locale: navigator?.language
            });

            setAlgorithm(algo);
            triggerAlgoLoad(algo, setError, setIsLoading);
        };

        constructFeed();
    }, [setAlgorithm, user]);  // TODO: add setError and setIsLoading to this list of dependencies?

    // Set up feed reloader to call algorithm.triggerFeedUpdate() on focus after RELOAD_IF_OLDER_THAN_SECONDS
    useEffect(() => {
        if (!user || !algorithm) return;

        const shouldReloadFeed = (): boolean => {
            if (!shouldAutoUpdate) return false;
            let should = false;
            let msg: string;

            if (isLoading || algorithm.isLoading()) {
                msg = `load in progress`;
                if (!isLoading) warnMsg(`isLoading is true but ${msg}`);
            } else {
                const feedAgeInSeconds = algorithm.mostRecentHomeTootAgeInSeconds();

                if (feedAgeInSeconds) {
                    msg = `feed is ${feedAgeInSeconds.toFixed(0)}s old`;
                    should = feedAgeInSeconds > RELOAD_IF_OLDER_THAN_SECONDS;
                } else {
                    msg = `${timeline.length} toots in feed but no most recent toot found!`;
                    warnMsg(msg);
                }
            }

            logMsg(`shouldReloadFeed() returning ${should} (${msg})`);
            return should;
        };

        const handleFocus = () => document.hasFocus() && shouldReloadFeed() && triggerLoad();
        window.addEventListener(FOCUS, handleFocus);
        return () => window.removeEventListener(FOCUS, handleFocus);
    }, [algorithm, isLoading, timeline, triggerLoad, user]);

    const algoContext: AlgoContext = {
        algorithm,
        api,
        isLoading,
        setShouldAutoUpdate,
        shouldAutoUpdate,
        timeline,
        triggerLoad,
        triggerPullAllUserData
    };

    return (
        <AlgorithmContext.Provider value={algoContext}>
            {children}
        </AlgorithmContext.Provider>
    );
};


// Trigger the algorithm to load new data
const triggerAlgoLoad = (
    algorithm: TheAlgorithm,
    setError?: (error: string) => void,
    setIsLoading?: (isLoading: boolean) => void,
    moreOldToots?: boolean
) => {
    logMsg(`triggerAlgoLoad() called. algorithm exists?: ${!!algorithm}`);
    if (!algorithm) return;
    setIsLoading?.(true);

    algorithm.triggerFeedUpdate(moreOldToots)
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
