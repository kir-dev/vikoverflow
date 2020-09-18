import withUser from "../../../../lib/api/with-user";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("with-user helper fn", () => {
  describe("options.throw: true (default)", () => {
    it("should send 400 when no token is provided", async () => {
      const fn = jest.fn();
      const req = {
        cookies: {},
      };
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);

      const handler = withUser(fn);
      await handler(req, res);

      expect(jwt.verify).toHaveBeenCalledTimes(0);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing token" });
    });
  });

  describe("options.throw: false", () => {
    it("should call fn when no token is provided without checking jwt", async () => {
      const fn = jest.fn();
      const req = {
        cookies: {},
      };
      const res = {};
      res.status = jest.fn().mockReturnValue(res);

      const handler = withUser(fn, { throw: false });
      await handler(req, res);

      expect(jwt.verify).toHaveBeenCalledTimes(0);
      expect(res.status).toHaveBeenCalledTimes(0);
      expect(fn).toHaveBeenCalledWith(req, res);
    });
  });
});
