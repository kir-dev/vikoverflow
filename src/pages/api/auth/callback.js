import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import db from "lib/api/db";
import { isSecureEnvironment } from "lib/utils";
import handler from "lib/api/handler";
import { HTTPError } from "lib/utils";

async function handleCallbackFromOauth(req, res) {
  const { code, state } = req.query;

  if (state !== process.env.OAUTH_SECRET) {
    throw new HTTPError(400, "bad secret");
  }

  const response = await fetch("https://auth.sch.bme.hu/oauth2/token", {
    body: `grant_type=authorization_code&code=${code}`,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.OAUTH_ID}:${process.env.OAUTH_PASS}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  if (!response.ok) {
    throw new HTTPError(400, "error getting token");
  }

  const { access_token } = await response.json();

  const dataResponse = await fetch(
    `https://auth.sch.bme.hu/api/profile?access_token=${access_token}`
  );

  if (!dataResponse.ok) {
    throw new HTTPError(400, "error fetching data");
  }

  const {
    internal_id: id,
    displayName: name,
    mail: email,
  } = await dataResponse.json();

  if (!id) {
    throw new HTTPError(400, "could not get user id from authsch");
  }

  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      PK: `USER#${id}`,
      SK: `USER#${id}`,
    },
    UpdateExpression: "set #n = :name, email = :email",
    ExpressionAttributeNames: {
      "#n": "name",
    },
    ExpressionAttributeValues: {
      ":name": name,
      ":email": email,
    },
  };

  await db.update(params).promise();

  res.setHeader("Set-Cookie", [
    serialize(
      "token",
      jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      }),
      {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: isSecureEnvironment(req),
        path: "/",
        sameSite: true,
      }
    ),
    serialize("logged-in", "1", {
      maxAge: 60 * 60 * 24 * 7,
      secure: isSecureEnvironment(req),
      path: "/",
      sameSite: true,
    }),
  ]);

  return res.redirect("/");
}

export default handler({
  GET: handleCallbackFromOauth,
});
