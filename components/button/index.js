import styles from "./button.module.css";
import cn from "clsx";

export const KIND = {
  secondary: "secondary",
};

export default function Button({ disabled, children, onClick, kind }) {
  const kindClassName = kind ? styles[kind] : false;

  return (
    <button
      className={cn(styles.root, kindClassName)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
