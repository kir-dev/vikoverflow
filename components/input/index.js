import styles from "./input.module.css";
import cn from "classnames";
import { memo, forwardRef } from "react";

function Input(
  {
    value,
    onChange,
    placeholder,
    className,
    errored,
    type,
    disabled,
    prefix,
    ...props
  },
  ref
) {
  return (
    <div
      className={cn(styles.container, {
        [styles.hasPrefix]: prefix,
        [styles.errored]: errored,
      })}
    >
      <input
        {...props}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        type={type ?? "text"}
        className={cn(styles.input, className)}
        ref={ref}
      />
      {prefix && <span>{prefix}</span>}
    </div>
  );
}

export default memo(forwardRef(Input));
