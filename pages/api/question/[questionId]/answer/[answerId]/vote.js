import db from "lib/api/db";
import withUser from "lib/api/with-user";

export default withUser(async function vote(req, res) {
  try {
    const params = {
      TransactItems: [
        {
          Update: {
            TableName: "Questions",
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
                TableName: "Questions",
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
                TableName: "Questions",
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
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});
