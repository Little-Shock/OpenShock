# OpenShock Runtime Slots And Codex App-Server Design

Date: 2026-04-11

## Why This Change

Recent debugging exposed two structural gaps:

1. `slotCount` was only a registration hint. Backend store still modeled each runtime as a single `online/busy` bit, so one long task could block the whole daemon.
2. OpenShock already treated `providerThreadId` and agent sessions as first-class concepts, but the actual Codex integration still relied on `codex exec --json` plus an internal normalization layer. That left us without a native long-lived thread transport.

The goal of this change is to fix those two gaps without adding a new layer of abstract machinery that the product does not need yet.

## Design Decisions

### 1. Real runtime slots, no fake slot objects

We intentionally do not introduce separate slot entities or leases yet.

Instead, runtime capacity is modeled directly on `Runtime`:

- `slotCount`
- `activeSlots`
- `lastHeartbeatAt`

`status` becomes a derived field:

- `online` when `activeSlots == 0`
- `busy` when `activeSlots > 0`

`activeSlots` is recalculated from currently owned work:

- `AgentTurn.status == claimed`
- `Run.status == running`
- `MergeAttempt.status == running`

This keeps the backend deterministic and small while making the slot model real.

### 2. Runtime ownership must be explicit

Parallel workers only work safely if OpenShock knows which runtime owns each unit of work.

`Run` and `MergeAttempt` already had `runtimeId`. `AgentTurn` now gets the same field.

This allows the backend to reject:

- turn completion from the wrong runtime
- run events from the wrong runtime
- merge events from the wrong runtime

That ownership check is the minimum correctness boundary once multiple daemon workers run concurrently.

### 3. Heartbeat reports liveness, not busy state

Previously heartbeat could overwrite a busy runtime back to `online`.

That is no longer allowed.

Heartbeat now only refreshes `lastHeartbeatAt`. Runtime busy state comes from actual claimed/running work. This prevents false idle states when one worker is still executing while another goroutine sends heartbeats.

### 4. Daemon concurrency is worker-based

The daemon now runs:

- one runtime registration
- one shared heartbeat loop
- `N` worker goroutines, where `N == slotCount`

Each worker claims and executes at most one unit of work at a time:

1. `agent_turn`
2. `run`
3. `merge`

If one worker blocks inside Codex, it only consumes one slot. The rest of the daemon continues claiming other work.

### 5. Codex integration is now provider-backed

We split execution behind a small internal executor contract:

- `exec` mode: existing `codex exec --json`
- `app-server` mode: `codex app-server --listen stdio://`
- `auto` mode: prefer app-server, fall back to exec if app-server cannot be initialized

This keeps the daemon flow stable while allowing provider transport to evolve independently.

### 6. App-server uses isolated `CODEX_HOME`

One strong lesson from inspecting Codex-driven products is that the daemon should behave like an orchestrator, not like a copy of the interactive desktop client.

Using the default user `~/.codex` risks:

- plugin startup side effects
- unrelated MCP state leaking into daemon turns
- desktop session warnings polluting daemon execution

So the daemon now supports a dedicated `OPENSHOCK_CODEX_HOME` / `--codex-home`.

Default:

- `~/.openshock-codex-home`

This makes the daemon a cleaner, product-owned execution environment.

### 7. Persistent agent threads stay local first

We do not add new backend APIs for app-server thread persistence in this step.

Instead, the daemon stores the real app-server thread ID in the per-session workspace `SESSION.json` as:

- `appServerThreadId`

This works well with the existing persistent workspace model:

- backend still owns product state
- daemon owns provider transport state
- session workspaces remain the stable bridge between turns

## Implementation Summary

Backend:

- runtime slot metadata is stored and returned by API
- runtime busy/online is derived
- `AgentTurn.runtimeId` was added
- claim/event/complete paths now enforce runtime ownership

Daemon:

- serial loop replaced by worker pool
- heartbeat moved into its own loop
- provider abstraction introduced
- `codex app-server` provider added
- per-session workspace now stores `appServerThreadId`

Contracts and scripts:

- OpenAPI updated with runtime slot fields and agent turn runtime ownership
- `dev.sh` documents `OPENSHOCK_CODEX_MODE` and `OPENSHOCK_CODEX_HOME`

## Intentional Limits

This design still leaves a few things for later:

- no per-slot lease recovery if one worker dies mid-run
- no backend-persisted app-server thread ID yet
- `auto` mode only falls back during provider initialization, not after partial streamed output

Those are acceptable for the current stage because the biggest product issue was global daemon blocking, and this change fixes that first.
