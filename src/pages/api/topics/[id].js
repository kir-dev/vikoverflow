import db from "lib/api/db";
import handler from "lib/api/handler";
import { HTTPError } from "lib/utils";

export async function getTopicById(id) {
  const getParams = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      PK: `TOPIC#${id}`,
      SK: `TOPIC#${id}`,
    },
    ProjectionExpression: "PK, GSI1SK",
  };

  const { Item } = await db.get(getParams).promise();

  if (!Item) {
    throw new HTTPError(404, "topic not found");
  }

  const topic = {
    id: Item.PK.split("#")[1],
    numberOfQuestions: Item.GSI1SK,
  };

  return { topic };
}

async function getTopic(req, res) {
  return res.json(await getTopicById(req.query.id));
}

export default handler({
  GET: getTopic,
});
