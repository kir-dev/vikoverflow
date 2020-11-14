import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { getQuestionSchema } from "lib/schemas";
import { trimSpaces, trimLineBreaks } from "lib/utils";
import { uploadToS3, deleteFromS3 } from "lib/api/s3";
import parseMultipart from "lib/api/parse-multipart";
import { DELETE_CURRENT_FILE } from "lib/constants";
import handler from "lib/api/handler";

// https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
const BATCH_SIZE = 25;

async function getQuestion(req, res) {
  try {
    let cursor;
    let items = [];

    do {
      const params = {
        TableName: process.env.DYNAMO_TABLE_NAME,
        KeyConditionExpression: "PK = :PK",
        ExpressionAttributeValues: {
          ":PK": `QUESTION#${req.query.questionId}`,
        },
        ScanIndexForward: false,
      };

      if (cursor) {
        params.ExclusiveStartKey = cursor;
      }

      const { Items, LastEvaluatedKey } = await db.query(params).promise();

      cursor = LastEvaluatedKey;
      items.push(...Items);
    } while (cursor);

    if (!items.length) {
      return res.status(404).json({ error: "Question not found." });
    }

    const metadata = items.find((e) => e.SK.startsWith("QUESTION#"));
    const answers = items.filter((e) => e.SK.startsWith("ANSWER#"));
    const questionUpvotingUsers = items
      .filter((e) => e.SK.startsWith("QUESTIONUPVOTE#"))
      .map((e) => e.SK.split("#")[1]);

    const question = {
      id: metadata.PK.split("#")[1],
      topic: metadata.topic,
      upvotes: {
        count: metadata.upvotes,
        currentUserUpvoted: req.user
          ? questionUpvotingUsers.includes(req.user.id)
          : false,
      },
      creator: metadata.creator,
      createdAt: metadata.createdAt,
      title: metadata.title,
      body: metadata.body,
      answers: {
        count: metadata.numberOfAnswers,
        list: answers.map((e) => {
          const id = e.SK.split("#")[1];
          const answerUpvotingUsers = items
            .filter((e) => e.SK.startsWith(`ANSWERUPVOTE#${id}`))
            .map((e) => e.SK.split("#")[2]);

          return {
            id,
            upvotes: {
              count: e.upvotes,
              currentUserUpvoted: req.user
                ? answerUpvotingUsers.includes(req.user.id)
                : false,
            },
            creator: e.creator,
            createdAt: e.createdAt,
            body: e.body,
          };
        }),
      },
      attachment: metadata.attachment,
    };

    return res.json({ question });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function editQuestion(req, res) {
  try {
    const { parsedFields, parsedFiles } = await parseMultipart(req);

    const isValid = await getQuestionSchema(
      !!parsedFields.topicDescription
    ).isValid(parsedFields);

    if (!isValid) {
      return res.status(400).json({ error: "request not in desired format" });
    }

    const allowedKeys = ["title", "body", "topic"];

    const updates = Object.entries(parsedFields)
      .filter(([key, _]) => allowedKeys.includes(key))
      .reduce((acc, [currKey, currVal]) => {
        acc[currKey] = currVal;
        return acc;
      }, {});

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No updates" });
    }

    const params = {
      TransactItems: [],
    };

    const getParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: {
        PK: `QUESTION#${req.query.questionId}`,
        SK: `QUESTION#${req.query.questionId}`,
      },
      ProjectionExpression: "topic, attachment",
    };

    const { Item } = await db.get(getParams).promise();

    const oldTopicId = Item.topic;
    const newTopicId = updates.topic;

    if (oldTopicId !== newTopicId) {
      // we are upserting a topic so the transaction doesnt fail
      // but using if_not_exists s to make sure createdAt and stuff is not overwritten
      const preparedUpdate = {
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {
          PK: `TOPIC#${newTopicId}`,
          SK: `TOPIC#${newTopicId}`,
        },
        UpdateExpression: `
        add
          GSI1SK :incr
        set
          GSI1PK = if_not_exists(GSI1PK, :GSI1PK),
          creator = if_not_exists(creator, :creator),
          createdAt = if_not_exists(createdAt, :createdAt)`,
        ExpressionAttributeValues: {
          ":GSI1PK": "TOPIC",
          ":creator": req.user.id,
          ":createdAt": Date.now(),
          ":incr": 1,
        },
      };

      if (parsedFields.topicDescription) {
        if (parsedFields.topicDescription.length > 64) {
          return res.status(400).json({ error: "topicDescriotion too long" });
        }

        preparedUpdate.UpdateExpression += `, description = if_not_exists(description, :description)`;
        preparedUpdate.ExpressionAttributeValues[":description"] =
          parsedFields.topicDescription;
      }

      params.TransactItems.push(
        {
          Update: {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Key: {
              PK: `TOPIC#${oldTopicId}`,
              SK: `TOPIC#${oldTopicId}`,
            },
            UpdateExpression: "add GSI1SK :decr",
            ExpressionAttributeValues: {
              ":decr": -1,
            },
            ConditionExpression: "attribute_exists(PK)",
          },
        },
        {
          Update: preparedUpdate,
        }
      );
    }

    const preparedUpdate = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: {
        PK: `QUESTION#${req.query.questionId}`,
        SK: `QUESTION#${req.query.questionId}`,
      },
      ConditionExpression: "attribute_exists(PK) and creator = :creator",
      UpdateExpression: "set",
      ExpressionAttributeValues: { ":creator": req.user.id },
    };

    Object.entries(updates).forEach(([key, value], i) => {
      const isLastEntry = i === Object.keys(updates).length - 1;

      preparedUpdate.UpdateExpression += ` ${key} = :${key}`;

      if (!isLastEntry) {
        preparedUpdate.UpdateExpression += ",";
      }

      if (key === "title") {
        value = trimSpaces(value);
      }

      if (key === "body") {
        value = trimLineBreaks(value);
      }

      preparedUpdate.ExpressionAttributeValues[`:${key}`] = value;
    });

    if (parsedFiles.length && parsedFields.file !== DELETE_CURRENT_FILE) {
      const file = parsedFiles[0];

      const key = await uploadToS3({
        body: file.body,
        contentType: file.contentType,
        metadata: {
          questionId: req.query.questionId,
          creator: req.user.id,
          createdAt: Date.now().toString(),
          originalName: file.originalName,
        },
        contentDisposition: `inline; filename="${file.originalName}"`,
      });

      preparedUpdate.UpdateExpression += `, attachment = :attachment`;
      preparedUpdate.ExpressionAttributeValues[":attachment"] = {
        s3Key: key,
        originalName: file.originalName,
      };
    }

    if (parsedFields.file === DELETE_CURRENT_FILE) {
      preparedUpdate.UpdateExpression += " remove attachment";
    }

    params.TransactItems.push({ Update: preparedUpdate });

    await db.transactWrite(params).promise();

    if (
      (parsedFiles.length || parsedFields.file === DELETE_CURRENT_FILE) &&
      Item.attachment
    ) {
      await deleteFromS3(Item.attachment.s3Key);
    }

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function deleteQuestion(req, res) {
  try {
    let cursor;
    let itemsToDelete = [];

    do {
      const queryParams = {
        TableName: process.env.DYNAMO_TABLE_NAME,
        KeyConditionExpression: "PK = :PK",
        ProjectionExpression: "SK, topic, creator, attachment",
        ExpressionAttributeValues: {
          ":PK": `QUESTION#${req.query.questionId}`,
        },
      };

      if (cursor) {
        queryParams.ExclusiveStartKey = cursor;
      }

      const { Items, LastEvaluatedKey } = await db.query(queryParams).promise();

      cursor = LastEvaluatedKey;
      itemsToDelete.push(...Items);
    } while (cursor);

    const metadata = itemsToDelete.find((e) => e.SK.startsWith("QUESTION#"));

    if (metadata.creator !== req.user.id) {
      return res
        .status(400)
        .json({ error: "Not authorized to delete this question" });
    }

    const topicId = metadata.topic;

    const batches = [];

    let currentBatch = [
      {
        Update: {
          TableName: process.env.DYNAMO_TABLE_NAME,
          Key: {
            PK: `TOPIC#${topicId}`,
            SK: `TOPIC#${topicId}`,
          },
          UpdateExpression: "add GSI1SK :decr",
          ExpressionAttributeValues: {
            ":decr": -1,
          },
        },
      },
    ];

    for (const item of itemsToDelete) {
      currentBatch.push({
        Delete: {
          TableName: process.env.DYNAMO_TABLE_NAME,
          Key: {
            PK: `QUESTION#${req.query.questionId}`,
            SK: item.SK,
          },
        },
      });

      if (currentBatch.length === BATCH_SIZE) {
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

    if (metadata?.attachment) {
      await deleteFromS3(metadata.attachment.s3Key);
    }

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler({
  GET: withUser(getQuestion, { throw: false }),
  PATCH: withUser(editQuestion),
  DELETE: withUser(deleteQuestion),
});
