/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React from 'react';
import { usePersistentState } from "react-persistent-state";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { ScoresType, TheAlgorithm } from "fedialgo";

import { settingsType } from "../types";
import { useAuth } from '../hooks/useAuth';


interface WeightSetterProps {
    userWeights: ScoresType,
    updateWeights: (weights: ScoresType) => void,
    settings: settingsType,
    updateSettings: (settings: settingsType) => void,
    languages: string[],
    setSelectedLanguages: (languages: string[]) => void,
    algorithm: TheAlgorithm
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

    return (
        <Accordion>
            <Accordion.Item eventKey="0">
                <Accordion.Header>Feed Algorithmus</Accordion.Header>
                <Accordion.Body>
                    {userWeights && Object.keys(userWeights).map((key, index) => {
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
                                    step={0.01}
                                    value={userWeights[key] ?? 1}
                                    onChange={(e) => {
                                        const newWeights = Object.assign({}, userWeights);
                                        newWeights[key] = Number(e.target.value);
                                        updateWeights(newWeights);
                                    }}
                                />
                            </Form.Group>
                        )
                    })}

                    {settings && Object.keys(settings).map((key, index) => {
                        return (
                            <Form.Group className="mb-3" key={index}>
                                <Form.Check
                                    type="checkbox"
                                    label={key}
                                    id={key}
                                    checked={settings[key]}
                                    disabled={false}
                                    onChange={(e) => {
                                        const newSettings = { ...settings };
                                        newSettings[key] = e.target.checked;
                                        updateSettings(newSettings);
                                    }}
                                />
                            </Form.Group>
                        );
                    })}

                    <Form.Group className="mb-3">
                        <Form.Label><b>
                            Show only toots in these languages
                        </b></Form.Label>

                        {languages.map((lang, index) => {
                            return (
                                <Form.Check
                                    checked={selectedLang.includes(lang)}
                                    disabled={false}
                                    id={lang}
                                    key={index}
                                    label={lang}
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
                            )
                        })}
                    </Form.Group>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};
