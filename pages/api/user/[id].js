import db from "lib/api/db";

export default async function getUser(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    const params = {
      TableName: "Questions",
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
      avatar: Item.avatar,
    };

    return res.json({
      user,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
