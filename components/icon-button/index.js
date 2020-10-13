import styles from "./icon-button.module.css";
import Tooltip from "components/tooltip";
import { Fragment } from "react";

export default function IconButton({
  children,
  onClick,
  tooltip,
  disabled,
  ...rest
}) {
  const Wrapper = tooltip ? Tooltip : Fragment;
  const wrapperProps = tooltip ? { label: tooltip } : {};

  return (
    <Wrapper {...wrapperProps}>
      <button
        disabled={disabled}
        className={styles.root}
        onClick={onClick}
        {...rest}
      >
        {children}
      </button>
    </Wrapper>
  );
}
