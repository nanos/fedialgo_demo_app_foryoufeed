/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { LazyLoadImage } from "react-lazy-load-image-component";
import {
    extractDomain,
    MediaCategory,
    Toot,
    TagWithUsageCounts,
    TrendingLink,
    TrendingObj,
    TrendingWithHistory,
} from "fedialgo";

import TrendingSection, { LINK_FONT_SIZE, infoTxtStyle } from "./TrendingSection";
import { IMAGE_BACKGROUND_COLOR, accordionBody, linkesque, titleStyle } from "../helpers/style_helpers";
import { followUri, openToot, openTrendingLink } from "../helpers/react_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

const DEFAULT_MAX_HASHTAGS_TO_SHOW = 100;
const MAX_TRENDING_LINK_LEN = 170;

const ATTACHMENT_PREFIXES: Record<MediaCategory, string> = {
    [MediaCategory.AUDIO]: "audio",
    [MediaCategory.IMAGE]: "pic",
    [MediaCategory.VIDEO]: "vid"
};


export default function TrendingInfo() {
    const { algorithm } = useAlgorithm();
    const [maxHashtagsToShow, setMaxHashtagsToShow] = useState(DEFAULT_MAX_HASHTAGS_TO_SHOW);

    const linkMapper = (obj: TrendingWithHistory) => `${obj.url}`;

    const linkInfoTxt = (obj: TrendingWithHistory) => {
        return `${obj.numToots?.toLocaleString()} toots by ${obj.numAccounts?.toLocaleString()} accounts`;
    };

    const linkText = (obj: TrendingObj): React.ReactElement => {
        const link = obj as TrendingLink;
        return prefixedHtml(link.title, extractDomain(link.url));
    };

    const tootInfoTxt = (toot: Toot) => {
        const msg = `${toot.repliesCount?.toLocaleString()} replies`;
        return `${msg}, ${toot.reblogsCount?.toLocaleString()} retoots`
    }

    const tootLinkText = (obj: TrendingObj): React.ReactElement => {
        const toot = obj as Toot;

        if (toot.attachmentType() == MediaCategory.IMAGE) {
            const image = toot.imageAttachments[0];
            return <>
                {prefixedHtml(toot.contentShortened(MAX_TRENDING_LINK_LEN), ATTACHMENT_PREFIXES[MediaCategory.IMAGE])}
                <span style={infoTxtStyle}>({tootInfoTxt(obj as Toot)})</span>
                <br />

                <div className="media-gallery" style={{width: "100%"}}>
                    <div className="media-gallery__item" style={{width: "100%"}}>
                        <LazyLoadImage
                            alt={toot.imageAttachments[0].description}
                            effect="blur"
                            src={image.previewUrl}
                            style={imageStyle}
                            wrapperProps={{style: {position: "static"}}}  // Required to center properly with blur
                        />
                    </div>
                </div>
            </>
        } else {
            return prefixedHtml(
                toot.contentShortened(MAX_TRENDING_LINK_LEN),
                ATTACHMENT_PREFIXES[toot.attachmentType()] || (toot.card?.url && 'link')
            );
        }
    };

    const prefixedHtml = (text: string, prefix?: string): React.ReactElement => {
        return (<>
            {prefix?.length ? <span style={monospace}>{`[${prefix}]`}</span> : ''}
            <span style={bold}>{prefix?.length ? ' ' : ''}{text}</span>
        </>);
    };

    const toggleAllPopularHashtags = () => {
        if (maxHashtagsToShow === DEFAULT_MAX_HASHTAGS_TO_SHOW) {
            setMaxHashtagsToShow(algorithm.userData.popularUserTags().length);
        } else {
            setMaxHashtagsToShow(DEFAULT_MAX_HASHTAGS_TO_SHOW);
        }
    }

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
                            name="Hashtags"
                            infoTxt={linkInfoTxt}
                            linkLabel={(tag: TagWithUsageCounts) => `#${tag.name}`}
                            linkUrl={linkMapper}
                            onClick={openTrendingLink}
                            trendingObjs={algorithm.trendingData.tags}
                        />

                        <TrendingSection
                            name="Links"
                            hasCustomStyle={true}
                            infoTxt={linkInfoTxt}
                            linkLabel={linkText}
                            linkUrl={linkMapper}
                            onClick={openTrendingLink}
                            trendingObjs={algorithm.trendingData.links}
                        />

                        <TrendingSection
                            name="Toots"
                            hasCustomStyle={true}
                            infoTxt={(t) => undefined}
                            linkLabel={tootLinkText}
                            linkUrl={linkMapper}
                            onClick={openToot}
                            trendingObjs={algorithm.trendingData.toots}
                        />

                        <TrendingSection
                            name="Servers That Were Scraped"
                            infoTxt={(domain: string) => {
                                const serverInfo = algorithm.mastodonServers[domain as string];
                                const info = [`MAU: ${serverInfo.MAU.toLocaleString()}`];
                                info.push(`followed pct of MAU: ${serverInfo.followedPctOfMAU.toFixed(3)}%`);
                                return info.join(', ');
                            }}
                            linkLabel={(domain: string) => domain as string}
                            linkUrl={(domain: string) => `https://${domain}`}
                            onClick={(domain: string, e) => followUri(`https://${domain}`, e)}
                            trendingObjs={Object.keys(algorithm.mastodonServers)}
                        />

                        <TrendingSection
                            name="Your Most Participated Hashtags"
                            footer={
                                <div style={{display: "flex", justifyContent: 'space-around', marginTop: "10px", width: "100%"}}>
                                    <div style={{width: "12%"}}>
                                        <a onClick={toggleAllPopularHashtags} style={footerLink}>
                                            {maxHashtagsToShow === DEFAULT_MAX_HASHTAGS_TO_SHOW ? "(Show All)" : "(Show Less)"}
                                        </a>
                                    </div>
                                </div>
                            }
                            infoTxt={(tag: TagWithUsageCounts) => `${tag.numToots?.toLocaleString()} of your recent toots`}
                            linkLabel={(tag: TagWithUsageCounts) => `#${tag.name}`}
                            linkUrl={(tag: TagWithUsageCounts) => tag.url}
                            onClick={openTrendingLink}
                            trendingObjs={algorithm.userData.popularUserTags().slice(0, maxHashtagsToShow)}
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

const footerLink: CSSProperties = {
    ...linkesque,
    fontSize: "16px",
    fontWeight: "bold",
};

const monospace: CSSProperties = {
    fontFamily: "monospace",
    fontSize: LINK_FONT_SIZE - 3,
};

const subheader: CSSProperties = {
    marginBottom: "7px",
};

const imageStyle: CSSProperties = {
    backgroundColor: IMAGE_BACKGROUND_COLOR,
    borderRadius: "15px",
    maxHeight: "200px",
    objectFit: "contain",
    objectPosition: "top",
    width: "70%",
};
