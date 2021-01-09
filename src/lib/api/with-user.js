import jwt from "jsonwebtoken";
import { HTTPError } from "lib/utils";

const withUser = (fn, options = { throw: true }) => async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    if (!options.throw) {
      req.user = null;
      return await fn(req, res);
    }
    throw new HTTPError(403, "Missing token");
  }

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id };
  } catch (e) {
    if (!options.throw) {
      req.user = null;
      return await fn(req, res);
    }
    throw new HTTPError(403, "Bad token");
  }

  return await fn(req, res);
};

export default withUser;
