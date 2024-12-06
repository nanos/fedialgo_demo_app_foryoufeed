/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "react-bootstrap";

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { mastodon, createRestAPIClient as loginToMastodon } from "masto";
import { TheAlgorithm, Toot, Weights } from "fedialgo";

import FilterSetter from "../components/FilterSetter";
import FindFollowers from "../components/FindFollowers";
import FullPageIsLoading, { DEFAULT_LOADING_MESSAGE } from "../components/FullPageIsLoading";
import StatusComponent from "../components/Status";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/WeightSetter";
import { useAuthContext } from "../hooks/useAuth";

const DEFAULT_NUM_TOOTS = 20;
const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;


export default function Feed() {
    // Contruct Feed on Page Load
    const { user, logout } = useAuthContext();

    // State variables
    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [feed, setFeed] = useState<Toot[]>([]); // timeline toots
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(DEFAULT_NUM_TOOTS);

    const api: mastodon.rest.Client = loginToMastodon({url: user.server, accessToken: user.access_token});
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);

    // Load the posts in the feed either from mastodon server or from the cache
    useEffect(() => {
        if (!user) {
            console.warn("User not set yet!");
            return;
        }

        constructFeed();
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
        } catch (error) {
            console.warn(`Failed to verifyCredentials() with error:`, error);
            logout();
            return;
        }

        const algo = await TheAlgorithm.create({api: api, user: currentUser, setFeedInApp: setFeed});
        setAlgorithm(algo);

        // If there are toots in the cache set isLoading to false early so something is displayed
        if (algo.feed.length > 0) setIsLoading(false);
        await algo.getFeed();
        setIsLoading(false);
    };

    // Pull more toots to display from our local cached and sorted toot feed
    // TODO: this should trigger the pulling of more toots from the server if we run out of local cache
    const showMoreToots = () => {
        console.log(`Showing ${numDisplayedToots} toots, ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more (${feed.length} available to show)`);
        setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
    };

    // Learn weights based on user action    // TODO: does learning weights really work?
    const learnWeights = async (scores: Weights): Promise<void> => {
        const newWeights = await algorithm.learnWeights(scores);
        if (!newWeights) return;
    };

    return (
        <Container fluid style={{height: 'auto'}}>
            <Modal show={error !== ""} onHide={() => setError("")}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>{error}</Modal.Body>
            </Modal>

            <Row>
                <Col xs={6}>
                    <div className="sticky-top">
                        {algorithm && <WeightSetter algorithm={algorithm} />}
                        {algorithm && <FilterSetter algorithm={algorithm} />}
                        <FindFollowers api={api} user={user} />
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
                                learnWeights={learnWeights}
                            />
                        ))}

                    {(isLoading || feed.length == 0) &&
                        <FullPageIsLoading
                            message={isLoading ? DEFAULT_LOADING_MESSAGE : "No toots found! Maybe check your filter settings"}
                        />}

                    <div ref={bottomRef} onClick={showMoreToots}>
                        <p>Load More</p>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};
