import { uploadToS3, deleteFromS3 } from "lib/api/s3";
import withUser from "lib/api/with-user";
import db from "lib/api/db";

export default withUser(async function addCustomUserStuff(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    let key;

    try {
      key = await uploadToS3(req);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    if (!key) {
      throw new Error("something is fishy");
    }

    const params = {
      TableName: "vikoverflow",
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
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
