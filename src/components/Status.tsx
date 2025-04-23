/*
 * Render a Status, also known as a Toot.
 */
import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";

// import * as emoji from 'node-emoji';
import parse from 'html-react-parser';
import Toast from 'react-bootstrap/Toast';
import { mastodon } from 'masto';
import { Toot, WeightName, accountNameWithEmojis } from "fedialgo";

import "../birdUI.css";
import "../default.css";
import AttachmentsModal from './AttachmentsModal';
import ScoreModal from './ScoreModal';
import { openToot } from "../helpers/react_helpers";
import { scoreString, timeString } from '../helpers/string_helpers';
import { User } from '../types';

const ICON_BUTTON_CLASS = "status__action-bar__button icon-button"
const ACTION_ICON_BASE_CLASS = `${ICON_BUTTON_CLASS} icon-button--with-counter`;
const IMAGES_HEIGHT = 314;
const VIDEO_HEIGHT = IMAGES_HEIGHT * 2;

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

const BUTTON_STYLE = {
    fontSize: "18px",
    height: "23.142857px",
    lineHeight: "18px",
    width: "auto",
};

// FontAwesome icons for the action buttons
const ACTION_ICONS = {
    Favorite: 'star',
    Open: 'link',
    Reply: 'reply',
    Retoot: 'retweet',
    Score: 'balance-scale',
};

const VIDEO_STYLE = {
    display: "block",
    margin: "auto",
    marginLeft: "auto",
    marginRight: "auto",
}


interface StatusComponentProps {
    api: mastodon.rest.Client,
    setError: (error: string) => void,
    status: Toot,
    user: User,
};


export default function StatusComponent(props: StatusComponentProps) {
    const localServer = props.user.server;
    const masto = props.api;

    const status: Toot = props.status.reblog || props.status;  // If it's a retoot set 'status' to the original toot
    const originalStatus: Toot = props.status.reblog ? props.status : null;
    const browseToToot = async (e: React.MouseEvent) => await openToot(status, e);

    // State variables
    const [error, _setError] = React.useState<string>("");
    const [favourited, setFavourited] = React.useState<boolean>(status.favourited);
    const [reblogged, setReblogged] = React.useState<boolean>(status.reblogged);
    const [mediaInspectionModalIdx, setMediaInspectionModalIdx] = React.useState<number>(-1); //index of the mediaAttachment to show
    const [showScoreModal, setShowScoreModal] = React.useState<boolean>(false);

    // TODO: I don't think we need a mastodon instance to display data? it's for retooting & favoriting
    if (!masto) throw new Error("No Mastodon API");
    const audios = status.audioAttachments();
    const images = status.imageAttachments();
    const videos = status.videoAttachments();
    const numTrendingTags = status.trendingTags?.length || 0;
    const hasTrendingTags = numTrendingTags > 0;
    let imageHeight: number;

    let trendingTagMsg = (`Contains ${hasTrendingTags ? 'Trending' : 'Followed'} Hashtag${numTrendingTags > 1 ? 's' : ''}` +
        (hasTrendingTags ? `: ${status.trendingTags.map(t => `#${t.name}`).join(', ')}` : ''))

    // If there's one image try to show it full size; If there's more than one use old image handler.
    if (images.length == 1 ) {
        imageHeight = images[0].meta?.small?.height || IMAGES_HEIGHT;
    } else {
        imageHeight = Math.min(IMAGES_HEIGHT, ...images.map(i => i.meta?.small?.height || IMAGES_HEIGHT));
    }

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


    // Make a status button (reply, reblog, fav, etc)
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
                style={BUTTON_STYLE}
                title={label}
                type="button"
            >
                <i aria-hidden="true" className={fontAwesomeClassName} />
                {innerSpan}
            </button>
        );
    };

    // Make an image element for display within a Toot.
    const makeImage = (image: mastodon.v1.MediaAttachment, idx: number): React.ReactElement => {
        return (
            <div
                className="media-gallery__item"
                key={image.previewUrl}
                style={{
                    height: "100%",
                    inset: "auto",
                    width: 1 / status.mediaAttachments.length * 100 + "%"
                }}
            >
                {/* TODO: what is this for? */}
                <canvas
                    className="media-gallery__preview media-gallery__preview--hidden"
                    height="32"
                    width="32"
                />

                <LazyLoadImage
                    alt={image.description}
                    onClick={() => setMediaInspectionModalIdx(idx)}
                    src={image.previewUrl}
                    style={{ objectPosition: "top", height: "100%", objectFit: "contain", width: "100%" }}
                />
            </div>
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

    const reblogger = (account: mastodon.v1.Account, i: number): React.ReactNode => (
        <a className="status__display-name muted" href={account.url} key={i}>
            <bdi><strong>
                {parse(accountNameWithEmojis(account))}
            </strong></bdi>
        </a>
    );


    return (
        <div>
            {status.mediaAttachments.length > 0 && (
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
                aria-label={`${status.account.displayName}, ${status.account.note} ${status.account.acct}`}
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
                                    ? <i className="fa fa-lock" title="Direct Message" style={{...iconStyle, color: "purple"}} />
                                    : <i className="fa fa-globe" title="Public" style={iconStyle} />}

                                {status.inReplyToAccountId &&
                                    <i
                                        className="fa fa-reply"
                                        style={{color: "blue", ...iconStyle}}
                                        title="Reply"
                                    />}

                                {(status.followedTags?.length || status.trendingTags?.length || 0) > 0 &&
                                    <i
                                        className="fa fa-hashtag"
                                        style={{color: hasTrendingTags ? 'orange' : 'yellow', ...iconStyle}}
                                        title={trendingTagMsg}
                                    />}

                                {status.trendingRank > 0 &&
                                    <i
                                        className="fa fa-fire"
                                        style={{color: 'red', ...iconStyle}}
                                        title="Trending Toot"
                                    />}

                                {(status.scoreInfo?.rawScores?.[WeightName.TRENDING_LINKS] || 0) > 0 &&
                                    <i
                                        className="fa fa-link"
                                        style={{color: 'orange', ...iconStyle}}
                                        title="Trending Link"
                                    />}

                                {/* {status.trendingTags?.length > 0 && <i className="fa fa-bolt" title="Trending Tag"></i>} */}
                            </span>

                            <time dateTime={status.createdAt} title={status.createdAt}>
                                {timeString(status.createdAt)}
                            </time>
                        </a>

                        {/* Account name + avatar */}
                        <div title={status.account.acct} className="status__display-name">
                            <div className="status__avatar">
                                <div className="account__avatar" style={{ width: "46px", height: "46px" }}>
                                    <LazyLoadImage src={status.account.avatar} alt={`${status.account.acct}`} />
                                </div>
                            </div>

                            <span className="display-name">
                                <bdi>
                                    <strong key="internalBDI" className="display-name__html">
                                        <a
                                            href={status.homserverAccountURL()}
                                            rel="noopener noreferrer"
                                            style={{ color: "white", textDecoration: "none" }}
                                            target="_blank"
                                        >
                                            {parse(accountNameWithEmojis(status.account))}
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

                                <span key="acctdisplay" className="display-name__account">@{status.account.acct}</span>
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
                    {status.card && status.mediaAttachments.length == 0 && (
                        <a
                            className="status-card compact"
                            href={status.card.url}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <div className="status-card__image">
                                <canvas
                                    className="status-card__image-preview status-card__image-preview--hidden"
                                    height="32"
                                    width="32"
                                />

                                <LazyLoadImage
                                    alt=""
                                    className="status-card__image-image"
                                    src={status.card.image}
                                    style={{ maxHeight: "45vh", objectPosition: "top" }}
                                />
                            </div>

                            <div className='status-card__content'>
                                <span className='status-card__host'>
                                    {status.card.providerName}
                                </span>

                                {status.card.title}

                                <p className='status-card__description'>
                                    {status.card.description.slice(0, 200)}
                                </p>
                            </div>
                        </a>)}

                    {audios.length > 0 &&
                        <div className="media-gallery" style={{ height: `${imageHeight / 4}px`, overflow: "hidden" }}>
                            <audio controls style={{ width: "100%" }}>
                                <source src={audios[0].remoteUrl} type="audio/mpeg" />
                            </audio>
                        </div>}

                    {images.length > 0 &&
                        <div className="media-gallery" style={{ height: `${imageHeight}px`, overflow: "hidden" }}>
                            {images.map((image, i) => makeImage(image, i))}
                        </div>}

                    {videos.length > 0 && (
                        <div className="media-gallery" style={{ height: `${VIDEO_HEIGHT}px`, overflow: "hidden" }}>
                            {videos.map((video, i) => {
                                const sourceTag = <source src={video?.url} type="video/mp4" />;
                                let videoTag = <></>;

                                if (video.type == 'gifv') {
                                    videoTag = (
                                        <video autoPlay height={"100%"} loop playsInline style={VIDEO_STYLE}>
                                            {sourceTag}
                                        </video>
                                    );
                                } else {
                                    videoTag = (
                                        <video controls height={"100%"} playsInline style={VIDEO_STYLE}>
                                            {sourceTag}
                                        </video>
                                    );
                                }

                                return (
                                    <div
                                        className="media-gallery__item"
                                        key={i}
                                        style={{ height: "100%", inset: "auto", width: "100%" }}
                                    >
                                        <canvas
                                            className="media-gallery__preview media-gallery__preview--hidden"
                                            height="32"
                                            width="32"
                                        />

                                        {videoTag}
                                    </div>
                                );
                            })}
                        </div>)}

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


const iconStyle = {
    marginRight: "4px",
};
