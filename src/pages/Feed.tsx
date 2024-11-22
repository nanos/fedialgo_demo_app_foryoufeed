/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import Container from "react-bootstrap/esm/Container";
import React, { useState, useEffect, useRef } from "react";
import { mastodon, createRestAPIClient as loginMasto } from "masto";
import { Modal } from "react-bootstrap";
import { usePersistentState } from "react-persistent-state";

import TheAlgorithm from "fedialgo";
import { condensedStatus } from 'fedialgo/dist/helpers'; // TODO: why do we need the dist/ dir?
import { StatusType, ScoresType } from 'fedialgo/dist/types';

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
    const [algoObj, setAlgo] = useState<TheAlgorithm>(null); //algorithm to use
    const [error, setError] = useState<string>("");
    const [filteredLanguages, setFilteredLanguages] = useState<string[]>([]); //languages to filter
    const [loading, setLoading] = useState<boolean>(true);  // true if page is still loading
    const [weights, setWeights] = useState<ScoresType>({});  // weights for each factor
    // Persistent state variables
    const [feed, setFeed] = usePersistentState<StatusType[]>([], user.id + "feed"); //feed to display
    const [records, setRecords] = usePersistentState<number>(DEFAULT_NUM_POSTS, user.id + "records"); //how many records to show
    const [scrollPos, setScrollPos] = usePersistentState<number>(0, user.id + "scroll"); //scroll position

    // TODO: changing this by clicking the checkbox in the GUI doesn't seem to work
    const [settings, setSettings] = usePersistentState<settingsType>(DEFAULT_SETTINGS, "settings"); //filter settings for feed

    window.addEventListener("scroll", () => {
        if (window.scrollY % 10 == 0) setScrollPos(window.scrollY);
    })

    const api: mastodon.rest.Client = loginMasto({url: user.server, accessToken: user.access_token});
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);

    // Load the posts in the feed either from mastodon server or from the cache
    useEffect(() => {
        const mostRecentStatus = feed.reduce((prev, current) =>
            (prev.createdAt > current.createdAt) ? prev : current,
            { createdAt: EARLIEST_TIMESTAMP }
        );

        console.log("most recent item in feed", mostRecentStatus);

        // only reload feed if the newest status is older than RELOAD_IF_OLDER_THAN_MS
        if (mostRecentStatus && (Date.now() - (new Date(mostRecentStatus.createdAt)).getTime()) > RELOAD_IF_OLDER_THAN_MS) {
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
    useEffect(() => {
        if (isBottom) {
            console.log("hit bottom of page; should load more toots...");
            loadMore();
        }
    }, [isBottom]);

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
        setWeights(await algo.getWeights());
        setAlgo(algo);
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

        setWeights(await algo.getWeights());
        setFeed(cleanFeed);
        setAlgo(algo);
    };

    const loadMore = () => {
        console.log(`records=${records}, feed.length=${feed.length}. loading ${NUM_POSTS_TO_LOAD_ON_SCROLL} more toots...`);
        setRecords(records + NUM_POSTS_TO_LOAD_ON_SCROLL);
    };

    //Adjust user Weights with slider values
    const weightAdjust = async (scores: ScoresType) => {
        const newWeights = await algoObj.weightAdjust(scores);
        console.log("new weights:");
        console.log(newWeights);
        setWeights(newWeights);
    };

    const updateWeights = async (newWeights: ScoresType) => {
        console.log(`updateWeights() called...`)
        setWeights(newWeights);

        if (algoObj) {
            const newFeed = await algoObj.weightTootsInFeed(newWeights);
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
        console.log(``);
        console.log(`CONDENSED FEED: `, feed.map(condensedStatus));
    }

    return (
        <Container style={{ maxWidth: "700px", height: "auto" }}>
            <Modal show={error !== ""} onHide={() => setError("")}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>
                <Modal.Body>{error}</Modal.Body>
            </Modal>

            <WeightSetter
                weights={weights}
                updateWeights={updateWeights}
                algoObj={algoObj}
                settings={settings}
                languages={feed.reduce((languagesInFeed, item) => {
                    if (!languagesInFeed.includes(item.language)) languagesInFeed.push(item.language);
                    return languagesInFeed;
                }, [])}
                setSelectedLanguages={setFilteredLanguages}
                updateSettings={updateSettings}
            />

            <FindFollowers api={api} user={user} />

            {!loading && api && (feed.length > 1) && feed.filter((status: StatusType) => {
                let pass = true;

                if (settings.onlyLinks && !(status.card || status.reblog?.card)) {
                    console.log(`Removing ${status.uri} from feed because it's not a link...`);
                    return false;
                }
                if (status.reblog && !settings.includeReposts) {
                    console.log(`Removing reblogged status ${status.uri} from feed...`);
                    return false;
                }
                if (filteredLanguages.length > 0 && !filteredLanguages.includes(status.language)) {
                    console.log(`Removing status ${status.uri} with invalid language ${status.language} (valid langs: ${JSON.stringify(filteredLanguages)}).`);
                    return false;
                }

                return pass;
            }).slice(0, Math.max(DEFAULT_NUM_POSTS, records)).map((status: StatusType) => {
                return (
                    <StatusComponent
                        status={status}
                        api={api}
                        user={user}
                        weightAdjust={weightAdjust}
                        key={status.uri}
                        setError={setError}
                    />
                )
            })}

            {(feed.length < 1 || loading) && <FullPageIsLoading />}
            <div ref={bottomRef} onClick={loadMore}>Load More</div>
        </Container>
    )
};

export default Feed;
