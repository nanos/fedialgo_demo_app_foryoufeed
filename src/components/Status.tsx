/*
 * Render a Status, also known as a Toot.
 */
import React, { CSSProperties } from "react";

import parse from 'html-react-parser';
import Toast from 'react-bootstrap/Toast';
import { Account, Toot } from "fedialgo";
import { capitalCase } from "change-case";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';

import ActionButton, { ButtonAction } from "./status/ActionButton";
import AttachmentsModal from './status/AttachmentsModal';
import MultimediaNode from "./status/MultimediaNode";
import PreviewCard from "./status/PreviewCard";
import ScoreModal from './status/ScoreModal';
import { openToot } from "../helpers/react_helpers";
import { timeString } from '../helpers/string_helpers';
import { User } from '../types';

interface StatusComponentProps {
    api: mastodon.rest.Client,
    setError: (error: string) => void,
    status: Toot,
    user: User,
};


export default function StatusComponent(props: StatusComponentProps) {
    const { api, setError } = props;
    let status: Toot = props.status;
    let reblogStatus: Toot | null = null;

    // If it's a retoot set 'status' to the original toot
    if (status.reblog) {
        status = status.reblog;
        reblogStatus = status;
    }

    const hasAttachments = status.mediaAttachments.length > 0;
    const browseToToot = async (e: React.MouseEvent) => await openToot(status, e);
    // idx of the mediaAttachment to show in the media inspection modal (-1 means no modal)
    const [mediaInspectionModalIdx, setMediaInspectionModalIdx] = React.useState<number>(-1);
    const [showScoreModal, setShowScoreModal] = React.useState<boolean>(false);

    // Increase mediaInspectionModalIdx on Right Arrow
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (mediaInspectionModalIdx === -1) return;
            let newIndex = mediaInspectionModalIdx;

            if (e.key === "ArrowRight") {
                newIndex += 1;
            } else if (e.key === "ArrowLeft") {
                newIndex -= 1;
                if (newIndex < 0) newIndex = status.mediaAttachments.length - 1;
            }

            setMediaInspectionModalIdx(newIndex % status.mediaAttachments.length);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mediaInspectionModalIdx])

    // Show the score of a toot
    const showScore = async () => {
        console.log(`showScore() called for toot: `, status, `\noriginalStatus:`, reblogStatus);
        setShowScoreModal(true);
    };

    const reblogger = (account: Account, i: number): React.ReactNode => (
        <a className="status__display-name muted" href={account.url} key={i}>
            <bdi><strong>
                {parse(account.displayNameWithEmojis())}
            </strong></bdi>
        </a>
    );

    const buildIcon = (iconName: string, title?: string, color?: string): React.ReactNode => {
        if (iconName == "hashtag") {
            color ||= status.trendingTags.length ? 'orange' : 'yellow';
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
                status={status}
            />
        );
    };

    return (
        <div>
            {hasAttachments && (
                <AttachmentsModal
                    mediaInspectionModalIdx={mediaInspectionModalIdx}
                    setMediaInspectionModalIdx={setMediaInspectionModalIdx}
                    toot={status}
                />)}

            <ScoreModal showScoreModal={showScoreModal} setShowScoreModal={setShowScoreModal} toot={status} />

            <div
                aria-label={`${status.account.displayName}, ${status.account.note} ${status.account.webfingerURI()}`}
                className="status__wrapper status__wrapper-public focusable"
            >
                {/* Names of accounts that reblogged the toot (if any) */}
                {status.reblogsBy.length > 0 &&
                    <div className="status__prepend">
                        <div className="status__prepend-icon-wrapper">
                            <i className="fa fa-retweet status__prepend-icon fa-fw" />
                        </div>

                        <span>
                            {status.reblogsBy.map((booster, i) => {
                                const rebloggerLink = reblogger(booster, i);
                                return i < (status.reblogsBy.length - 1) ? [rebloggerLink, ', '] : rebloggerLink;
                            })} boosted
                        </span>
                    </div>}

                <div className="status">
                    {/* Top bar with account and info icons */}
                    <div className="status__info">
                        {/* Top right icons + timestamp that link to the toot */}
                        <a className="status__relative-time" href={status.uri} rel="noreferrer" target="_blank">
                            <span className="status__visibility-icon">
                                {status.inReplyToAccountId && buildIcon("reply", "Reply", "blue")}
                                {status.containsTagsMsg() && buildIcon("hashtag", status.containsTagsMsg())}
                                {status.trendingRank > 0 && buildIcon("fire", "Trending Toot", "red")}
                                {status.trendingLinks.length > 0 && buildIcon("link", "Trending Link", "orange")}
                                {status.containsUserMention() && buildIcon("bolt", "You're Mentioned", "green")}

                                {status.isDM()
                                    ? buildIcon("lock", "Direct Message", "purple")
                                    : buildIcon("globe", "Public")}
                            </span>

                            <time dateTime={status.createdAt} title={status.createdAt}>
                                {timeString(status.createdAt)}
                            </time>
                        </a>

                        {/* Account name + avatar */}
                        <div title={status.account.webfingerURI()} className="status__display-name">
                            <div className="status__avatar">
                                <div className="account__avatar" style={{ width: "46px", height: "46px" }}>
                                    <LazyLoadImage src={status.account.avatar} alt={`${status.account.webfingerURI()}`} />
                                </div>
                            </div>

                            <span className="display-name">
                                <bdi>
                                    <strong key="internalBDI" className="display-name__html">
                                        <a
                                            href={status.account.homserverURL()}
                                            rel="noreferrer"
                                            style={accountLink}
                                            target="_blank"
                                        >
                                            {parse(status.account.displayNameWithEmojis())}
                                        </a>

                                        {status.account.fields.filter(f => f.verifiedAt).map((f, i) => (
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
                                    @{status.account.webfingerURI()}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Text of the toot */}
                    <div className="status__content status__content--with-action" >
                        <div className="status__content__text status__content__text--visible translate" lang="en">
                            {parse(status.contentWithEmojis())}
                        </div>
                    </div>

                    {/* Preview card image and text handling */}
                    {status.card && !hasAttachments && <PreviewCard card={status.card as mastodon.v1.PreviewCard} />}

                    {hasAttachments &&
                        <MultimediaNode
                            setMediaInspectionModalIdx={setMediaInspectionModalIdx}
                            status={status}
                        />}

                    {/* Actions (retoot, favorite, show score, etc) that appear in bottom panel of toot */}
                    <div className="status__action-bar">
                        {buildActionButton(ButtonAction.Reply, browseToToot)}
                        {buildActionButton(ButtonAction.Reblog)}
                        {buildActionButton(ButtonAction.Favourite)}
                        {buildActionButton(ButtonAction.Bookmark)}
                        {buildActionButton(ButtonAction.Reply, showScore)}
                    </div>
                </div>
            </div>
        </div>
    );
};


const baseIconStyle: CSSProperties = {
    marginRight: "4px",
};

const accountLink: CSSProperties = {
    color: "white",
    textDecoration: "none"
};
