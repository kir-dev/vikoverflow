import handler from "lib/api/handler";

async function redirectToOauth(req, res) {
  return res.redirect(
    `https://auth.sch.bme.hu/site/login?response_type=code&client_id=${process.env.OAUTH_ID}&state=${process.env.OAUTH_SECRET}&scope=basic+displayName+mail`
  );
}

export default handler({
  GET: redirectToOauth,
});
