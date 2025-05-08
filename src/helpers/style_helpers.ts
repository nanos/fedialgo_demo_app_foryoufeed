/*
 * Reusable CSS.
 */
import { CSSProperties } from "react";

export const CRYPTADAMUS_ICON_URL = "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/eecdc2393e75e8bf.jpg";
export const PARTICIPATED_TAG_COLOR = "#92a14a";
export const PARTICIPATED_TAG_COLOR_FADED = "#c3d46e";


export const accordionBody: CSSProperties = {
    backgroundColor: '#b2bfd4',
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
}

export const roundedBox: CSSProperties = {
    borderRadius: "25px",
    background: "lightgrey",
    paddingLeft: "30px",
    paddingRight: "30px",
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
