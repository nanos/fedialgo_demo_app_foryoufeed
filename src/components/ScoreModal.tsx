/*
 * Modal that shows all the elements of a toot's final score.
 */
import React from 'react';
import { Modal } from 'react-bootstrap';

import { describeAccount } from 'fedialgo/dist/helpers';
import { extractScoreInfo, Toot } from 'fedialgo';


export default function ScoreModal({
    setShowScoreModal,
    showScoreModal,
    toot
}: {
    setShowScoreModal: (showScoreModal: boolean) => void,
    showScoreModal: boolean,
    toot: Toot
}) {
    return (
        <Modal onHide={() => setShowScoreModal(false)} show={showScoreModal} style={{ color: "black" }}>
            <Modal.Header closeButton>
                <Modal.Title>This Toot's Score</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div style={{marginBottom: "10px"}}>
                    <p style={headerFont}>Computed Score: <code>{toot.value.toFixed(10)}</code></p>
                    <p>Posted by {describeAccount(toot)}</p>
                </div>

                <div style={{height: "15px"}} />

                <p>
                    <code style={{whiteSpace: 'pre'}}>
                        {JSON.stringify(extractScoreInfo(toot), null, 4)}
                    </code>
                </p>
            </Modal.Body>
        </Modal>
    );
};


const headerFont = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "5px",
};
