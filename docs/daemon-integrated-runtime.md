# Integrated Daemon Runtime (0A #16)

This note defines the daemon-side integrated runtime surface for single-machine bring-up.

## Scope in #16

- Shared runtime config for server + daemon runtime coupling.
- Effective daemon-to-server integration path.
- Real run, feedback, and approval hold events entering integrated runtime stream.

## Shared Runtime Config

Use `runtime/shared-runtime-config.example.json` as template.

Minimum fields:

- `workspace_id`
- `runtime_id`
- `shell_state_url` (for single-machine gate: `http://127.0.0.1:4174/api/v0a/shell-state`)
- `server.base_url`
- `daemon.state_path`
- `daemon.ack_path`
- `daemon.worktree_root`
- `daemon.publish_cursor_path`

## Commands

Verify runtime readiness against current integrated server contract:

```bash
go run ./cmd/openshock-daemon integrated-up --config runtime/shared-runtime-config.json
```

`integrated-up` validates these server endpoints:

- `GET /runtime/config`
- `POST /runtime/fixtures/seed`
- `GET /runtime/smoke`

If `shell_state_url` is configured, `integrated-up` also validates shell-state readiness
and fails explicitly when shell still returns non-2xx or missing sample topic.

Run integrated demo flow (creates lane/run, emits feedback, requests+resolves hold, publishes to server):

```bash
go run ./cmd/openshock-daemon integrated-demo --config runtime/shared-runtime-config.json
```

By default `integrated-demo` uses `sampleFixture.topicId` returned by `/runtime/config`.
Use `--topic <topic_id>` only when you need to override that fixture topic.

Publish any existing run artifacts to server stream:

```bash
go run ./cmd/openshock-daemon integrated-publish --config runtime/shared-runtime-config.json --run-id <run_id>
```

## What Gets Published

Daemon publishes runtime events to `POST /runtime/daemon/events`:

- `status_report`: lifecycle state updates
- `feedback_ingest`: execution-side feedback records
- `blocker_escalation`: approval hold state changes

A persistent publish cursor avoids duplicate replay for already-published records.

## Operator Note

For 0A integrated loop, run `integrated-up` before demo/publish commands.
If any runtime endpoint is unreachable, daemon returns hard error and does not move publish cursor.
