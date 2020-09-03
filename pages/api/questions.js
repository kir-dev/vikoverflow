import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { getQuestionSchema } from "lib/schemas";
import { nanoid } from "nanoid";
import { trimTitle, trimBody } from "lib/trim";

async function getAllQuestions(req, res) {
  try {
    let params;

    if (req.query.topic) {
      const checkParams = {
        TableName: "vikoverflow",
        Key: {
          PK: `TOPIC#${req.query.topic}`,
          SK: `TOPIC#${req.query.topic}`,
        },
      };

      const { Item } = await db.get(checkParams).promise();

      if (!Item) {
        return res.status(404).json({ error: "topic does not exist" });
      }

      params = {
        TableName: "vikoverflow",
        IndexName: "GSI2",
        KeyConditionExpression: "topic = :topic",
        ScanIndexForward: false,
        ExpressionAttributeValues: {
          ":topic": req.query.topic,
        },
      };
    } else {
      params = {
        TableName: "vikoverflow",
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :GSI1PK",
        ScanIndexForward: false,
        ExpressionAttributeValues: {
          ":GSI1PK": "QUESTION",
        },
      };
    }

    if (req.query.cursor) {
      if (req.query.topic) {
        params.ExclusiveStartKey = {
          topic: req.query.topic,
          PK: `QUESTION#${req.query.cursor}`,
          SK: `QUESTION#${req.query.cursor}`,
          createdAt: parseInt(req.query.cursorCreatedAt),
        };
      } else {
        if (req.query.cursor2) {
          params.ExclusiveStartKey = {
            GSI1PK: "QUESTION",
            GSI1SK: parseInt(req.query.cursor2),
            PK: `QUESTION#${req.query.cursor}`,
            SK: `QUESTION#${req.query.cursor}`,
          };
        }
      }
    }

    if (req.query.search) {
      params.ExpressionAttributeValues[":title"] = req.query.search;
      params.ExpressionAttributeValues[":body"] = req.query.search;
      params.ExpressionAttributeValues[":topic"] = req.query.search;
      params.FilterExpression =
        "contains(title, :title) or contains(body, :body) or contains(topic, :topic)";
    } else {
      params.Limit = req.query.limit ? parseInt(req.query.limit) : 10;
    }

    const { Items, LastEvaluatedKey } = await db.query(params).promise();

    const questions = Items.map(
      ({
        PK,
        topic,
        upvotes,
        creator,
        createdAt,
        title,
        body,
        numberOfAnswers,
      }) => ({
        id: PK.split("#")[1],
        topic,
        upvotes: {
          count: upvotes,
        },
        creator,
        createdAt,
        title,
        body,
        answers: {
          count: numberOfAnswers,
        },
      })
    );

    const responseObj = {
      questions,
    };

    if (LastEvaluatedKey) {
      responseObj.nextCursor = LastEvaluatedKey.PK.split("#")[1];
      if (LastEvaluatedKey.GSI1SK) {
        responseObj.nextCursor2 = LastEvaluatedKey.GSI1SK;
      }
      if (LastEvaluatedKey.createdAt) {
        responseObj.nextCursorCreatedAt = LastEvaluatedKey.createdAt;
      }
    }

    return res.json(responseObj);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function createQuestion(req, res) {
  try {
    const id = nanoid();

    const checkParams = {
      TableName: "vikoverflow",
      Key: {
        PK: `TOPIC#${req.body.topic}`,
        SK: `TOPIC#${req.body.topic}`,
      },
    };

    const { Item } = await db.get(checkParams).promise();

    // a topicDescroption is required when the topic does not exists
    const isValid = await getQuestionSchema(!Item).isValid(req.body);

    if (!isValid) {
      return res.status(400).json({ error: "request not in desired format" });
    }

    const topic = req.body.topic;

    // we are upserting a topic so the transaction doesnt fail
    // but using if_not_exists s to make sure createdAt and stuff is not overwritten
    const preparedUpdate = {
      TableName: "vikoverflow",
      Key: {
        PK: `TOPIC#${topic}`,
        SK: `TOPIC#${topic}`,
      },
      UpdateExpression: `
        add
          GSI1SK :incr
        set
          GSI1PK = if_not_exists(GSI1PK, :GSI1PK),
          creator = if_not_exists(creator, :creator),
          createdAt = if_not_exists(createdAt, :createdAt),
          description = if_not_exists(description, :description)`,
      ExpressionAttributeValues: {
        ":GSI1PK": "TOPIC",
        ":creator": req.user.id,
        ":createdAt": Date.now(),
        ":incr": 1,
        ":description": req.body?.topicDescription ?? "",
      },
    };

    const params = {
      TransactItems: [
        {
          Update: preparedUpdate,
        },
        {
          Put: {
            TableName: "vikoverflow",
            Item: {
              PK: `QUESTION#${id}`,
              SK: `QUESTION#${id}`,
              GSI1PK: "QUESTION",
              GSI1SK: Date.now(),
              title: trimTitle(req.body.title),
              body: trimBody(req.body.body),
              upvotes: 0,
              numberOfAnswers: 0,
              topic: req.body.topic,
              creator: req.user.id,
              createdAt: Date.now(),
            },
          },
        },
      ],
    };

    await db.transactWrite(params).promise();

    return res.json({ id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default function handler(req, res) {
  switch (req.method) {
    case "GET":
      return getAllQuestions(req, res);

    case "POST":
      return withUser(createQuestion)(req, res);

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
