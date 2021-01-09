import { uploadToS3, deleteFromS3 } from "lib/api/s3";
import withUser from "lib/api/with-user";
import db from "lib/api/db";
import parseMultipart from "lib/api/parse-multipart";
import handler from "lib/api/handler";
import { HTTPError } from "lib/utils";

async function addCustomUserStuff(req, res) {
  const { parsedFiles } = await parseMultipart(req);
  let key;
  const file = parsedFiles[0];

  if (!file) {
    throw new HTTPError(400, "no file");
  }

  try {
    key = await uploadToS3({
      body: file.body,
      contentType: file.contenctType,
      metadata: {
        creator: req.user.id,
        createdAt: Date.now().toString(),
      },
    });
  } catch (e) {
    throw new HTTPError(400, e.message);
  }

  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      PK: `USER#${req.user.id}`,
      SK: `USER#${req.user.id}`,
    },
    UpdateExpression: "set avatar = :avatar",
    ExpressionAttributeValues: {
      ":avatar": key,
    },
    ReturnValues: "ALL_OLD",
  };

  const oldData = await db.update(params).promise();

  if (oldData?.Attributes?.avatar) {
    await deleteFromS3(oldData.Attributes.avatar);
  }

  return res.json({ s3Key: key });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler({
  POST: withUser(addCustomUserStuff),
});
