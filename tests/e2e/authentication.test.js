import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(1000 * 60 * 2);

describe("frontend authentication flow", () => {
  it("should deny access to private routes for unauthenticated requests", async () => {
    await page.goto("http://localhost:3000/profil");
    await expect(page.url()).toBe("http://localhost:3000/belepes");

    await page.goto("http://localhost:3000/uj");
    await expect(page.url()).toBe("http://localhost:3000/belepes");

    await page.goto("http://localhost:3000/kerdes/__test__/szerkesztes");
    await expect(page.url()).toBe("http://localhost:3000/belepes");
  });

  it("should allow users to log in and get an auth token then access private routes", async () => {
    await page.goto("http://localhost:3000/belepes");
    await page.click("text=Belépés AuthSCH fiókkal");
    await page.fill("#LoginForm_username", process.env.TEST_OAUTH_USERNAME);
    await page.fill("#LoginForm_password", process.env.TEST_OAUTH_PASSWORD);
    await page.click("text=Bejelentkezés");

    // AuthSCH sometimes shows a second confirmation button
    if ((await page.url()) !== "http://localhost:3000/") {
      await page.click("text=Engedélyezés");
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

    // tries to access private route -> success
    await page.goto("http://localhost:3000/profil");

    await expect(page).toHaveSelector(
      `text=${process.env.TEST_OAUTH_PROFILE_NAME}`
    );
    await expect(page.url()).toBe("http://localhost:3000/profil");
  });

  it("should redirect authenticated users to the index page", async () => {
    await page.goto("http://localhost:3000/belepes");
    await page.waitForTimeout(1000);
    await expect(page.url()).toBe("http://localhost:3000/");
  });
});
