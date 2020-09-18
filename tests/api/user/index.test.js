const fetch = require("node-fetch");

describe("/api/user", () => {
  it("should return 400 if no token is supplied", async () => {
    const res = await fetch("http://localhost:3000/api/user");
    const data = await res.json();

    expect(res.status).toEqual(400);
    expect(data).toEqual({ error: "Missing token" });
  });
});
