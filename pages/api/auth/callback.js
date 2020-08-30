import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import db from "lib/api/db";

export default async function handleCallbackFromOauth(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    const { code, state } = req.query;

    if (state !== process.env.OAUTH_SECRET) {
      return res.status(400).json({ error: "bad secret" });
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
      return res.status(400).json({ error: "error getting token" });
    }

    const { access_token } = await response.json();

    const dataResponse = await fetch(
      `https://auth.sch.bme.hu/api/profile?access_token=${access_token}`
    );

    if (!dataResponse.ok) {
      return res.status(400).json({ error: "error fetching data" });
    }

    const {
      internal_id: id,
      displayName: name,
      mail: email,
    } = await dataResponse.json();

    const params = {
      TableName: "vikoverflow",
      Key: {
        PK: `USER#${id}`,
        SK: `USER#${id}`,
      },
      UpdateExpression:
        "set #n = if_not_exists(#n, :name), email = if_not_exists(email, :email)",
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
          // secure: process.env.NODE_ENV === 'production',
          path: "/",
          sameSite: "lax",
        }
      ),
      serialize("logged-in", "1", {
        maxAge: 60 * 60 * 24 * 7,
        // secure: process.env.NODE_ENV === 'production',
        path: "/",
        sameSite: "lax",
      }),
    ]);

    return res.redirect("/");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
