import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { getAnswerSchema } from "lib/schemas";
import { trimBody } from "lib/trim";

async function editAnswer(req, res) {
  try {
    const params = {
      TableName: "vikoverflow",
      Key: {
        PK: `QUESTION#${req.query.questionId}`,
        SK: `ANSWER#${req.query.answerId}`,
      },
      UpdateExpression: "set",
      ExpressionAttributeValues: {
        ":creator": req.user.id,
      },
      ConditionExpression: "creator = :creator",
    };

    const isValid = await getAnswerSchema(true).isValid(req.body);

    if (!isValid) {
      return res.status(400).json({ error: "request not in desired format" });
    }

    const allowedKeys = ["body"];
    const updates = Object.entries(req.body).filter(([key, _]) =>
      allowedKeys.includes(key)
    );

    if (!updates.length) {
      return res.status(400).json({ error: "No updates" });
    }

    updates.forEach(([key, value], i) => {
      params.UpdateExpression += ` ${key} = :${key}${
        i !== updates.length - 1 ? "," : ""
      }`;

      if (key === "body") {
        value = trimBody(value);
      }

      params.ExpressionAttributeValues[`:${key}`] = value;
    });

    await db.update(params).promise();

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function deleteAnswer(req, res) {
  try {
    // getting all vote SKs
    const { Items } = await db
      .query({
        TableName: "vikoverflow",
        KeyConditionExpression: "PK = :PK and begins_with(SK, :prefix)",
        ProjectionExpression: "SK",
        ExpressionAttributeValues: {
          ":PK": `QUESTION#${req.query.questionId}`,
          ":prefix": `ANSWERUPVOTE#${req.query.answerId}`,
        },
      })
      .promise();

    const batches = [];
    let currentBatch = [
      {
        Delete: {
          TableName: "vikoverflow",
          Key: {
            PK: `QUESTION#${req.query.questionId}`,
            SK: `ANSWER#${req.query.answerId}`,
          },
          ExpressionAttributeValues: {
            ":creator": req.user.id,
          },
          ConditionExpression: "creator = :creator",
        },
      },
      {
        Update: {
          TableName: "vikoverflow",
          Key: {
            PK: `QUESTION#${req.query.questionId}`,
            SK: `QUESTION#${req.query.questionId}`,
          },
          UpdateExpression: "add numberOfAnswers :incr",
          ExpressionAttributeValues: {
            ":incr": -1,
          },
        },
      },
    ];

    for (const item of Items) {
      currentBatch.push({
        Delete: {
          TableName: "vikoverflow",
          Key: {
            PK: `QUESTION#${req.query.questionId}`,
            SK: item.SK,
          },
        },
      });

      if (currentBatch.length === 25) {
        batches.push({
          TransactItems: currentBatch,
        });
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      batches.push({
        TransactItems: currentBatch,
      });
    }

    await Promise.all(
      batches.map((batch) => db.transactWrite(batch).promise())
    );

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default function handler(req, res) {
  switch (req.method) {
    case "PATCH":
      return withUser(editAnswer)(req, res);

    case "DELETE":
      return withUser(deleteAnswer)(req, res);

    default:
      res.setHeader("Allow", ["PATCH", "DELETE"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
