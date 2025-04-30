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
import { useAuthContext } from "../hooks/useAuth";

// Number constants
const DEFAULT_NUM_TOOTS = 20;
const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;
const RELOAD_IF_OLDER_THAN_MS = 1000 * 60 * 10; // 10 minutes
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
    const isLoadingInitialFeed = !feed?.length;

    // Initial load of the feed
    useEffect(() => {
        if (!user) {
            console.warn("User not set yet!");
            return;
        }

        // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
        const constructFeed = async (): Promise<void> => {
            console.log(`constructFeed() called with user ID ${user?.id} (feed already has ${feed.length} toots)`);
            let currentUser: mastodon.v1.Account;

            try {
                if (!user) throw new Error(`User not set in constructFeed()!`);
                currentUser = await api.v1.accounts.verifyCredentials();
            } catch (err) {
                console.error(`Failed to verifyCredentials() with error:`, err);
                logout();
                return;
            }

            const algo = await TheAlgorithm.create({api: api, user: currentUser, setFeedInApp: setFeed});
            setAlgorithm(algo);
            await algo.getFeed();
            console.log(`constructFeed() finished; feed has ${algo.feed.length} toots`);
        };

        constructFeed();
    }, [setAlgorithm, user]);

    // Show more toots when the user scrolls to bottom of the page
    // TODO: This doesn't actually trigger any API calls, it just shows more of the preloaded toots
    useEffect(() => {
        if (isBottom) {
            console.debug("Hit bottom of page; showing more toots (hopefully)...");
            showMoreToots();
        }
    }, [isBottom]);

    // useEffect to set up feed reloader (on focus after 10 minutes)
    useEffect(() => {
        if (!user || !algorithm || !feed) return;

        const shouldReloadFeed = (): boolean => {
            if (!feed?.length) {
                console.info(`Feed has 0 length; not reloading...`);
                return false;
            }

            const mostRecentAt = algorithm.mostRecentTootAt();
            const feedAgeInSeconds = (Date.now() - mostRecentAt.getTime()) / 1000;
            const should = feedAgeInSeconds > RELOAD_IF_OLDER_THAN_MS;
            console.log(`shouldReloadFeed(): ${should} (mostRecentAt is '${mostRecentAt}' so feed is ${feedAgeInSeconds} seconds old)`);
            return should;
        };

        const handleFocus = () => {
            // TODO: for some reason "not focused" never happens?
            console.info(`window is ${document.hasFocus() ? "focused" : "not focused"}`);
            if (!document.hasFocus()) return;

            if (algorithm?.loadingStatus) {
                console.info(`algorithm.loadingStatus is not empty so loading is already in progress...`);
                return;
            } else if (!shouldReloadFeed()) {
                return;
            }

            console.info(`Reloading feed because of focus...`);
            algorithm.getFeed();
        };

        const handleVisibility = () => {
            console.debug(`Tab visibilityState is ${document.visibilityState}`);
        };

        console.info(`Adding event listeners...`)
        window.addEventListener(FOCUS, handleFocus);
        window.addEventListener(VISIBILITY_CHANGE, handleVisibility);

        return () => {
            console.info(`Removing event listeners...`)
            window.removeEventListener(FOCUS, handleFocus);
            window.removeEventListener(VISIBILITY_CHANGE, handleVisibility);
        }
    }, [algorithm, feed, user]);

    // Pull more toots to display from our local cached and sorted toot feed
    // TODO: this should trigger the pulling of more toots from the server if we run out of local cache
    const showMoreToots = () => {
        console.log(`Showing ${numDisplayedToots} toots, ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more (${feed.length} available)`);
        setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
    };

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
                            : <p style={loadingMsgStyle}>Finished loading {feed.length} toots for timeline.</p>}
                    </div>
                </Col>

                <Col style={{backgroundColor: '#15202b', height: 'auto'}} xs={6}>
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
    marginTop: "5px",
};
