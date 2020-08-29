import jwt from "jsonwebtoken";

const withUser = (fn, options = { throw: true }) => async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    if (!options.throw) {
      req.user = null;
      return await fn(req, res);
    }
    return res.status(403).json({ error: "Missing token" });
  }

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id };
  } catch (e) {
    if (!options.throw) {
      req.user = null;
      return await fn(req, res);
    }
    return res.status(403).json({ error: "Bad token" });
  }

  return await fn(req, res);
};

export default withUser;
