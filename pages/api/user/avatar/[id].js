import { getFromS3 } from "lib/api/s3";
import sharp from "sharp";

export default async function getUserAvatar(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    const size = req.query.size ? parseInt(req.query.size) * 2 : 200;

    const data = await getFromS3(req.query.id);

    res.setHeader("Cache-Control", "max-age=31536000, immutable");
    res.setHeader("Content-Type", data.ContentType);

    const optimizedImage = await sharp(data.Body).resize(size, size).toBuffer();
    return res.send(optimizedImage);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
