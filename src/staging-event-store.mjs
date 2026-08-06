import { createHash, randomUUID } from "node:crypto";
import { appendFile, copyFile, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import postgres from "postgres";

const GENESIS_HASH = "0".repeat(64);

export class FileEventStore {
  constructor({ filePath }) {
    this.filePath = resolve(filePath);
    this.queue = Promise.resolve();
  }

  async initialize() {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      await stat(this.filePath);
    } catch {
      await writeFile(this.filePath, "", { flag: "wx" }).catch((error) => {
        if (error.code !== "EEXIST") throw error;
      });
    }
    await this.verifyChain();
  }

  async loadEvents() {
    await this.initializeIfNeeded();
    const text = await readFile(this.filePath, "utf8");
    return text
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          throw new Error(`Invalid staging event JSON at line ${index + 1}: ${error.message}`);
        }
      });
  }

  async append({ type, aggregateId = null, actorId = null, payload = {}, createdAt = new Date().toISOString(), eventId = randomUUID() }) {
    return this.enqueue(async () => {
      const events = await this.loadEvents();
      const previous = events.at(-1);
      const event = createEvent({
        sequence: events.length + 1,
        eventId,
        type,
        aggregateId,
        actorId,
        payload,
        createdAt,
        prevHash: previous?.eventHash ?? GENESIS_HASH,
      });
      await appendFile(this.filePath, `${JSON.stringify(event)}\n`, "utf8");
      return event;
    });
  }

  async appendMany(items) {
    return this.enqueue(async () => {
      const events = await this.loadEvents();
      let prevHash = events.at(-1)?.eventHash ?? GENESIS_HASH;
      let sequence = events.length;
      const created = items.map((item) => {
        sequence += 1;
        const event = createEvent({
          sequence,
          eventId: item.eventId ?? randomUUID(),
          type: item.type,
          aggregateId: item.aggregateId ?? null,
          actorId: item.actorId ?? null,
          payload: item.payload ?? {},
          createdAt: item.createdAt ?? new Date().toISOString(),
          prevHash,
        });
        prevHash = event.eventHash;
        return event;
      });
      if (created.length) await appendFile(this.filePath, `${created.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
      return created;
    });
  }

  async verifyChain() {
    const events = await this.loadEventsWithoutInitializeLoop();
    verifyEventChain(events);
    return { ok: true, events: events.length, headHash: events.at(-1)?.eventHash ?? GENESIS_HASH };
  }

  async backup(destinationPath) {
    await this.initializeIfNeeded();
    const target = resolve(destinationPath);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(this.filePath, target);
    return { source: this.filePath, destination: target, ...(await this.verifyChain()) };
  }

  async restore(sourcePath) {
    return this.enqueue(async () => {
      const source = resolve(sourcePath);
      const text = await readFile(source, "utf8");
      const events = text.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).map(JSON.parse);
      verifyEventChain(events);
      const temporary = `${this.filePath}.${randomUUID()}.restore`;
      await writeFile(temporary, text.endsWith("\n") || !text ? text : `${text}\n`, "utf8");
      await rename(temporary, this.filePath);
      return { ok: true, events: events.length, headHash: events.at(-1)?.eventHash ?? GENESIS_HASH };
    });
  }

  async reset() {
    return this.enqueue(async () => {
      await rm(this.filePath, { force: true });
      await this.initialize();
    });
  }

  async initializeIfNeeded() {
    try {
      await stat(this.filePath);
    } catch {
      await this.initialize();
    }
  }

  async loadEventsWithoutInitializeLoop() {
    await mkdir(dirname(this.filePath), { recursive: true });
    let text = "";
    try {
      text = await readFile(this.filePath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await writeFile(this.filePath, "", "utf8");
    }
    return text.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).map(JSON.parse);
  }

  enqueue(operation) {
    const next = this.queue.then(operation, operation);
    this.queue = next.then(() => undefined, () => undefined);
    return next;
  }
}

export class PostgresEventStore {
  constructor({ connectionString, ssl = "require", max = 3 }) {
    if (!connectionString) throw new Error("A staging Postgres connection string is required.");
    this.sql = postgres(connectionString, {
      ssl: ssl === false ? false : ssl,
      max,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: true,
    });
  }

  async initialize() {
    await this.sql`select 1`;
    const tables = await this.sql`
      select to_regclass('public.metaphilosophy_staging_events') as events_table
    `;
    if (!tables[0]?.events_table) {
      throw new Error("metaphilosophy_staging_events is missing. Apply the reviewed staging schema before use.");
    }
    await this.verifyChain();
  }

  async loadEvents() {
    const rows = await this.sql`
      select sequence, event_id, event_type, aggregate_id, actor_id, payload, created_at, prev_hash, event_hash
      from metaphilosophy_staging_events
      order by sequence asc
    `;
    return rows.map(rowToEvent);
  }

  async append(item) {
    const events = await this.appendMany([item]);
    return events[0];
  }

  async appendMany(items) {
    if (!items.length) return [];
    return this.sql.begin(async (transaction) => {
      await transaction`select pg_advisory_xact_lock(hashtext('metaphilosophy-staging-event-chain'))`;
      const lastRows = await transaction`
        select sequence, event_hash from metaphilosophy_staging_events order by sequence desc limit 1
      `;
      let sequence = Number(lastRows[0]?.sequence ?? 0);
      let prevHash = lastRows[0]?.event_hash ?? GENESIS_HASH;
      const created = [];

      for (const item of items) {
        sequence += 1;
        const event = createEvent({
          sequence,
          eventId: item.eventId ?? randomUUID(),
          type: item.type,
          aggregateId: item.aggregateId ?? null,
          actorId: item.actorId ?? null,
          payload: item.payload ?? {},
          createdAt: item.createdAt ?? new Date().toISOString(),
          prevHash,
        });
        await transaction`
          insert into metaphilosophy_staging_events
            (sequence, event_id, event_type, aggregate_id, actor_id, payload, created_at, prev_hash, event_hash)
          values
            (${event.sequence}, ${event.eventId}::uuid, ${event.type}, ${event.aggregateId}, ${event.actorId}, ${transaction.json(event.payload)}, ${event.createdAt}::timestamptz, ${event.prevHash}, ${event.eventHash})
        `;
        created.push(event);
        prevHash = event.eventHash;
      }
      return created;
    });
  }

  async verifyChain() {
    const events = await this.loadEvents();
    verifyEventChain(events);
    return { ok: true, events: events.length, headHash: events.at(-1)?.eventHash ?? GENESIS_HASH };
  }

  async backup(destinationPath) {
    const events = await this.loadEvents();
    verifyEventChain(events);
    const target = resolve(destinationPath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, events.length ? `${events.map((event) => JSON.stringify(event)).join("\n")}\n` : "", "utf8");
    return { destination: target, ok: true, events: events.length, headHash: events.at(-1)?.eventHash ?? GENESIS_HASH };
  }

  async close() {
    await this.sql.end({ timeout: 5 });
  }
}

export function createStagingEventStore({ databaseUrl, filePath, environment = process.env } = {}) {
  const connectionString = databaseUrl
    ?? environment.METAPHILOSOPHY_STAGING_DATABASE_URL
    ?? environment.STAGING_DATABASE_URL
    ?? null;
  if (connectionString) return new PostgresEventStore({ connectionString, ssl: environment.STAGING_DATABASE_SSL === "false" ? false : "require" });
  if (!filePath) throw new Error("No staging database URL or local event-store file path was supplied.");
  return new FileEventStore({ filePath });
}

export function verifyEventChain(events) {
  let expectedPrevHash = GENESIS_HASH;
  let expectedSequence = 1;
  const seen = new Set();
  for (const event of events) {
    if (event.sequence !== expectedSequence) throw new Error(`Event sequence mismatch: expected ${expectedSequence}, found ${event.sequence}.`);
    if (seen.has(event.eventId)) throw new Error(`Duplicate event ID ${event.eventId}.`);
    if (event.prevHash !== expectedPrevHash) throw new Error(`Broken event chain at sequence ${event.sequence}.`);
    const expectedHash = hashEvent({ ...event, eventHash: undefined });
    if (event.eventHash !== expectedHash) throw new Error(`Event hash mismatch at sequence ${event.sequence}.`);
    seen.add(event.eventId);
    expectedPrevHash = event.eventHash;
    expectedSequence += 1;
  }
  return true;
}

function createEvent({ sequence, eventId, type, aggregateId, actorId, payload, createdAt, prevHash }) {
  if (!type || typeof type !== "string") throw new Error("Event type is required.");
  const event = {
    sequence,
    eventId,
    type,
    aggregateId,
    actorId,
    payload: structuredClone(payload),
    createdAt: new Date(createdAt).toISOString(),
    prevHash,
  };
  return Object.freeze({ ...event, eventHash: hashEvent(event) });
}

function hashEvent(event) {
  const normalized = canonicalStringify({
    sequence: Number(event.sequence),
    eventId: event.eventId,
    type: event.type,
    aggregateId: event.aggregateId ?? null,
    actorId: event.actorId ?? null,
    payload: event.payload ?? {},
    createdAt: new Date(event.createdAt).toISOString(),
    prevHash: event.prevHash,
  });
  return createHash("sha256").update(normalized).digest("hex");
}

// PostgreSQL jsonb canonicalizes object storage independently of JavaScript key insertion order.
function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function rowToEvent(row) {
  return {
    sequence: Number(row.sequence),
    eventId: String(row.event_id),
    type: row.event_type,
    aggregateId: row.aggregate_id,
    actorId: row.actor_id,
    payload: row.payload ?? {},
    createdAt: new Date(row.created_at).toISOString(),
    prevHash: row.prev_hash,
    eventHash: row.event_hash,
  };
}
