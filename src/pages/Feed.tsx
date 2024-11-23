/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "react-bootstrap";
import { usePersistentState } from "react-persistent-state";

import Container from "react-bootstrap/esm/Container";
import { mastodon, createRestAPIClient as loginToMastodon } from "masto";
import { condensedStatus, Toot, ScoresType, TheAlgorithm } from "fedialgo";

import FindFollowers from "../components/FindFollowers";
import FullPageIsLoading from "../components/FullPageIsLoading";
import StatusComponent from "../components/Status";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/WeightSetter";
import { settingsType, UserAlgo } from "../types";
import { useAuth } from "../hooks/useAuth";

const DEFAULT_NUM_TOOTS = 20;
const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;

const EARLIEST_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const RELOAD_IF_OLDER_THAN_MINUTES = 0.5;
const RELOAD_IF_OLDER_THAN_MS = RELOAD_IF_OLDER_THAN_MINUTES * 60 * 1000;

const DEFAULT_SETTINGS = {
    includeReposts: true,
    onlyLinks: false,
};


export default function Feed() {
    //Contruct Feed on Page Load
    const { user, logout } = useAuth();

    // State variables
    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null); //algorithm to use
    const [error, setError] = useState<string>("");
    const [filteredLanguages, setFilteredLanguages] = useState<string[]>([]); //languages to filter
    const [isLoading, setIsLoading] = useState<boolean>(true);  // true if page is still loading
    const [userWeights, setUserWeights] = useState<ScoresType>({});  // weights for each factor

    // Persistent state variables
    const [feed, setFeed] = usePersistentState<Toot[]>([], user.id + "feed"); //feed to display
    const [numDisplayedToots, setNumDisplayedToots] = usePersistentState<number>(DEFAULT_NUM_TOOTS, user.id + "records"); //how many toots to show
    const [scrollPos, setScrollPos] = usePersistentState<number>(0, user.id + "scroll"); //scroll position
    // TODO: changing settings by clicking the checkbox in the GUI doesn't seem to work
    const [settings, setSettings] = usePersistentState<settingsType>(DEFAULT_SETTINGS, "settings"); //filter settings for feed

    // TODO: what's the point of this?
    window.addEventListener("scroll", () => {
        if (window.scrollY % 10 == 0) setScrollPos(window.scrollY);
    });

    const api: mastodon.rest.Client = loginToMastodon({url: user.server, accessToken: user.access_token});
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);  // TODO: this works after the initial load but after loading from cache it doesn't work sometimes?

    // Load the posts in the feed either from mastodon server or from the cache
    useEffect(() => {
        const mostRecentToot = feed.reduce((prev, current) =>
            (prev.createdAt > current.createdAt) ? prev : current,
            {createdAt: EARLIEST_TIMESTAMP}
        );

        console.log("most recent toot in feed: ", mostRecentToot);

        // only reload feed if the newest status is older than RELOAD_IF_OLDER_THAN_MS
        if (mostRecentToot && (Date.now() - (new Date(mostRecentToot.createdAt)).getTime()) > RELOAD_IF_OLDER_THAN_MS) {
            setNumDisplayedToots(DEFAULT_NUM_TOOTS);
            constructFeed();
            setIsLoading(false);
        } else {
            console.log("Loading feed from cache...");
            restoreFeedCache();
            setIsLoading(false);
        }
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
            loadMore();
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

        const algo = new TheAlgorithm(api, currentUser);
        setAlgorithm(algo);
        setUserWeights(await algo.getScoreWeights());
        return algo;
    };

    // Load toots and all the rest of the data from long term storage
    // TODO: does this actually work? It doesn't seem to call setFeed()...
    //       original: https://github.com/pkreissel/foryoufeed/blob/9c37e7803c63bb3f4162b93aff3853894e734bc7/src/pages/Feed.tsx#L65
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
        setFeed(await algo.getFeed());
    };

    // Pull more toots to display from our local cached and sorted toot feed
    // TODO: this should trigger the pulling of more toots from the server if we run out of local cache
    const loadMore = () => {
        console.log(`numDisplayedToots=${numDisplayedToots}, feed.length=${feed.length}. loading ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more toots...`);
        setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
    };

    // Adjust user Weights with slider values
    const weightAdjust = async (scores: ScoresType) => {
        const newWeights = await algorithm.weightAdjust(scores);
        console.log("new userWeights in weightAdjust():", newWeights);
        setUserWeights(newWeights);
    };

    const updateWeights = async (newWeights: ScoresType) => {
        console.log(`updateWeights() called...`)
        setUserWeights(newWeights);

        if (algorithm) {
            const newFeed = await algorithm.weightTootsInFeed(newWeights);
            setFeed(newFeed);
        }
    };

    const updateSettings = async (newSettings: settingsType) => {
        console.log(`newSettings: ${JSON.stringify(newSettings)}`);
        setSettings(newSettings);
        setFeed([...feed]);
    };

    // Log the weighted feed to the console
    if (feed.length > 1) {
        console.log(`ORDERED FEED (condensed): `, feed.map(condensedStatus));
    }

    // Strip out toots we don't want to show to the user for various reasons
    const filteredFeed = feed.filter((status: Toot) => {
        if (settings.onlyLinks && !(status.card || status.reblog?.card)) {
            console.log(`Removing ${status.uri} from feed because it's not a link...`);
            return false;
        } else if (status.reblog && !settings.includeReposts) {
            console.log(`Removing reblogged status ${status.uri} from feed...`);
            return false;
        } else if (filteredLanguages.length > 0 && !filteredLanguages.includes(status.language)) {
            console.log(`Removing toot ${status.uri} w/invalid language ${status.language} (valid langs: ${JSON.stringify(filteredLanguages)}).`);
            return false;
        }

        return true;
    });

    return (
        <Container style={{ maxWidth: "700px", height: "auto" }}>
            <Modal show={error !== ""} onHide={() => setError("")}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>{error}</Modal.Body>
            </Modal>

            <WeightSetter
                algorithm={algorithm}
                languages={feed.reduce((languagesInFeed, item) => {
                    if (!languagesInFeed.includes(item.language)) languagesInFeed.push(item.language);
                    return languagesInFeed;
                }, [])}
                setSelectedLanguages={setFilteredLanguages}
                settings={settings}
                updateSettings={updateSettings}
                updateWeights={updateWeights}
                userWeights={userWeights}
            />

            <FindFollowers api={api} user={user} />

            {!isLoading && api && (feed.length > 1) &&
                filteredFeed.slice(0, Math.max(DEFAULT_NUM_TOOTS, numDisplayedToots)).map((toot: Toot) => (
                    <StatusComponent
                        api={api}
                        key={toot.uri}
                        setError={setError}
                        status={toot}
                        user={user}
                        weightAdjust={weightAdjust}
                    />
                )
            )}

            {(feed.length == 0 || isLoading) && <FullPageIsLoading />}
            <div ref={bottomRef} onClick={loadMore}>Load More</div>
        </Container>
    )
};
