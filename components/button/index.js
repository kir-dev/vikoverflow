import styles from "./button.module.css";
import cn from "clsx";
import Tooltip from "components/tooltip";
import { Fragment } from "react";

export const KIND = {
  secondary: "secondary",
  icon: "icon",
};

export default function Button({
  disabled,
  children,
  onClick,
  kind,
  tooltip,
  ...otherProps
}) {
  const Wrapper = tooltip ? Tooltip : Fragment;
  const wrapperProps = tooltip ? { label: tooltip } : {};
  const kindClassName = kind ? styles[kind] : false;

  return (
    <Wrapper {...wrapperProps}>
      <button
        className={cn(styles.root, kindClassName)}
        disabled={disabled}
        onClick={onClick}
        {...otherProps}
      >
        {children}
      </button>
    </Wrapper>
  );
}
