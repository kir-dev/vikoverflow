import styles from "./select.module.css";
import cn from "clsx";
import Error from "components/error";
import Label from "components/label";
import { DownArrow } from "components/icons";
import { Fragment } from "react";

export default function Select({
  value,
  onChange,
  label,
  error,
  disabled,
  children,
  className,
  ...props
}) {
  const Wrapper = label ? Label : Fragment;
  const wrapperProps = label ? { value: label } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        className={cn(
          styles.root,
          {
            [styles.errored]: error,
            [styles.disabled]: disabled,
          },
          className
        )}
      >
        <select
          value={value}
          onChange={onChange}
          className={styles.select}
          disabled={disabled}
          {...props}
        >
          {children}
        </select>
        <span className={styles.arrow}>
          <DownArrow />
        </span>
      </div>
      {error && (
        <div className={styles.errorRoot}>
          <Error>{error}</Error>
        </div>
      )}
    </Wrapper>
  );
}
