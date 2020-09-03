import _Linkify from "linkifyjs/react";
import { Fragment } from "react";

const options = {
  target: {
    url: "_blank",
  },
  attributes: {
    rel: "noopener",
  },
  className: "",
  format(value, type) {
    if (type === "url" && value.length > 48) {
      value = value.slice(0, 48) + "…";
    }
    return value;
  },
  validate: {
    email() {
      return false;
    },
  },
};

export default function Linkify({ children }) {
  return (
    <_Linkify tagName={Fragment} options={options}>
      {children}
    </_Linkify>
  );
}
