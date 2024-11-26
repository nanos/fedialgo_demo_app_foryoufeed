/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React from 'react';
import { usePersistentState } from "react-persistent-state";

import Accordion from 'react-bootstrap/esm/Accordion';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/Row';
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

    const settingCheckbox = (settingName: string) => {
        return (
            <Form.Check
                checked={settings[settingName]}
                disabled={false}
                id={settingName}
                key={settingName}
                label={settingName}
                onChange={(e) => {
                    const newSettings = { ...settings };
                    newSettings[settingName] = e.target.checked;
                    updateSettings(newSettings);
                }}
                type="checkbox"
            />
        );
    };

    const languageCheckbox = (languageCode: string) => {
        const lang = languageCode || NO_LANGUAGE;

        return (
            <Form.Check
                checked={selectedLang.includes(languageCode)}
                disabled={false}
                id={lang}
                key={lang}
                label={lang}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newLang = [...selectedLang];

                    if (e.target.checked) {
                        newLang.push(languageCode);
                    } else {
                        newLang.splice(newLang.indexOf(languageCode), 1);
                    }

                    setSelectedLanguage(newLang);
                    setSelectedLanguages(newLang);
                }}
                type="checkbox"
            />
        );
    };

    const gridify = (list: Array<any>) => {
        if (!list || list.length === 0) return <></>;

        return (
            <Row>
                <Col>{oddNumbered(list)}</Col>
                {list.length > 1 && <Col>{evenNumbered(list)}</Col>}
            </Row>
        );
    };

    const settingCheckboxes = Object.keys(settings).sort().map((settingName) => settingCheckbox(settingName));
    const languageCheckboxes = languages.sort().map((lang) => languageCheckbox(lang));

    return (
        <Accordion>
            <Accordion.Item eventKey="0">
                <Accordion.Header>
                    <p style={{fontSize: 25, fontWeight: "bold"}}>
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

                        <Form.Label>
                            <b>If you turn off both toots from accounts you follow as well as trending toots you will see no toots.</b>
                        </Form.Label>

                        <Form.Group className="mb-1">
                            {settings && gridify(settingCheckboxes)}
                        </Form.Group>
                    </div>

                    <div style={roundedBox}>
                        <p style={headerFont}>Languages</p>

                        <Form.Group className="mb-1">
                            <Form.Label>
                                <b>Show only toots in these languages:</b>
                            </Form.Label>

                            {gridify(languageCheckboxes)}
                        </Form.Group>
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};

const evenNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 != 0);
const oddNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 == 0);

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
