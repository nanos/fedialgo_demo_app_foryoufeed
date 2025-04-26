/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import {
    extractDomain,
    MediaCategory,
    TheAlgorithm,
    Toot,
    TrendingLink,
    TrendingObj,
    TrendingTag,
    TrendingWithHistory,
} from "fedialgo";

import TrendingSection, { LINK_FONT_SIZE } from "./TrendingSection";
import { accordionBody } from "./FilterAccordionSection";
import { followUri, openToot } from "../helpers/react_helpers";
import { titleStyle } from "../helpers/style_helpers";

const MAX_TRENDING_LINK_LEN = 170;

const ATTACHMENT_PREFIXES: Record<MediaCategory, string> = {
    [MediaCategory.AUDIO]: "audio",
    [MediaCategory.IMAGE]: "pic",
    [MediaCategory.VIDEO]: "vid"
};


export default function TrendingInfo({ algorithm }: { algorithm: TheAlgorithm }) {
    const linkMapper = (link: TrendingObj) => `${(link as TrendingLink).url}`;
    const infoTxt = (obj: TrendingWithHistory) => `${obj.numToots} toots by ${obj.numAccounts} accounts`;

    const tootLinkText = (obj: TrendingObj): React.ReactElement => {
        const toot = obj as Toot;

        return prefixedText(
            toot.contentShortened(MAX_TRENDING_LINK_LEN),
            ATTACHMENT_PREFIXES[toot.attachmentType()] || (toot.card?.url && 'link')
        );
    };

    const linkText = (obj: TrendingObj): React.ReactElement => {
        const link = obj as TrendingLink;
        return prefixedText(link.title, extractDomain(link.url));
    };

    const prefixedText = (text: string, prefix?: string): React.ReactElement => {
        return (<>
            {prefix?.length ? <span style={monospace}>{`[${prefix}]`}</span> : ''}
            <span style={bold}>{prefix?.length ? ' ' : ''}{text}</span>
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
                    <p style={subheader}>
                        Trending data was scraped from {Object.keys(algorithm.mastodonServers).length} Mastodon servers.
                    </p>

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

                        <TrendingSection
                            sectionName="Servers That Were Scraped"
                            infoTxt={(server) => {
                                const serverInfo = algorithm.mastodonServers[server as string];
                                const info = [`MAU: ${serverInfo.serverMAU.toLocaleString()}`];
                                info.push(`followed pct of MAU: ${serverInfo.followedPctOfMAU.toFixed(3)}%`);
                                return info.join(', ');
                            }}
                            linkText={(server) => server as string}
                            linkUrl={(server) => `https://${server}`}
                            onClick={(server, e) => followUri(`https://${server}`, e)}
                            trendingObjs={Object.keys(algorithm.mastodonServers)}
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

const subheader: CSSProperties = {
    marginBottom: "7px",
};
