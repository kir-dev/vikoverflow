import db from "lib/api/db";
import handler from "lib/api/handler";

export async function getTopics() {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :GSI1PK",
    ExpressionAttributeValues: {
      ":GSI1PK": "TOPIC",
    },
    ScanIndexForward: false,
    Limit: 5,
  };

  const { Items } = await db.query(params).promise();

  const topics = Items.map(({ PK, GSI1SK }) => ({
    id: PK.split("#")[1],
    numberOfQuestions: GSI1SK,
  }));

  return { topics };
}

async function getAllTopics(req, res) {
  return res.json(await getTopics());
}

export default handler({
  GET: getAllTopics,
});
