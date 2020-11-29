import styles from "./input.module.css";
import cn from "clsx";
import { forwardRef, Fragment } from "react";
import Error from "components/error";
import Label from "components/label";

function Input(
  {
    value,
    onChange,
    placeholder,
    className,
    type,
    disabled,
    prefix,
    label,
    error,
    ...props
  },
  ref
) {
  const Wrapper = label ? Label : Fragment;
  const wrapperProps = label ? { value: label } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        className={cn(styles.container, {
          [styles.hasPrefix]: prefix,
          [styles.errored]: error,
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
      {error && (
        <div className={styles.errorRoot}>
          <Error>{error}</Error>
        </div>
      )}
    </Wrapper>
  );
}

export default forwardRef(Input);
