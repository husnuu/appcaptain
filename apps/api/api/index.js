import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Production bundle is written to ./handler.cjs by pnpm build:vercel. */
const handlerModule = require("./handler.cjs");
const handler = typeof handlerModule === "function" ? handlerModule : handlerModule.default;

export default handler;

export const config = {
  maxDuration: 30,
};
