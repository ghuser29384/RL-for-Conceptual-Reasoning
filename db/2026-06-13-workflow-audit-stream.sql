alter table audit_events
  drop constraint if exists audit_events_stream_check;

alter table audit_events
  add constraint audit_events_stream_check
  check (
    stream in (
      'rating',
      'certification',
      'benchmark_exposure',
      'source_style_audit',
      'workflow'
    )
  );
