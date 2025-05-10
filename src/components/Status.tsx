/*
 * Render a Status, also known as a Toot.
 */
import React, { CSSProperties } from "react";

import parse from 'html-react-parser';
// import Toast from 'react-bootstrap/Toast';
import { Account, Toot, timeString } from "fedialgo";
import { capitalCase } from "change-case";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';
import {
    IconDefinition,
    faBolt,
    faCheckCircle,
    faFireFlameCurved,
    faGlobe,
    faHashtag,
    faLink,
    faLock,
    faPencil,
    faReply,
    faRetweet,
} from "@fortawesome/free-solid-svg-icons";

import ActionButton, { ButtonAction } from "./status/ActionButton";
import AttachmentsModal from './status/AttachmentsModal';
import MultimediaNode from "./status/MultimediaNode";
import Poll from "./status/Poll";
import PreviewCard from "./status/PreviewCard";
import ScoreModal from './status/ScoreModal';
import { logMsg } from '../helpers/string_helpers';
import { openToot } from "../helpers/react_helpers";
import { PARTICIPATED_TAG_COLOR, PARTICIPATED_TAG_COLOR_FADED, RED } from "../helpers/style_helpers";
import { timestampString } from "../helpers/string_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

export const TOOLTIP_ACCOUNT_ANCHOR = "user-account-anchor";

interface StatusComponentProps {
    setError: (error: string) => void,
    status: Toot,
};


export default function StatusComponent(props: StatusComponentProps) {
    const { setError, status } = props;
    const { api } = useAlgorithm();

    // If it's a retoot set 'toot' to the original toot
    const toot = status.realToot();
    const hasAttachments = toot.mediaAttachments.length > 0;
    const isReblog = toot.reblogsBy.length > 0;
    const ariaLabel = `${toot.account.displayName}, ${toot.account.note} ${toot.account.webfingerURI}`;

    // idx of the mediaAttachment to show in the media inspection modal (-1 means no modal)
    const [mediaInspectionIdx, setMediaInspectionIdx] = React.useState<number>(-1);
    const [showScoreModal, setShowScoreModal] = React.useState<boolean>(false);

    // Increase mediaInspectionIdx on Right Arrow
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (mediaInspectionIdx === -1) return;
            let newIndex = mediaInspectionIdx;

            if (e.key === "ArrowRight") {
                newIndex += 1;
            } else if (e.key === "ArrowLeft") {
                newIndex -= 1;
                if (newIndex < 0) newIndex = toot.mediaAttachments.length - 1;
            }

            setMediaInspectionIdx(newIndex % toot.mediaAttachments.length);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mediaInspectionIdx])

    // Show the score of a toot
    const showScore = async () => {
        logMsg(`showScore() called for toot: `, status);
        setShowScoreModal(true);
    };

    const reblogger = (account: Account, i: number): React.ReactNode => (
        <a className="status__display-name muted" href={account.homserverURL()} key={i} target="_blank" rel="noreferrer">
            <bdi><strong>
                {parse(account.displayNameWithEmojis())}
            </strong></bdi>
        </a>
    );

    const buildIcon = (icon: IconDefinition, title?: string, color?: string): React.ReactElement => {
        if (icon.iconName == "hashtag") {
            if (toot.trendingTags?.length) {
                color = RED;
            } else if (toot.followedTags?.length) {
                color = "yellow";
            } else if (toot.participatedTags?.length) {
                color = PARTICIPATED_TAG_COLOR;
            }
        }

        return <FontAwesomeIcon
            icon={icon}
            style={color ? {...baseIconStyle, color: color} : baseIconStyle}
            title={title || capitalCase(icon.iconName)}
        />;
    };

    const buildActionButton = (action: ButtonAction, onClick?: (e: React.MouseEvent) => void) => {
        return (
            <ActionButton
                action={action}
                api={api}
                onClick={onClick}
                setError={setError}
                status={toot}
            />
        );
    };

    return (
        <div>
            {hasAttachments &&
                <AttachmentsModal
                    mediaInspectionIdx={mediaInspectionIdx}
                    setMediaInspectionIdx={setMediaInspectionIdx}
                    toot={toot}
                />}

            <ScoreModal showScoreModal={showScoreModal} setShowScoreModal={setShowScoreModal} toot={toot} />

            <div aria-label={ariaLabel} className="status__wrapper status__wrapper-public focusable">
                {/* Names of accounts that reblogged the toot (if any) */}
                {isReblog &&
                    <div className="status__prepend">
                        <div className="status__prepend-icon-wrapper">
                            <FontAwesomeIcon className="status__prepend-icon fa-fw" icon={faRetweet} />
                        </div>

                        <span>
                            {toot.reblogsBy.sort((a, b) => (a.displayName.toLowerCase() < b.displayName.toLowerCase()) ? -1 : 1).map((booster, i) => {
                                const rebloggerLink = reblogger(booster, i);
                                return i < (toot.reblogsBy.length - 1) ? [rebloggerLink, ', '] : rebloggerLink;
                            })} retooted
                        </span>
                    </div>}

                <div className="status" style={isReblog ? { paddingTop: "10px" } : {}}>
                    {/* Top bar with account and info icons */}
                    <div className="status__info">
                        {/* Top right icons + timestamp that link to the toot */}
                        <a className="status__relative-time" href={toot.uri} rel="noreferrer" target="_blank">
                            <span className="status__visibility-icon">
                                {toot.editedAt && buildIcon(faPencil, `Edited at ${toot.editedAt}`)}
                                {toot.inReplyToAccountId && buildIcon(faReply, "Reply", "blue")}
                                {toot.trendingRank > 0 && buildIcon(faFireFlameCurved, "Trending Toot", RED)}
                                {toot.trendingLinks.length > 0 && buildIcon(faLink, "Contains Trending Link", RED)}
                                {toot.containsUserMention() && buildIcon(faBolt, "You're Mentioned", "green")}
                                {toot.containsTagsMsg() && buildIcon(faHashtag, toot.containsTagsMsg())}

                                {toot.isDM()
                                    ? buildIcon(faLock, "Direct Message", "purple")
                                    : toot.account.isFollowed
                                        ? buildIcon(faGlobe, "You follow this account", "#2092a1") // )  //"#025c78")
                                        : buildIcon(faGlobe, "Not an account you follow")}
                            </span>

                            <time dateTime={toot.createdAt} title={toot.createdAt}>
                                {timestampString(toot.createdAt)}
                            </time>
                        </a>

                        {/* Account name + avatar */}
                        <div title={toot.account.webfingerURI} className="status__display-name">
                            <a
                                data-tooltip-id={TOOLTIP_ACCOUNT_ANCHOR}
                                data-tooltip-html={toot.account.noteWithAccountInfo()}
                            >
                                <div className="status__avatar">
                                    <div className="account__avatar" style={{ width: "46px", height: "46px" }}>
                                        <LazyLoadImage src={toot.account.avatar} alt={`${toot.account.webfingerURI}`} />
                                    </div>
                                </div>
                            </a>

                            <span className="display-name">
                                <bdi>
                                    <strong key="internalBDI" className="display-name__html">
                                        <a
                                            href={toot.account.homserverURL()}
                                            rel="noreferrer"
                                            style={accountLink}
                                            target="_blank"
                                        >
                                            {parse(toot.account.displayNameWithEmojis())}
                                        </a>

                                        {toot.account.fields.filter(f => f.verifiedAt).map((f, i) => (
                                            <span
                                                className="verified-badge"
                                                key={`${f.name}_${i}`}
                                                style={{ color: "lightblue", padding: "0px 5px" }}
                                                title={f.value.replace(/<[^>]*>?/gm, '')}
                                            >
                                                <FontAwesomeIcon aria-hidden="true" icon={faCheckCircle} />
                                            </span>
                                        ))}
                                    </strong>
                                </bdi>

                                <span key="acctdisplay" className="display-name__account">
                                    @{toot.account.webfingerURI}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Text of the toot */}
                    <div className="status__content" >
                        <div className="status__content__text status__content__text--visible translate" lang="en">
                            {parse(toot.contentWithEmojis())}
                        </div>
                    </div>

                    {/* Preview card and attachment display */}
                    {toot.card && !hasAttachments && <PreviewCard card={toot.card as mastodon.v1.PreviewCard} />}
                    {hasAttachments && <MultimediaNode setMediaInspectionIdx={setMediaInspectionIdx} status={toot}/>}
                    {toot.poll && <Poll poll={toot.poll} setError={setError} />}

                    {/* Actions (retoot, favorite, show score, etc) that appear in bottom panel of toot */}
                    <div className="status__action-bar">
                        {buildActionButton(ButtonAction.Reply, async (e: React.MouseEvent) => await openToot(toot, e))}
                        {buildActionButton(ButtonAction.Reblog)}
                        {buildActionButton(ButtonAction.Favourite)}
                        {buildActionButton(ButtonAction.Bookmark)}
                        {buildActionButton(ButtonAction.Score, showScore)}
                    </div>
                </div>
            </div>
        </div>
    );
};


const accountLink: CSSProperties = {
    color: "white",
    textDecoration: "none"
};

const baseIconStyle: CSSProperties = {
    marginRight: "3px",
};
