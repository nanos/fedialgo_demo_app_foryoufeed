import React from 'react';
import { Modal } from 'react-bootstrap';

import { Toot } from 'fedialgo';


export default function ScoreModal({
    showScoreModal,
    setShowScoreModal,
    toot
}: {
    showScoreModal: boolean,
    setShowScoreModal: (showScoreModal: boolean) => void,
    toot: Toot
}) {
    // console.debug(`ScoreModal for toot #${toot.id}: `, toot);

    return (
        <Modal show={showScoreModal} onHide={() => setShowScoreModal(false)} style={{ color: "black" }}>
            <Modal.Header closeButton>
                <Modal.Title>Score</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>Score: {toot.value}</p>

                <div>{
                    Object.keys(toot.scores).map(key => (
                        <p key={key}>{key}: {toot.scores[key]}</p>
                    ))
                }</div>
            </Modal.Body>
        </Modal>
    );
};
