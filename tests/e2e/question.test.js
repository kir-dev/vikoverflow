import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(1000 * 60 * 2);

let createdQuestionId;

beforeAll(async () => {
  await page.goto("http://localhost:3000/belepes");
  await page.click("text=Belépés AuthSCH fiókkal");
  await page.fill("#LoginForm_username", process.env.TEST_OAUTH_USERNAME);
  await page.fill("#LoginForm_password", process.env.TEST_OAUTH_PASSWORD);
  await page.click("text=Bejelentkezés");
  if ((await page.url()) !== "http://localhost:3000/") {
    await page.click("text=Engedélyezés");
  }
  const cookies = await context.cookies();
  const tokenCookie = cookies.find((c) => c.name === "token");

  if (!tokenCookie) {
    throw new Error("login failed");
  }
});

describe("question flow", () => {
  it("should allow users to submit a new question", async () => {
    await page.goto("http://localhost:3000/uj");
    await page.waitForTimeout(1000);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.type("testTitle");
    await page.keyboard.press("Tab");
    await page.keyboard.type("testBody");
    await page.keyboard.press("Tab");
    await page.keyboard.type("e2e-test-topic-1");
    await page.keyboard.press("Enter");

    await page.click("text=Küldés");

    await expect(page).toHaveSelector(
      `text=${process.env.TEST_OAUTH_PROFILE_NAME}`
    );
    await expect(page).toHaveSelector(`text=néhány másodperce`);
    await expect(page).toHaveSelector(`text=testTitle`);
    await expect(page).toHaveSelector(`text=testBody`);
    await expect(page).toHaveSelector(`text=#e2e-test-topic-1`);

    createdQuestionId = (await page.url()).split("/").pop();
  });

  it("should allow users to edit their questions", async () => {
    await page.goto(`http://localhost:3000/kerdes/${createdQuestionId}`);

    await page.click('[data-test="editQuestionButton"]');

    await page.waitForTimeout(1000);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.type("editedTestTitle");
    await page.keyboard.press("Tab");
    await page.keyboard.type("editedTestBody");
    await page.keyboard.press("Tab");
    await page.keyboard.type("e2e-test-topic-2");
    await page.keyboard.press("Enter");

    await page.click("text=Szerkesztés");

    await page.waitForTimeout(2000);
    await expect(page.url()).toBe(
      `http://localhost:3000/kerdes/${createdQuestionId}`
    );
    await expect(page).toHaveSelector(`text=editedTestTitle`);
    await expect(page).toHaveSelector(`text=editedTestBody`);
    await expect(page).toHaveSelector(`text=#e2e-test-topic-1`);
    await expect(page).toHaveSelector(`text=#e2e-test-topic-2`);
  });

  it("should allow users to delete their questions", async () => {
    await page.goto(`http://localhost:3000/kerdes/${createdQuestionId}`);

    await page.click('[data-test="deleteQuestionButton"]');
    await page.click("text=Igen");

    await page.waitForTimeout(1000);
    await expect(page.url()).toBe("http://localhost:3000/");
  });
});
