import db from "lib/api/db";
import handler from "lib/api/handler";

async function getTopic(req, res) {
  try {
    const getParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: {
        PK: `TOPIC#${req.query.id}`,
        SK: `TOPIC#${req.query.id}`,
      },
      ProjectionExpression: "PK, GSI1SK",
    };

    const { Item } = await db.get(getParams).promise();

    if (!Item) {
      return res.status(404).json({ error: "topic not found" });
    }

    const topic = {
      id: Item.PK.split("#")[1],
      numberOfQuestions: Item.GSI1SK,
    };

    return res.json({ topic });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default handler({
  GET: getTopic,
});
