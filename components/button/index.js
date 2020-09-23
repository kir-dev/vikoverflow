import styles from "./button.module.css";
import cn from "clsx";
import { forwardRef, memo } from "react";
import LoadingDots from "components/loading-dots";

function Button(
  {
    small,
    medium,
    inverted,
    loading,
    disabled,
    className,
    children,
    onClick,
    ...props
  },
  ref
) {
  const handleClick = (e) => {
    if (disabled) {
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={cn(styles.root, className, {
        [styles.inverted]: inverted,
        [styles.small]: small,
        [styles.medium]: medium,
        [styles.loading]: loading,
        [styles.disabled]: disabled,
      })}
      ref={ref}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      <span className={styles.text}>{children}</span>
      {loading && (
        <span className={styles.loadingDots}>
          <LoadingDots size="big" />
        </span>
      )}
    </button>
  );
}

export default memo(forwardRef(Button));
