import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createLmcaServer as createPlatformLmcaServer } from "./platform-server.mjs";
import { createLmcaServer as createStagingLmcaServer } from "./staging-server.mjs";

export * from "./platform-server.mjs";

export function createLmcaServer(options = {}) {
  return shouldUseStagingServer(options)
    ? createStagingLmcaServer(options)
    : createPlatformLmcaServer(options);
}

export function createMetaphilosophyStagingServer(options = {}) {
  return createStagingLmcaServer({ ...options, staging: true });
}

function shouldUseStagingServer(options) {
  return options?.staging === true
    || Boolean(options?.dataDir)
    || Boolean(options?.databaseUrl)
    || Boolean(options?.store)
    || Boolean(options?.environment?.STAGING_DATA_DIR)
    || Boolean(options?.environment?.METAPHILOSOPHY_STAGING_DATABASE_URL)
    || Boolean(options?.environment?.STAGING_DATABASE_URL);
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? "127.0.0.1";
  const staging = process.env.METAPHILOSOPHY_SERVER_MODE === "staging"
    || Boolean(process.env.STAGING_DATA_DIR)
    || Boolean(process.env.METAPHILOSOPHY_STAGING_DATABASE_URL)
    || Boolean(process.env.STAGING_DATABASE_URL);
  createLmcaServer(staging ? { staging: true, environment: process.env } : {}).listen(port, host, () => {
    console.log(`${staging ? "Metaphilosophy staging" : "LMCA platform"} server listening on http://${host}:${port}/`);
  });
}
