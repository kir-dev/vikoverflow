import db from "lib/api/db";
import withUser from "lib/api/with-user";

export default withUser(async function vote(req, res) {
  try {
    const params = {
      TransactItems: [
        {
          Update: {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Key: {
              PK: `QUESTION#${req.query.questionId}`,
              SK: `QUESTION#${req.query.questionId}`,
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
                  SK: `QUESTIONUPVOTE#${req.user.id}`,
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
                  SK: `QUESTIONUPVOTE#${req.user.id}`,
                },
                ConditionExpression: "attribute_exists(PK)",
              },
            },
      ],
    };

    await db.transactWrite(params).promise();

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});
