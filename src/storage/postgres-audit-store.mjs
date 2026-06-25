const streams = {
  rating: "rating",
  certification: "certification",
  benchmark: "benchmark_exposure",
  sourceStyleAudit: "source_style_audit",
  workflow: "workflow",
};

export async function createPostgresAuditStore(options = {}) {
  const connectionString = options.connectionString ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL or DATABASE_URL is required when LMCA_AUDIT_STORE=postgres");
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(connectionString, {
    max: Number(process.env.POSTGRES_CONNECTION_LIMIT ?? 5),
    ssl: process.env.POSTGRES_SSL === "disable" ? false : "require",
  });
  const rlsRole = options.rlsRole ?? process.env.POSTGRES_RLS_ROLE ?? "service";
  const rlsExternalAuthId = options.rlsExternalAuthId ?? process.env.POSTGRES_RLS_EXTERNAL_AUTH_ID ?? "server";

  async function readEvents(stream) {
    const rows = await withRlsContext(async (db) => db`
        select event_json
        from audit_events
        where stream = ${stream}
        order by sequence_id asc
      `);
    return rows.map((row) => row.event_json);
  }

  async function appendEvent(stream, event) {
    await withRlsContext(async (db) => db`
        insert into audit_events (
          stream,
          event_id,
          event_type,
          actor_hash,
          payload_hash,
          event_json
        )
        values (
          ${stream},
          ${event.id ?? event.eventId ?? null},
          ${event.type ?? null},
          ${event.actorHash ?? null},
          ${event.payloadHash ?? null},
          ${db.json(event)}
        )
      `);
  }

  async function withRlsContext(callback) {
    return sql.begin(async (db) => {
      await db`select set_config('app.current_role', ${rlsRole}, true)`;
      await db`select set_config('app.current_external_auth_id', ${rlsExternalAuthId}, true)`;
      return callback(db);
    });
  }

  return {
    storageMode: "postgres_append_only",
    async readRatingEvents() {
      return readEvents(streams.rating);
    },
    async appendRatingEvent(event) {
      await appendEvent(streams.rating, event);
    },
    async readCertificationEvents() {
      return readEvents(streams.certification);
    },
    async appendCertificationEvent(event) {
      await appendEvent(streams.certification, event);
    },
    async readBenchmarkExposureEvents() {
      return readEvents(streams.benchmark);
    },
    async appendBenchmarkExposureEvent(event) {
      await appendEvent(streams.benchmark, event);
    },
    async readSourceStyleAuditEvents() {
      return readEvents(streams.sourceStyleAudit);
    },
    async appendSourceStyleAuditEvent(event) {
      await appendEvent(streams.sourceStyleAudit, event);
    },
    async readWorkflowEvents() {
      return readEvents(streams.workflow);
    },
    async appendWorkflowEvent(event) {
      await appendEvent(streams.workflow, event);
    },
  };
}
