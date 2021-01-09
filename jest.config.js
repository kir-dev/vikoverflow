module.exports = {
  verbose: true,
  projects: [
    {
      displayName: "e2e",
      preset: "jest-playwright-preset",
      testMatch: ["<rootDir>/tests/e2e/**/*.test.js"],
      moduleDirectories: ["node_modules", "src"],
    },
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
      moduleDirectories: ["node_modules", "src"],
    },
  ],
};
