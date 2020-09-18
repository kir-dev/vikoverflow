import dotenv from "dotenv";
dotenv.config();

describe("frontend authentication flow", () => {
  it.skip("should not let non-authenticated users access the private routes", async () => {
    await page.goto("http://localhost:3000/profil");
    const buttonText = await (
      await page.textContent('[data-test="loginButton"]')
    ).trim();

    expect(buttonText).toBe("Belépés AuthSCH fiókkal");
  });

  it.skip("should allow users to sing in with AuthSCH and recieve a token", async () => {
    await page.click("text=Belépés AuthSCH fiókkal");
    await page.fill("#LoginForm_username", process.env.TEST_OAUTH_USERNAME);
    await page.fill("#LoginForm_password", process.env.TEST_OAUTH_PASSWORD);

    await page.click("text=Bejelentkezés");

    try {
      await page.click("text=Engedélyezés", { timeout: 1000 * 3 });
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
  });

  it.skip("should allow authenticated users to access the private routes", async () => {
    await page.goto("http://localhost:3000/profil");
    await page.waitForSelector(`text=${process.env.TEST_OAUTH_PROFILE_NAME}`);
  });
});
