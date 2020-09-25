import styles from "./textarea.module.css";
import cn from "clsx";
import Autosize from "react-textarea-autosize";
import { forwardRef, memo, Fragment } from "react";
import Error from "components/error";
import Label from "components/label";

function Textarea(
  {
    value,
    onChange,
    className,
    disabled,
    error,
    placeholder,
    label,
    minRows,
    maxRows,
    ...props
  },
  ref
) {
  const Wrapper = label ? Label : Fragment;
  const wrapperProps = label ? { value: label } : {};

  return (
    <Wrapper {...wrapperProps}>
      {minRows || maxRows ? (
        <Autosize
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
          minRows={minRows}
          maxRows={maxRows}
          {...props}
        />
      ) : (
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
      )}

      {error && (
        <div className={styles.errorRoot}>
          <Error>{error}</Error>
        </div>
      )}
    </Wrapper>
  );
}

export default memo(forwardRef(Textarea));
