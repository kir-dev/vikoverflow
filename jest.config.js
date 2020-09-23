module.exports = {
  verbose: true,
  projects: [
    {
      displayName: "e2e",
      preset: "jest-playwright-preset",
      testMatch: ["<rootDir>/tests/e2e/**/*.test.js"],
    },
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
    },
  ],
};
