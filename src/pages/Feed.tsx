/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { CSSProperties, useState, useEffect, useRef } from "react";

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { GET_FEED_BUSY_MSG, READY_TO_LOAD_MSG, TheAlgorithm, Toot, timeString } from "fedialgo";
import { mastodon, createRestAPIClient } from "masto";
import { Modal } from "react-bootstrap";
import { Tooltip } from 'react-tooltip';

import FilterSetter from "../components/algorithm/FilterSetter";
import FindFollowers from "../components/FindFollowers";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusComponent from "../components/Status";
import TrendingInfo from "../components/TrendingInfo";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/algorithm/WeightSetter";
import { AlgorithmProvider } from "../hooks/useAlgorithm";
import { browserLanguage, logMsg, warnMsg } from "../helpers/string_helpers";
import { useAuthContext } from "../hooks/useAuth";

// Number constants
const DEFAULT_NUM_DISPLAYED_TOOTS = 20;
const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;
const RELOAD_IF_OLDER_THAN_SECONDS = 60 * 10; // 10 minutes
// String constants
const FOCUS = "focus";
const VISIBILITY_CHANGE = "visibilitychange";
const TOOLTIP_ANCHOR = "tooltip-anchor";
// Messaging constants
const AUTO_UPDATE_TOOLTIP_MSG = "If this box is checked new toots will be automatically loaded when you focus this browser tab.";
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
    const [shouldAutoLoadNewToots, setShouldAutoLoadNewToots] = useState<boolean>(false);  // Auto load new toots
    const [isControlPanelSticky, setIsControlPanelSticky] = useState<boolean>(true);  // Left panel stickiness
    const [isLoading, setIsLoading] = useState<boolean>(true);  // Loading spinner
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(DEFAULT_NUM_DISPLAYED_TOOTS);
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [prevScrollY, setPrevScrollY] = useState(0);
    const [timeline, setTimeline] = useState<Toot[]>([]);  // contains timeline Toots
    const [triggerReload, setTriggerReload] = useState<number>(0);  // Used to trigger reload of feed via useEffect watcher

    // Other variables
    // const isLoadingInitialFeed = (!algorithm || (isLoading && !timeline?.length));
    const isInitialLoad = timeline.length === 0;  // TODO: this is not really correct, it should be based on the algorithm loading status
    const scrollMsg = `Scroll: ${scrollPercentage.toFixed(2)}% (${window.scrollY}), Displaying ${numDisplayedToots} Toots`;
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
        if (lastLoadTimeInSeconds) msg += ` in ${lastLoadTimeInSeconds.toFixed(1)} seconds`;

        return (
            <p style={loadingMsgStyle}>
                {msg} ({<a onClick={reset} style={resetLinkStyle}>clear all data and reload</a>})
            </p>
        );
    };

    const triggerLoad = () => {
        if (!algorithm) return;
        setIsLoading(true);

        algorithm.triggerFeedUpdate()
            .then(() => logMsg(`triggerLoad() finished`))
            .catch((err) => {
                if (err.message.includes(GET_FEED_BUSY_MSG)) {
                    warnMsg(`triggerLoad() Load already in progress, please wait a moment and try again`);
                } else {
                    console.error(`Failed to triggerLoad() with error:`, err);
                    setError(`Failed to triggerLoad: ${err}`);
                }
            })
            .finally(() => setIsLoading(false));
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

            const algo = await TheAlgorithm.create({
                api: api, user:
                currentUser,
                setTimelineInApp: setTimeline,
                language: browserLanguage()}
            );

            setAlgorithm(algo);
            setIsLoading(true);

            algo.triggerFeedUpdate()
                .catch((err) => {
                    console.error(`Failed to triggerFeedUpdate() with error:`, err);
                    setError(`Failed to triggerFeedUpdate: ${err}`);
                })
                .finally(() => {
                    setIsLoading(false);
                    logMsg(`Finished loading feed with ${timeline.length} toots`);
                });
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
            if (numDisplayedToots < timeline.length) {
                const msg = `Showing ${numDisplayedToots} toots, adding ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more`;
                logMsg(`${msg} (${timeline.length} available in feed)`);
                setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
            } else {
                logMsg(`Already showing ${numDisplayedToots} toots, no more toots available`);
            }
        };

        if (isBottom && timeline.length) {
            showMoreToots();
        }

        // If there's less than numDisplayedToots in the feed set numDisplayedToots to the number of toots in the feed
        if (timeline?.length && timeline.length < numDisplayedToots) {
            setNumDisplayedToots(timeline.length);
        }

        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight; // Total height
            const scrollPosition = document.documentElement.scrollTop || window.scrollY; // Current scroll position
            const viewportHeight = document.documentElement.clientHeight; // Visible viewport height
            const totalScrollableHeight = scrollHeight - viewportHeight; // Scrollable distance
            const percentage = (scrollPosition / totalScrollableHeight) * 100;
            setScrollPercentage(percentage);

            if (percentage <= 50 && numDisplayedToots > (DEFAULT_NUM_DISPLAYED_TOOTS * 2)) {
                const newNumDisplayedToots = Math.floor(numDisplayedToots * 0.7);
                logMsg(`Scroll percentage is less than 50%, lowering numDisplayedToots to ${newNumDisplayedToots}`);
                setNumDisplayedToots(newNumDisplayedToots);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isBottom, numDisplayedToots, prevScrollY, setNumDisplayedToots, setPrevScrollY, timeline]);

    // Set up feed reloader to call algorithm.triggerFeedUpdate() on focus after RELOAD_IF_OLDER_THAN_SECONDS
    useEffect(() => {
        if (!user || !algorithm || isInitialLoad) return;

        const shouldReloadFeed = (): boolean => {
            if (!shouldAutoLoadNewToots) return false;
            let should = false;
            let msg: string;

            if (algorithm.isLoading()) {
                msg = `algorithm.isLoading() says load in progress`;
            } else {
                const mostRecentAt = algorithm.mostRecentHomeTootAt();

                if (!mostRecentAt) {
                    console.warn(`${timeline.length} toots in feed, but no most recent toot found!`);
                    return false;
                }

                const feedAgeInSeconds = (Date.now() - mostRecentAt.getTime()) / 1000;
                msg = `feed is ${feedAgeInSeconds.toFixed(0)}s old, most recent from followed: ${timeString(mostRecentAt)}`;
                should = feedAgeInSeconds > RELOAD_IF_OLDER_THAN_SECONDS;
            }

            logMsg(`shouldReloadFeed() returning ${should} (${msg})`);
            return should;
        };

        const handleFocus = () => {
            if (!document.hasFocus()) return;
            if (!shouldReloadFeed()) return;
            triggerLoad();
        };

        window.addEventListener(FOCUS, handleFocus);
        return () => window.removeEventListener(FOCUS, handleFocus);
    }, [algorithm, timeline, isInitialLoad, triggerLoad, user]);


    return (
        <Container fluid style={{height: 'auto'}}>
            <Tooltip id={TOOLTIP_ANCHOR} place="top" />

            <Modal show={error !== ""} onHide={() => setError("")} style={{color: "black"}}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>{error}</Modal.Body>
            </Modal>

            <Row>
                <Col xs={6}>
                    <AlgorithmProvider algorithm={algorithm}>
                        <div className="sticky-top" style={isControlPanelSticky ? {} : {position: "relative"}} >
                            <div style={stickySwitchContainer}>
                                <Form.Check
                                    checked={isControlPanelSticky}
                                    className="mb-3"
                                    key={"stickPanel"}
                                    label={`Stick Control Panel To Top`}
                                    onChange={(e) => setIsControlPanelSticky(e.target.checked)}
                                    type="checkbox"
                                />

                                {(!algorithm || algorithm.isDebug)
                                    ? <p>{scrollMsg}</p>
                                    : <a
                                        data-tooltip-id={TOOLTIP_ANCHOR}
                                        data-tooltip-content={AUTO_UPDATE_TOOLTIP_MSG}
                                        key={"tooltipautoload"}
                                        style={{color: "white"}}
                                    >
                                        <Form.Check
                                            checked={shouldAutoLoadNewToots}
                                            className="mb-3"
                                            key={"autoLoadNewToots"}
                                            label={`Auto Load New Toots`}
                                            onChange={(e) => setShouldAutoLoadNewToots(e.target.checked)}
                                            type="checkbox"
                                        />
                                    </a>}
                            </div>

                            {algorithm && <WeightSetter />}
                            {algorithm && <FilterSetter />}
                            {algorithm && <TrendingInfo />}
                            <FindFollowers api={api} user={user} />

                            {/* Checking algorith.loadingStatus here DOES NOT trigger a render when the value changes */}
                            {/* {(isInitialLoad || isLoading || algorithm?.loadingStatus) */}
                            {(isInitialLoad || isLoading)
                                ? <LoadingSpinner message={algorithm?.loadingStatus || READY_TO_LOAD_MSG} style={loadingMsgStyle} />
                                : (algorithm && finishedLoadingMsg(algorithm?.lastLoadTimeInSeconds))}

                            {/* <p style={loadingMsgStyle}>
                                <a onClick={() => algorithm.logWithState("DEMO APP", `State (isLoading=${isLoading}, isInitialLoad=${isInitialLoad}, algorithm.isLoading()=${algorithm.isLoading()})`)} >
                                    Dump current algorithm state to console
                                </a>
                            </p> */}
                        </div>
                    </AlgorithmProvider>
                </Col>

                {/* <Col style={statusesColStyle} xs={6}> */}
                <Col xs={6}>
                    {algorithm && !isLoading && !isInitialLoad && <>
                        <p style={{...loadingMsgStyle, marginTop: "8px", textAlign: "center", fontSize: "13px"}}>
                            <a onClick={triggerLoad} style={{cursor: "pointer", textDecoration: "underline"}} >
                                (load new toots)
                            </a>
                        </p></>}

                    <div style={statusesColStyle}>
                        {timeline.slice(0, Math.max(DEFAULT_NUM_DISPLAYED_TOOTS, numDisplayedToots)).map((toot) => (
                            <StatusComponent
                                api={api}
                                key={toot.uri}
                                setError={setError}
                                status={toot}
                                user={user}
                            />
                        ))}

                        {/* TODO: the NO_TOOTS_MSG will never happen */}
                        {isInitialLoad &&
                            <LoadingSpinner
                                isFullPage={true}
                                message={isLoading ? DEFAULT_LOADING_MESSAGE : NO_TOOTS_MSG}
                            />}

                        <div ref={bottomRef}>
                            <p>Load More</p>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};


const loadingMsgStyle: CSSProperties = {
    fontSize: "16px",
    height: "20px",
    marginTop: "6px",
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
    borderRadius: '10px',
    height: 'auto',
};

const stickySwitchContainer: CSSProperties = {
    display: "flex",
    height: "20px",
    justifyContent: "space-between",
    marginBottom: "5px",
};
