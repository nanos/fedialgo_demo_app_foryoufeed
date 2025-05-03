/*
 * Render a Status, also known as a Toot.
 */
import React, { CSSProperties } from "react";

import parse from 'html-react-parser';
// import Toast from 'react-bootstrap/Toast';
import { Account, Toot, timeString } from "fedialgo";
import { capitalCase } from "change-case";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';

import ActionButton, { ButtonAction } from "./status/ActionButton";
import AttachmentsModal from './status/AttachmentsModal';
import MultimediaNode from "./status/MultimediaNode";
import PreviewCard from "./status/PreviewCard";
import ScoreModal from './status/ScoreModal';
import { logMsg } from '../helpers/string_helpers';
import { openToot } from "../helpers/react_helpers";
import { User } from '../types';

interface StatusComponentProps {
    api: mastodon.rest.Client,
    setError: (error: string) => void,
    status: Toot,
    user: User,
};


export default function StatusComponent(props: StatusComponentProps) {
    const { api, setError } = props;
    // If it's a retoot set 'toot' to the original toot
    let toot = props.status.realToot();
    let retoot = toot.reblog ? props.status : null;
    const hasAttachments = toot.mediaAttachments.length > 0;
    const isReblog = toot.reblogsBy.length > 0;

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
        logMsg(`showScore() called for toot: `, toot, `\noriginalStatus:`, retoot);
        setShowScoreModal(true);
    };

    const reblogger = (account: Account, i: number): React.ReactNode => (
        <a className="status__display-name muted" href={account.homserverURL()} key={i} target="_blank" rel="noreferrer">
            <bdi><strong>
                {parse(account.displayNameWithEmojis())}
            </strong></bdi>
        </a>
    );

    const buildIcon = (iconName: string, title?: string, color?: string): React.ReactNode => {
        if (iconName == "hashtag") {
            color ||= toot.trendingTags?.length ? 'orange' : 'yellow';
        }

        return <i
            className={`fa fa-${iconName}`}
            style={color ? {...baseIconStyle, color: color} : baseIconStyle}
            title={title || capitalCase(iconName)}
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
            {hasAttachments && (
                <AttachmentsModal
                    mediaInspectionIdx={mediaInspectionIdx}
                    setMediaInspectionIdx={setMediaInspectionIdx}
                    toot={toot}
                />)}

            <ScoreModal showScoreModal={showScoreModal} setShowScoreModal={setShowScoreModal} toot={toot} />

            <div
                aria-label={`${toot.account.displayName}, ${toot.account.note} ${toot.account.webfingerURI}`}
                className="status__wrapper status__wrapper-public focusable"
            >
                {/* Names of accounts that reblogged the toot (if any) */}
                {isReblog &&
                    <div className="status__prepend">
                        <div className="status__prepend-icon-wrapper">
                            <i className="fa fa-retweet status__prepend-icon fa-fw" />
                        </div>

                        <span>
                            {toot.reblogsBy.map((booster, i) => {
                                const rebloggerLink = reblogger(booster, i);
                                return i < (toot.reblogsBy.length - 1) ? [rebloggerLink, ', '] : rebloggerLink;
                            })} boosted
                        </span>
                    </div>}

                <div className="status" style={isReblog ? { paddingTop: "10px" } : {}}>
                    {/* Top bar with account and info icons */}
                    <div className="status__info">
                        {/* Top right icons + timestamp that link to the toot */}
                        <a className="status__relative-time" href={toot.uri} rel="noreferrer" target="_blank">
                            <span className="status__visibility-icon">
                                {/* TODO: the pencil doesn't seem to show up */}
                                {toot.editedAt && buildIcon("pencil", `Edited at ${toot.editedAt}`)}
                                {toot.inReplyToAccountId && buildIcon("reply", "Reply", "blue")}
                                {toot.containsTagsMsg() && buildIcon("hashtag", toot.containsTagsMsg())}
                                {toot.trendingRank > 0 && buildIcon("fire", "Trending Toot", "red")}
                                {toot.trendingLinks.length > 0 && buildIcon("link", "Trending Link", "orange")}
                                {toot.containsUserMention() && buildIcon("bolt", "You're Mentioned", "green")}

                                {toot.isDM()
                                    ? buildIcon("lock", "Direct Message", "purple")
                                    : toot.isFollowed
                                        ? buildIcon("globe", "You follow this account")
                                        : buildIcon("globe", "Not an account you follow", "#025c78")}
                            </span>

                            <time dateTime={toot.createdAt} title={toot.createdAt}>
                                {timeString(toot.createdAt, navigator?.language || "en-US").replace("today", "Today")}
                            </time>
                        </a>

                        {/* Account name + avatar */}
                        <div title={toot.account.webfingerURI} className="status__display-name">
                            <div className="status__avatar">
                                <div className="account__avatar" style={{ width: "46px", height: "46px" }}>
                                    <LazyLoadImage src={toot.account.avatar} alt={`${toot.account.webfingerURI}`} />
                                </div>
                            </div>

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
                                                <i aria-hidden="true" className="fa fa-check-circle" />
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
    marginRight: "4px",
};
