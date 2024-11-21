/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import { mastodon, createRestAPIClient as loginMasto } from "masto";
import { Modal } from "react-bootstrap";
import { StatusType, settingsType, weightsType } from "../types";
import { useAuth } from "../hooks/useAuth";
import { usePersistentState } from "react-persistent-state";

import Container from "react-bootstrap/esm/Container";
import FindFollowers from "../components/FindFollowers";
import FullPageIsLoading from "../components/FullPageIsLoading";
import React, { useState, useEffect, useRef } from "react";
import StatusComponent from "../components/Status";
import TheAlgorithm from "fedialgo"
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/WeightSetter";

const DEFAULT_NUM_POSTS = 20;
const EARLIEST_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const RELOAD_IF_OLDER_THAN_MINUTES = 30;
const RELOAD_IF_OLDER_THAN_MS = RELOAD_IF_OLDER_THAN_MINUTES * 60 * 1000;


const Feed = () => {
    //Contruct Feed on Page Load
    const { user, logout } = useAuth();

    // State variables
    const [algoObj, setAlgo] = useState<TheAlgorithm>(null); //algorithm to use
    const [error, setError] = useState<string>("");
    const [filteredLanguages, setFilteredLanguages] = useState<string[]>(["en", "de"]); //languages to filter
    const [loading, setLoading] = useState<boolean>(true); //true if page is still loading
    const [weights, setWeights] = useState<weightsType>({}); //weights for each factor
    // Persistent state variables
    const [feed, setFeed] = usePersistentState<StatusType[]>([], user.id + "feed"); //feed to display
    const [records, setRecords] = usePersistentState<number>(DEFAULT_NUM_POSTS, user.id + "records"); //how many records to show
    const [scrollPos, setScrollPos] = usePersistentState<number>(0, user.id + "scroll"); //scroll position
    const [settings, setSettings] = usePersistentState<settingsType>({
        "reposts": true,
        "onlyLinks": false,
    }, "settings"); //settings for feed

    window.addEventListener("scroll", () => {
        if (window.scrollY % 10 == 0) setScrollPos(window.scrollY);
    })

    const api: mastodon.rest.Client = loginMasto({
        url: user.server,
        accessToken: user.access_token,
    });
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);

    // Load the posts in the feed either from mastodon server or from the cache
    useEffect(() => {
        const lastStatus = feed.reduce((prev, current) =>
            (prev.createdAt > current.createdAt) ? prev : current,
            { createdAt: EARLIEST_TIMESTAMP }
        );

        console.log("last status", lastStatus);

        // only reload feed if the newest status is older than RELOAD_IF_OLDER_THAN_MS
        if (lastStatus && (Date.now() - (new Date(lastStatus.createdAt)).getTime()) > RELOAD_IF_OLDER_THAN_MS) {
            setRecords(DEFAULT_NUM_POSTS);
            constructFeed();
            setLoading(false);
        } else {
            console.log("loaded from cache");
            restoreFeedCache();
            setLoading(false);
        }
    }, []);

    // Load more records when the user scrolls to bottom of the page
    useEffect(() => {
        if (isBottom) {
            console.log("bottom");
            loadMore();
        }
    }, [isBottom]);

    const restoreFeedCache = async () => {
        if (user) {
            let currUser: mastodon.v1.Account;

            try {
                currUser = await api.v1.accounts.verifyCredentials();
            } catch (error) {
                console.log(error);
                logout();
            }

            const algo = new TheAlgorithm(api, currUser);
            setWeights(await algo.getWeights());
            setAlgo(algo);
            window.scrollTo(0, scrollPos);
        }
    };

    const constructFeed = async () => {
        if (user) {
            let currUser: mastodon.v1.Account;

            try {
                currUser = await api.v1.accounts.verifyCredentials();
            } catch (error) {
                console.log(error);
                logout();
            }

            const algo = new TheAlgorithm(api, currUser);
            const feed: StatusType[] = await algo.getFeed();
            setWeights(await algo.getWeights());
            setFeed(feed);
            setAlgo(algo);
        }
    };

    const loadMore = () => {
        if (records < feed.length) {
            console.log("loading more toots...");
            console.log(records);
            setRecords(records + 10);
        }
    };

    //Adjust user Weights with slider values
    const weightAdjust = async (scores: weightsType) => {
        const newWeights = await algoObj.weightAdjust(scores);
        console.log(newWeights);
        setWeights(newWeights);
    };

    const updateWeights = async (newWeights: weightsType) => {
        setWeights(newWeights);
        if (algoObj) {
            const newFeed = await algoObj.setWeights(newWeights);
            setFeed(newFeed);
        }
    };

    const updateSettings = async (newSettings: settingsType) => {
        console.log(newSettings);
        setSettings(newSettings);
        setFeed([...feed]);
    };

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
                languages={feed.reduce((acc, item) => {
                    if (!acc.includes(item.language)) acc.push(item.language)
                    return acc
                }, [])}
                setSelectedLanguages={setFilteredLanguages}
                updateSettings={updateSettings}
            />

            <FindFollowers api={api} user={user} />

            {!loading && api && (feed.length > 1) && feed.filter((status: StatusType) => {
                let pass = true
                if (settings.onlyLinks) {
                    pass = !(status.card == null && status?.reblog?.card == null)
                }
                if (!settings.reposts) {
                    pass = pass && (status.reblog == null)
                }
                if (filteredLanguages.length > 0) {
                    pass = pass && (filteredLanguages.includes(status.language))
                }
                return pass
            }).slice(0, Math.max(20, records)).map((status: StatusType) => {
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
            {(feed.length < 1 || loading) &&
                <FullPageIsLoading />
            }
            <div ref={bottomRef} onClick={loadMore}>Load More</div>
        </Container>
    )
};

export default Feed;
