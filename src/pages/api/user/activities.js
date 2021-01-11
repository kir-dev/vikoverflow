import db from "lib/api/db";
import { ACTIVITY } from "lib/constants";
import withUser from "lib/api/with-user";
import handler from "lib/api/handler";
import { encodeJSON, decodeJSON } from "lib/utils";

async function getUserActivities(req, res) {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    IndexName: "GSI2",
    KeyConditionExpression: "creator = :creator",
    ScanIndexForward: false,
    ExpressionAttributeValues: {
      ":creator": req.user.id,
    },
    Limit: 10,
    ProjectionExpression: "PK, SK, title, creator, createdAt",
  };

  if (req.query.cursor) {
    params.ExclusiveStartKey = decodeJSON(req.query.cursor);
  }

  const { Items, LastEvaluatedKey } = await db.query(params).promise();

  // population with the items we already fetched
  const extraMetadata = Items.filter((e) => e.SK.startsWith(ACTIVITY.QUESTION));

  // Prefixes of items who need their parent question fetched
  const neededPrefixes = [
    ACTIVITY.QUESTION_UPVOTE,
    ACTIVITY.ANSWER,
    ACTIVITY.ANSWER_UPVOTE,
  ];

  // Questions needed to be fetch for additional info
  const additionalQuestions = new Set();

  for (let activity of Items) {
    // an activity's parent will be fetched if the activity has the correct prefix and we don't
    // already have the parent downloaded
    const isNeeded =
      neededPrefixes.includes(activity.SK.split("#")[0] + "#") &&
      !extraMetadata.find((e) => e.SK === activity.PK);

    if (isNeeded) {
      additionalQuestions.add(activity.PK);
    }
  }

  if (additionalQuestions.size) {
    const additionalInfoParams = {
      RequestItems: {
        [process.env.DYNAMO_TABLE_NAME]: {
          Keys: [...additionalQuestions].map((v) => ({ PK: v, SK: v })),
          ProjectionExpression: "PK, SK, title",
        },
      },
    };

    const {
      Responses: { [process.env.DYNAMO_TABLE_NAME]: responseQuestions },
    } = await db.batchGet(additionalInfoParams).promise();

    extraMetadata.push(...responseQuestions);
  }

  const activities = Items.map((activity) => {
    if (activity.SK.startsWith(ACTIVITY.QUESTION)) {
      return {
        type: ACTIVITY.QUESTION,
        title: activity.title,
        id: activity.SK.split("#")[1],
      };
    }

    if (activity.SK.startsWith(ACTIVITY.TOPIC)) {
      return {
        type: ACTIVITY.TOPIC,
        name: activity.SK.split("#")[1],
      };
    }

    if (activity.SK.startsWith(ACTIVITY.ANSWER)) {
      return {
        type: ACTIVITY.ANSWER,
        title: extraMetadata.find((e) => e.PK === activity.PK).title,
        id: activity.PK.split("#")[1],
      };
    }

    if (activity.SK.startsWith(ACTIVITY.QUESTION_UPVOTE)) {
      return {
        type: ACTIVITY.QUESTION_UPVOTE,
        title: extraMetadata.find((e) => e.PK === activity.PK).title,
        id: activity.PK.split("#")[1],
      };
    }

    if (activity.SK.startsWith(ACTIVITY.ANSWER_UPVOTE)) {
      return {
        type: ACTIVITY.ANSWER_UPVOTE,
        title: extraMetadata.find((e) => e.PK === activity.PK).title,
        id: activity.PK.split("#")[1],
      };
    }

    return null;
  }).filter((a) => !!a);

  const responseObj = {
    activities,
  };

  if (LastEvaluatedKey) {
    responseObj.nextCursor = encodeJSON(LastEvaluatedKey);
  }

  return res.json(responseObj);
}

export default handler({
  GET: withUser(getUserActivities),
});
