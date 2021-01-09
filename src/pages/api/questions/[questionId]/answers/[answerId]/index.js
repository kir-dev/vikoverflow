import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { getAnswerSchema } from "lib/schemas";
import { trimLineBreaks, HTTPError } from "lib/utils";
import handler from "lib/api/handler";
import parseMultipart from "lib/api/parse-multipart";
import { DELETE_CURRENT_FILE } from "lib/constants";
import { uploadToS3, deleteFromS3 } from "lib/api/s3";

// https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
const BATCH_SIZE = 25;

async function editAnswer(req, res) {
  const { parsedFields, parsedFiles } = await parseMultipart(req);

  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      PK: `QUESTION#${req.query.questionId}`,
      SK: `ANSWER#${req.query.answerId}`,
    },
    UpdateExpression: "set",
    ExpressionAttributeValues: {
      ":creator": req.user.id,
    },
    ConditionExpression: "creator = :creator",
    ReturnValues: "ALL_OLD",
  };

  const isValid = await getAnswerSchema(true).isValid(parsedFields);

  if (!isValid) {
    throw new HTTPError(400, "request not in desired format");
  }

  const allowedKeys = ["body"];
  const updates = Object.entries(parsedFields).filter(([key, _]) =>
    allowedKeys.includes(key)
  );

  if (!updates.length) {
    throw new HTTPError(400, "No updates");
  }

  updates.forEach(([key, value], i) => {
    params.UpdateExpression += ` ${key} = :${key}${
      i !== updates.length - 1 ? "," : ""
    }`;

    if (key === "body") {
      value = trimLineBreaks(value);
    }

    params.ExpressionAttributeValues[`:${key}`] = value;
  });

  if (parsedFiles.length && parsedFields.file !== DELETE_CURRENT_FILE) {
    const file = parsedFiles[0];

    const key = await uploadToS3({
      body: file.body,
      contentType: file.contentType,
      metadata: {
        questionId: req.query.questionId,
        answerId: req.query.answerId,
        creator: req.user.id,
        createdAt: Date.now().toString(),
        originalName: encodeURIComponent(file.originalName),
      },
      contentDisposition: `inline; filename="${encodeURIComponent(
        file.originalName
      )}"`,
    });

    params.UpdateExpression += `, attachment = :attachment`;
    params.ExpressionAttributeValues[":attachment"] = {
      s3Key: key,
      originalName: file.originalName,
    };
  }

  if (parsedFields.file === DELETE_CURRENT_FILE) {
    params.UpdateExpression += " remove attachment";
  }

  const { Attributes } = await db.update(params).promise();

  if (
    (parsedFiles.length || parsedFields.file === DELETE_CURRENT_FILE) &&
    Attributes.attachment
  ) {
    await deleteFromS3(Attributes.attachment.s3Key);
  }

  return res.json({ success: true });
}

async function deleteAnswer(req, res) {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      PK: `QUESTION#${req.query.questionId}`,
      SK: `ANSWER#${req.query.answerId}`,
    },
  };

  const { Item: metadata } = await db.get(params).promise();

  if (!metadata) {
    throw new HTTPError(404, "Answer not found.");
  }

  let cursor;
  let itemsToDelete = [];

  do {
    const queryParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      KeyConditionExpression: "PK = :PK and begins_with(SK, :prefix)",
      ProjectionExpression: "SK",
      ExpressionAttributeValues: {
        ":PK": `QUESTION#${req.query.questionId}`,
        ":prefix": `ANSWERUPVOTE#${req.query.answerId}`,
      },
    };

    if (cursor) {
      queryParams.ExclusiveStartKey = cursor;
    }

    const { Items, LastEvaluatedKey } = await db.query(queryParams).promise();

    cursor = LastEvaluatedKey;
    itemsToDelete.push(...Items);
  } while (cursor);

  const batches = [];
  let currentBatch = [
    {
      Delete: {
        TableName: process.env.DYNAMO_TABLE_NAME,
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
        TableName: process.env.DYNAMO_TABLE_NAME,
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
  PATCH: withUser(editAnswer),
  DELETE: withUser(deleteAnswer),
});
