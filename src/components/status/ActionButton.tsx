/*
 * Render an action button for a status (toot).
 * The action button can be a favourite, reblog, bookmark, reply, or score button.
 */
import React, { CSSProperties } from "react";

import { capitalCase } from "change-case";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, faBalanceScale, faBookmark, faReply, faRetweet, faStar } from "@fortawesome/free-solid-svg-icons";
import { mastodon } from 'masto';
import { Toot } from "fedialgo";

import { logMsg } from "../../helpers/string_helpers";
import { scoreString } from "../../helpers/string_helpers";

export enum ButtonAction {
    Bookmark = 'bookmark',
    Favourite = 'favourite',
    Reblog = 'reblog',
    Reply = 'reply',
    Score = 'score',
};

const ICON_BUTTON_CLASS = "status__action-bar__button icon-button"
const ACTION_ICON_BASE_CLASS = `${ICON_BUTTON_CLASS} icon-button--with-counter`;

type ActionInfo = {
    booleanName?: string,
    countName?: string,
    icon: IconDefinition,
};

const ACTION_INFO: Record<ButtonAction, ActionInfo> = {
    [ButtonAction.Bookmark]: {
        booleanName: `${ButtonAction.Bookmark}ed`,
        icon: faBookmark
    },
    [ButtonAction.Favourite]: {
        booleanName: `${ButtonAction.Favourite}d`,
        countName: `${ButtonAction.Favourite}sCount`,
        icon: faStar,
    },
    [ButtonAction.Reblog]: {
        booleanName: 'reblogged',
        countName: 'reblogsCount',
        icon: faRetweet,
    },
    [ButtonAction.Reply]: {
        countName: 'repliesCount',
        icon: faReply,
    },
    [ButtonAction.Score]: {
        icon: faBalanceScale,
    },
};

interface ActionButtonProps {
    action: ButtonAction,
    api: mastodon.rest.Client,
    onClick?: (e: React.MouseEvent) => void,
    setError: (error: string) => void,
    status: Toot,
};


export default function ActionButton(props: ActionButtonProps) {
    const { action, api, onClick, setError, status } = props;
    const actionInfo = ACTION_INFO[action];
    const label = action == ButtonAction.Score ? "Show Score" : capitalCase(action)

    const [currentState, setCurrentState] = React.useState<boolean>(status[actionInfo.booleanName]);
    let className = ACTION_ICON_BASE_CLASS;
    let buttonText;

    if (actionInfo.countName) {
        buttonText = status[actionInfo.countName];
    } else if (action == ButtonAction.Score) {
        buttonText = scoreString(status.scoreInfo?.score);
    }

    // If the action is a boolean (fave, reblog, bookmark) set the className active/inactive
    if (actionInfo.booleanName) {
        className += currentState ? " active activate" : " deactivate";
    }
    // else if (action == ButtonAction.Score) {
    //     className = ICON_BUTTON_CLASS;  // TODO: is this necessary?
    // }

    // Returns a function that's called when state changes for faves, bookmarks, retoots
    const performAction = (actionName: ButtonAction, actionInfo: ActionInfo) => {
        return () => {
            const startingCount = status[actionInfo.countName] == true ? 1 : (status[actionInfo.countName] || 0);
            const startingState = !!status[actionInfo.booleanName];
            const newState = !startingState;

            // Optimistically update the GUI (we will reset to original state if the server call fails later)
            logMsg(`${actionName}() toot (startingState: ${startingState}, count: ${startingCount}): `, status);
            status[actionInfo.booleanName] = newState;
            setCurrentState(newState);

            if (newState && actionInfo.countName && actionName != ButtonAction.Reply) {
                status[actionInfo.countName] = startingCount + 1;
            } else {
                status[actionInfo.countName] = startingCount ? (startingCount - 1) : 0;  // Avoid count going below 0
            }

            (async () => {
                try {
                    const status_ = await status.resolve();
                    const id = status_.id;

                    if (actionName == ButtonAction.Bookmark) {
                        if (newState) {
                            await api.v1.statuses.$select(id).bookmark();
                        } else {
                            await api.v1.statuses.$select(id).unbookmark();
                        }
                    } else if (actionName == ButtonAction.Favourite) {
                        if (newState) {
                            await api.v1.statuses.$select(id).favourite();
                        } else {
                            await api.v1.statuses.$select(id).unfavourite();
                        }
                    } else if (actionName == ButtonAction.Reblog) {
                        if (newState) {
                            await api.v1.statuses.$select(id).reblog();
                        } else {
                            await api.v1.statuses.$select(id).unreblog();
                        }
                    } else {
                        throw new Error(`Unknown actionName: ${actionName}`);
                    }

                    logMsg(`Successfully changed ${actionName} bool to ${newState}`);
                } catch (error) {
                    const msg = `Failed to ${actionName} toot! (${error.message})`;
                    console.error(`${msg} Resetting count to ${status[actionInfo.countName]}`, error);
                    setCurrentState(startingState);
                    status[actionInfo.booleanName] = startingState;
                    if (actionInfo.countName) status[actionInfo.countName] = startingCount;
                    setError(msg);
                }
            })();
        };
    };

    return (
        <button
            aria-hidden="false"
            aria-label={label}
            className={className}
            onClick={onClick || performAction(action, actionInfo)}
            style={buttonStyle}
            title={label}
            type="button"
        >
            <FontAwesomeIcon aria-hidden="true" className="fa-fw" icon={actionInfo.icon} />

            {(buttonText || buttonText === 0) &&
                <span className="icon-button__counter">
                    <span className="animated-number">
                        <span style={{position: "static"}}>
                            <span>{buttonText}</span>
                        </span>
                    </span>
                </span>}
        </button>
    );
};


const buttonStyle: CSSProperties = {
    fontSize: "18px",
    height: "23.142857px",
    lineHeight: "18px",
    width: "auto",
};
