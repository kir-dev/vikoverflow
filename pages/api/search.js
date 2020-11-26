import es from "lib/api/es";
import { truncateBody, encodeJSON, decodeJSON } from "lib/utils";
import handler from "lib/api/handler";

async function search(req, res) {
  try {
    if (!req.query.q) {
      return res
        .status(400)
        .json({ error: "query parameter 'q' not provided" });
    }

    const params = {
      index: process.env.ELASTICSEARCH_INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: req.query.q,
                  fuzziness: "AUTO",
                  fields: ["*"],
                },
              },
            ],
          },
        },
        sort: [{ _score: "desc" }, { _id: "asc" }],
      },
    };

    if (req.query.type) {
      params.body.query.bool.must.push({ match: { type: req.query.type } });
    }

    if (req.query.cursor) {
      params.body.search_after = decodeJSON(req.query.cursor);
    }

    const result = await es.search(params);

    const mappedResults = result.body.hits.hits.map((h) =>
      h._source.body
        ? { ...h._source, body: truncateBody(h._source.body) }
        : h._source
    );

    const responseObj = {
      results: mappedResults,
    };

    if (mappedResults.length === 10) {
      const lastItem = result.body.hits.hits[9];
      responseObj.nextCursor = encodeJSON([lastItem._score, lastItem._id]);
    }

    return res.json(responseObj);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export default handler({
  GET: search,
});
