require("dotenv").config();

describe("frontend authentication flow", () => {
    it("should not let non-authenticated users access the private routes", async () => {
        await page.goto("http://localhost:3000/profil");
        expect(await page.textContent('[data-test="loginButton"]')).toEqual("Belépés AuthSCH fiókkal")
    })

    it("should allow users to sing in with AuthSCH and recieve a token", async () => {
        await page.click('text=Belépés AuthSCH fiókkal')
        await page.fill('#LoginForm_username', process.env.TEST_OAUTH_USERNAME);
        await page.fill('#LoginForm_password', process.env.TEST_OAUTH_PASSWORD);

        await page.click('text=Bejelentkezés')

        try {
            await page.click('text=Engedélyezés', { timeout: 1000 * 5 });
        } catch (error) {
            // no-op, AuthSCH sometimes does not show the second confirmation button
        }

        const cookies = await context.cookies();
        const tokenCookie = cookies.find(c => c.name === 'token')
        const loggedInCookie = cookies.find(c => c.name === 'logged-in')
        process.env.COOKIES = JSON.stringify([tokenCookie, loggedInCookie]);

        expect(tokenCookie.value).toBeTruthy()
        expect(tokenCookie.httpOnly).toEqual(true)
        expect(tokenCookie.sameSite).toEqual('Strict')

        expect(loggedInCookie.value).toEqual('1')
        expect(loggedInCookie.httpOnly).toEqual(false)
        expect(loggedInCookie.sameSite).toEqual('Strict')
    })

    it('should allow authenticated users to access the private routes', async () => {
        await page.goto("http://localhost:3000/profil");
        await page.waitForSelector(`text=${process.env.TEST_OAUTH_PROFILE_NAME}`)
    })
})