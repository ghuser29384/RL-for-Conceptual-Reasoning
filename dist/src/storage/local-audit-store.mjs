import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export function createLocalAuditStore(options = {}) {
  const auditDir = resolve(options.auditDir ?? "data/audit");
  const storageMode = options.storageMode ?? "local_jsonl_append_only";
  const paths = {
    rating: join(auditDir, "rating-events.jsonl"),
    certification: join(auditDir, "certification-events.jsonl"),
    benchmark: join(auditDir, "benchmark-exposure-events.jsonl"),
    sourceStyleAudit: join(auditDir, "source-style-audit-events.jsonl"),
    workflow: join(auditDir, "workflow-events.jsonl"),
  };

  return {
    storageMode,
    auditDir,
    async readRatingEvents() {
      return readJsonl(paths.rating);
    },
    async appendRatingEvent(event) {
      await appendJsonl(auditDir, paths.rating, event);
    },
    async readCertificationEvents() {
      return readJsonl(paths.certification);
    },
    async appendCertificationEvent(event) {
      await appendJsonl(auditDir, paths.certification, event);
    },
    async readBenchmarkExposureEvents() {
      return readJsonl(paths.benchmark);
    },
    async appendBenchmarkExposureEvent(event) {
      await appendJsonl(auditDir, paths.benchmark, event);
    },
    async readSourceStyleAuditEvents() {
      return readJsonl(paths.sourceStyleAudit);
    },
    async appendSourceStyleAuditEvent(event) {
      await appendJsonl(auditDir, paths.sourceStyleAudit, event);
    },
    async readWorkflowEvents() {
      return readJsonl(paths.workflow);
    },
    async appendWorkflowEvent(event) {
      await appendJsonl(auditDir, paths.workflow, event);
    },
  };
}

async function readJsonl(path) {
  let text = "";
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function appendJsonl(auditDir, path, event) {
  await mkdir(auditDir, { recursive: true });
  await appendFile(path, `${JSON.stringify(event)}\n`, "utf8");
}
