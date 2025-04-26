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

import AttachmentsModal from './AttachmentsModal';
import MultimediaNode from "./MultimediaNode";
import PreviewCard from "./PreviewCard";
import ScoreModal from './ScoreModal';
import { openToot } from "../helpers/react_helpers";
import { scoreString, timeString } from '../helpers/string_helpers';
import { User } from '../types';

const ICON_BUTTON_CLASS = "status__action-bar__button icon-button"
const ACTION_ICON_BASE_CLASS = `${ICON_BUTTON_CLASS} icon-button--with-counter`;
const FAVORITE = 'favourite';
const RETOOT = 'reblog';

const ACTION_NAMES = {
    [FAVORITE]: {
        booleanName: 'favourited',
        countName: 'favouritesCount',
    },
    [RETOOT]: {
        booleanName: 'reblogged',
        countName: 'reblogsCount',
    }
};

// FontAwesome icons for the action buttons
const ACTION_ICONS = {
    Favorite: 'star',
    Open: 'link',
    Reply: 'reply',
    Retoot: 'retweet',
    Score: 'balance-scale',
};

interface StatusComponentProps {
    api: mastodon.rest.Client,
    setError: (error: string) => void,
    status: Toot,
    user: User,
};


export default function StatusComponent(props: StatusComponentProps) {
    const homeServer = props.user.server;
    const masto = props.api;

    const status: Toot = props.status.reblog || props.status;  // If it's a retoot set 'status' to the original toot
    const originalStatus: Toot = props.status.reblog ? props.status : null;
    const hasAttachments = status.mediaAttachments.length > 0;
    const browseToToot = async (e: React.MouseEvent) => await openToot(status, e);

    // State variables
    const [error, _setError] = React.useState<string>("");
    const [favourited, setFavourited] = React.useState<boolean>(status.favourited);
    const [reblogged, setReblogged] = React.useState<boolean>(status.reblogged);
    const [mediaInspectionModalIdx, setMediaInspectionModalIdx] = React.useState<number>(-1); // idx of the mediaAttachment to show
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


    // Make a status button (reply, reblog, favourite, etc)
    const makeButton = (
        className: string,
        label: string,
        onClick: (e?: React.MouseEvent) => void,
        buttonText: number | string | null = null,
    ): React.ReactElement => {
        const fontAwesomeClassName = `fa fa-${ACTION_ICONS[label]} fa-fw`;
        let innerSpan = <></>;

        if (buttonText || buttonText === 0) {
            innerSpan = (
                <span className="icon-button__counter">
                    <span className="animated-number">
                        <span style={{ position: "static" }}>
                            <span>{buttonText}</span>
                        </span>
                    </span>
                </span>
            );
        }

        return (
            <button
                aria-hidden="false"
                aria-label={label}
                className={className}
                onClick={onClick}
                style={buttonStyle}
                title={label}
                type="button"
            >
                <i aria-hidden="true" className={fontAwesomeClassName} />
                {innerSpan}
            </button>
        );
    };

    // Returns a function that's called when state changes for faves and retoots
    const performAction = (actionName: string) => {
        return () => {
            const actionWords = ACTION_NAMES[actionName];
            const startingCount = status[actionWords.countName] || 0;
            const startingState = !!status[actionWords.booleanName];
            const newState = !startingState;
            const updateStateFxn = actionName == FAVORITE ? setFavourited : setReblogged;
            console.log(`${actionName}() toot (startingState: ${startingState}, count: ${startingCount}): `, status);

            // Optimistically update the GUI (we will reset to original state if the server call fails later)
            updateStateFxn(newState);
            status[actionWords.booleanName] = newState;

            if (newState) {
                status[actionWords.countName] = startingCount + 1;
            } else {
                status[actionWords.countName] = startingCount ? (startingCount - 1) : 0;  // Avoid count going below 0
            }

            (async () => {
                try {
                    const status_ = await status.resolve();
                    const id = status_.id;

                    if (actionName == FAVORITE) {
                        if (newState) {
                            await masto.v1.statuses.$select(id).favourite();
                        } else {
                            await masto.v1.statuses.$select(id).unfavourite();
                        }
                    } else if (actionName == RETOOT) {
                        if (newState) {
                            await masto.v1.statuses.$select(id).reblog();
                        } else {
                            await masto.v1.statuses.$select(id).unreblog();
                        }
                    } else {
                        throw new Error(`Unknown actionName: ${actionName}`);
                    }

                    console.log(`Successfully changed ${actionName} bool to ${newState}`);
                } catch (error) {
                    const msg = `Failed to ${actionName} toot!`;
                    console.error(`${msg} Resetting count to ${status[actionWords.countName]}`, error);
                    updateStateFxn(startingState);
                    status[actionWords.booleanName] = startingState;
                    status[actionWords.countName] = startingCount;
                    _setError(msg);
                }
            })();
        };
    };

    // Show the score of a toot
    const showScore = async () => {
        console.log(`showScore() called for toot: `, status, `\noriginalStatus:`, originalStatus);
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

    return (
        <div>
            {hasAttachments && (
                <AttachmentsModal
                    mediaInspectionModalIdx={mediaInspectionModalIdx}
                    setMediaInspectionModalIdx={setMediaInspectionModalIdx}
                    toot={status}
                />)}

            <ScoreModal showScoreModal={showScoreModal} setShowScoreModal={setShowScoreModal} toot={status} />

            <Toast autohide delay={3000} show={Boolean(error)}>
                <Toast.Header>
                    <strong className="me-auto">Error</strong>
                </Toast.Header>

                <Toast.Body>{error}</Toast.Body>
            </Toast>

            <div
                aria-label={`${status.account.displayName}, ${status.account.note} ${status.account.webfingerURI()}`}
                className="status__wrapper status__wrapper-public focusable"
            >
                {/* Name of account that reblogged the toot (if it exists) */}
                {status.reblogsBy.length > 0 &&
                    <div className="status__prepend">
                        <div className="status__prepend-icon-wrapper">
                            <i className="fa fa-retweet status__prepend-icon fa-fw" />
                        </div>

                        <span>
                            {status.reblogsBy.map((booster, i) => {
                                const result = reblogger(booster, i);

                                if (i < status.reblogsBy.length - 1) {
                                    return [result, ', '];
                                } else {
                                    return result;
                                }
                            })} boosted
                        </span>
                    </div>}

                <div className="status">
                    {/* Top right icons + timestamp that link to the toot */}
                    <div className="status__info">
                        <a
                            className="status__relative-time"
                            href={status.uri}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <span className="status__visibility-icon">
                                {status.isDM()
                                    ? buildIcon("lock", "Direct Message", "purple")
                                    : buildIcon("globe", "Public")}

                                {status.inReplyToAccountId && buildIcon("reply", "Reply", "blue")}
                                {status.containsTagsMsg() && buildIcon("hashtag", status.containsTagsMsg())}
                                {status.trendingRank > 0 && buildIcon("fire", "Trending Toot", "red")}
                                {status.trendingLinks.length > 0 && buildIcon("link", "Trending Link", "orange")}
                                {status.containsUserMention() && buildIcon("bolt", "You're Mentioned", "green")}
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
                                            rel="noopener noreferrer"
                                            style={{ color: "white", textDecoration: "none" }}
                                            target="_blank"
                                        >
                                            {parse(status.account.displayNameWithEmojis())}
                                        </a>

                                        {status.account.fields.filter(f => f.verifiedAt).map(f => (
                                            <span
                                                className="verified-badge"
                                                key={f.name}
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
                        {makeButton(ACTION_ICON_BASE_CLASS, "Reply", browseToToot, status.repliesCount)}

                        {makeButton(
                            ACTION_ICON_BASE_CLASS + (reblogged ? " active activate" : " deactivate"),
                            "Retoot",
                            performAction(RETOOT),
                            status.reblogsCount,
                        )}

                        {makeButton(
                            ACTION_ICON_BASE_CLASS + (favourited ? " active activate" : " deactivate"),
                            "Favorite",
                            performAction(FAVORITE),
                            status.favouritesCount,
                        )}

                        {makeButton(ICON_BUTTON_CLASS, "Score", showScore, scoreString(status?.scoreInfo?.score))}
                        {makeButton(ICON_BUTTON_CLASS, "Open", browseToToot)}
                    </div>
                </div>
            </div>
        </div>
    );
};


const baseIconStyle: CSSProperties = {
    marginRight: "4px",
};

const buttonStyle: CSSProperties = {
    fontSize: "18px",
    height: "23.142857px",
    lineHeight: "18px",
    width: "auto",
};
