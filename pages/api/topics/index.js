import db from "lib/api/db";

async function getAllTopics(req, res) {
  try {
    const params = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :GSI1PK",
      ExpressionAttributeValues: {
        ":GSI1PK": "TOPIC",
      },
      ScanIndexForward: false,
    };

    params.Limit = req.query.limit ? parseInt(req.query.limit) : 5;

    const { Items } = await db.query(params).promise();

    const topics = Items.map(({ PK, GSI1SK }) => ({
      id: PK.split("#")[1],
      numberOfQuestions: GSI1SK,
    }));

    return res.json({ topics });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default function handler(req, res) {
  switch (req.method) {
    case "GET":
      return getAllTopics(req, res);

    default:
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
