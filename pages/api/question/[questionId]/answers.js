import db from "lib/api/db";
import ksuid from "ksuid";
import withUser from "lib/api/with-user";
import { getAnswerSchema } from "lib/schemas";
import { trimBody } from "lib/trim";

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
            TableName: "vikoverflow",
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
            TableName: "vikoverflow",
            Item: {
              PK: `QUESTION#${req.query.questionId}`,
              SK: `ANSWER#${id}`,
              body: trimBody(req.body.body),
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
