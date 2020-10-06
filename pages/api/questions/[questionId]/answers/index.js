import db from "lib/api/db";
import { nanoid } from "nanoid";
import withUser from "lib/api/with-user";
import { getAnswerSchema } from "lib/schemas";
import { trimLineBreaks } from "lib/utils";

export default withUser(async function createAnswer(req, res) {
  try {
    const isValid = await getAnswerSchema().isValid(req.body);

    if (!isValid) {
      return res.status(400).json({ error: "request not in desired format" });
    }

    const id = `${Date.now()}-${nanoid(6)}`;

    const params = {
      TransactItems: [
        {
          Update: {
            TableName: process.env.DYNAMO_TABLE_NAME,
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
            TableName: process.env.DYNAMO_TABLE_NAME,
            Item: {
              PK: `QUESTION#${req.query.questionId}`,
              SK: `ANSWER#${id}`,
              body: trimLineBreaks(req.body.body),
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
