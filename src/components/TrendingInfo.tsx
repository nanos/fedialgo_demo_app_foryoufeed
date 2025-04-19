/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import TrendingSection, { LINK_FONT_SIZE } from "./TrendingSection";

import { accordionBody } from "./FilterAccordionSection";
import { extractDomain } from "fedialgo/dist/helpers";
import { followUri, openToot } from "../helpers/react_helpers";
import { TheAlgorithm, Toot } from "fedialgo";
import { titleStyle } from "./WeightSetter";
import { TrendingLink, TrendingTag, TrendingWithHistory, TrendingObj } from "fedialgo/dist/types";
// import { prefix } from "@fortawesome/free-solid-svg-icons";  // TODO: remove this package?

const MAX_TRENDING_LINK_LEN = 130;


export default function TrendingInfo({ algorithm }: { algorithm: TheAlgorithm }) {
    const linkMapper = (link: TrendingObj) => `${(link as TrendingLink).url}`;
    const infoTxt = (obj: TrendingWithHistory) => `${obj.numToots} toots by ${obj.numAccounts} accounts`;

    const tootLinkText = (obj: TrendingObj): React.ReactElement => {
        const toot = obj as Toot;
        return prefixedText(toot.attachmentPrefix(), toot.contentShortened(MAX_TRENDING_LINK_LEN));
    };

    const linkText = (obj: TrendingObj): React.ReactElement => {
        const link = obj as TrendingLink;
        return prefixedText(extractDomain(link.url), link.title);
    };

    const prefixedText = (prefix: string, text: string): React.ReactElement => {
        return (<>
            {prefix.length ? <span style={monospace}>{`[${prefix}]`}</span> : ''}
            <span style={bold}>{prefix.length ? ' ' : ''}{text}</span>
        </>);
    };

    return (
        <Accordion>
            <Accordion.Item eventKey="trendingInfoTags">
                <Accordion.Header>
                    <p style={titleStyle}>
                        What's Trending
                    </p>
                </Accordion.Header>

                <Accordion.Body style={accordionBody}>
                    <Accordion>
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
                            hasCustomStyle={true}
                            infoTxt={infoTxt}
                            linkText={linkText}
                            linkUrl={linkMapper}
                            onClick={(link, e) => followUri(`${(link as TrendingLink).url}`, e)}
                            trendingObjs={algorithm.trendingLinks}
                        />

                        <TrendingSection
                            sectionName="Toots"
                            hasCustomStyle={true}
                            infoTxt={(t: Toot) => `${t.repliesCount} replies, ${t.reblogsCount} retoots`}
                            linkText={tootLinkText}
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


const bold: CSSProperties = {
    fontWeight: "bold",
};

const monospace: CSSProperties = {
    fontFamily: "monospace",
    fontSize: LINK_FONT_SIZE - 3,
};
