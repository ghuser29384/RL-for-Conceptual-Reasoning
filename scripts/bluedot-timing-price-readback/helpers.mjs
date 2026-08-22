import { createHash } from "node:crypto";

export function findForbidden(value, forbiddenKeys, path = "$") {
  const out = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => out.push(...findForbidden(item, forbiddenKeys, `${path}[${index}]`)));
    return out;
  }
  if (!value || typeof value !== "object") return out;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) out.push(`${path}.${key}`);
    out.push(...findForbidden(child, forbiddenKeys, `${path}.${key}`));
  }
  return out;
}

export function hash(value) {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function median(values) {
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

export function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

export function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function text(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function clean(value) {
  return String(value ?? "").trim();
}

export function controlledId(value) {
  return /^[A-Z][A-Z0-9_-]{2,127}$/.test(value);
}

export function validTime(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function nonnegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function positiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function sameSet(actual, expected) {
  return JSON.stringify([...new Set(actual ?? [])].sort()) === JSON.stringify([...new Set(expected)].sort());
}

export function expect(condition, message, errors) {
  if (!condition) errors.push(message);
}
