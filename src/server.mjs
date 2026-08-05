import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { createStagingApiHandler } from "../api/staging.mjs";
import { createStagingEventStore } from "./staging-event-store.mjs";
import { StagingWorkflowService } from "./staging-service.mjs";

const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
});

export function createLmcaServer({
  rootDir = resolve(fileURLToPath(new URL("..", import.meta.url))),
  dataDir = process.env.STAGING_DATA_DIR ?? resolve(rootDir, ".staging-data"),
  databaseUrl = process.env.METAPHILOSOPHY_STAGING_DATABASE_URL ?? process.env.STAGING_DATABASE_URL ?? null,
  environment = process.env,
  now,
  store: suppliedStore,
} = {}) {
  const store = suppliedStore ?? createStagingEventStore({
    databaseUrl,
    filePath: databaseUrl ? null : resolve(dataDir, "events.jsonl"),
    environment,
  });
  const service = new StagingWorkflowService({ store, now });
  const runtime = {
    store,
    service,
    csrfSecret: environment.STAGING_CSRF_SECRET ?? environment.STAGING_BOOTSTRAP_TOKEN ?? "local-development-only-secret",
    environment,
    mode: databaseUrl ? "postgres_staging" : "local_file_staging",
  };
  const apiHandler = createStagingApiHandler({ runtime });
  const staticRoot = resolve(rootDir, environment.STAGING_STATIC_ROOT ?? "staging");
  const publicRoot = resolve(rootDir, environment.PUBLIC_STATIC_ROOT ?? "dist");

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname === "/api/health") {
        req.url = "/api/staging?action=health";
        return apiHandler(req, res);
      }
      if (url.pathname === "/api/staging") return apiHandler(req, res);
      if (url.pathname === "/" || url.pathname === "/staging" || url.pathname === "/staging/") {
        return serveFile(res, resolve(staticRoot, "index.html"), { noStore: true, noIndex: true });
      }
      if (url.pathname.startsWith("/staging/")) {
        const relative = url.pathname.slice("/staging/".length) || "index.html";
        const filePath = safeResolve(staticRoot, relative);
        return serveFile(res, filePath, { noStore: true, noIndex: true });
      }
      if (url.pathname.startsWith("/public/")) {
        const relative = url.pathname.slice("/public/".length) || "index.html";
        const filePath = safeResolve(publicRoot, relative);
        return serveFile(res, filePath, { noStore: false, noIndex: false });
      }
      return sendText(res, 404, "Not found\n");
    } catch (error) {
      console.error("server_request_error", error);
      return sendText(res, 500, "Internal server error\n");
    }
  });
}

export async function startLmcaServer(options = {}) {
  const server = createLmcaServer(options);
  const port = Number(options.port ?? process.env.PORT ?? 3000);
  const host = options.host ?? process.env.HOST ?? "127.0.0.1";
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolvePromise();
    });
  });
  const address = server.address();
  console.log(`Metaphilosophy staging server listening on http://${host}:${address.port}/staging/`);
  return server;
}

async function serveFile(res, filePath, { noStore, noIndex }) {
  try {
    const details = await stat(filePath);
    const finalPath = details.isDirectory() ? resolve(filePath, "index.html") : filePath;
    const body = await readFile(finalPath);
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[extname(finalPath).toLowerCase()] ?? "application/octet-stream");
    res.setHeader("Cache-Control", noStore ? "no-store, max-age=0" : "public, max-age=300");
    setBrowserSecurityHeaders(res, { noIndex });
    return res.end(body);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return sendText(res, 404, "Not found\n");
    throw error;
  }
}

function safeResolve(root, relative) {
  const normalizedRelative = normalize(relative).replace(/^([/\\])+/, "");
  const candidate = resolve(root, normalizedRelative);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) throw new Error("Path traversal rejected.");
  return candidate;
}

function sendText(res, status, text) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  setBrowserSecurityHeaders(res, { noIndex: true });
  return res.end(text);
}

function setBrowserSecurityHeaders(res, { noIndex }) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()" );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if (noIndex) res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startLmcaServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
