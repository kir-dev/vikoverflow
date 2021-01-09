import db from "lib/api/db";
import withUser from "lib/api/with-user";
import handler from "lib/api/handler";

async function editVotes(req, res) {
  const params = {
    TransactItems: [
      {
        Update: {
          TableName: process.env.DYNAMO_TABLE_NAME,
          Key: {
            PK: `QUESTION#${req.query.questionId}`,
            SK: `ANSWER#${req.query.answerId}`,
          },
          UpdateExpression: "add upvotes :incr",
          ExpressionAttributeValues: {
            ":incr": req.body.upvote ? 1 : -1,
          },
          ConditionExpression: "attribute_exists(PK)",
        },
      },
      req.body.upvote
        ? {
            Put: {
              TableName: process.env.DYNAMO_TABLE_NAME,
              Item: {
                PK: `QUESTION#${req.query.questionId}`,
                SK: `ANSWERUPVOTE#${req.query.answerId}#${req.user.id}`,
                creator: req.user.id,
                createdAt: Date.now(),
              },
              ConditionExpression: "attribute_not_exists(PK)",
            },
          }
        : {
            Delete: {
              TableName: process.env.DYNAMO_TABLE_NAME,
              Key: {
                PK: `QUESTION#${req.query.questionId}`,
                SK: `ANSWERUPVOTE#${req.query.answerId}#${req.user.id}`,
              },
              ConditionExpression: "attribute_exists(PK)",
            },
          },
    ],
  };

  await db.transactWrite(params).promise();

  return res.json({ success: true });
}

export default handler({
  PATCH: withUser(editVotes),
});
