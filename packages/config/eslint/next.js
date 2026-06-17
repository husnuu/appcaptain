/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "./base.js",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/jsx-runtime",
  ],
  plugins: ["react", "react-hooks"],
  settings: {
    react: { version: "detect" },
  },
  env: {
    browser: true,
    node: true,
  },
};
