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
    const [selectedLang, setSelectedLanguage] = usePersistentState<string[]>([], user.id + "selectedLangs");
    const scoringWeightNames = Object.keys(userWeights).filter(name => name != TIME_DECAY).sort();

    return (
        <Accordion>
            <Accordion.Item eventKey="0">
                <Accordion.Header>
                    <p style={{fontWeight: "bold", fontSize: 25}}>
                        Feed Algorithmus
                    </p>
                </Accordion.Header>

                <Accordion.Body>
                    {/* Time Decay slider */}
                    <WeightSlider
                        defaultValue={DEFAULT_TIME_DECAY}
                        description={TIME_DECAY_DESCRIPTION}
                        key={TIME_DECAY}
                        scoreName={TIME_DECAY}
                        updateWeights={updateWeights}
                        userWeights={userWeights}
                    />

                    <div style={{height: '5px'}} />

                    {/* Other feature weighting sliders */}
                    <div style={roundedBox}>
                        <p style={headerFont}>Weightings</p>

                        {userWeights && scoringWeightNames.map((scoreName) => (
                            <WeightSlider
                                description={algorithm.getDescription(scoreName)}
                                key={scoreName}
                                scoreName={scoreName}
                                updateWeights={updateWeights}
                                userWeights={userWeights}
                            />))}
                    </div>

                    <div style={roundedBox}>
                        <p style={headerFont}>Filters</p>

                        {settings && Object.keys(settings).map((key, index) => (
                            <Form.Group className="mb-1" key={index}>
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
                            </Form.Group>))}
                    </div>

                    <div style={roundedBox}>
                        <p style={headerFont}>Languages</p>

                        <Form.Group className="mb-1">
                            <Form.Label>
                                <b>Show only toots in these languages:</b>
                            </Form.Label>

                            {languages.map((lang, index) => (
                                <Form.Check
                                    checked={selectedLang.includes(lang)}
                                    disabled={false}
                                    id={lang}
                                    key={index}
                                    label={lang || NO_LANGUAGE}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const newLang = [...selectedLang];

                                        if (e.target.checked) {
                                            newLang.push(lang);
                                        } else {
                                            newLang.splice(newLang.indexOf(lang), 1);
                                        }

                                        setSelectedLanguage(newLang);
                                        setSelectedLanguages(newLang);
                                    }}
                                    type="checkbox"
                                />
                            ))}
                        </Form.Group>
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const headerFont = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "15px",
    textDecoration: "underline",
};


const roundedBox = {
    borderRadius: "25px",
    broderWidth: "1px",
    background: "lightgrey",
    marginBottom: "20px",
    padding: "20px",
};
