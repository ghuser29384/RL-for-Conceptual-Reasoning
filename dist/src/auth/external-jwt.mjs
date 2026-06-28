import { createPublicKey, timingSafeEqual, verify as verifySignature } from "node:crypto";

const allowedRoles = new Set(["rater", "graduate", "phd", "expert", "admin", "auditor"]);
const jwksCache = new Map();

export function createExternalJwtAuthConfig(options = {}) {
  const issuer = options.issuer ?? process.env.LMCA_AUTH_ISSUER;
  const audience = options.audience ?? process.env.LMCA_AUTH_AUDIENCE;
  const jwksUrl = options.jwksUrl ?? process.env.LMCA_AUTH_JWKS_URL;
  const jwks = options.jwks;
  const roleClaim = options.roleClaim ?? process.env.LMCA_AUTH_ROLE_CLAIM ?? "lmca_role";
  const assignmentsClaim = options.assignmentsClaim ?? process.env.LMCA_AUTH_ASSIGNMENTS_CLAIM ?? "lmca_assignments";
  const clockSkewSeconds = Number(options.clockSkewSeconds ?? process.env.LMCA_AUTH_CLOCK_SKEW_SECONDS ?? 60);

  if (!issuer) throw new Error("LMCA_AUTH_ISSUER is required when LMCA_AUTH_MODE=external_jwt");
  if (!audience) throw new Error("LMCA_AUTH_AUDIENCE is required when LMCA_AUTH_MODE=external_jwt");
  if (!jwksUrl && !jwks) throw new Error("LMCA_AUTH_JWKS_URL is required when LMCA_AUTH_MODE=external_jwt");

  return {
    issuer,
    audience,
    jwksUrl,
    jwks,
    roleClaim,
    assignmentsClaim,
    clockSkewSeconds: Number.isFinite(clockSkewSeconds) ? clockSkewSeconds : 60,
    jwksCacheMs: Number(options.jwksCacheMs ?? process.env.LMCA_AUTH_JWKS_CACHE_MS ?? 10 * 60 * 1000),
  };
}

export async function verifyExternalJwtToken(token, config, nowMs = Date.now()) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3) return { ok: false, error: "missing_or_malformed_external_jwt" };

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "invalid_external_jwt_payload" };
  }

  if (header.alg !== "RS256") return { ok: false, error: "unsupported_external_jwt_alg" };
  if (!header.kid || typeof header.kid !== "string") return { ok: false, error: "missing_external_jwt_kid" };

  const claimValidation = validateStandardClaims(payload, config, nowMs);
  if (!claimValidation.ok) return claimValidation;

  const jwk = await findJwk(header.kid, config);
  if (!jwk) return { ok: false, error: "external_jwt_key_not_found" };
  if (jwk.alg && jwk.alg !== "RS256") return { ok: false, error: "external_jwt_key_alg_mismatch" };
  if (jwk.use && jwk.use !== "sig") return { ok: false, error: "external_jwt_key_use_mismatch" };
  if (jwk.kty !== "RSA") return { ok: false, error: "unsupported_external_jwt_key_type" };

  let verified = false;
  try {
    const key = createPublicKey({ key: jwk, format: "jwk" });
    verified = verifySignature("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], "base64url"));
  } catch {
    return { ok: false, error: "external_jwt_signature_verification_failed" };
  }
  if (!verified) return { ok: false, error: "invalid_external_jwt_signature" };

  const mappedUser = mapClaimsToUser(payload, config);
  if (!mappedUser.ok) return mappedUser;
  return {
    ok: true,
    user: mappedUser.user,
    claims: {
      issuer: payload.iss,
      subject: payload.sub,
      audience: payload.aud,
    },
  };
}

export function mapClaimsToUser(payload, config) {
  const subject = payload?.sub;
  if (!subject || typeof subject !== "string") return { ok: false, error: "missing_external_jwt_subject" };

  const role = String(resolveExternalAuthClaim(payload, config.roleClaim) ?? "");
  if (!allowedRoles.has(role)) return { ok: false, error: "missing_or_invalid_external_jwt_role" };

  const allowedAssignmentIds = normalizeAssignmentClaim(resolveExternalAuthClaim(payload, config.assignmentsClaim), role);
  const displayName = displayNameFromClaims(payload);
  return {
    ok: true,
    user: {
      id: subject,
      externalAuthId: subject,
      displayName,
      role,
      allowedAssignmentIds,
    },
  };
}

function validateStandardClaims(payload, config, nowMs) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { ok: false, error: "invalid_external_jwt_payload" };
  if (payload.iss !== config.issuer) return { ok: false, error: "external_jwt_issuer_mismatch" };
  if (!audienceMatches(payload.aud, config.audience)) return { ok: false, error: "external_jwt_audience_mismatch" };

  const nowSeconds = Math.floor(nowMs / 1000);
  const skew = Math.max(0, config.clockSkewSeconds ?? 60);
  if (!Number.isFinite(payload.exp)) return { ok: false, error: "missing_external_jwt_exp" };
  if (payload.exp + skew <= nowSeconds) return { ok: false, error: "external_jwt_expired" };
  if (payload.nbf !== undefined && Number.isFinite(payload.nbf) && payload.nbf - skew > nowSeconds) return { ok: false, error: "external_jwt_not_yet_valid" };
  if (payload.iat !== undefined && Number.isFinite(payload.iat) && payload.iat - skew > nowSeconds) return { ok: false, error: "external_jwt_issued_in_future" };
  return { ok: true };
}

function audienceMatches(actualAudience, expectedAudience) {
  if (typeof actualAudience === "string") return constantTimeStringEqual(actualAudience, expectedAudience);
  if (Array.isArray(actualAudience)) return actualAudience.some((item) => typeof item === "string" && constantTimeStringEqual(item, expectedAudience));
  return false;
}

async function findJwk(kid, config) {
  const jwks = config.jwks ?? (await fetchJwks(config));
  if (!jwks || !Array.isArray(jwks.keys)) throw new Error("JWKS payload must contain a keys array");
  return jwks.keys.find((key) => key.kid === kid);
}

async function fetchJwks(config) {
  const cached = jwksCache.get(config.jwksUrl);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.jwks;

  const response = await fetch(config.jwksUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`JWKS fetch failed with HTTP ${response.status}`);
  const jwks = await response.json();
  jwksCache.set(config.jwksUrl, { jwks, expiresAt: now + config.jwksCacheMs });
  return jwks;
}

function normalizeAssignmentClaim(value, role) {
  if (role === "admin" || role === "auditor") return ["*"];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.length > 0);
  if (typeof value === "string" && value.length > 0) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function displayNameFromClaims(payload) {
  for (const key of ["name", "preferred_username", "email"]) {
    if (typeof payload[key] === "string" && payload[key].length > 0) return payload[key];
  }
  return payload.sub;
}

function claimAtPath(payload, path) {
  return String(path)
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => (value && typeof value === "object" ? value[key] : undefined), payload);
}

function resolveExternalAuthClaim(payload, path) {
  const direct = claimAtPath(payload, path);
  if (direct !== undefined) return direct;

  const pathParts = String(path).split(".").filter(Boolean);
  if (pathParts.length !== 1) return undefined;
  const claimName = pathParts[0];
  for (const metadataPath of ["public_metadata", "metadata", "user_metadata"]) {
    const value = claimAtPath(payload, `${metadataPath}.${claimName}`);
    if (value !== undefined) return value;
  }
  return undefined;
}

function constantTimeStringEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}
