/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import TrendingSection from "./TrendingSection";

import { accordionBody } from "./FilterAccordionSection";
import { followUri, openToot } from "../helpers/react_helpers";
import { TheAlgorithm, Toot } from "fedialgo";
import { titleStyle } from "./WeightSetter";
import { TrendingLink, TrendingTag, TrendingWithHistory } from "fedialgo/dist/types";


export default function TrendingInfo({ algorithm }: { algorithm: TheAlgorithm }) {
    const [open, setOpen] = useState<boolean>(false);  // TODO: is this necessary?

    const linkMapper = (link: TrendingWithHistory) => `${(link as TrendingLink).url}`;
    const infoTxt = (obj: TrendingWithHistory) => `${obj.numToots} toots by ${obj.numAccounts} accounts`;

    return (
        <Accordion>
            <Accordion.Item eventKey="trendingInfoTags">
                <Accordion.Header>
                    <p style={titleStyle}>
                        What's Trending
                    </p>
                </Accordion.Header>

                <Accordion.Body onEnter={() => setOpen(true)} style={accordionBody}>
                    <Accordion key="trendstuff">
                        <TrendingSection
                            sectionName="Hashtags"
                            infoTxt={infoTxt}
                            linkText={(tag) => `#${(tag as TrendingTag).name}`}
                            linkUrl={(tag) => algorithm.buildTagURL(tag as TrendingTag)}
                            onClick={(tag, e) => followUri(algorithm.buildTagURL(tag as TrendingTag), e)}
                            trendingObjs={algorithm.trendingTags}
                        />

                        <TrendingSection
                            sectionName="Links"
                            infoTxt={infoTxt}
                            linkText={(link) => `${(link as TrendingLink).title}`}
                            linkUrl={linkMapper}
                            onClick={(link, e) => followUri(`${(link as TrendingLink).url}`, e)}
                            trendingObjs={algorithm.trendingLinks}
                        />

                        <TrendingSection
                            sectionName="Toots"
                            infoTxt={(t: Toot) => `${t.repliesCount} replies, ${t.reblogsCount} retoots`}
                            linkText={(toot) => `${(toot as Toot).contentShortened()}`}
                            linkUrl={linkMapper}
                            onClick={openToot}
                            trendingObjs={algorithm.trendingToots}
                        />
                    </Accordion>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};
