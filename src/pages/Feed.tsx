/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { CSSProperties, useState, useEffect, useRef } from "react";

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { mastodon, createRestAPIClient as loginToMastodon } from "masto";
import { Modal } from "react-bootstrap";
import { TheAlgorithm, Toot } from "fedialgo";

import FilterSetter from "../components/algorithm/FilterSetter";
import FindFollowers from "../components/FindFollowers";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusComponent from "../components/Status";
import TrendingInfo from "../components/TrendingInfo";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/algorithm/WeightSetter";
import { logMsg } from "../helpers/string_helpers";
import { useAuthContext } from "../hooks/useAuth";

// Number constants
const DEFAULT_NUM_TOOTS = 20;
const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;
const RELOAD_IF_OLDER_THAN_SECONDS = 60 * 10; // 10 minutes
// String constants
const FOCUS = "focus";
const VISIBILITY_CHANGE = "visibilitychange";
const DEFAULT_LOADING_MESSAGE = "(this can take a while the first time)";
const NO_TOOTS_MSG = "but no toots found! Maybe check your filter settings";


export default function Feed() {
    const { user, logout } = useAuthContext();
    const api: mastodon.rest.Client = loginToMastodon({url: user.server, accessToken: user.access_token});
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);

    // State variables
    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [error, setError] = useState<string>("");
    const [feed, setFeed] = useState<Toot[]>([]);  // contains timeline Toots
    const [isControlPanelSticky, setIsControlPanelSticky] = useState<boolean>(false);  // Left panel stickiness
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(DEFAULT_NUM_TOOTS);
    const [triggerReload, setTriggerReload] = useState<number>(0);  // Used to trigger reload of feed via useEffect watcher
    const isLoadingInitialFeed = !feed?.length;

    const reset = async () => {
        if (!window.confirm("Are you sure?")) return;
        setError("");
        await algorithm.reset();
        setNumDisplayedToots(DEFAULT_NUM_TOOTS);
        setTriggerReload(triggerReload + 1);
    }

    // Pull more toots to display from our local cached and sorted toot feed
    // TODO: this should trigger the pulling of more toots from the server if we run out of local cache
    const showMoreToots = () => {
        const msg = `Showing ${numDisplayedToots} toots, adding ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more`;
        logMsg(`${msg} (${feed.length} available in feed)`);
        setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
    };

    // Initial load of the feed (can be re-triggered by changing the value of triggerReload)
    useEffect(() => {
        if (!user) return;

        // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
        const constructFeed = async (): Promise<void> => {
            logMsg(`constructFeed() called with user ID ${user?.id} (feed already has ${feed.length} toots)`);
            let currentUser: mastodon.v1.Account;

            try {
                currentUser = await api.v1.accounts.verifyCredentials();
            } catch (err) {
                console.error(`Failed to verifyCredentials() with error:`, err);
                logout();
                return;
            }

            const algo = await TheAlgorithm.create({api: api, user: currentUser, setFeedInApp: setFeed});
            setAlgorithm(algo);
            await algo.getFeed();
            logMsg(`constructFeed() finished; feed has ${algo.feed.length} toots`);
        };

        constructFeed();
    }, [setAlgorithm, triggerReload, user]);

    // Show more toots when the user scrolls to bottom of the page
    // TODO: This doesn't actually trigger any API calls, it just shows more of the preloaded toots
    useEffect(() => {
        if (isBottom) showMoreToots();
    }, [feed, isBottom, numDisplayedToots, setNumDisplayedToots, showMoreToots]);

    // Set up feed reloader to call algorithm.getFeed() on focus after RELOAD_IF_OLDER_THAN_SECONDS
    useEffect(() => {
        if (!user || !algorithm || isLoadingInitialFeed) return;

        const shouldReloadFeed = (): boolean => {
            if (algorithm?.loadingStatus) {
                logMsg(`shouldReloadFeed() = false (algorithm.loadingStatus is not empty so load in progress)`);
                return false;
            }

            const mostRecentAt = algorithm.mostRecentHomeTootAt();
            const feedAgeInSeconds = (Date.now() - mostRecentAt.getTime()) / 1000;
            const should = feedAgeInSeconds > RELOAD_IF_OLDER_THAN_SECONDS;
            logMsg(`shouldReloadFeed() = ${should} (feed is ${feedAgeInSeconds}s old, mostRecentAt is '${mostRecentAt}')`);
            return should;
        };

        const handleFocus = () => {
            // for some reason "not focused" never happens? https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus
            logMsg(`window is ${document.hasFocus() ? "focused" : "not focused"}`);
            if (!document.hasFocus()) return;
            if (shouldReloadFeed()) algorithm.getFeed();
        };

        window.addEventListener(FOCUS, handleFocus);
        return () => window.removeEventListener(FOCUS, handleFocus);
    }, [algorithm, feed, isLoadingInitialFeed, user]);

    return (
        <Container fluid style={{height: 'auto'}}>
            <Modal show={error !== ""} onHide={() => setError("")} style={{color: "black"}}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>{error}</Modal.Body>
            </Modal>

            <Row>
                <Col xs={6}>
                    <div className="sticky-top" style={isControlPanelSticky ? {} : {position: "relative"}} >
                        <div style={{height: "20px", marginBottom: "5px"}}>
                            <Form.Check
                                type="checkbox"
                                label="Stick Control Panel To Top"
                                checked={isControlPanelSticky}
                                onChange={(e) => setIsControlPanelSticky(e.target.checked)}
                                className="mb-3"
                            />
                        </div>

                        {algorithm && <WeightSetter algorithm={algorithm} />}
                        {algorithm && <FilterSetter algorithm={algorithm} />}
                        {algorithm && <TrendingInfo algorithm={algorithm} />}
                        <FindFollowers api={api} user={user} />

                        {algorithm?.loadingStatus
                            ? <LoadingSpinner isFullPage={false} message={algorithm.loadingStatus} style={loadingMsgStyle} />
                            : <p style={loadingMsgStyle}>Found {feed.length} toots for timeline.</p>}

                        {algorithm &&
                            <p style={resetLinkStyle}>
                                <a onClick={reset}>
                                    Clear all data and reload
                                </a>
                            </p>}
                    </div>
                </Col>

                <Col style={statusesColStyle} xs={6}>
                    {api && !isLoadingInitialFeed &&
                        feed.slice(0, Math.max(DEFAULT_NUM_TOOTS, numDisplayedToots)).map((toot) => (
                            <StatusComponent
                                api={api}
                                key={toot.uri}
                                setError={setError}
                                status={toot}
                                user={user}
                            />
                        ))}

                    {isLoadingInitialFeed &&
                        <LoadingSpinner
                            isFullPage={true}
                            // TODO: the NO_TOOTS_MSG will never show bc now isLoading is based on feed state variable
                            message={isLoadingInitialFeed ? DEFAULT_LOADING_MESSAGE : NO_TOOTS_MSG}
                        />}

                    <div ref={bottomRef} onClick={showMoreToots}>
                        <p>Load More</p>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};


const loadingMsgStyle: CSSProperties = {
    height: "20px",
    marginTop: "7px",
};

const resetLinkStyle: CSSProperties = {
    color: "red",
    cursor: "pointer",
    fontSize: "12px",
    marginTop: "4px",
    textDecoration: "underline",
};

const statusesColStyle: CSSProperties = {
    backgroundColor: '#15202b',
    height: 'auto',
};
