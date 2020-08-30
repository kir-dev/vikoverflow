import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { UserProfileSchema } from "lib/schemas";

async function getUser(req, res) {
  try {
    const params = {
      TableName: "vikoverflow",
      Key: {
        PK: `USER#${req.query.id}`,
        SK: `USER#${req.query.id}`,
      },
    };

    const { Item } = await db.get(params).promise();

    if (!Item) {
      return res.status(404).json({ error: "user does not exist" });
    }

    const user = {
      id: Item.PK.split("#")[1],
      name: Item.name,
      bio: Item.bio,
      avatar: Item.avatar,
    };

    if (req.user?.id === req.query.id) {
      user.email = Item.email;
    }

    return res.json({
      user,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function editUser(req, res) {
  try {
    if (req.query.id !== req.user.id) {
      return res
        .status(400)
        .json({ error: "Not authorized to edit this user" });
    }

    if (typeof req.body.bio === "undefined") {
      return res.status(400).json({ error: "bio is required" });
    }

    const isValid = await UserProfileSchema.isValid(req.body);

    if (!isValid) {
      return res.status(400).json({ error: "request not in desired format" });
    }

    const params = {
      TableName: "vikoverflow",
      Key: {
        PK: `USER#${req.query.id}`,
        SK: `USER#${req.query.id}`,
      },
      UpdateExpression: "set bio = :bio",
      ExpressionAttributeValues: {
        ":bio": req.body.bio,
      },
    };

    await db.update(params).promise();

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default function handler(req, res) {
  switch (req.method) {
    case "GET":
      return withUser(getUser, { throw: false })(req, res);

    case "PATCH":
      return withUser(editUser)(req, res);

    default:
      res.setHeader("Allow", ["GET", "PATCH"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
