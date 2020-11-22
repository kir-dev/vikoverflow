import { createContext, useContext, useState } from "react";
import Toast from "./toast";
import styles from "./toasts.module.css";
import Portal from "@reach/portal";
import { nanoid } from "nanoid";

const ToastsContext = createContext();

export function useToasts() {
  return useContext(ToastsContext);
}

export function ToastsProvider({ children }) {
  const [hovering, setHovering] = useState(false);
  const [messages, setMessages] = useState([]);

  function addToast(message) {
    setMessages([
      ...messages.slice(Math.max(messages.length - 3, 0)),
      { key: nanoid(), text: message },
    ]);
  }

  function handleRemove(key) {
    // must use the callback form of setMessages because
    // handleRemove is used in cb of a setTimeout in the <Toast/> component
    // meaning it would have stale closure on the `messages` array
    setMessages((oldVal) => oldVal.filter((e) => e.key !== key));
  }

  return (
    <ToastsContext.Provider value={{ addToast }}>
      {children}
      <Portal>
        <div
          className={styles.list}
          onMouseEnter={() => setHovering(true)}
          onTouchStart={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onTouchEnd={() => setHovering(false)}
        >
          {messages.map(({ key, text }, i) => (
            <Toast
              index={messages.length - 1 - i}
              key={key}
              hovering={hovering}
              onRemove={() => handleRemove(key)}
              text={text}
            />
          ))}
        </div>
      </Portal>
    </ToastsContext.Provider>
  );
}
