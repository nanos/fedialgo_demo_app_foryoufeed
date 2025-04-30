/*
 * Navigation helpers for React components.
 */

import { logMsg } from "./string_helpers";
import { Toot } from "fedialgo";


// Opens in new tab. For same tab do this:  window.location.href = statusURL;
export function followUri(uri: string, e: React.MouseEvent): boolean {
    e.preventDefault();
    window.open(uri, '_blank');
    return false;
};


// Open the Toot in a new tab, resolved to its URL on the user's home server
export async function openToot(toot: Toot, e: React.MouseEvent): Promise<boolean> {
    e.preventDefault();
    logMsg("openToot() called with:", toot);
    const resolvedURL = await toot.homeserverURL();
    return followUri(resolvedURL, e);
};
