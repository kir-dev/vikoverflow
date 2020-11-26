const { DynamoDB } = require("aws-sdk");
const { Client } = require("@elastic/elasticsearch");
const { serializeError } = require("serialize-error");

function mapRecord(record) {
  const converted = DynamoDB.Converter.output({
    M: record,
  });

  const type = converted.SK.split("#")[0].toLowerCase();

  switch (type) {
    case "topic":
      return {
        type,
        id: converted.PK.split("#")[1],
      };

    case "question":
      return {
        type,
        id: converted.PK.split("#")[1],
        title: converted.title,
        body: converted.body,
        topics: converted.topics,
        createdAt: converted.createdAt,
        upvotes: converted.upvotes,
        creator: converted.creator,
        numberOfAnswers: converted.numberOfAnswers,
      };

    case "answer":
      return {
        type,
        id: converted.SK.split("#")[1],
        questionId: converted.PK.split("#")[1],
        body: converted.body,
      };

    case "user":
      return {
        type,
        id: converted.PK.split("#")[1],
        name: converted.name,
      };

    default:
      return;
  }
}

const client = new Client({
  node: `https://${process.env.ES_DOMAIN}`,
  auth: {
    username: process.env.ES_USER,
    password: process.env.ES_PASSWORD,
  },
});

exports.handler = async function (event, context) {
  try {
    console.info("event:", JSON.stringify(event, null, 2));

    for (const record of event.Records.filter((record) => record.dynamodb)) {
      try {
        const id = `${record.dynamodb.Keys.PK.S}|${record.dynamodb.Keys.SK.S}`;

        if (record.eventName === "REMOVE") {
          if (
            !["topic", "question", "answer", "user"].includes(
              record.dynamodb.Keys.SK.S?.split("#")?.[0]?.toLowerCase()
            )
          ) {
            continue;
          }

          console.info("deleting:", id);

          const result = await client.delete({
            index: process.env.ES_INDEX,
            id,
          });

          console.info("result:", JSON.stringify(result, null, 2));

          continue;
        }

        const document = mapRecord(record.dynamodb.NewImage);

        if (!document) {
          continue;
        }

        console.info("indexing:", id);

        const result = await client.index({
          index: process.env.ES_INDEX,
          id,
          body: document,
        });

        console.info("result:", JSON.stringify(result, null, 2));
      } catch (e) {
        console.error("error:", JSON.stringify(serializeError(e), null, 2));
      }
    }
  } catch (e) {
    console.error("error:", JSON.stringify(serializeError(e), null, 2));
  }
};
