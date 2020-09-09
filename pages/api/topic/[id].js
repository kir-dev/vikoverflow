import db from "lib/api/db";
import { ACTIVITY } from "lib/constants";

export default async function getTopic(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    const getParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: {
        PK: `TOPIC#${req.query.id}`,
        SK: `TOPIC#${req.query.id}`,
      },
    };

    const { Item } = await db.get(getParams).promise();

    if (!Item) {
      return res.status(404).json({ error: "topic not found" });
    }

    const topic = {
      id: Item.PK.split("#")[1],
      description: Item.description,
    };

    return res.json({ topic });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
