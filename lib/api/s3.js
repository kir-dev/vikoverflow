import Busboy from "busboy";
import aws from "aws-sdk";
import { nanoid } from "nanoid";

export async function getFromS3(key) {
  const s3 = new aws.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  });

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

 return await s3.getObject(params).promise();
}

export async function deleteFromS3(key) {
  const s3 = new aws.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  });

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  await s3.deleteObject(params).promise();
}

// has to be used with
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
export async function uploadToS3(request) {
  const busboy = new Busboy({
    headers: request.headers,
    limits: { fileSize: 1024 * 1024 * 5, files: 1 },
  });

  const filesToUpload = [];

  await new Promise((resolve, reject) => {
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];

      file.on("data", (data) => chunks.push(data));

      file.on("limit", () => reject("file too big"));

      file.on("end", () => {
        filesToUpload.push({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: nanoid(),
          Body: Buffer.concat(chunks),
          ContentType: mimetype,
        });
      });
    });

    busboy.on("filesLimit", () => reject("too many files"));

    busboy.on("finish", resolve);

    request.pipe(busboy);
  });

  if (filesToUpload.length !== 1) {
    throw new Error("Invalid number of files");
  }

  const s3 = new aws.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  });

  const { Key } = await s3.upload(filesToUpload[0]).promise();

  return Key;
}
