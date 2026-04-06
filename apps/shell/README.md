# 0A Thin Shell Skeleton

This directory contains the `0A` thin shell baseline for OpenShock.

Scope is intentionally narrow and matches the contract:

- `Topic overview`
- `Agent status`
- `Delivery state`
- `Approval / intervention points`
- `Three fixed human intervention points` (lead plan, worker dispatch, merge closeout)
- `Coarse observability`

Out of scope in this skeleton:

- Full chat UX
- Issue authoring flows
- Rich historical analytics
- Persistent backend storage

## Local run

```bash
# optional if API runs on another host
export SHELL_API_UPSTREAM=http://127.0.0.1:7070
# optional if browser should call API origin directly (without same-origin proxy)
# export SHELL_API_BASE_URL=http://127.0.0.1:7070
node apps/shell/scripts/dev-server.mjs
```

Open:

<http://127.0.0.1:4173>

## Integrated runtime contract

The shell no longer owns local mock state. `dev-server.mjs` serves shell assets and keeps one adapter
surface (`/api/v0a/*`) that is composed from stable `/v1` endpoints:

- `GET /v1/topics?limit=1`
- `GET /v1/topics/:topicId`
- `GET /v1/topics/:topicId/status`
- `GET /v1/topics/:topicId/topic-state`
- `GET /v1/topics/:topicId/merge-lifecycle`
- `GET /v1/topics/:topicId/task-allocation`
- `GET /v1/topics/:topicId/approval-holds?status=pending`
- `GET /v1/topics/:topicId/messages`
- `GET /v1/topics/:topicId/run-history`
- `POST /v1/topics/:topicId/approval-holds/:holdId/decisions`
- `POST /v1/topics/:topicId/messages`

So the shell no longer requires upstream `/api/v0a/*` routes to exist.

- `GET /api/v0a/shell-state`
  - Returns topic/agent/approval/intervention/observability data synthesized from real `/topics/*` + `/runtime/*`.
- `POST /api/v0a/approvals/:approvalId/decision`
  - Body: `{ "decision": "approve" | "reject", "operator": "<string>", "note": "<string>" }`
  - Writes to `POST /v1/topics/:topicId/approval-holds/:holdId/decisions`.
- `POST /api/v0a/interventions/:interventionId/action`
  - Body: `{ "action": "pause" | "resume" | "reroute" | "request_report", "operator": "<string>", "note": "<string>" }`
  - Writes to `POST /v1/topics/:topicId/messages` as runtime status events.
- `POST /api/v0a/intervention-points/:pointId/action`
  - Body: `{ "action": "approve" | "hold" | "escalate", "operator": "<string>", "note": "<string>" }`
  - Writes to `POST /v1/topics/:topicId/messages` as runtime status events.
