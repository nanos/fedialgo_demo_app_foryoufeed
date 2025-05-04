/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { CSSProperties, useState, useEffect, useRef } from "react";

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { mastodon, createRestAPIClient } from "masto";
import { Modal } from "react-bootstrap";
import { TheAlgorithm, Toot, timeString } from "fedialgo";

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
const DEFAULT_NUM_DISPLAYED_TOOTS = 20;
const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;
const RELOAD_IF_OLDER_THAN_SECONDS = 60 * 10; // 10 minutes
// String constants
const FOCUS = "focus";
const VISIBILITY_CHANGE = "visibilitychange";
const DEFAULT_LOADING_MESSAGE = "(first time can take up to a minute or so)";
const NO_TOOTS_MSG = "but no toots found! Maybe check your filter settings";


export default function Feed() {
    const { user, logout } = useAuthContext();
    const api: mastodon.rest.Client = createRestAPIClient({url: user.server, accessToken: user.access_token});
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);

    // State variables
    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [error, setError] = useState<string>("");
    const [timeline, setTimeline] = useState<Toot[]>([]);  // contains timeline Toots
    const [isControlPanelSticky, setIsControlPanelSticky] = useState<boolean>(false);  // Left panel stickiness
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(DEFAULT_NUM_DISPLAYED_TOOTS);
    const [triggerReload, setTriggerReload] = useState<number>(0);  // Used to trigger reload of feed via useEffect watcher
    const isLoadingInitialFeed = !!(algorithm?.isLoading() && !timeline?.length);
    // console.log("[DEMO APP] <Feed> constructor isLoadingInitialFeed:", isLoadingInitialFeed, `\nalgo.loadingStatus: `, algorithm?.loadingStatus, `\nfeed.length: ${feed?.length}`);

    const resetNumDisplayedToots = () => setNumDisplayedToots(DEFAULT_NUM_DISPLAYED_TOOTS);

    // Reset all state except for the user and server
    const reset = async () => {
        if (!window.confirm("Are you sure?")) return;
        setError("");
        resetNumDisplayedToots();
        setTriggerReload(triggerReload + 1);
        if (!algorithm) return;
        await algorithm.reset();
    };

    const finishedLoadingMsg = (lastLoadTimeInSeconds: number | null) => {
        let msg = `Loaded ${(timeline?.length || 0).toLocaleString()} toots for timeline`;
        // console.log("[DEMO APP] <Feed> finishedLoadingStr:", msg);

        if (lastLoadTimeInSeconds) {
            msg += ` in ${lastLoadTimeInSeconds.toFixed(1)} seconds`;
        }

        return (
            <p style={loadingMsgStyle}>
                {msg} ({<a onClick={reset} style={resetLinkStyle}>clear all data and reload</a>})
            </p>
        );
    };

    // Initial load of the feed (can be re-triggered by changing the value of triggerReload)
    useEffect(() => {
        if (!user) return;

        // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
        const constructFeed = async (): Promise<void> => {
            logMsg(`constructFeed() called with user ID ${user?.id} (feed already has ${timeline.length} toots)`);
            let currentUser: mastodon.v1.Account;

            try {
                currentUser = await api.v1.accounts.verifyCredentials();
            } catch (err) {
                console.error(`Failed to verifyCredentials() with error:`, err);
                logout();
                return;
            }

            const algo = await TheAlgorithm.create({api: api, user: currentUser, setTimelineInApp: setTimeline});
            setAlgorithm(algo);

            try {
                algo.triggerFeedUpdate();
                logMsg(`constructFeed() finished; feed has ${algo.feed.length} toots`);
            } catch (err) {
                console.error(`Failed to triggerFeedUpdate() with error:`, err);
                setError(`Failed to triggerFeedUpdate: ${err}`);
            }
        };

        constructFeed();
    }, [setAlgorithm, triggerReload, user]);

    // Show more toots when the user scrolls to bottom of the page
    // TODO: This doesn't actually trigger any API calls, it just shows more of the preloaded toots
    // TODO: this triggers twice: once when isbottom changes to true and again because numDisplayedToots
    //       is increased, triggerng a second evaluation of the block
    useEffect(() => {
        // Pull more toots to display from our local cached and sorted toot feed
        // TODO: this should trigger the pulling of more toots from the server if we run out of local cache
        const showMoreToots = () => {
            const msg = `Showing ${numDisplayedToots} toots, adding ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more`;
            logMsg(`${msg} (${timeline.length} available in feed)`);
            setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
        };

        if (isBottom && timeline.length) showMoreToots();
    }, [timeline, isBottom, numDisplayedToots, setNumDisplayedToots]);

    // Set up feed reloader to call algorithm.triggerFeedUpdate() on focus after RELOAD_IF_OLDER_THAN_SECONDS
    useEffect(() => {
        if (!user || !algorithm || isLoadingInitialFeed) return;

        const shouldReloadFeed = (): boolean => {
            let should = false;
            let msg: string;

            if (algorithm?.isLoading()) {
                msg = `algorithm.isLoading() says load in progress`;
            } else {
                const mostRecentAt = algorithm.mostRecentHomeTootAt();
                const feedAgeInSeconds = (Date.now() - mostRecentAt.getTime()) / 1000;
                msg = `feed is ${feedAgeInSeconds.toFixed(0)}s old, most recent from followed: ${timeString(mostRecentAt)}`;
                should = feedAgeInSeconds > RELOAD_IF_OLDER_THAN_SECONDS;
            }

            logMsg(`shouldReloadFeed() returning ${should} (${msg})`);
            return should;
        };

        const handleFocus = () => {
            // for some reason "not focused" never happens? https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus
            // logMsg(`window is ${document.hasFocus() ? "focused" : "not focused"}`);
            if (!document.hasFocus()) return;
            if (!shouldReloadFeed()) return;

            algorithm.triggerFeedUpdate().then(() => {
                logMsg(`finished calling getFeed with ${timeline.length} toots`);
            }).catch((err) => {
                console.error(`error calling triggerFeedUpdate():`, err);
                setError(`error calling triggerFeedUpdate(): ${err}`);
            })
        };

        window.addEventListener(FOCUS, handleFocus);
        return () => window.removeEventListener(FOCUS, handleFocus);
    }, [algorithm, timeline, isLoadingInitialFeed, user]);

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
                        {algorithm && <FilterSetter algorithm={algorithm} resetNumDisplayedToots={resetNumDisplayedToots}/>}
                        {algorithm && <TrendingInfo algorithm={algorithm} />}
                        <FindFollowers api={api} user={user} />

                        {algorithm?.isLoading()
                            ? <LoadingSpinner message={algorithm.loadingStatus} style={loadingMsgStyle} />
                            : (algorithm && finishedLoadingMsg(algorithm.lastLoadTimeInSeconds))}
                    </div>
                </Col>

                <Col style={statusesColStyle} xs={6}>
                    {api && !isLoadingInitialFeed &&
                        timeline.slice(0, Math.max(DEFAULT_NUM_DISPLAYED_TOOTS, numDisplayedToots)).map((toot) => (
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
                            message={isLoadingInitialFeed ? DEFAULT_LOADING_MESSAGE : NO_TOOTS_MSG}
                        />}

                    <div ref={bottomRef}>
                        <p>Load More</p>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};


const loadingMsgStyle: CSSProperties = {
    fontSize: "16px",
    height: "20px",
    marginTop: "7px",
};

const resetLinkStyle: CSSProperties = {
    color: "red",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    textDecoration: "underline",
};

const statusesColStyle: CSSProperties = {
    backgroundColor: '#15202b',
    height: 'auto',
};
