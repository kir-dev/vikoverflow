import styles from "./modal.module.css";
import { useEffect } from "react";
import Button from "components/button";
import Portal from "@reach/portal";

const Modal = ({ children, open, onClose }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = null;
    }

    return () => {
      document.body.style.overflow = null;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <Portal>
      <div className={styles.root}>
        <div onClick={onClose} className={styles.backdrop} />
        <div className={styles.content}>{children}</div>
      </div>
    </Portal>
  );
};

Modal.Header = ({ children }) => <h2 className={styles.header}>{children}</h2>;

Modal.Body = ({ children }) => <div className={styles.body}>{children}</div>;

Modal.Footer = ({ children }) => (
  <div className={styles.footer}>{children}</div>
);

Modal.Action = ({ children, onClick, disabled, loading }) => (
  <Button
    loading={loading}
    disabled={disabled}
    onClick={onClick}
    className={styles.action}
  >
    {children}
  </Button>
);

export default Modal;
