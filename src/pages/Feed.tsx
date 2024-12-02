/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "react-bootstrap";
import { usePersistentState } from "react-persistent-state";

import Container from "react-bootstrap/esm/Container";
import { mastodon, createRestAPIClient as loginToMastodon } from "masto";
import { DEFAULT_FILTERS, NO_LANGUAGE, TRENDING_TOOTS, FeedFilterSettings, ScoresType, TheAlgorithm, Toot } from "fedialgo";

import FindFollowers from "../components/FindFollowers";
import FullPageIsLoading from "../components/FullPageIsLoading";
import StatusComponent from "../components/Status";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/WeightSetter";
import { CountsType } from "../types";
import { useAuth } from "../hooks/useAuth";

const DEFAULT_NUM_TOOTS = 20;
const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;
const FEED_WIDTH = '800px';

const EARLIEST_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const RELOAD_IF_OLDER_THAN_MINUTES = 0.5;
const RELOAD_IF_OLDER_THAN_MS = RELOAD_IF_OLDER_THAN_MINUTES * 60 * 1000;


export default function Feed() {
    // Contruct Feed on Page Load
    const { user, logout } = useAuth();

    // State variables
    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null); //algorithm to use
    const [error, setError] = useState<string>("");
    const [filteredLanguages, setFilteredLanguages] = useState<string[]>([]); //languages to filter
    const [isLoading, setIsLoading] = useState<boolean>(true);  // true if page is still loading
    const [languagesInFeed, setLanguagesInFeed] = useState<CountsType>({}); // languages that show up at least once in the feed toots
    const [userWeights, setUserWeights] = useState<ScoresType>({});  // weights for each factor
    // TODO: this should be in persistent state but it's too big?
    const [feed, setFeed] = useState<Toot[]>([]); // timeline toots

    // Persistent state variables
    const [numDisplayedToots, setNumDisplayedToots] = usePersistentState<number>(DEFAULT_NUM_TOOTS, user.id + "numDisplayedToots"); //how many toots to show
    const [scrollPos, setScrollPos] = usePersistentState<number>(0, user.id + "scroll"); //scroll position

    window.addEventListener("scroll", () => {
        if (window.scrollY % 10 == 0) setScrollPos(window.scrollY);
    });

    const api: mastodon.rest.Client = loginToMastodon({url: user.server, accessToken: user.access_token});
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);  // TODO: this works after the initial load but after loading from cache it doesn't work sometimes?

    // Load the posts in the feed either from mastodon server or from the cache
    useEffect(() => {
        const mostRecentToot = feed.reduce(
            (recentToot, toot) => recentToot.createdAt > toot.createdAt ? recentToot : toot,
            {createdAt: EARLIEST_TIMESTAMP}
        );

        if (mostRecentToot.createdAt != EARLIEST_TIMESTAMP) {
            console.log("Found recent toot in feed: ", mostRecentToot);
        } else {
            console.log("No recent toot found in feed...");
        }

        // only reload feed if the newest status is older than RELOAD_IF_OLDER_THAN_MS
        if ((Date.now() - (new Date(mostRecentToot.createdAt)).getTime()) > RELOAD_IF_OLDER_THAN_MS) {
            setNumDisplayedToots(DEFAULT_NUM_TOOTS);
            constructFeed();
        } else {
            console.log("Loading feed from cache...");
            restoreFeedCache();
        }

        setIsLoading(false);
    }, []);

    // Load more records when the user scrolls to bottom of the page
    // TODO: This doesn't work when there's less elements in the feed array than are supposed to be
    //       displayed as per the setNumDisplayedToots() value. For example this situation in logs breaks infinite scroll:
    //
    //  - hit bottom of page; should load more toots... Feed.tsx:78
    //  - numDisplayedToots=60, feed.length=56. loading 10 more toots... Feed.tsx:126
    //  - 56 status elements in feed: Array(56) [ {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, … ]
    useEffect(() => {
        if (isBottom) {
            console.log("hit bottom of page; should load more toots...");
            showMoreToots();
        }
    }, [isBottom]);


    // Check that we have valid user credentials, otherwise force a logout.
    const getUserAlgo = async (): Promise<TheAlgorithm | null>  => {
        let currentUser: mastodon.v1.Account;

        if (!user) {
            console.warn(`getUserAlgo() called without a valid user, can't get algorithm...`);
            return null;
        }

        try {
            currentUser = await api.v1.accounts.verifyCredentials();
        } catch (error) {
            console.warn(`Failed to getUserAlgo() with error:`, error);
            logout();
            return null;
        }

        const algo = await TheAlgorithm.create(api, currentUser);
        setAlgorithm(algo);
        setUserWeights(await algo.getUserWeights());
        return algo;
    };

    // Called if timeline feed was loaded from persistent storage
    const restoreFeedCache = async () => {
        console.log(`restoreFeedCache() called with user ID ${user?.id}...`);
        const algo = await getUserAlgo();
        if (!algo) return;
        window.scrollTo(0, scrollPos);
    };

    const constructFeed = async () => {
        console.log(`constructFeed() called with user ID ${user?.id}...`);
        const algo = await getUserAlgo();
        if (!algo) return;
        console.log(`About to call algo.getFeed(). 'feed' state currently contains ${feed.length} toots...`);
        const timelineFeed = await algo.getFeed();
        setFeed(timelineFeed);
        algo.logFeedInfo()

        // Get all the unique languages that show up in the feed
        const feedLanguages = timelineFeed.reduce((langCounts, toot) => {
            const tootLanguage = toot.language || NO_LANGUAGE;
            langCounts[tootLanguage] = (langCounts[tootLanguage] || 0) + 1;
            return langCounts;
        }, {} as CountsType)

        setLanguagesInFeed(feedLanguages);
    };

    // Pull more toots to display from our local cached and sorted toot feed
    // TODO: this should trigger the pulling of more toots from the server if we run out of local cache
    const showMoreToots = () => {
        console.log(`numDisplayedToots=${numDisplayedToots}, feed.length=${feed.length}. loading ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more toots...`);
        setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
    };

    // Learn weights based on user action    // TODO: does learning weights really work?
    const weightAdjust = async (scores: ScoresType) => {
        const newWeights = await algorithm.learnWeights(scores);
        console.log("new userWeights in weightAdjust():", newWeights);
        setUserWeights(newWeights);
    };

    // Update the user weightings stored in TheAlgorithm when a user moves a weight slider
    const updateWeights = async (newWeights: ScoresType): Promise<ScoresType> => {
        console.log(`updateWeights() called...`);
        setUserWeights(newWeights);

        if (algorithm) {
            const newFeed = await algorithm.weightTootsInFeed(newWeights);  // Has side effect of updating WeightsStore
            setFeed(newFeed);
            algorithm.logFeedInfo();
        } else {
            console.warn(`'algorithm' variable not set, can't updateWeights()!`);
        }

        console.log(`updateWeights() finished...`);
        return newWeights;
    };

    const updateFilters = async (newFilters: FeedFilterSettings) => {
        console.log(`updateFilters() called with newSettings: `, newFilters);
        algorithm.filters = newFilters;
        setFeed(algorithm.filteredFeed());
    };

    if (algorithm && algorithm.feed.length != feed.length) {
        console.log(`filtered ${feed.length} of ${algorithm.feed.length} toots:`, feed);
    }

    return (
        <Container style={{backgroundColor: '#15202b', height: 'auto', maxWidth: FEED_WIDTH}}>
            <Modal show={error !== ""} onHide={() => setError("")}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>{error}</Modal.Body>
            </Modal>

            <WeightSetter
                algorithm={algorithm}
                languagesInFeed={languagesInFeed}
                updateFilters={updateFilters}
                updateWeights={updateWeights}
                userWeights={userWeights}
            />

            <FindFollowers api={api} user={user} />

            {!isLoading && api && (feed.length >= 1) &&
                feed.slice(0, Math.max(DEFAULT_NUM_TOOTS, numDisplayedToots)).map((toot: Toot) => (
                    <StatusComponent
                        api={api}
                        key={toot.uri}
                        setError={setError}
                        status={toot}
                        user={user}
                        weightAdjust={weightAdjust}
                    />
                ))}

            {(feed.length == 0 || isLoading) && <FullPageIsLoading />}
            <div ref={bottomRef} onClick={showMoreToots}>Load More</div>
        </Container>
    );
};
