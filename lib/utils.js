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

/**
 * Based on the environment and the request we know if a secure cookie can be set.
 * https://github.com/auth0/nextjs-auth0/blob/88959971958e5c6ed5bd874828c97363d2224f74/src/utils/cookies.ts
 */
export function isSecureEnvironment(req) {
  if (!req || !req.headers || !req.headers.host) {
    throw new Error('The "host" request header is not available');
  }

  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const host =
    (req.headers.host.indexOf(":") > -1 && req.headers.host.split(":")[0]) ||
    req.headers.host;
  if (["localhost", "127.0.0.1"].indexOf(host) > -1) {
    return false;
  }

  return true;
}
