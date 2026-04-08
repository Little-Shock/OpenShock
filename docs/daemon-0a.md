# 0A Daemon Skeleton

This scaffold implements the daemon execution surface for Phase 0A, focused on execution concerns only.

## Scope Locked in This Skeleton

- Lane and run lifecycle state machine
- Worktree path allocation per lane and run
- Durable ack persisted outside process memory
- Failure recovery hooks for in-flight runs after daemon restart
- Execution-side feedback ingestion from runtime-side signals
- Execution-side approval hold request/release for high-risk runtime actions

## Package Layout

- `daemon/service.go`: lifecycle API (`CreateLane`, `EnqueueRun`, run transitions, `AckRun`, `RecoverInterruptedRuns`)
- `daemon/service.go`: lifecycle + execution feedback + approval holds APIs
- `daemon/worktree.go`: lane/run filesystem isolation
- `daemon/store.go`: atomic persistent snapshot (`state.json`)
- `daemon/ack_store.go`: durable ack persistence (`ack.json`)
- `daemon/recovery.go`: recovery callback hooks
- `cmd/openshock-daemon/main.go`: startup bootstrap and optional recovery pass

## State Machine

Run states are aligned with PRD:

`queued -> dispatched -> running -> completed`

Additional paths:

- `running -> approval_required -> running`
- `running/dispatched -> failed|blocked|cancelled`

## Durable Ack Model

- Each run event gets an increasing `sequence`.
- External consumers ack with `AckRun(runID, sequence)`.
- Ack is written to `ack.json` first, then reflected into run state as `acked_sequence`.
- On startup, daemon syncs `ack.json` back into `state.json` for consistency.

## Recovery Hooks

`RecoverInterruptedRuns` scans runs in `dispatched`, `running`, `approval_required`.

- Hook entry: `OnRunRecoveryCandidate`.
- Hook failure: run transitions to `failed`, with cause recorded.
- Restart behavior:
  - `dispatched/running` -> `blocked` + `recovery_needed=true`
  - `approval_required` stays pending approval but records recovery event.

## Execution Feedback and Approval Holds

- Runtime-side failures, tool outcomes, and operator feedback can be ingested by `IngestExecutionFeedback`.
- Feedback ingestion persists a structured feedback record and appends run timeline events.
- Runtime can raise `RequestExecutionApprovalHold` to pause execution in `approval_required`.
- Hold resolution is explicit via `ResolveExecutionApprovalHold`:
  - `approved=true`: hold released, run resumes when no active holds remain.
  - `approved=false`: hold rejected, run transitions to `blocked`.

## Run

```bash
go run ./cmd/openshock-daemon
```

With custom storage root:

```bash
OPENSHOCK_DAEMON_DATA_DIR=/tmp/openshock-daemon go run ./cmd/openshock-daemon
```
