const ALL_VALID_METHODS = ["GET", "POST", "PATCH", "DELETE"];

export default function handler(mapping) {
  if (Object.keys(mapping).some((key) => !ALL_VALID_METHODS.includes(key))) {
    throw new Error("Invalid method in mapping");
  }

  return function _handlerFn(req, res) {
    if (mapping[req.method]) {
      return mapping[req.method](req, res);
    }

    res.setHeader("Allow", Object.keys(mapping));
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  };
}
