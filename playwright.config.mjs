import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "campaign-signup.spec.mjs",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3187",
  },
  webServer: {
    command: "npm run build && npm start -- --hostname 127.0.0.1 --port 3187",
    url: "http://127.0.0.1:3187",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
