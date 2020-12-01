import handler from "../../../../src/lib/api/handler";

describe("handler", () => {
  it("should throw an error when an invalid method is passed", () => {
    const mapping1 = {
      GET: () => {},
      P0ST: () => {},
    };

    const mapping2 = {
      get: () => {},
      post: () => {},
    };

    const mapping3 = {
      GET: "test",
    };

    expect(() => {
      handler(mapping1);
    }).toThrow("Invalid method in mapping");
    expect(() => {
      handler(mapping2);
    }).toThrow("Invalid method in mapping");
    expect(() => {
      handler(mapping3);
    }).toThrow("Methods value is not a function");
  });

  it("should return with a function which handles invalid incoming request methods correctly", () => {
    const mapping = {
      GET: () => {},
      PATCH: () => {},
    };

    const fn = handler(mapping);

    const req = {
      method: "POST",
    };
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();

    fn(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", ["GET", "PATCH"]);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method POST Not Allowed" });
  });

  it("should return with a function which handles valid incoming request methods correctly", () => {
    const mapping = {
      GET: jest.fn(),
    };

    const fn = handler(mapping);

    const req = {
      method: "GET",
    };
    const res = {
      key: "value",
    };

    fn(req, res);

    expect(mapping.GET).toHaveBeenCalledWith(req, res);
  });
});
