/*
 * React component to display preview cards: https://docs.joinmastodon.org/entities/PreviewCard/
 */
import React, { CSSProperties } from 'react';

import parse from 'html-react-parser';
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
                    style={{ maxHeight: "45vh", objectPosition: "top" }}
                />
            </div>

            <div className='status-card__content'>
                {/* <span className='status-card__host'>
                    [{card.providerName}]
                </span> */}

                [{card.providerName}] {parse(card.title)}

                <p className='status-card__description'>
                    {card.description.slice(0, MAX_STATUS_CARD_LEN)}
                </p>
            </div>
        </a>
    );
}
