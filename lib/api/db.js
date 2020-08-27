import aws from "aws-sdk";

const ddb = new aws.DynamoDB.DocumentClient({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

export default ddb;
