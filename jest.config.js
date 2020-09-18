module.exports = {
  projects: [
    {
      rootDir: "tests/e2e",
      displayName: "e2e",
      preset: "jest-playwright-preset",
    },
    {
      rootDir: "tests/unit",
      displayName: "unit",
    },
  ],
};
