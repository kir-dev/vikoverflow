const puppeteer = require("puppeteer");
const next = require("next/dist/server/next");
const path = require("path");
const http = require("http");

const url = (endpoint = "") => "http://localhost:3000" + endpoint;

let app;
let server;
let token;

jest.setTimeout(1000 * 60 * 5);

beforeAll(async () => {
  app = next({
    dir: path.join(__dirname, "../"),
    dev: false,
    quiet: true,
  });

  await app.prepare();

  server = http.createServer(app.getRequestHandler());
  await new Promise((resolve, reject) => {
    server.listen(3000, (err, res) => {
      if (err) reject(err);
      resolve();
    });
  });
});

afterAll(async () => {
  await app.close();
  await new Promise((resolve, reject) => {
    server.close((err, res) => {
      if (err) reject(err);
      resolve();
    });
  });
});

describe("frontend", () => {
  describe("auth", () => {
    it("should not let non-authenticated users access the private routes", async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url("/profil"));
      await page.waitForSelector('[data-test="loginButton"]');
      const buttonText = await page.$eval(
        '[data-test="loginButton"]',
        (el) => el.innerText
      );

      await browser.close();
      expect(buttonText).toEqual("Belépés AuthSCH fiókkal");
    });

    it("should allow users to sing in with AuthSCH and recieve a token", async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(url("/belepes"));

      await page.waitForSelector('[data-test="loginButton"]');
      await page.click('[data-test="loginButton"]');

      await page.waitForSelector("#LoginForm_username");
      await page.type("#LoginForm_username", process.env.OAUTH_LOGIN_USER_1);
      await page.type("#LoginForm_password", process.env.OAUTH_LOGIN_PASS_1);

      await Promise.all([
        page.click("button[type=submit]"),
        page.waitForNavigation(),
      ]);

      const cookies = await page.cookies();
      token = cookies.find((c) => c.name === "token").value;

      await browser.close();
      expect(token).toBeTruthy();
    });

    it("should allow authenticated users to access private routes", async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setCookie({
        name: "logged-in",
        value: "1",
        url: url(),
        path: "/",
        sameSite: "Lax",
      });
      await page.setCookie({
        name: "token",
        value: token,
        httpOnly: true,
        url: url(),
        path: "/",
        sameSite: "Lax",
      });
      await page.goto(url("/profil"));
      await page.waitForSelector('[data-test="userIsLoggedIn"]');

      await browser.close();
    });
  });
});
