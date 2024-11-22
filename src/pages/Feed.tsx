/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import Container from "react-bootstrap/esm/Container";
import React, { useState, useEffect, useRef } from "react";
import { mastodon, createRestAPIClient as loginToMastodon } from "masto";
import { Modal } from "react-bootstrap";
import { usePersistentState } from "react-persistent-state";

import { condensedStatus, StatusType, ScoresType, TheAlgorithm } from "fedialgo";

import { settingsType } from "../types";
import { useAuth } from "../hooks/useAuth";
import FindFollowers from "../components/FindFollowers";
import FullPageIsLoading from "../components/FullPageIsLoading";
import StatusComponent from "../components/Status";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/WeightSetter";

const DEFAULT_NUM_POSTS = 20;
const NUM_POSTS_TO_LOAD_ON_SCROLL = 10;

const EARLIEST_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const RELOAD_IF_OLDER_THAN_MINUTES = 0.5;
const RELOAD_IF_OLDER_THAN_MS = RELOAD_IF_OLDER_THAN_MINUTES * 60 * 1000;

const DEFAULT_SETTINGS = {
    includeReposts: true,
    onlyLinks: false,
};


const Feed = () => {
    //Contruct Feed on Page Load
    const { user, logout } = useAuth();

    // State variables
    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null); //algorithm to use
    const [error, setError] = useState<string>("");
    const [filteredLanguages, setFilteredLanguages] = useState<string[]>([]); //languages to filter
    const [loading, setLoading] = useState<boolean>(true);  // true if page is still loading
    const [userWeights, setUserWeights] = useState<ScoresType>({});  // weights for each factor

    // Persistent state variables
    const [feed, setFeed] = usePersistentState<StatusType[]>([], user.id + "feed"); //feed to display
    const [records, setRecords] = usePersistentState<number>(DEFAULT_NUM_POSTS, user.id + "records"); //how many records to show
    const [scrollPos, setScrollPos] = usePersistentState<number>(0, user.id + "scroll"); //scroll position
    // TODO: changing settings by clicking the checkbox in the GUI doesn't seem to work
    const [settings, setSettings] = usePersistentState<settingsType>(DEFAULT_SETTINGS, "settings"); //filter settings for feed

    // TODO: what's the point of this?
    window.addEventListener("scroll", () => {
        if (window.scrollY % 10 == 0) setScrollPos(window.scrollY);
    });

    const api: mastodon.rest.Client = loginToMastodon({url: user.server, accessToken: user.access_token});
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);  // TODO: this works after the initial load but after loading from cache it doesn't work

    // Load the posts in the feed either from mastodon server or from the cache
    useEffect(() => {
        const mostRecentToot = feed.reduce((prev, current) =>
            (prev.createdAt > current.createdAt) ? prev : current,
            {createdAt: EARLIEST_TIMESTAMP}
        );

        console.log("most recent toot in feed: ", mostRecentToot);

        // only reload feed if the newest status is older than RELOAD_IF_OLDER_THAN_MS
        if (mostRecentToot && (Date.now() - (new Date(mostRecentToot.createdAt)).getTime()) > RELOAD_IF_OLDER_THAN_MS) {
            setRecords(DEFAULT_NUM_POSTS);
            constructFeed();
            setLoading(false);
        } else {
            console.log("loaded feed from cache");
            restoreFeedCache();
            setLoading(false);
        }
    }, []);

    // Load more records when the user scrolls to bottom of the page
    // TODO: This doesn't work when there's less elements in the feed array than are supposed to be
    //       displayed as per the setRecords() value. For example this situation in logs breaks infinite scroll:
    //
    //  - hit bottom of page; should load more toots... Feed.tsx:78
    //  - records=60, feed.length=56. loading 10 more toots... Feed.tsx:126
    //  - 56 status elements in feed: Array(56) [ {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, … ]
    useEffect(() => {
        if (isBottom) {
            console.log("hit bottom of page; should load more toots...");
            loadMore();
        }
    }, [isBottom]);

    // Load toots and all the rest of the data from long term storage
    // TODO: does this still work?
    const restoreFeedCache = async () => {
        if (!user) return;
        console.log(`restoreFeedCache() called...`);
        let currUser: mastodon.v1.Account;

        try {
            currUser = await api.v1.accounts.verifyCredentials();
        } catch (error) {
            console.warn(error);
            logout();
        }

        const algo = new TheAlgorithm(api, currUser);
        setUserWeights(await algo.getWeights());
        setAlgorithm(algo);
        window.scrollTo(0, scrollPos);
    };

    const constructFeed = async () => {
        if (!user) return;
        console.log(`constructFeed() called...`);
        let currUser: mastodon.v1.Account;

        try {
            currUser = await api.v1.accounts.verifyCredentials();
        } catch (error) {
            console.warn(error);
            logout();
        }

        const algo = new TheAlgorithm(api, currUser);
        const feed: StatusType[] = await algo.getFeed();

        // Sometimes there are wonky statuses that are like years in the future so we filter them out.
        // TODO: move this to the fedialgo package.
        const cleanFeed = feed.filter((status) => Date.now() >= (new Date(status.createdAt)).getTime());
        const numRemoved = feed.length - cleanFeed.length;
        if (numRemoved > 0) console.log(`Removed ${numRemoved} feed items bc they were in the future`);

        setUserWeights(await algo.getWeights());
        setFeed(cleanFeed);
        setAlgorithm(algo);
    };

    const loadMore = () => {
        console.log(`records=${records}, feed.length=${feed.length}. loading ${NUM_POSTS_TO_LOAD_ON_SCROLL} more toots...`);
        setRecords(records + NUM_POSTS_TO_LOAD_ON_SCROLL);
    };

    //Adjust user Weights with slider values
    const weightAdjust = async (scores: ScoresType) => {
        const newWeights = await algorithm.weightAdjust(scores);
        console.log("new userWeights:");
        console.log(newWeights);
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
        console.log(`${feed.length} status elements in feed:`, feed);
        console.log(`ORDERED FEED (condensed): `, feed.map(condensedStatus));
    }

    // Strip out toots we don't want to show to the user for various reasons
    const filteredFeed = feed.filter((status: StatusType) => {
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

            {!loading && api && (feed.length > 1) &&
                filteredFeed.slice(0, Math.max(DEFAULT_NUM_POSTS, records)).map((toot: StatusType) => (
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

            {(feed.length == 0 || loading) && <FullPageIsLoading />}
            <div ref={bottomRef} onClick={loadMore}>Load More</div>
        </Container>
    )
};

export default Feed;
