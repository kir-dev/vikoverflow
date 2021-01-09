import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { UserProfileSchema } from "lib/schemas";
import { trimSpaces } from "lib/utils";
import handler from "lib/api/handler";
import { HTTPError } from "lib/utils";

export async function getUserById(id, isOwnProfile) {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      PK: `USER#${id}`,
      SK: `USER#${id}`,
    },
  };

  const { Item } = await db.get(params).promise();

  if (!Item) {
    throw new HTTPError(404, "user does not exist");
  }

  const responseObj = {
    user: {
      id: Item.PK.split("#")[1],
      name: Item.name,
      bio: Item.bio,
      avatar: Item.avatar,
    },
  };

  if (isOwnProfile) {
    responseObj.user.email = Item.email;
  }

  return responseObj;
}

async function getUser(req, res) {
  return res.json(
    await getUserById(req.query.id, req.user?.id === req.query.id)
  );
}

async function editUser(req, res) {
  if (req.query.id !== req.user.id) {
    throw new HTTPError(400, "Not authorized to edit this user");
  }

  if (typeof req.body.bio === "undefined") {
    throw new HTTPError(400, "bio is required");
  }

  const isValid = await UserProfileSchema.isValid(req.body);

  if (!isValid) {
    throw new HTTPError(400, "request not in desired format");
  }

  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      PK: `USER#${req.query.id}`,
      SK: `USER#${req.query.id}`,
    },
    UpdateExpression: "set bio = :bio",
    ExpressionAttributeValues: {
      ":bio": trimSpaces(req.body.bio),
    },
  };

  await db.update(params).promise();

  return res.json({ success: true });
}

export default handler({
  GET: withUser(getUser, { throw: false }),
  PATCH: withUser(editUser),
});
