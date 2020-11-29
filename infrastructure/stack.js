const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const elasticsearch = require("@aws-cdk/aws-elasticsearch");
const lambda = require("@aws-cdk/aws-lambda");
const lambdaNode = require("@aws-cdk/aws-lambda-nodejs");
const { DynamoEventSource } = require("@aws-cdk/aws-lambda-event-sources");

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
      readCapacity: 8,
      writeCapacity: 8,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });
    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.NUMBER },
      readCapacity: 8,
      writeCapacity: 8,
    });
    table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "creator", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.NUMBER },
      readCapacity: 8,
      writeCapacity: 8,
    });

    const es = new elasticsearch.Domain(this, "ElasticSearchDomain", {
      version: elasticsearch.ElasticsearchVersion.V7_7,
      capacity: {
        dataNodeInstanceType: "t3.small.elasticsearch",
      },
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      useUnsignedBasicAuth: true,
      fineGrainedAccessControl: {
        masterUserName: process.env.ELASTICSEARCH_USER,
        masterUserPassword: process.env.ELASTICSEARCH_PW,
      },
    });

    const ddbToEsLambda = new lambdaNode.NodejsFunction(this, "ddbToEsLambda", {
      entry: path.resolve(__dirname, "./es-indexer-lambda.js"),
      environment: {
        ES_DOMAIN: es.domainEndpoint,
        ES_INDEX: process.env.ELASTICSEARCH_INDEX_NAME,
        ES_USER: process.env.ELASTICSEARCH_USER,
        ES_PASSWORD: process.env.ELASTICSEARCH_PW,
      },
    });

    es.grantReadWrite(ddbToEsLambda);

    ddbToEsLambda.addEventSource(
      new DynamoEventSource(table, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 5,
        retryAttempts: 5,
      })
    );
  }
}

const app = new cdk.App();
new VikoverflowStack(app, "VikoverflowStack");
app.synth();

module.exports = { VikoverflowStack };
