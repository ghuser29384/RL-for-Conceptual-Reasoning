import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

const EXPECTED = Object.freeze({ records: 1000, positions: 250, domains: 25, critiquesPerPosition: 4 });

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stitchChunks(chunks) {
  if (!chunks.length) return "";

  let encoded = chunks[0].replace(/\s+/gu, "");
  const overlaps = [];

  for (const rawChunk of chunks.slice(1)) {
    const chunk = rawChunk.replace(/\s+/gu, "");
    if (!chunk) {
      overlaps.push(0);
      continue;
    }

    const maximum = Math.min(encoded.length, chunk.length);
    const markerLength = Math.min(64, chunk.length);
    let overlap = 0;

    if (markerLength > 0) {
      const marker = chunk.slice(0, markerLength);
      const searchStart = Math.max(0, encoded.length - maximum);
      let index = encoded.indexOf(marker, searchStart);

      while (index >= 0) {
        const candidate = encoded.length - index;
        if (candidate <= chunk.length && candidate > overlap && chunk.startsWith(encoded.slice(index))) {
          overlap = candidate;
        }
        index = encoded.indexOf(marker, index + 1);
      }
    }

    overlaps.push(overlap);
    encoded += chunk.slice(overlap);
  }

  console.log(`Synthetic payload chunks: ${chunks.length}; detected overlaps: ${overlaps.join(",") || "none"}.`);
  return encoded;
}

function parseJsonLines(text) {
  const rows = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at line ${index + 1}: ${error.message}`);
      }
    });
  return rows;
}

function extractFlattenedRecords(payload, inflatedText) {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.records)) return payload.records;
    if (Array.isArray(payload.dialogues)) return payload.dialogues;
    if (Array.isArray(payload.pairs)) return payload.pairs;

    const candidateEntries = Object.entries(payload).filter(([, value]) => typeof value === "string");
    const preferred = candidateEntries.find(([path]) => /metaphilosophy_1000_pairs\.jsonl$/iu.test(path))
      || candidateEntries.find(([path]) => /pairs\.jsonl$/iu.test(path))
      || candidateEntries.find(([path]) => /critiques?\.jsonl$/iu.test(path));
    if (preferred) return parseJsonLines(preferred[1]);
  }

  return parseJsonLines(inflatedText);
}

function normalizeRelease(payload, inflatedText) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)
      && Array.isArray(payload.positions) && Array.isArray(payload.critiques)) {
    return { positions: payload.positions, critiques: payload.critiques };
  }

  const records = extractFlattenedRecords(payload, inflatedText);
  const positions = [];
  const critiques = [];
  const seenPositions = new Set();

  for (const record of records) {
    const required = ["critique_id", "position_id", "domain", "title", "position", "label", "attack_type", "critique"];
    for (const field of required) {
      if (typeof record?.[field] !== "string" || !record[field].trim()) {
        throw new Error(`Record is missing required field ${field}.`);
      }
    }
    if (!seenPositions.has(record.position_id)) {
      positions.push({
        position_id: record.position_id,
        domain: record.domain,
        title: record.title,
        position: record.position,
      });
      seenPositions.add(record.position_id);
    }
    critiques.push({
      critique_id: record.critique_id,
      position_id: record.position_id,
      label: record.label,
      attack_type: record.attack_type,
      critique: record.critique,
    });
  }

  return { positions, critiques };
}

function validateRelease({ positions, critiques }) {
  if (critiques.length !== EXPECTED.records) throw new Error(`Expected ${EXPECTED.records} critiques; found ${critiques.length}.`);
  if (positions.length !== EXPECTED.positions) throw new Error(`Expected ${EXPECTED.positions} positions; found ${positions.length}.`);

  const positionIds = new Set(positions.map((position) => position.position_id));
  const critiqueIds = new Set(critiques.map((critique) => critique.critique_id));
  const domains = new Set(positions.map((position) => position.domain));
  const counts = new Map();

  if (positionIds.size !== positions.length) throw new Error("Duplicate position IDs found.");
  if (critiqueIds.size !== critiques.length) throw new Error("Duplicate critique IDs found.");
  if (new Set(positions.map((position) => position.position)).size !== positions.length) throw new Error("Duplicate position texts found.");
  if (new Set(critiques.map((critique) => critique.critique)).size !== critiques.length) throw new Error("Duplicate critique texts found.");
  if (domains.size !== EXPECTED.domains) throw new Error(`Expected ${EXPECTED.domains} domains; found ${domains.size}.`);

  for (const critique of critiques) {
    if (!positionIds.has(critique.position_id)) throw new Error(`Orphan critique ${critique.critique_id}.`);
    counts.set(critique.position_id, (counts.get(critique.position_id) || 0) + 1);
  }
  for (const position of positions) {
    if (counts.get(position.position_id) !== EXPECTED.critiquesPerPosition) {
      throw new Error(`${position.position_id} has ${counts.get(position.position_id) || 0} critiques.`);
    }
  }
}

export async function unpackSyntheticRelease() {
  const root = resolve(import.meta.dirname, "..");
  const sourceDirectory = resolve(root, "src/releases/metaphilosophy-1000");
  const outputDirectory = resolve(root, "arguments/data");
  const chunkNames = (await readdir(sourceDirectory))
    .filter((name) => /^data-\d+\.txt$/u.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (!chunkNames.length) throw new Error("Synthetic release payload chunks were not found.");

  const chunks = await Promise.all(chunkNames.map((name) => readFile(resolve(sourceDirectory, name), "utf8")));
  const encoded = stitchChunks(chunks);
  const compressed = Buffer.from(encoded, "base64");
  const inflated = gunzipSync(compressed);
  const inflatedText = inflated.toString("utf8");

  let payload = null;
  try {
    payload = JSON.parse(inflatedText);
  } catch {
    // The canonical payload is JSONL; parsing continues below.
  }

  const release = normalizeRelease(payload, inflatedText);
  release.positions.sort((a, b) => a.position_id.localeCompare(b.position_id, undefined, { numeric: true }));
  release.critiques.sort((a, b) => a.critique_id.localeCompare(b.critique_id, undefined, { numeric: true }));
  validateRelease(release);

  await mkdir(outputDirectory, { recursive: true });
  const positionsText = `${JSON.stringify(release.positions)}\n`;
  const critiquesText = `${JSON.stringify(release.critiques)}\n`;
  const manifest = {
    release_id: "synthetic-1000-v1",
    title: "Metaphilosophy Synthetic Argument–Critique Library",
    released_at: "2026-07-16",
    provenance: "Model-authored synthetic expansion; unrated by Metaphilosophy expert raters.",
    records: release.critiques.length,
    positions: release.positions.length,
    critiques: release.critiques.length,
    critiques_per_position: EXPECTED.critiquesPerPosition,
    domains: new Set(release.positions.map((position) => position.domain)).size,
    source_chunks: chunkNames.length,
    files: {
      "positions.json": { bytes: Buffer.byteLength(positionsText), sha256: sha256(positionsText) },
      "critiques.json": { bytes: Buffer.byteLength(critiquesText), sha256: sha256(critiquesText) },
    },
  };

  await Promise.all([
    writeFile(resolve(outputDirectory, "positions.json"), positionsText),
    writeFile(resolve(outputDirectory, "critiques.json"), critiquesText),
    writeFile(resolve(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
  ]);

  console.log(`Synthetic release unpacked: ${manifest.positions} positions, ${manifest.critiques} critiques, ${manifest.domains} domains.`);
}
