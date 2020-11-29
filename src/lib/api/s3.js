import aws from "aws-sdk";
import { nanoid } from "nanoid";

const s3 = new aws.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

export async function getFromS3(key) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  return await s3.getObject(params).promise();
}

export async function deleteFromS3(key) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  await s3.deleteObject(params).promise();
}

export async function uploadToS3(file) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: nanoid(),
    Body: file.body,
    ContentType: file.contentType,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  };

  if (file.metadata) {
    params.Metadata = file.metadata;
  }

  if (file.contentDisposition) {
    params.ContentDisposition = file.contentDisposition;
  }

  const { Key } = await s3.upload(params).promise();

  return Key;
}
