const fetch = require("node-fetch");

describe("/api/questions", () => {
  it("should return a list of questions", async () => {
    const data = await (
      await fetch("http://localhost:3000/api/questions")
    ).json();

    expect(data.questions).toBeTruthy();
  });
});
