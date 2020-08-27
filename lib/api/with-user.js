import db from "lib/api/db";
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
    const { id, name, email } = jwt.verify(token, process.env.OAUTH_SECRET);
    req.user = { id, name, email };
  } catch (e) {
    if (!options.throw) {
      req.user = null;
      return await fn(req, res);
    }
    return res.status(403).json({ error: "Bad token" });
  }

  const params = {
    TableName: "Questions",
    Key: {
      PK: `USER#${req.user.id}`,
      SK: `USER#${req.user.id}`,
    },
  };

  const { Item } = await db.get(params).promise();

  if (Item) {
    req.user.avatar = Item.avatar;
  }

  return await fn(req, res);
};

export default withUser;
