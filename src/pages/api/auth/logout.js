import withUser from "lib/api/with-user";
import { serialize } from "cookie";
import { isSecureEnvironment } from "lib/utils";
import handler from "lib/api/handler";

async function logout(req, res) {
  res.setHeader("Set-Cookie", [
    serialize("token", "", {
      maxAge: 0,
      httpOnly: true,
      secure: isSecureEnvironment(req),
      path: "/",
      sameSite: true,
    }),
    serialize("logged-in", "", {
      maxAge: 0,
      secure: isSecureEnvironment(req),
      path: "/",
      sameSite: true,
    }),
  ]);

  return res.json({ success: true });
}

export default handler({
  GET: withUser(logout),
});
