/*
 * React component to display preview cards for links.
 * https://docs.joinmastodon.org/entities/PreviewCard/
 */
import React, { CSSProperties } from 'react';

import parse from 'html-react-parser';
import { extractDomain } from 'fedialgo';
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';

const MAX_STATUS_CARD_LEN = 350;


export default function PreviewCard({ card }: { card: mastodon.v1.PreviewCard }) {
    return (
        <a
            className="status-card compact"
            href={card.url}
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
                    src={card.image}
                    style={cardImage}
                />
            </div>

            <div className='status-card__content'>
                {/* <span className='status-card__host'>
                    [{card.providerName}]
                </span> */}

                {parse(card.title)} [{card.providerName || extractDomain(card.url)}]

                <p className='status-card__description'>
                    {card.description.slice(0, MAX_STATUS_CARD_LEN)}
                </p>
            </div>
        </a>
    );
};


const cardImage: CSSProperties = {
    maxHeight: "40vh",
    objectPosition: "top",
};
