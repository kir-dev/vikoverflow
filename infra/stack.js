const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const dynamodb = require("@aws-cdk/aws-dynamodb");

class VikoverflowStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    new s3.Bucket(this, "UserContentBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: process.env.S3_BUCKET_NAME,
      accessControl: s3.BucketAccessControl.PUBLIC_READ,
    });

    const table = new dynamodb.Table(this, "Table", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      tableName: process.env.DYNAMO_TABLE_NAME,
      readCapacity: 1,
      writeCapacity: 1,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
    });
    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.NUMBER },
      readCapacity: 1,
      writeCapacity: 1,
    });
    table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "topic", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.NUMBER },
      readCapacity: 1,
      writeCapacity: 1,
    });
    table.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: { name: "creator", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.NUMBER },
      readCapacity: 1,
      writeCapacity: 1,
    });
  }
}

const app = new cdk.App();
new VikoverflowStack(app, "VikoverflowStack");
app.synth();

module.exports = { VikoverflowStack };
