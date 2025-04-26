/*
 * Modal that allows for inspection of tooted images etc upon clicking.
 */
import React from 'react';

import parse from 'html-react-parser';
import { MediaCategory, Toot, VIDEO_TYPES } from "fedialgo";
import { Modal } from 'react-bootstrap';

interface AttachmentsModalProps {
    mediaInspectionModalIdx: number;
    setMediaInspectionModalIdx: (mediaInspectionModalIdx: number) => void;
    toot: Toot;
};


export default function AttachmentsModal(props: AttachmentsModalProps) {
    const { mediaInspectionModalIdx, setMediaInspectionModalIdx, toot } = props;
    const shouldShowModal = mediaInspectionModalIdx >= 0;
    let element: JSX.Element = <></>;

    if (shouldShowModal) {
        const media = toot.mediaAttachments[mediaInspectionModalIdx];

        if (!media?.url) {
            console.warn(`[AttachmentsModal] Invalid media.url at idx ${mediaInspectionModalIdx}. toot:`, toot);
        } else if (media.type == MediaCategory.IMAGE) {
            element = (
                <img
                    alt={media.description ?? ""}
                    src={media.url}
                    width={"100%"}
                />
            );
        } else if (VIDEO_TYPES.includes(media.type)) {
            element = (
                <video width={"100%"} controls>
                    <source src={media.url} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        } else {
            console.warn(`[AttachmentsModal] Unknown type at toot.mediaAttachments[${mediaInspectionModalIdx}]`, toot);
        }
    }

    return (
        <Modal
            fullscreen={'xxl-down'}
            onHide={() => setMediaInspectionModalIdx(-1)}
            show={shouldShowModal}
            size={'lg'}
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    {parse(toot.content)[100]}         {/* TODO: WTF? */}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {shouldShowModal && <div>{element}</div>}
            </Modal.Body>
        </Modal>
    );
};
