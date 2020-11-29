import withUser from "lib/api/with-user";
import handler from "lib/api/handler";

async function getUser(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    const user = req.user;
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default handler({
  GET: withUser(getUser),
});
