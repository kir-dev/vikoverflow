import styles from "./textarea.module.css";
import cn from "classnames";
import Autosize from "react-textarea-autosize";

const Textarea = ({
  value,
  onChange,
  className,
  disabled,
  errored,
  placeholder,
  ...props
}) => (
  <Autosize
    value={value}
    onChange={onChange}
    disabled={disabled}
    placeholder={placeholder}
    className={cn(
      styles.root,
      {
        [styles.disabled]: disabled,
        [styles.errored]: errored,
      },
      className
    )}
    {...props}
  />
);

export default Textarea;
