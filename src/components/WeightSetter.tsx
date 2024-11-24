/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React from 'react';
import { usePersistentState } from "react-persistent-state";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { DEFAULT_TIME_DECAY, TIME_DECAY, ScoresType, TheAlgorithm } from "fedialgo";

import { settingsType } from "../types";
import { useAuth } from '../hooks/useAuth';

const NO_LANGUAGE = '[not specified]';

interface WeightSetterProps {
    userWeights: ScoresType,
    updateWeights: (weights: ScoresType) => void,
    settings: settingsType,
    updateSettings: (settings: settingsType) => void,
    languages: string[],
    setSelectedLanguages: (languages: string[]) => void,
    algorithm: TheAlgorithm,
};


export default function WeightSetter({
    algorithm,
    languages,
    setSelectedLanguages,
    settings,
    updateSettings,
    updateWeights,
    userWeights,
}: WeightSetterProps) {
    const { user } = useAuth();
    const [selectedLang, setLang] = usePersistentState<string[]>([], user.id + "selectedLangs");
    const scoringWeightNames = Object.keys(userWeights).filter(name => name != TIME_DECAY);

    return (
        <Accordion>
            <Accordion.Item eventKey="0">
                <Accordion.Header>Feed Algorithmus</Accordion.Header>
                <Accordion.Body>
                    {userWeights && scoringWeightNames.map((key, index) => {
                        return (
                            <Form.Group className="mb-3" key={index}>
                                <Form.Label>
                                    <b>{key + " - "}</b>
                                    {algorithm.getDescription(key) + ": " + (userWeights[key]?.toFixed(2) ?? "1")}
                                </Form.Label>

                                <Form.Range
                                    id={key}
                                    min={Math.min(...Object.values(userWeights).filter(x => !isNaN(x)) ?? [0]) - 1 * 1.2}
                                    max={Math.max(...Object.values(userWeights).filter(x => !isNaN(x)) ?? [0]) + 1 * 1.2}
                                    onChange={(e) => {
                                        const newWeights = Object.assign({}, userWeights);
                                        newWeights[key] = Number(e.target.value);
                                        updateWeights(newWeights);
                                    }}
                                    step={0.01}
                                    value={userWeights[key] ?? 1}
                                />
                            </Form.Group>
                        );
                    })}

                    {/* Time Decay slider */}
                    <Form.Group className="mb-3" key={'timeDecay'}>
                        <Form.Label>
                            <b>Time Decay Factor - </b>
                            {"Higher values means toots are demoted sooner: " + (userWeights[TIME_DECAY]?.toFixed(2) ?? `${DEFAULT_TIME_DECAY}`)}
                        </Form.Label>

                        <Form.Range
                            id={'timedecay'}
                            min={Math.min(...Object.values(userWeights).filter(x => !isNaN(x)) ?? [0]) - 1 * 1.2}
                            max={Math.max(...Object.values(userWeights).filter(x => !isNaN(x)) ?? [0]) + 1 * 1.2}
                            onChange={(e) => {
                                const newWeights = Object.assign({}, userWeights);
                                newWeights[TIME_DECAY] = Number(e.target.value);
                                updateWeights(newWeights);
                            }}
                            step={0.01}
                            value={userWeights[TIME_DECAY] ?? DEFAULT_TIME_DECAY}
                        />
                    </Form.Group>

                    {settings && Object.keys(settings).map((key, index) => {
                        return (
                            <Form.Group className="mb-3" key={index}>
                                <Form.Check
                                    checked={settings[key]}
                                    disabled={false}
                                    id={key}
                                    label={key}
                                    onChange={(e) => {
                                        const newSettings = { ...settings };
                                        newSettings[key] = e.target.checked;
                                        updateSettings(newSettings);
                                    }}
                                    type="checkbox"
                                />
                            </Form.Group>
                        );
                    })}

                    <Form.Group className="mb-3">
                        <Form.Label>
                            <b>Show only toots in these languages</b>
                        </Form.Label>

                        {languages.map((lang, index) => {
                            return (
                                <Form.Check
                                    checked={selectedLang.includes(lang)}
                                    disabled={false}
                                    id={lang}
                                    key={index}
                                    label={lang || NO_LANGUAGE}
                                    onChange={(e) => {
                                        const newLang = [...selectedLang];

                                        if (e.target.checked) {
                                            newLang.push(lang);
                                        } else {
                                            newLang.splice(newLang.indexOf(lang), 1);
                                        }

                                        setLang(newLang);
                                        setSelectedLanguages(newLang);
                                    }}
                                    type="checkbox"
                                />
                            );
                        })}
                    </Form.Group>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};
