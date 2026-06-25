import { createConfiguredApiContext, handleApiRequest } from "../server.mjs";

let contextPromise;

export const config = {
  maxDuration: 300,
};

export default async function handler(request, response) {
  try {
    contextPromise ??= createConfiguredApiContext();
    const context = await contextPromise;
    const url = new URL(request.url ?? "/", `${requestProtocol(request)}://${requestHost(request)}`);
    await handleApiRequest(request, response, url, context);
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(
      JSON.stringify({
        error: "internal_server_error",
        detail: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

function requestHost(request) {
  return headerValue(request.headers, "host") ?? "127.0.0.1";
}

function requestProtocol(request) {
  return headerValue(request.headers, "x-forwarded-proto") ?? (process.env.VERCEL ? "https" : "http");
}

function headerValue(headers, key) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(key);
  return headers[key] ?? headers[key.toLowerCase()] ?? null;
}
