import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { TopicDescriptionSchema } from "lib/schemas";

async function getTopic(req, res) {
  try {
    const getParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: {
        PK: `TOPIC#${req.query.id}`,
        SK: `TOPIC#${req.query.id}`,
      },
      ProjectionExpression: "PK, description, creator",
    };

    const { Item } = await db.get(getParams).promise();

    if (!Item) {
      return res.status(404).json({ error: "topic not found" });
    }

    const { PK, ...rest } = Item;

    const topic = {
      id: PK.split("#")[1],
      ...rest,
    };

    return res.json({ topic });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function editTopic(req, res) {
  try {
    const isValid = await TopicDescriptionSchema.isValid(req.body);

    if (!isValid) {
      return res.status(400).json({ error: "request not in desired format" });
    }

    const allowedKeys = ["description"];

    const updates = Object.entries(req.body)
      .filter(([key, _]) => allowedKeys.includes(key))
      .reduce((acc, [currKey, currVal]) => {
        acc[currKey] = currVal;
        return acc;
      }, {});

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No updates" });
    }

    const updateParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: {
        PK: `TOPIC#${req.query.id}`,
        SK: `TOPIC#${req.query.id}`,
      },
      ConditionExpression: "attribute_exists(PK) and creator = :creator",
      UpdateExpression: "set",
      ExpressionAttributeValues: { ":creator": req.user.id },
    };

    Object.entries(updates).forEach(([key, value], i) => {
      const isLastEntry = i === Object.keys(updates).length - 1;

      updateParams.UpdateExpression += ` ${key} = :${key}`;

      if (!isLastEntry) {
        updateParams.UpdateExpression += ",";
      }

      updateParams.ExpressionAttributeValues[`:${key}`] = value;
    });

    await db.update(updateParams).promise();

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default function handler(req, res) {
  switch (req.method) {
    case "GET":
      return getTopic(req, res);

    case "PATCH":
      return withUser(editTopic)(req, res);

    default:
      res.setHeader("Allow", ["GET", "PATCH"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
