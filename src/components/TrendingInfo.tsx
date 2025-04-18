/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import TrendingSection from "./TrendingSection";

import { accordionBody } from "./FilterAccordionSection";
import { TheAlgorithm } from "fedialgo";
import { titleStyle } from "./WeightSetter";
import { TrendingLink, TrendingTag, TrendingWithHistory } from "fedialgo/dist/types";


export default function TrendingInfo({ algorithm }: { algorithm: TheAlgorithm }) {
    const [open, setOpen] = useState<boolean>(false);  // TODO: is this necessary?
    const linkMapper = (link: TrendingWithHistory) => `${(link as TrendingLink).url}`

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
                            trendingObjs={algorithm.trendingTags}
                            linkTextMapper={(tag) => `#${(tag as TrendingTag).name}`}
                            linkUrlMapper={(tag) => algorithm.buildTagURL(tag as TrendingTag)}
                        />

                        <TrendingSection
                            sectionName="Links"
                            trendingObjs={algorithm.trendingLinks}
                            linkTextMapper={(link: TrendingWithHistory) => `${(link as TrendingLink).title}`}
                            linkUrlMapper={linkMapper}
                        />
                    </Accordion>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};
