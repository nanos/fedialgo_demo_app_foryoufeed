import React, { CSSProperties} from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { GIFV, Toot } from "fedialgo";
import { mastodon } from 'masto';

import "../birdUI.css";
import "../default.css";

const IMAGES_HEIGHT = 314;
const VIDEO_HEIGHT = IMAGES_HEIGHT * 2;

interface MultimediaNodeProps {
    status: Toot;
    setMediaInspectionModalIdx: (idx: number) => void;
}


export default function MultimediaNode(props: MultimediaNodeProps): React.ReactElement {
    const { status, setMediaInspectionModalIdx } = props;
    const images = status.imageAttachments();
    const style = {overflow: "hidden"};
    let imageHeight = IMAGES_HEIGHT;

    // If there's one image try to show it full size; If there's more than one use old image handler.
    if (images.length == 1 ) {
        imageHeight = images[0].meta?.small?.height || IMAGES_HEIGHT;
    } else {
        imageHeight = Math.min(IMAGES_HEIGHT, ...images.map(i => i.meta?.small?.height || IMAGES_HEIGHT));
    }

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
                    style={imageStyle}
                />
            </div>
        );
    };

    if (status.audioAttachments().length > 0) {
        return (
            <div className="media-gallery" style={{ height: `${imageHeight / 4}px`, ...style }}>
                <audio controls style={{ width: "100%" }}>
                    <source src={status.audioAttachments()[0].remoteUrl} type="audio/mpeg" />
                </audio>
            </div>
        );
    } else if (status.imageAttachments().length > 0) {
        return (
            <div className="media-gallery" style={{ height: `${imageHeight}px`, ...style }}>
                {status.imageAttachments().map((image, i) => makeImage(image, i))}
            </div>
        );
    } else if (status.videoAttachments().length > 0) {
        return (
            <div className="media-gallery" style={{ height: `${VIDEO_HEIGHT}px`, ...style }}>
                {status.videoAttachments().map((video, i) => {
                    const sourceTag = <source src={video?.url} type="video/mp4" />;
                    let videoTag: React.ReactElement;

                    // GIFs play in a loop
                    if (video.type == GIFV) {
                        videoTag = (
                            <video autoPlay height={"100%"} loop playsInline style={videoEmbedStyle}>
                                {sourceTag}
                            </video>
                        );
                    } else {
                        videoTag = (
                            <video controls height={"100%"} playsInline style={videoEmbedStyle}>
                                {sourceTag}
                            </video>
                        );
                    }

                    return (
                        <div className="media-gallery__item" key={i} style={videoStyle}>
                            <canvas
                                className="media-gallery__preview media-gallery__preview--hidden"
                                height="32"
                                width="32"
                            />

                            {videoTag}
                        </div>
                    );
                })}
            </div>
        );
    } else {
        console.error(`Unknown media type for status: ${status.uri}`, status);
    }
};


const imageStyle: CSSProperties = {
    height: "100%",
    objectFit: "contain",
    objectPosition: "top",
    width: "100%",
};

const videoStyle: CSSProperties = {
    height: "100%",
    inset: "auto",
    width: "100%"
};

const videoEmbedStyle: CSSProperties = {
    display: "block",
    margin: "auto",
    marginLeft: "auto",
    marginRight: "auto",
};
