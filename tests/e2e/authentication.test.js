import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(1000 * 60 * 3);

describe("frontend authentication flow", () => {
  it("should allow users to log in and get an auth token to access private routes", async () => {
    await page.goto("http://localhost:3000/profil");
    const buttonText = await (
      await page.textContent('[data-test="loginButton"]')
    ).trim();

    expect(buttonText).toBe("Belépés AuthSCH fiókkal");

    await page.click("text=Belépés AuthSCH fiókkal");
    await page.fill("#LoginForm_username", process.env.TEST_OAUTH_USERNAME);
    await page.fill("#LoginForm_password", process.env.TEST_OAUTH_PASSWORD);

    await page.click("text=Bejelentkezés", { timeout: 1000 * 60 * 1 });

    try {
      await page.click("text=Engedélyezés", { timeout: 1000 * 60 * 1 });
    } catch (error) {
      // no-op, AuthSCH sometimes does not show the second confirmation button
    }

    const cookies = await context.cookies();
    const tokenCookie = cookies.find((c) => c.name === "token");
    const loggedInCookie = cookies.find((c) => c.name === "logged-in");

    expect(tokenCookie.value).toBeTruthy();
    expect(tokenCookie.httpOnly).toBe(true);
    expect(tokenCookie.sameSite).toBe("Strict");

    expect(loggedInCookie.value).toBe("1");
    expect(loggedInCookie.httpOnly).toBe(false);
    expect(loggedInCookie.sameSite).toBe("Strict");

    await page.goto("http://localhost:3000/profil");
    await page.waitForSelector(`text=${process.env.TEST_OAUTH_PROFILE_NAME}`);
  });
});
