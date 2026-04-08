# OpenShock Phase 2 Control-Plane Surface Review (v0)

## Scope

This draft only covers the current `apps/server` control-plane surface and proposes a minimum external API contract that can be consumed by non-first-party frontends.

Input baseline:

- Current HTTP surface in `apps/server/src/http-server.js` and `apps/server/README.md`
- Current control-plane semantics in `apps/server/src/coordinator.js` and `apps/server/src/protocol.js`
- Phase 2 direction: backend-first, contract-first, API-first consumer-grade surface

## Current Surface Snapshot

Current HTTP endpoints exposed by server:

- `POST /topics`
- `POST /topics/:topicId/agents`
- `POST /topics/:topicId/messages`
- `POST /topics/:topicId/approvals/:holdId/decision`
- `GET /topics/:topicId/overview`
- `GET /topics/:topicId/coarse`
- `GET /topics/:topicId/messages?route=<scope>`
- `GET /runtime/config`
- `POST /runtime/fixtures/seed`
- `POST /runtime/daemon/events`
- `GET /runtime/smoke`
- `GET /health`

Current control-plane primitives already present in server truth:

- Topic (goal, constraints, revision, truth, deliveryState)
- Actor/Agent (id, role, status, lane)
- Structured Message (type, source, targetScope, payload, state)
- Approval Hold (gate, status, decider, timestamps)
- Conflict and resolution
- Blocker and risk flags

Current protocol enums in code:

- Message types: dispatch, status_report, handoff_package, challenge, merge_request, blocker_escalation, feedback_ingest, shared_truth_proposal, conflict_resolution
- Actor roles: lead, worker, human, system
- Human gates: architecture-level-change, external-interface-change, pr-merge, cross-topic-shared-truth-rewrite

## External API Gap List

### P0 (consumer-blocking)

1. No explicit external API namespace/version (`/v1`). Current paths are implementation-first and mix runtime helper endpoints with control-plane endpoints.
2. No topic listing endpoint. Consumer cannot discover topic set without out-of-band id.
3. No explicit actor resource contract. `POST /topics/:topicId/agents` currently acts as register-or-overwrite semantics without explicit status transition contract.
4. No typed schema contract per message type at API level. Allowed payload shape is implicit in coordinator logic, forcing consumers to infer behavior from code.
5. Error semantics are not HTTP-classified enough for external consumers. Most domain errors return HTTP 400; missing stable mapping for 404/409/422/429.
6. No idempotency contract for create topic, post message, and approval decision. Retry safety is undefined for network retries.
7. No auth/authz surface in API contract. Current permissions are internal actor checks only.
8. No pagination/cursor contract for message listing. High-volume topic history has no bounded retrieval pattern.
9. No dedicated debug surface contract for consumer-side troubleshooting (request correlation, trace id, deterministic replay anchors).

### P1 (near-term contract hardening)

1. No explicit backward compatibility policy for enum expansion and field evolution.
2. No explicit distinction between control-plane public APIs and runtime/internal helper APIs.
3. No explicit state transition contract for actor status and message states.
4. No explicit policy for eventual consistency/revision conflict response behavior.

## API-First 5-Gate Back-Check (Aligned with #31 Baseline)

This section rewrites the control-plane review directly against the accepted five-gate baseline, instead of introducing a separate lens.

### Gate 1: Resource Model Naming

Already shapeable as first-class resources in current control-plane:

- Topic
- Actor
- ApprovalHold
- Conflict
- Blocker
- DeliveryState

Not yet safe as external first-class resources in current control-plane:

- Message (currently overloaded as both command intake and timeline record; should not be exposed as external truth resource)
- Lane / Run (not owned by control-plane; should be sourced from execution-plane contract in #34)

### Gate 2: Event Model (Command vs Event Separation)

Current mixed points in control-plane:

- `POST /topics/:topicId/messages` is both command intake and de-facto event storage trigger.
- `GET /topics/:topicId/messages` exposes message log, but the model is not contracted as explicit event stream.
- `/runtime/daemon/events` is a specialized write path outside topic command surface, which adds a second command ingress shape.

Minimum separation needed for next cut:

- Command write surface and event read surface must be explicitly split.
- Control-plane event stream must carry accepted/rejected/escalated/finalized facts as stable event types.
- `Message` should be treated as internal implementation carrier in this phase, not as consumer-facing resource contract.

### Gate 3: Error Semantics

Current state:

- Machine-readable `error/message/details` exists.
- Domain boundary checks already emit stable machine codes (`actor_not_registered`, `actor_role_mismatch`, `actor_inactive`, `decision_actor_*`, etc.).

Not yet safe for external consumer:

- HTTP status mapping is too flat (most domain errors map to 400).
- No stable error family contract that separates invalid input, not found, state conflict, boundary rejection, internal failure.

### Gate 4: Version Compatibility

Current state:

- No explicit version namespace on public paths.

Required for external baseline:

- Introduce `/v1` namespace and additive-only change rule within major version.
- Keep compatibility aliases only as transitional shim, not as long-term contract.

### Gate 5: Debug / Read Model

Current state:

- `overview` and `coarse` provide partial read models.
- Full history remains implicit in message timeline and in-memory coordinator state.

Gap for external consumer:

- No explicit debug/read API that supports cursor replay and deterministic rejection reasoning.
- Runtime helper/shell views are still carrying too much troubleshooting burden.

## Next-Cut Ticketable Outputs (Directly Usable by #29)

1. **P2-CP-01: Versioned Control-Plane Namespace**
   - Add `/v1` control-plane paths and compatibility aliases for old paths.
   - DoD: all control-plane external endpoints reachable via `/v1`; old paths marked compatibility-only.

2. **P2-CP-02: Command/Event Surface Split**
   - Replace `/v1/topics/{id}/messages` with explicit command write + event read split.
   - DoD: command writes no longer double as audit/read contract; event stream has stable event type set and cursor replay.

3. **P2-CP-03: Resource Contract Stabilization**
   - Promote Topic/Actor/ApprovalHold/Conflict/Blocker/Delivery to stable external resources.
   - DoD: each resource has required fields, stable id, and read endpoint coverage.

4. **P2-CP-04: Error Family + HTTP Mapping**
   - Keep machine codes, add stable error family map and HTTP class mapping.
   - DoD: conflict/not_found/boundary_rejection/internal all distinguishable by both code family and status class.

5. **P2-CP-05: Debug Read Model**
   - Add cursor-based debug history and rejection-reason retrieval tied to actor/resource ids.
   - DoD: external consumer can reproduce last N transitions and rejection causes without shell-only helpers.

## Minimal Resource Contract Draft (v0)

### Contract Principles

- Contract-first: API shape defined before implementation expansion.
- Consumer-grade: no reliance on internal timing assumptions or hidden coordinator state.
- Additive evolution: prefer add-only changes; no breaking repurpose of existing fields.
- Stable error semantics: code + HTTP class + retry signal.

### Resource Model (minimum set)

#### Topic

Required fields:

- `topic_id` (string)
- `goal` (string)
- `constraints` (string[])
- `revision` (int)
- `delivery_state` (`not_started|awaiting_merge_gate|pr_ready|...`)
- `created_at`, `updated_at` (ISO8601)

#### Actor

Required fields:

- `actor_id` (string)
- `role` (`lead|worker|human|system`)
- `status` (`active|blocked|idle`)
- `lane_id` (nullable string)
- `last_seen_at` (ISO8601)

#### Message

This object remains internal in v0 and is not a consumer-facing first-class resource.
For external contract, it should be split into:

- `CommandIntent` (write-only request contract)
- `ControlEvent` (read-only audit/replay contract)

#### CommandIntent (external write contract)

Required fields:

- `command_id` (server-generated stable id)
- `topic_id` (string)
- `command_type` (enum)
- `source_actor_id` (string)
- `payload` (object)
- `requested_at` (ISO8601)

#### ControlEvent (external read contract)

Required fields:

- `event_id` (server-generated stable id)
- `topic_id` (string)
- `event_type` (`command_accepted|command_rejected|hold_created|hold_decided|conflict_opened|conflict_resolved|blocker_added|blocker_cleared|delivery_state_changed|...`)
- `related_command_id` (nullable string)
- `related_resource_type` (nullable string)
- `related_resource_id` (nullable string)
- `result_state` (nullable enum)
- `reason_code` (nullable string, required on rejection)
- `reason_detail` (nullable string)
- `request_id` (string)
- `correlation_id` (nullable string)
- `at` (ISO8601)

#### ApprovalHold

Required fields:

- `hold_id` (string)
- `topic_id` (string)
- `related_command_id` (string)
- `gate` (enum)
- `status` (`pending|approved|rejected`)
- `decider_actor_id` (nullable string)
- `intervention_point` (nullable enum)
- `created_at`, `decided_at` (ISO8601)

#### Blocker

Required fields:

- `blocker_id` (string)
- `topic_id` (string)
- `reason` (string)
- `created_at` (ISO8601)
- optional links (`message_id`, `conflict_id`)

### API Surface (minimum external set)

- `POST /v1/topics`
- `GET /v1/topics/{topic_id}`
- `GET /v1/topics?cursor=<token>&limit=<n>`
- `PUT /v1/topics/{topic_id}/actors/{actor_id}`
- `GET /v1/topics/{topic_id}/actors`
- `POST /v1/topics/{topic_id}/commands`
- `GET /v1/topics/{topic_id}/events?cursor=<token>&limit=<n>&event_type=<type>`
- `GET /v1/topics/{topic_id}/approval-holds?status=pending`
- `POST /v1/topics/{topic_id}/approval-holds/{hold_id}/decisions`
- `GET /v1/topics/{topic_id}/coarse`
- `GET /v1/topics/{topic_id}/debug/history?cursor=<token>&limit=<n>&view=<events|snapshot>`
- `GET /v1/topics/{topic_id}/debug/rejections?cursor=<token>&limit=<n>`

Runtime helper endpoints should be moved under an internal namespace (example: `/internal/runtime/*`) and excluded from consumer contract.

### Debug/History Contract Hardening (minimum)

`/v1/topics/{topic_id}/debug/history` must be explicitly contracted as follows:

- Cursor semantics: opaque forward cursor, stable ordering by `(at, event_id)`, no duplicate rows across pages.
- View semantics:
  - `view=events`: returns canonical `ControlEvent[]`
  - `view=snapshot`: returns point-in-time state projection records with `snapshot_revision`
- Rejection anchors (required fields on relevant entries):
  - `reason_code`
  - `request_id`
  - `correlation_id`
  - `related_command_id`

`/v1/topics/{topic_id}/debug/rejections` must return rejection-focused stream entries only and include the same anchor fields for QA replayability.

### Error Contract (minimum)

Response envelope:

```json
{
  "error": {
    "code": "actor_inactive",
    "message": "actor worker_01 must be active",
    "details": {},
    "retryable": false,
    "request_id": "req_xxx"
  }
}
```

HTTP mapping baseline:

- `400` malformed request
- `401` unauthenticated
- `403` authenticated but not authorized
- `404` resource not found
- `409` revision/state conflict
- `422` domain rule violation (valid shape, invalid business transition)
- `429` rate limited
- `5xx` server/internal

### Idempotency / Retry Baseline

- `POST /v1/topics`, `POST /v1/topics/{topic_id}/commands`, and approval decision endpoint require `Idempotency-Key`.
- Duplicate `Idempotency-Key` within retention window returns the original result payload.

### Compatibility Baseline

- Add fields, do not rename/remove in-place.
- Add enum values only with documented fallback behavior.
- Version bump required for breaking behavior.

## Recommended Phase 2 First Implementation Cut

1. Add `/v1` control-plane namespace while preserving current routes as compatibility alias.
2. Add `GET /v1/topics` and actor endpoints with explicit status contract.
3. Add standardized error envelope + HTTP class mapping.
4. Add idempotency support for topic/command/decision writes.
5. Split `/runtime/*` into internal namespace in contract docs (implementation can keep compatibility shim in first cut).
6. Add debug history endpoint with cursor contract and request correlation id.

## Out of Scope (this draft)

- Execution-plane queue/lane/run/worktree contracts (covered by #34)
- Integration plane GitHub/PR/notification contracts (covered by #35)
- Full architecture/governance blueprint final wording (owned by #30)
