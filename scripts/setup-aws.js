require("dotenv").config();
const aws = require("aws-sdk");
const chalk = require("chalk");

(async function setup() {
  console.info(chalk.blue("setting up AWS environment..."));

  // Setting up DynamoDB
  {
    const db = new aws.DynamoDB({
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      region: process.env.REGION,
    });

    const params = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      BillingMode: "PROVISIONED",
      KeySchema: [
        {
          AttributeName: "PK",
          KeyType: "HASH",
        },
        {
          AttributeName: "SK",
          KeyType: "RANGE",
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 2,
        WriteCapacityUnits: 2,
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            {
              AttributeName: "GSI1PK",
              KeyType: "HASH",
            },
            {
              AttributeName: "GSI1SK",
              KeyType: "RANGE",
            },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2,
          },
        },
        {
          IndexName: "GSI2",
          KeySchema: [
            {
              AttributeName: "topic",
              KeyType: "HASH",
            },
            {
              AttributeName: "createdAt",
              KeyType: "RANGE",
            },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2,
          },
        },
        {
          IndexName: "GSI3",
          KeySchema: [
            {
              AttributeName: "creator",
              KeyType: "HASH",
            },
            {
              AttributeName: "createdAt",
              KeyType: "RANGE",
            },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2,
          },
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "PK",
          AttributeType: "S",
        },
        {
          AttributeName: "SK",
          AttributeType: "S",
        },
        {
          AttributeName: "GSI1PK",
          AttributeType: "S",
        },
        {
          AttributeName: "GSI1SK",
          AttributeType: "N",
        },
        {
          AttributeName: "topic",
          AttributeType: "S",
        },
        {
          AttributeName: "creator",
          AttributeType: "S",
        },
        {
          AttributeName: "createdAt",
          AttributeType: "N",
        },
      ],
    };

    const waitForParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
    };

    try {
      await db.createTable(params).promise();
      await db.waitFor("tableExists", waitForParams).promise();
      console.info(chalk.blue("dynamodb - setup successfull"));
    } catch (e) {
      console.info(chalk.red(`dynamodb - ${e.message}`));
    }
  }

  // Setting up S3 bucket
  {
    const s3 = new aws.S3({
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      region: process.env.REGION,
    });

    const createParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      ACL: "public-read",
    };

    const waitForParams = {
      Bucket: process.env.S3_BUCKET_NAME,
    };

    try {
      await s3.createBucket(createParams).promise();
      await s3.waitFor("bucketExists", waitForParams).promise();

      console.info(chalk.blue("s3 - setup successfull"));
    } catch (e) {
      console.info(chalk.red(`s3 - ${e.message}`));
    }
  }

  console.info(chalk.blue("environment setup finished"));
})();
