export default async function redirectToOauth(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    return res.redirect(
      `https://auth.sch.bme.hu/site/login?response_type=code&client_id=${process.env.OAUTH_ID}&state=${process.env.OAUTH_SECRET}&scope=basic+displayName+mail`
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
