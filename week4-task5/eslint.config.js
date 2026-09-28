const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/**", "coverage/**", "generated/**", "docs/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
    rules: {
      "no-unused-vars": ["error", { args: "after-used", argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
    },
  },
  { files: ["test/**/*.js"], languageOptions: { globals: globals.jest } },
  { files: ["public/**/*.js"], languageOptions: { sourceType: "script", globals: { ...globals.browser, io: "readonly" } } },
  // Playwright's evaluate callbacks execute in the browser.
  { files: ["scripts/recordRealtimeDemo.js"], languageOptions: { globals: globals.browser } },
];
