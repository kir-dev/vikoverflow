import withUser from "lib/api/with-user";
import { serialize } from "cookie";

export default withUser(async function (req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    res.setHeader("Set-Cookie", [
      serialize("token", "", {
        maxAge: 0,
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        path: "/",
        sameSite: "lax",
      }),
      serialize("logged-in", "", {
        maxAge: 0,
        // secure: process.env.NODE_ENV === 'production',
        path: "/",
        sameSite: "lax",
      }),
    ]);

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});
