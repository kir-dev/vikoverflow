import db from "lib/api/db";
import { nanoid } from "nanoid";
import withUser from "lib/api/with-user";
import { getAnswerSchema } from "lib/schemas";
import { trimLineBreaks, HTTPError } from "lib/utils";
import handler from "lib/api/handler";
import parseMultipart from "lib/api/parse-multipart";
import { uploadToS3 } from "lib/api/s3";

async function createAnswer(req, res) {
  const { parsedFields, parsedFiles } = await parseMultipart(req);

  const isValid = await getAnswerSchema().isValid(parsedFields);

  if (!isValid) {
    throw new HTTPError(400, "request not in desired format");
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
            body: trimLineBreaks(parsedFields.body),
            upvotes: 0,
            creator: req.user.id,
            createdAt: Date.now(),
          },
        },
      },
    ],
  };

  if (parsedFiles.length) {
    const file = parsedFiles[0];

    const key = await uploadToS3({
      body: file.body,
      contentType: file.contentType,
      metadata: {
        questionId: req.query.questionId,
        answerId: id,
        creator: req.user.id,
        createdAt: Date.now().toString(),
        originalName: encodeURIComponent(file.originalName),
      },
      contentDisposition: `inline; filename="${encodeURIComponent(
        file.originalName
      )}"`,
    });

    params.TransactItems[1].Put.Item.attachment = {
      s3Key: key,
      originalName: file.originalName,
    };
  }

  await db.transactWrite(params).promise();

  return res.json({ success: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler({
  POST: withUser(createAnswer),
});
