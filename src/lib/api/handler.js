const ALL_VALID_METHODS = ["GET", "POST", "PATCH", "DELETE"];

export default function handler(mapping) {
  const keys = Object.keys(mapping);

  if (keys.some((key) => !ALL_VALID_METHODS.includes(key))) {
    throw new Error("Invalid method in mapping");
  }

  if (keys.some((key) => typeof mapping[key] !== "function")) {
    throw new Error("Methods value is not a function");
  }

  return function _handlerFn(req, res) {
    if (mapping[req.method]) {
      return mapping[req.method](req, res);
    }

    res.setHeader("Allow", Object.keys(mapping));
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  };
}
