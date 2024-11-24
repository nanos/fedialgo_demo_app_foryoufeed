/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React from 'react';
import { usePersistentState } from "react-persistent-state";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import WeightSlider from './WeightSlider';
import { DEFAULT_TIME_DECAY, TIME_DECAY, ScoresType, TheAlgorithm } from "fedialgo";

import { settingsType } from "../types";
import { useAuth } from '../hooks/useAuth';

const NO_LANGUAGE = '[not specified]';
const TIME_DECAY_DESCRIPTION = "Higher values means toots are demoted sooner";

interface WeightSetterProps {
    algorithm: TheAlgorithm,
    languages: string[],
    setSelectedLanguages: (languages: string[]) => void,
    settings: settingsType,
    updateSettings: (settings: settingsType) => void,
    updateWeights: (weights: ScoresType) => void,
    userWeights: ScoresType,
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
                    {userWeights && scoringWeightNames.map((scoreName, index) => {
                        return (
                            <WeightSlider
                                description={algorithm.getDescription(scoreName)}
                                key={scoreName}
                                scoreName={scoreName}
                                updateWeights={updateWeights}
                                userWeights={userWeights}
                            />
                        );
                    })}

                    {/* Time Decay slider */}
                    <WeightSlider
                        defaultValue={DEFAULT_TIME_DECAY}
                        description={TIME_DECAY_DESCRIPTION}
                        key={TIME_DECAY}
                        scoreName={TIME_DECAY}
                        updateWeights={updateWeights}
                        userWeights={userWeights}
                    />

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
