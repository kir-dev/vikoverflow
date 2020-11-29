import styles from "./textarea.module.css";
import cn from "clsx";
import { forwardRef, Fragment } from "react";
import Error from "components/error";
import Label from "components/label";

function Textarea(
  { value, onChange, className, disabled, error, placeholder, label, ...props },
  ref
) {
  const Wrapper = label ? Label : Fragment;
  const wrapperProps = label ? { value: label } : {};

  return (
    <Wrapper {...wrapperProps}>
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        ref={ref}
        className={cn(
          styles.root,
          {
            [styles.disabled]: disabled,
            [styles.errored]: error,
          },
          className
        )}
        {...props}
      />

      {error && (
        <div className={styles.errorRoot}>
          <Error>{error}</Error>
        </div>
      )}
    </Wrapper>
  );
}

export default forwardRef(Textarea);
