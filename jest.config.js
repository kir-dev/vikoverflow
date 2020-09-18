module.exports = {
  projects: [
    {
      displayName: "e2e",
      preset: "jest-playwright-preset",
      testMatch: ["<rootDir>/tests/e2e/**/*.js"],
    },
    {
      displayName: "api",
      testMatch: ["<rootDir>/tests/api/**/*.js"],
    },
  ],
};
