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

    if (!req.query.size) {
      return res
        .status(400)
        .json({ error: "size query parameter is required" });
    }

    const size = parseInt(req.query.size);

    const data = await getFromS3(req.query.id);

    const acceptsWebP = req.headers?.accept?.split(",")?.includes("image/webp");

    const optimizedImage = await sharp(data.Body)
      .resize(size, size)
      .toFormat(acceptsWebP ? "webp" : "png")
      .toBuffer();

    res.setHeader("Cache-Control", "max-age=31536000, immutable");
    res.setHeader("Content-Type", acceptsWebP ? "image/webp" : "image/png");

    return res.send(optimizedImage);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
