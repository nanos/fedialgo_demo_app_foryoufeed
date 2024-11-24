/*
 * Modal that allows for inspection of tooted images etc upon clicking.
 */
import parse from 'html-react-parser';
import React from 'react';

import { Modal } from 'react-bootstrap';
import { Toot } from "fedialgo";


export default function AttachmentsModal(
    {
        mediaInspectionModalIdx,
        setMediaInspectionModalIdx,
        toot
    }: {
        mediaInspectionModalIdx: number,
        setMediaInspectionModalIdx: (mediaInspectionModalIdx: number) => void,
        toot: Toot
    }
) {
    return (
        <Modal show={mediaInspectionModalIdx != -1} onHide={() => setMediaInspectionModalIdx(-1)}>
            <Modal.Header closeButton>
                <Modal.Title>
                    {parse(toot.content)[100]}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {(mediaInspectionModalIdx != -1) &&
                    <div>
                        {
                            toot.mediaAttachments[mediaInspectionModalIdx]?.type === "image" &&
                                <img
                                    alt={toot.mediaAttachments[mediaInspectionModalIdx]?.description ?? ""}
                                    src={toot.mediaAttachments[mediaInspectionModalIdx]?.url}
                                    width={"100%"}
                                />
                        }

                        {toot.mediaAttachments[mediaInspectionModalIdx]?.type === "video" &&
                            <video width={"100%"} controls>
                                <source src={toot.mediaAttachments[mediaInspectionModalIdx]?.url} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        }
                    </div>
                }
            </Modal.Body>
        </Modal>
    );
};
