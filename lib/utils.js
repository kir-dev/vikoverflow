import { useState, useEffect } from "react";

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function trimSpaces(str) {
  return str.trim().replace(/\s\s+/g, " ");
}

export function trimLineBreaks(str) {
  return str.trim().replace(/\n\s*\n\s*\n/g, "\n\n");
}
