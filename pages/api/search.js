import { Client } from "@elastic/elasticsearch";
import { truncateBody } from "lib/utils";

const client = new Client({
  node: process.env.ELASTICSEARCH_DOMAIN_ENDPOINT,
  auth: {
    username: process.env.ELASTICSEARCH_USER,
    password: process.env.ELASTICSEARCH_PW,
  },
});

export default async function search(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!req.query.q) {
      return res
        .status(400)
        .json({ error: "query parameter 'q' not provided" });
    }

    const result = await client.search({
      index: process.env.ELASTICSEARCH_INDEX_NAME,
      body: {
        query: {
          multi_match: {
            query: req.query.q,
            fuzziness: "AUTO",
            fields: ["*"],
          },
        },
      },
    });

    const mappedResults = result.body.hits.hits.map((h) =>
      h._source.body
        ? { ...h._source, body: truncateBody(h._source.body) }
        : h._source
    );

    return res.json({ results: mappedResults });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
