import handler from "lib/api/handler";

async function redirectToOauth(req, res) {
  try {
    return res.redirect(
      `https://auth.sch.bme.hu/site/login?response_type=code&client_id=${process.env.OAUTH_ID}&state=${process.env.OAUTH_SECRET}&scope=basic+displayName+mail`
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export default handler({
  GET: redirectToOauth,
});
