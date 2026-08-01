import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, process.env.PREVIEW_DIRECTORY ?? "dist");
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const host = process.env.HOST ?? "127.0.0.1";

const routeAliases = Object.freeze({
  "/": "index.html",
  "/index.html": "index.html",
  "/research": "research/index.html",
  "/research/": "research/index.html",
  "/arguments": "arguments/index.html",
  "/arguments/": "arguments/index.html",
  "/contribute": "reviewers/closed.html",
  "/contribute/": "reviewers/closed.html",
  "/reviewers": "reviewers/closed.html",
  "/reviewers/": "reviewers/closed.html",
});

const contentTypes = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jsonl": "application/x-ndjson; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
});

function sendText(response, status, text) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "text/plain; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(text);
}

async function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}:${port}`).pathname);
  const aliased = routeAliases[pathname] ?? pathname.replace(/^\/+/, "");
  const normalized = aliased || "index.html";
  const candidate = resolve(dist, normalized);
  if (candidate !== dist && !candidate.startsWith(`${dist}${sep}`)) {
    throw new Error("Path traversal rejected.");
  }
  const metadata = await stat(candidate);
  if (metadata.isDirectory()) {
    const indexPath = resolve(candidate, "index.html");
    const indexMetadata = await stat(indexPath);
    return { path: indexPath, size: indexMetadata.size };
  }
  return { path: candidate, size: metadata.size };
}

export function createStaticPreviewServer() {
  return createServer(async (request, response) => {
    if (!request.url || !["GET", "HEAD"].includes(request.method ?? "")) {
      sendText(response, 405, "Method not allowed\n");
      return;
    }

    try {
      const asset = await resolveRequestPath(request.url);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-length": asset.size,
        "content-type": contentTypes[extname(asset.path).toLowerCase()] ?? "application/octet-stream",
        "permissions-policy": "camera=(), microphone=(), geolocation=()",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(asset.path).pipe(response);
    } catch {
      sendText(response, 404, "Not found\n");
    }
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help")) {
    console.log("Usage: node scripts/serve-static-preview.mjs");
    console.log("Serves the built dist directory with production-like aliases for browser QA. Configure HOST, PORT, and PREVIEW_DIRECTORY through environment variables.");
  } else {
    const server = createStaticPreviewServer();
    server.listen(port, host, () => {
      console.log(`Metaphilosophy static preview listening at http://${host}:${port}`);
    });
  }
}
