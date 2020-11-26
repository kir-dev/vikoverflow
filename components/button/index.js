import styles from "./button.module.css";
import cn from "clsx";
import Tooltip from "components/tooltip";
import { Fragment, forwardRef } from "react";

export const KIND = {
  secondary: "secondary",
  icon: "icon",
};

function Button(
  { disabled, children, onClick, kind, tooltip, ...otherProps },
  ref
) {
  const Wrapper = tooltip && !disabled ? Tooltip : Fragment;
  const wrapperProps = tooltip ? { label: tooltip } : {};
  const kindClassName = kind ? styles[kind] : false;

  return (
    <Wrapper {...wrapperProps}>
      <button
        className={cn(styles.root, kindClassName)}
        disabled={disabled}
        onClick={onClick}
        ref={ref}
        {...otherProps}
      >
        {children}
      </button>
    </Wrapper>
  );
}

export default forwardRef(Button);
