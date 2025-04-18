/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import TrendingSection from "./TrendingSection";

import { accordionBody } from "./FilterAccordionSection";
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
                        What's Trending (WIP)
                    </p>
                </Accordion.Header>

                <Accordion.Body onEnter={() => setOpen(true)} style={accordionBody}>
                    <Accordion key="trendstuff">
                        <TrendingSection
                            sectionName="Hashtags"
                            infoTxtMapper={infoTxt}
                            trendingObjs={algorithm.trendingTags}
                            linkTextMapper={(tag) => `#${(tag as TrendingTag).name}`}
                            linkUrlMapper={(tag) => algorithm.buildTagURL(tag as TrendingTag)}
                        />

                        <TrendingSection
                            sectionName="Links"
                            infoTxtMapper={infoTxt}
                            trendingObjs={algorithm.trendingLinks}
                            linkTextMapper={(link) => `${(link as TrendingLink).title}`}
                            linkUrlMapper={linkMapper}
                        />

                        <TrendingSection
                            sectionName="Toots"
                            infoTxtMapper={(t: Toot) => `${t.repliesCount} replies, ${t.reblogsCount} retoots`}
                            trendingObjs={algorithm.trendingToots}
                            linkTextMapper={(toot) => `${(toot as Toot).contentShortened()}`}
                            linkUrlMapper={(toot) => `${(toot as Toot).url}`}
                        />
                    </Accordion>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};
