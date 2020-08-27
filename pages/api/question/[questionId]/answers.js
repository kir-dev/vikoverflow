import db from "lib/api/db";
import ksuid from "ksuid";
import withUser from "lib/api/with-user";
import { getAnswerSchema } from "lib/schemas";

export default withUser(async function createAnswer(req, res) {
  try {
    const isValid = await getAnswerSchema().isValid(req.body);

    if (!isValid) {
      return res.status(400).json({ error: "request not in desired format" });
    }

    const id = ksuid.randomSync().string;

    const params = {
      TransactItems: [
        {
          Update: {
            TableName: "Questions",
            Key: {
              PK: `QUESTION#${req.query.questionId}`,
              SK: `QUESTION#${req.query.questionId}`,
            },
            UpdateExpression: "add numberOfAnswers :incr",
            ExpressionAttributeValues: {
              ":incr": 1,
            },
            ConditionExpression: "attribute_exists(PK)",
          },
        },
        {
          Put: {
            TableName: "Questions",
            Item: {
              PK: `QUESTION#${req.query.questionId}`,
              SK: `ANSWER#${id}`,
              body: req.body.body,
              upvotes: 0,
              creator: req.user.id,
              createdAt: Date.now(),
            },
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
