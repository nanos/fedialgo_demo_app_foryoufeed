/*
 * Render a Status, also known as a Toot.
 */
import parse from 'html-react-parser';
import React from 'react';
import Toast from 'react-bootstrap/Toast';

import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';
import { ScoresType, Toot } from "fedialgo";
import { imageAttachments, videoAttachments } from 'fedialgo/dist/helpers';

import "../birdUI.css";
import "../default.css";
import AttachmentsModal from './AttachmentsModal';
import ScoreModal from './ScoreModal';
import { timeString } from '../helpers/string_helpers';
import { User } from '../types';

const ICON_BUTTON_CLASS = "status__action-bar__button icon-button"
const ACTION_ICON_BASE_CLASS = `${ICON_BUTTON_CLASS} icon-button--with-counter`;
const IMAGES_HEIGHT = 314;
const VIDEO_HEIGHT = IMAGES_HEIGHT + 100;

interface StatusComponentProps {
    api: mastodon.rest.Client,
    setError: (error: string) => void,
    status: Toot,
    user: User,
    weightAdjust: (statusWeight: ScoresType) => void,
};


export default function StatusComponent(props: StatusComponentProps) {
    const masto = props.api;
    const weightAdjust = props.weightAdjust;
    let status: Toot = props.status;

    // If it's a retoot then set 'status' to be the thing that was retooted
    if (props.status.reblog) {
        status = props.status.reblog;
        status.reblogBy = props.status.account;
        status.scores = props.status.scores;
    }

    const [favourited, setFavourited] = React.useState<boolean>(status.favourited);
    const [reblogged, setReblogged] = React.useState<boolean>(status.reblogged);
    const [mediaInspectionModalIdx, setMediaInspectionModalIdx] = React.useState<number>(-1); //index of the media attachment to show
    const [showScoreModal, setShowScoreModal] = React.useState<boolean>(false);
    const [error, _setError] = React.useState<string>("");

    const images = imageAttachments(status);
    const videos = videoAttachments(status);
    let imageElement = <></>;

    // Make a status button (reply, reblog, fav, etc)
    const makeButton = (
        buttonText: number | string | null,
        className: string,
        label: string,
        onClick,
        italicType: string,
        italicText?: string,
    ) => {
        const italicClassName = `fa fa-${italicType} fa-fw`;
        let italicElement = <></>;
        let innerSpan = <></>;
        let style = buttonStyle;

        // TODO: This is a hack to expand the "i" icon by 2px
        if (italicText == 'i') {
            style = Object.assign({}, buttonStyle);
            style.width = '20px';
        }

        if (italicText) {
            italicElement = <i aria-hidden="true" className={italicClassName}>{italicText}</i>;
        } else {
            italicElement = <i aria-hidden="true" className={italicClassName}></i>;
        }

        if (buttonText || buttonText === 0) {
            innerSpan = (
                <span className="icon-button__counter">
                    <span className="animated-number">
                        <span style={{ position: "static" }}>
                            <span>{buttonText}</span>
                        </span>
                    </span>
                </span>
            )
        }

        return (
            <button
                aria-hidden="false"
                aria-label={label}
                className={className}
                onClick={onClick}
                style={style}
                title={label}
                type="button"
            >
                {italicElement}
                {innerSpan}
            </button>
        );
    };

    // If there's just one image try to show it full size.
    // If there's more than one image use the original image handler (for now).
    if (images.length == 1) {
        const image = images[0];
        let imgHeight = image.meta?.small?.height;
        let imgWidth = image.meta?.small?.width;

        imageElement = (
            <div className="media-gallery" style={{ height: `${imgHeight}px`, overflow: "hidden" }}>
                <div
                    className="media-gallery__item"
                    style={{
                        height: "100%",
                        inset: "auto",
                        width: 1 / status.mediaAttachments.length * 100 + "%"
                    }}
                >
                    <canvas
                        className="media-gallery__preview media-gallery__preview--hidden"
                        height="32"
                        width="32"
                    />

                    <LazyLoadImage
                        alt={image.description}
                        onClick={() => setMediaInspectionModalIdx(0)}
                        src={image.previewUrl}
                        sizes="559px"
                        style={{ objectPosition: "50%", width: "100%" }}
                    />
                </div>
            </div>
        );
    } else if (images.length > 1) {
        imageElement = (
            <div className="media-gallery" style={{ height: `${IMAGES_HEIGHT}px`, overflow: "hidden" }}>
                {status.mediaAttachments.filter(att => att.type === "image").map((att, i) => (
                    <div
                        className="media-gallery__item"
                        key={i}
                        style={{
                            height: "100%",
                            inset: "auto",
                            width: 1 / status.mediaAttachments.length * 100 + "%"
                        }}
                    >
                        <canvas
                            className="media-gallery__preview media-gallery__preview--hidden"
                            height="32"
                            width="32"
                        />

                        <LazyLoadImage
                            alt={att.description}
                            onClick={() => setMediaInspectionModalIdx(i)}
                            src={att.previewUrl}
                            sizes="559px"
                            style={{ objectPosition: "50%", width: "100%" }}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (!masto) throw new Error("No Mastodon API");

    // Increase mediaInspectionModalIdx on Right Arrow
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (mediaInspectionModalIdx === -1) return;

            if (e.key === "ArrowRight" && mediaInspectionModalIdx < status.mediaAttachments.length - 1) {
                setMediaInspectionModalIdx(mediaInspectionModalIdx + 1);
            } else if (e.key === "ArrowLeft" && mediaInspectionModalIdx > 0) {
                setMediaInspectionModalIdx(mediaInspectionModalIdx - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mediaInspectionModalIdx])


    const resolve = async (status: Toot): Promise<Toot> => {
        if (status.uri.includes(props.user.server)) {
            return status;
        } else {
            const res = await masto.v2.search.fetch({ q: status.uri, resolve: true });
            return res.statuses[0];
        }
    };

    // Retoot a post
    const reblog = async () => {
        const status_ = await resolve(status);
        reblogged ? console.log("skipping reblog()") : weightAdjust(status.scores);  // TODO: does learning weights really work?
        const id = status_.id;

        (async () => {
            if (reblogged) {
                await masto.v1.statuses.$select(id).unreblog();
            } else {
                await masto.v1.statuses.$select(id).reblog();
            }

            setReblogged(!reblogged);
        })();
    };

    // Favourite a post
    const fav = async () => {
        console.log(`fav() status.scores: `, status.scores);
        const status_ = await resolve(status);
        favourited ? console.log("skipping fav()") : weightAdjust(status.scores);  // TODO: does learning weights really work?
        const id = status_.id;

        (async () => {
            if (favourited) {
                await masto.v1.statuses.$select(id).unfavourite();
            } else {
                await masto.v1.statuses.$select(id).favourite();
            }

            setFavourited(!favourited);
        })();
    };

    const followUri = async (e) => {
        //Follow a link to another instance on the homeserver
        e.preventDefault()
        const status_ = await resolve(status);
        weightAdjust(status.scores);  // TODO: does learning weights really work?
        console.log(`followUri() status_: `, status_);
        //new tab:
        //window.open(props.user.server + "/@" + status_.account.acct + "/" + status_.id, '_blank');
        window.location.href = props.user.server + "/@" + status_.account.acct + "/" + status_.id
    };

    // Show the score of a toot
    const showScore = async () => {
        console.log(`showScore() called for toot: `, status);
        setShowScoreModal(true);
    };

    return (
        <div>
            {status.mediaAttachments.length > 0 && (
                <AttachmentsModal
                    mediaInspectionModalIdx={mediaInspectionModalIdx}
                    setMediaInspectionModalIdx={setMediaInspectionModalIdx}
                    toot={status}
                />)}

            <ScoreModal showScoreModal={showScoreModal} setShowScoreModal={setShowScoreModal} toot={status} />

            <Toast show={Boolean(error)} delay={3000} autohide>
                <Toast.Header>
                    <strong className="me-auto">Error</strong>
                </Toast.Header>

                <Toast.Body>{error}</Toast.Body>
            </Toast>

            <div
                className="status__wrapper status__wrapper-public focusable"
                aria-label={`${status.account.displayName}, ${status.account.note} ${status.account.acct}`}
            >
                {status.reblogBy &&
                    <div className="status__prepend">
                        <div className="status__prepend-icon-wrapper">
                            <i className="fa fa-retweet status__prepend-icon fa-fw" />
                        </div>

                        <span>
                            <a
                                className="status__display-name muted"
                                data-id="109357260772763021"
                                href={`${props.user.server}/@${status.reblogBy.acct}`}
                            >
                                <bdi><strong>{status.reblogBy.displayName}</strong></bdi>
                            </a> shared
                        </span>
                    </div>}

                <div className="status status-public" data-id="110208921130165916">
                    <div className="status__info">
                        <a
                            className="status__relative-time"
                            href={status.uri}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <span className="status__visibility-icon">
                                <i className="fa fa-globe" title="Public" style={{marginRight: '4px'}}/>

                                {status?.trendingRank &&
                                    <i
                                        className="fa fa-fire"
                                        style={{color: 'red', marginRight: '4px'}}
                                        title="Trending Toot"
                                    />}

                                {status?.recommended && <i className="fa fa-bolt" title="Recommended By AI"></i>}
                            </span>

                            <time dateTime={status.createdAt} title={status.createdAt}>
                                {timeString(status.createdAt)}
                            </time>
                        </a>

                        <div title={status.account.acct} className="status__display-name">
                            <div className="status__avatar">
                                <div className="account__avatar" style={{ width: "46px", height: "46px" }}>
                                    <LazyLoadImage src={status.account.avatar} alt="{status.account.acct}" />
                                </div>
                            </div>

                            <span className="display-name">
                                <bdi>
                                    <strong className="display-name__html">
                                        <a
                                            href={props.user.server + "/@" + status.account.acct}
                                            rel="noopener noreferrer"
                                            style={{ color: "white", textDecoration: "none" }}
                                            target="_blank"
                                        >
                                            {status.account.displayName}
                                        </a>

                                        {status.account.fields.filter(f => f.verifiedAt).map(f => (
                                            <span
                                                className="verified-badge"
                                                key={f.name}
                                                style={{ color: "lightblue", padding: "0px 5px" }}
                                                title={f.value.replace(/<[^>]*>?/gm, '')}
                                            >
                                                <i className="fa fa-check-circle" aria-hidden="true" />
                                            </span>
                                        ))}
                                    </strong>
                                </bdi>

                                <span className="display-name__account">@{status.account.acct}</span>
                            </span>
                        </div>
                    </div>

                    <div className="status__content status__content--with-action" >
                        <div className="status__content__text status__content__text--visible translate" lang="en">
                            {parse(status.content)}
                        </div>
                    </div>

                    {status.card && status.mediaAttachments.length == 0 && (
                        <a
                            className="status-card compact"
                            href={status.card.url}
                            onClick={() => weightAdjust(status.scores)}
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
                                    style={{ maxHeight: "35vh", objectPosition: "top" }}
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

                    {imageElement}

                    {videos.length > 0 && (
                        <div className="media-gallery" style={{ height: `${VIDEO_HEIGHT}px`, overflow: "hidden" }}>
                            <p>VIDEO</p>

                            {videos.map((att, i) => (
                                <div
                                    className="media-gallery__item"
                                    key={i}
                                    style={{ inset: "auto", width: "100%", height: "100%" }}
                                >
                                    <canvas
                                        className="media-gallery__preview media-gallery__preview--hidden"
                                        height="32"
                                        width="32"
                                    />

                                    {/* Currently at least shows the thumbnail */}
                                    <video width={"100%"} controls playsInline>
                                        <source src={videos[i]?.url} type="video/mp4" />
                                    </video>
                                </div>
                            ))}
                        </div>)}

                    <div className="status__action-bar">
                        {makeButton(status.repliesCount, ACTION_ICON_BASE_CLASS, "Reply", followUri, 'reply')}

                        {makeButton(
                            status.reblogsCount,
                            ACTION_ICON_BASE_CLASS + (reblogged ? " active activate" : " deactivate"),
                            "Retoot",
                            reblog,
                            'retweet'
                        )}

                        {makeButton(
                            status.favouritesCount,
                            ACTION_ICON_BASE_CLASS + (favourited ? " active activate" : " deactivate"),
                            "Favorite",
                            fav,
                            'star'
                        )}

                        {makeButton(null, ICON_BUTTON_CLASS, "Score", showScore, 'pie-chart', 'i')}
                        {makeButton(null, ICON_BUTTON_CLASS, "Open", followUri, 'link')}
                    </div>
                </div>
            </div>
        </div>
    );
};
{/*const makeButton = (
        buttonText: number | string | null,
        className: string,
        label: string,
        onClick,
        italicType: string,
        italicText?: string, */}


const buttonStyle = {
    fontSize: "18px",
    height: "23.142857px",
    lineHeight: "18px",
    width: "auto",
};
