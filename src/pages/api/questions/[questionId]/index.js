import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { QuestionSchema } from "lib/schemas";
import { trimSpaces, trimLineBreaks, HTTPError } from "lib/utils";
import { uploadToS3, deleteFromS3 } from "lib/api/s3";
import parseMultipart from "lib/api/parse-multipart";
import { DELETE_CURRENT_FILE } from "lib/constants";
import handler from "lib/api/handler";

// https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
const BATCH_SIZE = 25;

async function getQuestion(req, res) {
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
    throw new HTTPError(404, "Question not found.");
  }

  const metadata = items.find((e) => e.SK.startsWith("QUESTION#"));
  const answers = items.filter((e) => e.SK.startsWith("ANSWER#"));
  const questionUpvotingUsers = items
    .filter((e) => e.SK.startsWith("QUESTIONUPVOTE#"))
    .map((e) => e.SK.split("#")[1]);

  const question = {
    id: metadata.PK.split("#")[1],
    topics: metadata.topics,
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
          attachment: e.attachment,
        };
      }),
    },
    attachment: metadata.attachment,
  };

  return res.json({ question });
}

async function editQuestion(req, res) {
  const { parsedFields, parsedFiles } = await parseMultipart(req);

  parsedFields.topics = JSON.parse(parsedFields.topics);

  const isValid = await QuestionSchema.isValid(parsedFields);

  if (!isValid) {
    throw new HTTPError(400, "request not in desired format");
  }

  const allowedKeys = ["title", "body", "topics"];

  const updates = Object.entries(parsedFields)
    .filter(([key, _]) => allowedKeys.includes(key))
    .reduce((acc, [currKey, currVal]) => {
      acc[currKey] = currVal;
      return acc;
    }, {});

  if (!Object.keys(updates).length) {
    throw new HTTPError(400, "No updates");
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
    ProjectionExpression: "createdAt, topics, attachment",
  };

  const { Item } = await db.get(getParams).promise();

  // if a key has -1 it has to be removed
  // if it has 1 it has to be added
  const topicOperations = {};

  const oldTopics = Item.topics;
  const newTopics = parsedFields.topics;

  // all old topics which are not in new have to be removed
  oldTopics
    .filter((t) => !newTopics.includes(t))
    .forEach((t) => (topicOperations[t] = -1));

  // all new topics which are not in old have to be added
  newTopics
    .filter((t) => !oldTopics.includes(t))
    .forEach((t) => (topicOperations[t] = 1));

  for (const topic of Object.keys(topicOperations)) {
    const remove = topicOperations[topic] === -1;

    params.TransactItems.push({
      // increasing/decreasing the numberOfQuestions on each topic
      Update: {
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {
          PK: `TOPIC#${topic}`,
          SK: `TOPIC#${topic}`,
        },
        UpdateExpression:
          "add GSI1SK :incr set GSI1PK = if_not_exists(GSI1PK, :GSI1PK)",
        ExpressionAttributeValues: {
          ":GSI1PK": "TOPIC",
          ":incr": remove ? -1 : 1,
        },
      },
    });
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
        originalName: encodeURIComponent(file.originalName),
      },
      contentDisposition: `inline; filename="${encodeURIComponent(
        file.originalName
      )}"`,
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
}

async function deleteQuestion(req, res) {
  let cursor;
  let itemsToDelete = [];

  do {
    const queryParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      KeyConditionExpression: "PK = :PK",
      ProjectionExpression: "SK, topics, creator, attachment, createdAt",
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
    throw new HTTPError(400, "Not authorized to delete this question");
  }

  const batches = [];

  let currentBatch = [];

  for (const topic of metadata.topics) {
    currentBatch.push({
      // decreasing the numberOfQuestions on each topic
      Update: {
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {
          PK: `TOPIC#${topic}`,
          SK: `TOPIC#${topic}`,
        },
        UpdateExpression: "add GSI1SK :incr",
        ExpressionAttributeValues: {
          ":incr": -1,
        },
      },
    });
  }

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

  await Promise.all(batches.map((batch) => db.transactWrite(batch).promise()));

  if (metadata?.attachment) {
    await deleteFromS3(metadata.attachment.s3Key);
  }

  return res.json({ success: true });
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
