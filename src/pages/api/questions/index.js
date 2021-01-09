import db from "lib/api/db";
import withUser from "lib/api/with-user";
import { QuestionSchema } from "lib/schemas";
import { nanoid } from "nanoid";
import {
  trimSpaces,
  trimLineBreaks,
  truncateBody,
  encodeJSON,
  decodeJSON,
} from "lib/utils";
import parseMultipart from "lib/api/parse-multipart";
import { uploadToS3 } from "lib/api/s3";
import handler from "lib/api/handler";
import es from "lib/api/es";
import { HTTPError } from "lib/utils";

function mapQuestions(rawDbItems) {
  return rawDbItems.map(
    ({
      PK,
      topics,
      upvotes,
      creator,
      createdAt,
      title,
      body,
      numberOfAnswers,
    }) => ({
      id: PK.split("#")[1],
      topics,
      upvotes: {
        count: upvotes,
      },
      creator,
      createdAt,
      title,
      body: truncateBody(body),
      answers: {
        count: numberOfAnswers,
      },
    })
  );
}

function mapEs(rawEsItems) {
  return rawEsItems.map(
    ({ type, upvotes, numberOfAnswers, body, ...rest }) => ({
      ...rest,
      upvotes: { count: upvotes },
      answers: {
        count: numberOfAnswers,
      },
      body: truncateBody(body),
    })
  );
}

export async function getQuestions(cursor) {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :GSI1PK",
    ScanIndexForward: false,
    ExpressionAttributeValues: {
      ":GSI1PK": "QUESTION",
    },
    Limit: 10,
  };

  if (cursor) {
    params.ExclusiveStartKey = cursor;
  }

  const { Items, LastEvaluatedKey } = await db.query(params).promise();

  const responseObj = {
    questions: mapQuestions(Items),
  };

  if (LastEvaluatedKey) {
    responseObj.nextCursor = encodeJSON(LastEvaluatedKey);
  }

  return responseObj;
}

export async function getQuestionsByTopic(topic, cursor) {
  // checking if topic actually exists
  {
    const params = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: {
        PK: `TOPIC#${topic}`,
        SK: `TOPIC#${topic}`,
      },
      ProjectionExpression: "PK",
    };

    const { Item } = await db.get(params).promise();

    if (!Item) {
      throw new Error("topic not found");
    }
  }

  const params = {
    index: process.env.ELASTICSEARCH_INDEX_NAME,
    body: {
      query: {
        match: {
          topics: topic,
        },
      },
      sort: [{ createdAt: "desc" }],
    },
  };

  if (cursor) {
    params.body.search_after = cursor;
  }

  const results = await es.search(params);

  const rawQuestions = results.body.hits.hits.map((h) => h._source);

  const responseObj = {
    questions: mapEs(rawQuestions),
  };

  if (rawQuestions.length === 10) {
    const lastItem = rawQuestions[9];
    responseObj.nextCursor = encodeJSON([lastItem.createdAt]);
  }

  return responseObj;
}

async function getAllQuestions(req, res) {
  const topic = req.query.topic;
  const cursor = req.query.cursor && decodeJSON(req.query.cursor);

  if (topic) {
    return res.json(await getQuestionsByTopic(topic, cursor));
  }

  return res.json(await getQuestions(cursor));
}

async function createQuestion(req, res) {
  const { parsedFields, parsedFiles } = await parseMultipart(req);

  parsedFields.topics = JSON.parse(parsedFields.topics);

  if (!(await QuestionSchema.isValid(parsedFields))) {
    throw new HTTPError(400, "request not in desired format");
  }

  const questionId = nanoid();
  const createdAt = Date.now();

  const params = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.DYNAMO_TABLE_NAME,
          Item: {
            PK: `QUESTION#${questionId}`,
            SK: `QUESTION#${questionId}`,
            GSI1PK: "QUESTION",
            GSI1SK: createdAt,
            title: trimSpaces(parsedFields.title),
            body: trimLineBreaks(parsedFields.body),
            upvotes: 0,
            numberOfAnswers: 0,
            topics: parsedFields.topics,
            creator: req.user.id,
            createdAt,
          },
        },
      },
    ],
  };

  for (const topic of parsedFields.topics) {
    params.TransactItems.push({
      // increasing the numberOfQuestions on each topic
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
          ":incr": 1,
        },
      },
    });
  }

  if (parsedFiles.length) {
    const file = parsedFiles[0];

    const key = await uploadToS3({
      body: file.body,
      contentType: file.contentType,
      metadata: {
        questionId,
        creator: req.user.id,
        createdAt: Date.now().toString(),
        originalName: encodeURIComponent(file.originalName),
      },
      contentDisposition: `inline; filename="${encodeURIComponent(
        file.originalName
      )}"`,
    });

    params.TransactItems[0].Put.Item.attachment = {
      s3Key: key,
      originalName: file.originalName,
    };
  }

  await db.transactWrite(params).promise();

  return res.json({ id: questionId });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler({
  GET: getAllQuestions,
  POST: withUser(createQuestion),
});
