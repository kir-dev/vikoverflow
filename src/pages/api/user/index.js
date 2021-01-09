import withUser from "lib/api/with-user";
import handler from "lib/api/handler";

async function getUser(req, res) {
  return res.json({ user: req.user });
}

export default handler({
  GET: withUser(getUser),
});
