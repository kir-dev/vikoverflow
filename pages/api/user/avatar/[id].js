import { getFromS3 } from "lib/api/s3";

export default async function getUserAvatar(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    const data = await getFromS3(req.query.id);

    res.setHeader(
      "Cache-Control",
      "max-age=31536000, public"
    );
    res.setHeader("Content-Type", data.ContentType);
    return res.send(data.Body);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
