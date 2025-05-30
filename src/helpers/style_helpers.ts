/*
 * Reusable CSS.
 * CSS color keywords:https://www.w3.org/wiki/CSS/Properties/color/keywords
 */
import { CSSProperties } from "react";

export const CRYPTADAMUS_ICON_URL = "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/eecdc2393e75e8bf.jpg";
export const SHOWCASE_IMAGE_URL = "https://raw.githubusercontent.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed/refs/heads/master/public/assets/Showcase.png";
export const IMAGE_BACKGROUND_COLOR = "#C1C1C1";
export const RED = 'firebrick';
export const TOOLTIP_ANCHOR = "tooltip-anchor";

export const FEED_BACKGROUND_COLOR = '#15202b';
export const FOLLOWED_TAG_COLOR = 'yellow';
export const FOLLOWED_USER_COLOR = 'cyan';
export const FOLLOWED_USER_COLOR_FADED = "#2092a1";
export const PARTICIPATED_TAG_COLOR = "#92a14a";
// export const PARTICIPATED_TAG_COLOR_FADED = "#c3d46e";
export const PARTICIPATED_TAG_COLOR_MIN = "#d8deb9";
export const TRENDING_TAG_COLOR = RED;
export const TRENDING_TAG_COLOR_FADED = '#f08c8c';

export const RECHARTS_COLORS: CSSProperties["color"][] = [
    "red",
    "orange",
    // "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "brown",
    "grey",
    "fuchsia",
    "lime",
    "cyan",
    "bisque",
    // "navy",
    "orangered",
    "skyblue",
    "rosybrown",
    "olive",
    "mediumvioletred",
    "lightgoldenrodyellow",
    "gold",
    "crimson",
];

export const accordionBody: CSSProperties = {
    backgroundColor: '#b2bfd4',
};

export const accordionSubheader: CSSProperties = {
    // marginBottom: "7px",
    marginLeft: "7px",
    padding: "7px",
};

export const globalFont: CSSProperties = {
    color: "black",
    fontFamily: "Tahoma, Geneva, sans-serif",
};

export const headerFont: CSSProperties = {
    ...globalFont,
    fontSize: 15,
    fontWeight: 800,
    marginLeft: "15px",
    marginBottom: "0px",
    marginTop: "0px",
};

export const linkesque: CSSProperties = {
    cursor: "pointer",
    textDecoration: "underline",
};

export const noPadding: CSSProperties = {
    padding: "0px",
};

export const paddingBorder: CSSProperties = {
    padding: "2px",
};

export const roundedBox: CSSProperties = {
    borderRadius: "20px",
    background: "lightgrey",
    paddingLeft: "25px",
    paddingRight: "20px",
    paddingBottom: "13px",
    paddingTop: "20px",
};

export const titleStyle: CSSProperties = {
    ...globalFont,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: "5px",
    marginLeft: "5px",
    marginTop: "0px",
    textDecoration: "underline",
};

export const tooltipZIndex: CSSProperties = {
    zIndex: 2000,
};
