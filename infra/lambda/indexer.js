const { DynamoDB } = require("aws-sdk");
const { Client } = require("@elastic/elasticsearch");

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
        description: converted.description,
      };

    case "question":
      return {
        type,
        id: converted.PK.split("#")[1],
        title: converted.title,
        body: converted.body,
        topicId: converted.topic,
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

exports.handler = async function (event, context) {
  const NODE = process.env.ES_DOMAIN;
  const INDEX = process.env.ES_INDEX;

  console.log("DynamoDB to ES synchronize event triggered");
  console.log("Received event object:", event);
  console.log("ES domain to use:", NODE);

  if (!event.Records) {
    console.log("No records to process. Exiting");
    return;
  }

  const client = new Client({
    node: `https://${NODE}`,
    auth: {
      username: process.env.ES_USER,
      password: process.env.ES_PASSWORD,
    },
  });

  for (const record of event.Records.filter((record) => record.dynamodb)) {
    try {
      let result;

      const keys = record.dynamodb.Keys;

      console.log(JSON.stringify(record));

      const id = `${keys.PK.S}|${keys.SK.S}`;

      if (!id) {
        console.log(
          `Can not detect the ID of the document to index. Make sure the DynamoDB document has a field called '${process.env.PK}'`
        );
        continue;
      }

      if (record.eventName === "REMOVE") {
        console.log("Deleting document: " + id);
        result = await client.delete({
          index: INDEX,
          id,
        });
      } else {
        if (!record.dynamodb.NewImage) {
          console.log(
            "Trying to index new document but the DynamoDB stream event did not provide the NewImage. Skipping..."
          );
          continue;
        }

        console.log("Indexing document: " + id);

        const document = mapRecord(record.dynamodb.NewImage);

        if (!document) {
          console.log(
            "This document does not need to be saved to elasticsearch"
          );
          continue;
        }

        console.log("The full object to store is: ", document);
        result = await client.index({
          index: INDEX,
          id,
          body: document,
        });
      }

      console.log(result);
    } catch (e) {
      console.error("Failed to process DynamoDB row");
      console.error(record);
      console.error(e);
    }
  }
};
