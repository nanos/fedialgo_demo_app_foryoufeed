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
const RELOAD_IF_OLDER_THAN_MS = 1000 * 60 * 15; // 15 minutes
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
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(DEFAULT_NUM_TOOTS);

    const handleFocus = () => {
        console.debug(`window is ${document.hasFocus() ? "focused" : "not focused"}`);

        if (isLoading && feed.length == 0) {
            console.debug(`isLoading=True; not reloading feed...`);
            return;
        } else if (!algorithm) {
            console.warn("Algorithm not set yet!");
            return;
        } else if (!shouldReloadFeed()) {
            console.debug(`shouldReloadFeed() returned false; not reloading feed...`);
            return;
        }

        algorithm.getFeed();
    };

    // Load the posts in the feed either from mastodon server or from the cache
    useEffect(() => {
        if (!user) {
            console.warn("User not set yet!");
            return;
        }

        constructFeed();
        const handleVisibility = () => console.log(`Tab is ${document.visibilityState}`);
        window.addEventListener(VISIBILITY_CHANGE, handleVisibility);
        window.addEventListener(FOCUS, handleFocus);

        return () => {
            window.removeEventListener(VISIBILITY_CHANGE, handleVisibility);
            window.removeEventListener(FOCUS, handleFocus);
        }
    }, [user]);

    // Show more toots when the user scrolls to bottom of the page
    // TODO: This doesn't actually trigger any API calls, it just shows more of the preloaded toots
    useEffect(() => {
        if (isBottom) {
            console.log("hit bottom of page; should load more toots...");
            showMoreToots();
        }
    }, [isBottom]);

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

        // If there are toots in the cache set isLoading to false early so something is displayed
        if (algo.feed.length > 0) setIsLoading(false);
        await algo.getFeed();
        console.log(`constructFeed() finished; feed has ${algo.feed.length} toots, setting isLoading=false`);
        setIsLoading(false);
    };

    const shouldReloadFeed = (): boolean => {
        if (!algorithm || !feed || feed.length == 0) return false;
        const mostRecentAt = algorithm.mostRecentTootAt();
        const should = ((Date.now() - mostRecentAt.getTime()) > RELOAD_IF_OLDER_THAN_MS);
        console.log(`shouldReloadFeed() mostRecentAt: ${mostRecentAt}, should: ${should}`);
        return should;
    }

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
                    {!isLoading && api && (feed.length >= 1) &&
                        feed.slice(0, Math.max(DEFAULT_NUM_TOOTS, numDisplayedToots)).map((toot) => (
                            <StatusComponent
                                api={api}
                                key={toot.uri}
                                setError={setError}
                                status={toot}
                                user={user}
                            />
                        ))}

                    {(isLoading || feed.length == 0) &&
                        <LoadingSpinner
                            isFullPage={true}
                            message={isLoading ? DEFAULT_LOADING_MESSAGE : NO_TOOTS_MSG}
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
