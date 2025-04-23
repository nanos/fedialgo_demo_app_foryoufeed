/*
 * Modal that shows all the elements of a toot's final score.
 */
import React, { CSSProperties } from 'react';

import { Modal } from 'react-bootstrap';
import { Toot } from 'fedialgo';

import { globalFont } from '../helpers/style_helpers';

interface ScoreModalProps {
    setShowScoreModal: (showScoreModal: boolean) => void,
    showScoreModal: boolean,
    toot: Toot,
};


export default function ScoreModal(props: ScoreModalProps) {
    const { setShowScoreModal, showScoreModal, toot } = props;
    let computedScore: string;

    if (!toot.scoreInfo) {
        computedScore = "No score computed yet.";
        console.warn("No score computed yet for toot:", toot);
    } else {
        computedScore = `${toot.scoreInfo.score > 0.000001 ? toot.scoreInfo.score.toFixed(10) : toot.scoreInfo.score}`;
    }

    return (
        <Modal onHide={() => setShowScoreModal(false)} show={showScoreModal} style={{ color: "black" }}>
            <Modal.Header closeButton>
                <Modal.Title>This Toot's Score</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div style={{marginBottom: "10px"}}>
                    <p style={headerFont}>
                        Computed Score: <code>{computedScore}</code>
                    </p>

                    <p>Posted by {toot.describeAccount()}</p>
                </div>

                <div style={{height: "15px"}} />

                <p>
                    <code style={{whiteSpace: 'pre'}}>
                        {JSON.stringify(toot.scoreInfo, null, 4)}
                    </code>
                </p>
            </Modal.Body>
        </Modal>
    );
};


const headerFont: CSSProperties = {
    ...globalFont,
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "5px",
};
