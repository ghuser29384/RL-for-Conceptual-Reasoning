import { createHmac, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";

import { createStagingEventStore } from "../src/staging-event-store.mjs";
import { StagingWorkflowService, serviceError } from "../src/staging-service.mjs";

const COOKIE_NAME = "mp_staging_session";
const JSON_LIMIT_BYTES = 1_000_000;
const RELEASE_PREVIEW_BRANCH = "release/vercel-preview";
const HOSTED_GATEWAY_URL = "https://zpnbshgrscbfelpychhn.supabase.co/functions/v1/metaphilosophy-staging-ledger";
const HOSTED_CSRF_DOMAIN = "metaphilosophy-staging-preview-csrf-v1";
const MUTATING_ACTIONS = new Set([
  "logout",
  "identity.create",
  "invite.create",
  "invite.revoke",
  "invite.replace",
  "assignment.create",
  "draft.save",
  "assignment.submit",
  "correction.request",
  "withdrawal.request",
  "correction.resolve",
  "adjudication.open",
  "adjudication.review",
  "adjudication.close",
]);

let cachedRuntime = null;

export default async function handler(req, res) {
  return createStagingApiHandler()(req, res);
}

export function createStagingApiHandler(options = {}) {
  return async function stagingApiHandler(req, res) {
    setSecurityHeaders(res);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Allow", "GET, POST, PUT, OPTIONS");
      return res.end();
    }

    try {
      const runtime = await getRuntime(options, req);
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const action = url.searchParams.get("action") || "health";
      const sessionToken = readCookie(req.headers.cookie, COOKIE_NAME);
      const body = ["POST", "PUT", "PATCH"].includes(req.method) ? await readJsonBody(req) : {};

      if (MUTATING_ACTIONS.has(action)) validateCsrf(req, sessionToken, runtime.csrfSecret);

      let result;
      switch (action) {
        case "health":
          requireMethod(req, "GET");
          result = {
            status: "ok",
            environment: runtime.mode,
            persistence: runtime.store.constructor.name,
            chain: await runtime.store.verifyChain(),
            release: {
              sha: runtime.environment.VERCEL_GIT_COMMIT_SHA ?? null,
              branch: runtime.environment.VERCEL_GIT_COMMIT_REF ?? null,
              vercelEnvironment: runtime.environment.VERCEL_ENV ?? null,
            },
            researchRatingsAuthorized: false,
          };
          break;
        case "bootstrap":
          requireMethod(req, "POST");
          requirePrivateHost(req, runtime.environment);
          result = await runtime.service.bootstrap({
            bootstrapToken: req.headers["x-staging-bootstrap-token"],
            expectedBootstrapToken: runtime.environment.STAGING_BOOTSTRAP_TOKEN,
            operatorEmail: body.operatorEmail,
          });
          break;
        case "invite.redeem": {
          requireMethod(req, "POST");
          const redeemed = await runtime.service.redeemInvite({ token: body.token, userAgent: req.headers["user-agent"] });
          setSessionCookie(res, redeemed.sessionToken, redeemed.session.expiresAt, req);
          result = {
            identity: redeemed.identity,
            session: redeemed.session,
            csrfToken: makeCsrfToken(redeemed.sessionToken, runtime.csrfSecret),
          };
          break;
        }
        case "logout":
          requireMethod(req, "POST");
          result = await runtime.service.logout(sessionToken);
          clearSessionCookie(res, req);
          break;
        case "me":
          requireMethod(req, "GET");
          result = await runtime.service.me(sessionToken);
          result.csrfToken = makeCsrfToken(sessionToken, runtime.csrfSecret);
          break;
        case "workspace":
          requireMethod(req, "GET");
          result = await runtime.service.getWorkspace(sessionToken);
          break;
        case "identity.create":
          requireMethod(req, "POST");
          result = await runtime.service.createIdentity({ actorSessionToken: sessionToken, ...body });
          break;
        case "invite.create":
          requireMethod(req, "POST");
          result = await runtime.service.createInvite({ actorSessionToken: sessionToken, ...body });
          break;
        case "invite.revoke":
          requireMethod(req, "POST");
          result = await runtime.service.revokeInvite({ actorSessionToken: sessionToken, ...body });
          break;
        case "invite.replace":
          requireMethod(req, "POST");
          result = await runtime.service.replaceInvite({ actorSessionToken: sessionToken, ...body });
          break;
        case "assignment.create":
          requireMethod(req, "POST");
          result = await runtime.service.createAssignment({ actorSessionToken: sessionToken, ...body });
          break;
        case "draft.save":
          requireMethod(req, "PUT");
          result = await runtime.service.saveDraft({ sessionToken, ...body });
          break;
        case "assignment.submit":
          requireMethod(req, "POST");
          result = await runtime.service.submitAssignment({ sessionToken, ...body });
          break;
        case "correction.request":
          requireMethod(req, "POST");
          result = await runtime.service.requestCorrection({ sessionToken, ...body });
          break;
        case "withdrawal.request":
          requireMethod(req, "POST");
          result = await runtime.service.requestWithdrawal({ sessionToken, ...body });
          break;
        case "correction.resolve":
          requireMethod(req, "POST");
          result = await runtime.service.operatorResolveCorrection({ actorSessionToken: sessionToken, ...body });
          break;
        case "adjudication.open":
          requireMethod(req, "POST");
          result = await runtime.service.openAdjudicationCase({ actorSessionToken: sessionToken, ...body });
          break;
        case "adjudication.review":
          requireMethod(req, "POST");
          result = await runtime.service.submitAdjudicationReview({ sessionToken, ...body });
          break;
        case "adjudication.close":
          requireMethod(req, "POST");
          result = await runtime.service.closeAdjudicationCase({ actorSessionToken: sessionToken, ...body });
          break;
        case "export.private":
          requireMethod(req, "GET");
          result = await runtime.service.operatorExport({ actorSessionToken: sessionToken, publicOnly: false });
          res.setHeader("Content-Disposition", `attachment; filename=metaphilosophy-staging-private-${new Date().toISOString().slice(0, 10)}.json`);
          break;
        case "export.public":
          requireMethod(req, "GET");
          result = await runtime.service.operatorExport({ actorSessionToken: sessionToken, publicOnly: true });
          res.setHeader("Content-Disposition", `attachment; filename=metaphilosophy-staging-public-${new Date().toISOString().slice(0, 10)}.json`);
          break;
        default:
          throw serviceError(404, "unknown_action", "Unknown staging action.");
      }

      return sendJson(res, 200, { ok: true, action, data: result });
    } catch (error) {
      const status = Number(error.status) || 500;
      if (status >= 500) console.error("staging_api_error", error);
      return sendJson(res, status, {
        ok: false,
        error: {
          code: error.code || "internal_error",
          message: status >= 500 ? "The staging workflow could not complete the request." : error.message,
          detail: status >= 500 ? undefined : error.detail,
        },
      });
    }
  };
}

async function getRuntime(options, req) {
  if (options.runtime) return options.runtime;
  if (options.store) {
    const service = options.service ?? new StagingWorkflowService({ store: options.store, now: options.now });
    await service.initialize();
    return {
      store: options.store,
      service,
      csrfSecret: options.csrfSecret || options.environment?.STAGING_CSRF_SECRET || options.environment?.STAGING_BOOTSTRAP_TOKEN || "local-test-only-secret",
      environment: options.environment ?? process.env,
      mode: options.mode ?? "test",
    };
  }

  const environment = process.env;
  const isVercel = Boolean(environment.VERCEL);
  const isDesignatedReleasePreview = isVercel
    && environment.VERCEL_ENV === "preview"
    && environment.VERCEL_GIT_COMMIT_REF === RELEASE_PREVIEW_BRANCH;

  if (isDesignatedReleasePreview) {
    const oidcToken = String(req.headers["x-vercel-oidc-token"] ?? "");
    if (!oidcToken) {
      throw serviceError(503, "vercel_oidc_unavailable", "The protected preview did not supply its Vercel OIDC identity.");
    }
    const store = createStagingEventStore({
      gatewayUrl: environment.METAPHILOSOPHY_STAGING_GATEWAY_URL ?? HOSTED_GATEWAY_URL,
      oidcToken,
      expectedReleaseSha: environment.VERCEL_GIT_COMMIT_SHA ?? null,
      expectedBranch: environment.VERCEL_GIT_COMMIT_REF,
      environment,
    });
    const service = new StagingWorkflowService({ store });
    await service.initialize();
    // The high-entropy HttpOnly session token remains the unguessable input to this HMAC.
    // This stable domain-separation value is not a credential and avoids a long-lived preview secret.
    const csrfSecret = environment.STAGING_CSRF_SECRET ?? HOSTED_CSRF_DOMAIN;
    return { store, service, csrfSecret, environment, mode: "hosted_staging_oidc" };
  }

  if (cachedRuntime) return cachedRuntime;

  const databaseUrl = environment.METAPHILOSOPHY_STAGING_DATABASE_URL
    ?? environment.STAGING_DATABASE_URL
    ?? null;
  if (isVercel && !databaseUrl) {
    throw serviceError(503, "staging_database_unconfigured", "The isolated staging database has not been configured.");
  }
  const filePath = environment.STAGING_EVENT_FILE
    ?? (!isVercel ? resolve(environment.STAGING_DATA_DIR ?? ".staging-data", "events.jsonl") : null);
  const store = createStagingEventStore({ databaseUrl, filePath, environment });
  const service = new StagingWorkflowService({ store });
  await service.initialize();
  const csrfSecret = environment.STAGING_CSRF_SECRET ?? environment.STAGING_BOOTSTRAP_TOKEN;
  if (!csrfSecret) throw serviceError(503, "staging_secret_unconfigured", "STAGING_CSRF_SECRET or STAGING_BOOTSTRAP_TOKEN is required.");
  cachedRuntime = { store, service, csrfSecret, environment, mode: isVercel ? "hosted_staging" : "local_staging" };
  return cachedRuntime;
}

function requireMethod(req, method) {
  if (req.method !== method) throw serviceError(405, "method_not_allowed", `Use ${method} for this action.`);
}

function requirePrivateHost(req, environment) {
  if (environment.STAGING_ALLOW_REMOTE_BOOTSTRAP === "true") return;
  const host = String(req.headers.host ?? "").split(":")[0];
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    throw serviceError(403, "remote_bootstrap_disabled", "Remote bootstrap is disabled.");
  }
}

function validateCsrf(req, sessionToken, secret) {
  if (!sessionToken) throw serviceError(401, "authentication_required", "A staging session is required.");
  const supplied = String(req.headers["x-staging-csrf"] ?? "");
  const expected = makeCsrfToken(sessionToken, secret);
  if (!constantTimeEqual(supplied, expected)) throw serviceError(403, "csrf_rejected", "The request could not be verified.");
  const fetchSite = String(req.headers["sec-fetch-site"] ?? "same-origin");
  if (!["same-origin", "same-site", "none"].includes(fetchSite)) throw serviceError(403, "cross_site_rejected", "Cross-site requests are not allowed.");
}

function makeCsrfToken(sessionToken, secret) {
  if (!sessionToken || !secret) return "";
  return createHmac("sha256", String(secret)).update(String(sessionToken)).digest("base64url");
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > JSON_LIMIT_BYTES) throw serviceError(413, "body_too_large", "The request body is too large.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw serviceError(400, "invalid_json", "The request body must be valid JSON.");
  }
}

function setSessionCookie(res, token, expiresAt, req) {
  const secure = Boolean(process.env.VERCEL) || String(req.headers["x-forwarded-proto"] ?? "").includes("https");
  const attributes = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Expires=${new Date(expiresAt).toUTCString()}`,
  ];
  if (secure) attributes.push("Secure");
  res.setHeader("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(res, req) {
  const secure = Boolean(process.env.VERCEL) || String(req.headers["x-forwarded-proto"] ?? "").includes("https");
  const attributes = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (secure) attributes.push("Secure");
  res.setHeader("Set-Cookie", attributes.join("; "));
}

function readCookie(header, name) {
  const cookies = String(header ?? "").split(";").map((part) => part.trim()).filter(Boolean);
  for (const cookie of cookies) {
    const index = cookie.indexOf("=");
    if (index === -1) continue;
    if (cookie.slice(0, index) === name) return decodeURIComponent(cookie.slice(index + 1));
  }
  return null;
}

function setSecurityHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()" );
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
}

function sendJson(res, status, body) {
  res.statusCode = status;
  return res.end(`${JSON.stringify(body)}\n`);
}
