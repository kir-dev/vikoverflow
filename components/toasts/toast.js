import { useState, useEffect, useRef } from "react";
import cn from "clsx";
import styles from "./toasts.module.css";

export default function Toast({ index, text, hovering, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // using a small delay to make sure the initial render does not
    // have the .visible class so that the transform/transition plays

    if ("requestIdleCallback" in window) {
      // requestIdleCallback not supported in Safari
      window.requestIdleCallback(
        () => {
          setVisible(true);
        },
        { timeout: 100 }
      );
    } else {
      setTimeout(() => {
        setVisible(true);
      }, 1);
    }
  }, []);

  useEffect(() => {
    if (hovering) {
      clearTimeout(timeoutRef.current);
    } else {
      timeoutRef.current = setTimeout(() => {
        setHiding(true);
        setTimeout(() => {
          onRemove();
        }, 200);
      }, 5000 - index * 200);
    }
  }, [hovering]);

  return (
    <div
      className={cn(styles.toastContainer, {
        [styles.hidden]: index > 2 || hiding,
        [styles.visible]: visible,
      })}
      style={{ "--index": index }}
    >
      <div className={styles.toast}>
        <span>{text}</span>
      </div>
    </div>
  );
}
