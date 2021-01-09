import { HTTPError } from "lib/utils";

function sendError(res, error) {
  if (error instanceof HTTPError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof Error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(500).json({ error: "Damn, something went real bad..." });
}

const ALL_VALID_METHODS = ["GET", "PATCH", "DELETE", "POST"];

export default function handler(mapping) {
  const keys = Object.keys(mapping);

  if (keys.some((key) => !ALL_VALID_METHODS.includes(key))) {
    throw new Error("Invalid method in mapping");
  }

  if (keys.some((key) => typeof mapping[key] !== "function")) {
    throw new Error("Methods value is not a function");
  }

  return async function _handlerFn(req, res) {
    if (mapping[req.method]) {
      try {
        await mapping[req.method](req, res);
      } catch (error) {
        sendError(res, error);
      }

      return;
    }

    res.setHeader("Allow", Object.keys(mapping));
    return sendError(
      res,
      new HTTPError(405, `Method ${req.method} Not Allowed`)
    );
  };
}
