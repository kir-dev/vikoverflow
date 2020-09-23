import withUser from "../../../../lib/api/with-user";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("with-user", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

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

    expect(fn).toHaveBeenCalledTimes(0);
    expect(jwt.verify).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing token" });
  });

  it("should call fn when no token is provided & options.throw = false", async () => {
    const fn = jest.fn();
    const req = {
      cookies: {},
    };
    const res = {};
    res.status = jest.fn().mockReturnValue(res);

    const handler = withUser(fn, { throw: false });
    await handler(req, res);

    expect(req.user).toBe(null);
    expect(jwt.verify).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(0);
    expect(fn).toHaveBeenCalledWith(req, res);
  });

  it("should send 401 when a bad token is provided", async () => {
    const fn = jest.fn();
    const req = {
      cookies: {
        token: "abc123",
      },
    };
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    const handler = withUser(fn);
    await handler(req, res);

    expect(fn).toHaveBeenCalledTimes(0);
    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Bad token" });
  });

  it("should call fn when a bad token is provided & options.throw = false", async () => {
    const fn = jest.fn();
    const req = {
      cookies: {
        token: "abcde123",
      },
    };
    const res = {};
    res.status = jest.fn().mockReturnValue(res);

    const handler = withUser(fn, { throw: false });
    await handler(req, res);

    expect(req.user).toBe(null);
    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledTimes(0);
    expect(fn).toHaveBeenCalledWith(req, res);
  });

  it("should set the req.user correctly and call fn if token is valid", async () => {
    const user = { id: "user1" };
    const fn = jest.fn();
    const req = {
      cookies: {
        token: "abc123",
      },
    };
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    jwt.verify.mockReturnValue(user);

    const handler = withUser(fn);
    await handler(req, res);

    expect(req.user).toEqual(user);
    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledTimes(0);
    expect(fn).toHaveBeenCalledWith(req, res);
  });
});
