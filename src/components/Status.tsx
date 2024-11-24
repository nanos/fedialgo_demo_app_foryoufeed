/*
 * Render a Status, also known as a Toot.
 */
import parse from 'html-react-parser';
import React from 'react';
import Toast from 'react-bootstrap/Toast';

import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';
import { ScoresType, Toot } from "fedialgo";

import "../birdUI.css";
import "../default.css";
import AttachmentsModal from './AttachmentsModal';
import ScoreModal from './ScoreModal';
import { User } from '../types';

const ICON_BUTTON_CLASS = "status__action-bar__button icon-button"
const ACTION_ICON_BASE_CLASS = `${ICON_BUTTON_CLASS} icon-button--with-counter`;

interface StatusComponentProps {
    status: Toot,
    api: mastodon.rest.Client,
    user: User,
    weightAdjust: (statusWeight: ScoresType) => void,
    setError: (error: string) => void,
};


export default function StatusComponent(props: StatusComponentProps) {
    const masto = props.api;
    const status = props.status.reblog ? props.status.reblog : props.status;
    const weightAdjust = props.weightAdjust;
    status.reblogBy = props.status.reblog ? props.status.account.displayName : props.status?.reblogBy;
    status.scores = props.status.scores;

    const [favourited, setFavourited] = React.useState<boolean>(status.favourited);
    const [reblogged, setReblogged] = React.useState<boolean>(status.reblogged);
    const [mediaInspectionModalIdx, setMediaInspectionModalIdx] = React.useState<number>(-1); //index of the media attachment to show
    const [showScoreModal, setShowScoreModal] = React.useState<boolean>(false);
    const [error, _setError] = React.useState<string>("");

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
        setShowScoreModal(true)
    };

    return (
        <div>
            {
                status.mediaAttachments.length > 0 && (
                    <AttachmentsModal
                        mediaInspectionModalIdx={mediaInspectionModalIdx}
                        setMediaInspectionModalIdx={setMediaInspectionModalIdx}
                        toot={status}
                    />
                )
            }

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
                            <a data-id="109357260772763021" href="/@mcnees@mastodon.social" className="status__display-name muted">
                                <bdi><strong>{status.reblogBy}</strong></bdi>
                            </a> shared
                        </span>
                    </div>}

                <div className="status status-public" data-id="110208921130165916">
                    <div className="status__info">
                        <a href={status.uri} className="status__relative-time" target="_blank" rel="noopener noreferrer">
                            <span className="status__visibility-icon">
                                <i className="fa fa-globe" title="Öffentlich" />
                                {status?.topPost && <i className="fa fa-fire" title="Top Post"></i>}
                                {status?.recommended && <i className="fa fa-bolt" title="Recommended By AI"></i>}
                            </span>

                            <time dateTime={status.createdAt} title={status.createdAt}>
                                {(new Date(status.createdAt)).toLocaleTimeString()}
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

                    {status.card && (
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
                                    style={{ maxHeight: "30vh" }}
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
                        </a>
                    )}

                    {!status.card &&
                        status.mediaAttachments.filter(att => att.type === "image").length > 0 && (
                            <div className="media-gallery" style={{ height: "314.4375px", overflow: "hidden" }}>
                                {status.mediaAttachments.filter(att => att.type === "image").map((att, i) => (
                                    <div
                                        className="media-gallery__item"
                                        key={i}
                                        style={{ inset: "auto", width: 1 / status.mediaAttachments.length * 100 + "%", height: "100%" }}
                                    >
                                        <canvas className="media-gallery__preview media-gallery__preview--hidden" width="32" height="32" />

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
                        )
                    }

                    {status.mediaAttachments.filter(att => att.type === "video").length > 0 && (
                        <div className="media-gallery" style={{ height: "314.4375px", overflow: "hidden" }}>
                            {status.mediaAttachments.filter(att => att.type === "video").map((att, i) => (
                                <div className="media-gallery__item" style={{ inset: "auto", width: "100%", height: "100%" }} key={i}>
                                    <canvas className="media-gallery__preview media-gallery__preview--hidden" width="32" height="32" />

                                    <LazyLoadImage
                                        alt={att.description}
                                        onClick={() => setMediaInspectionModalIdx(i)}
                                        scr={att.previewUrl}
                                        sizes="559px"
                                        style={{ objectPosition: "50%", width: "100%" }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="status__action-bar">
                        <button
                            aria-hidden="false"
                            aria-label="Antworten"
                            className={ACTION_ICON_BASE_CLASS}
                            onClick={followUri}
                            style={{ fontSize: "18px", width: "auto", height: "23.142857px", lineHeight: "18px" }}
                            type="button"
                            title="Antworten"
                        >
                            <i className="fa fa-reply fa-fw" aria-hidden="true" />

                            <span className="icon-button__counter">
                                <span className="animated-number">
                                    <span style={{ position: "static" }}> {status.repliesCount}</span>
                                </span>
                            </span>
                        </button>

                        <button
                            aria-hidden="false"
                            aria-label="Teilen"
                            className={(ACTION_ICON_BASE_CLASS + (reblogged ? " active activate" : " deactivate"))}
                            onClick={reblog}
                            type="button" title="Teilen"
                            style={{ fontSize: "18px", width: "auto", height: "23.142857px", lineHeight: "18px" }}
                        >
                            <i className="fa fa-retweet fa-fw" aria-hidden="true" />

                            <span className="icon-button__counter">
                                <span className="animated-number">
                                    <span style={{ position: "static" }}>
                                        <span>{status.reblogsCount}</span>
                                    </span>
                                </span>
                            </span>
                        </button>

                        <button
                            aria-hidden="false"
                            aria-label="Favorisieren"
                            className={(ACTION_ICON_BASE_CLASS + (favourited ? " active activate" : " deactivate"))}
                            onClick={fav}
                            style={{ fontSize: "18px", width: "auto", height: "23.142857px", lineHeight: "18px" }}
                            type="button"
                            title="Favorisieren"
                        >
                            <i className="fa fa-star fa-fw" aria-hidden="true" />

                            <span className="icon-button__counter">
                                <span className="animated-number">
                                    <span style={{ position: "static" }}>
                                        <span>{status.favouritesCount}</span>
                                    </span>
                                </span>
                            </span>
                        </button>

                        <button
                            aria-hidden="false"
                            aria-label="Score"
                            className={ICON_BUTTON_CLASS}
                            onClick={showScore}
                            style={{ fontSize: "18px", width: "20px", height: "23.142857px", lineHeight: "18px" }}
                            title="Score"
                            type="button"
                        >
                            <i className="fa fa-pie-chart fa-fw" title="Info">
                                i
                            </i>
                        </button>

                        <button
                            aria-hidden="false"
                            aria-label="Auf eigenem Server öffnen"
                            onClick={followUri}
                            type="button" title="Open on your instance"
                            className={ICON_BUTTON_CLASS}
                            style={{ fontSize: "18px", width: "auto", height: "23.142857px", lineHeight: "18px" }}
                        >
                            <i className="fa fa-link fa-fw" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
