# Stage 1 Collaboration Shell

This directory contains the Stage 1 collaboration shell for OpenShock.

Scope in this stage:

- Room workspace (`1 Room = 1 Topic`)
- Topic and run workspace views
- Inbox for pending approvals, interventions, and closeout gates
- Approval, intervention, follow-up, and closeout actions
- Coarse observability

Out of scope in this stage:

- New backend truth sources or new backend nouns
- Re-introducing old `/topics/*` shell-local patterns
- Phase 2/3/4 capabilities (workspace/account/runtime-governance expansion)

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

The shell does not own local mock truth. `dev-server.mjs` serves shell assets and keeps one adapter surface (`/api/v0a/*`) composed from stable `/v1` endpoints only:

- `GET /v1/topics?limit=1`
- `GET /v1/topics/:topicId`
- `GET /v1/topics/:topicId/status`
- `GET /v1/topics/:topicId/topic-state`
- `GET /v1/topics/:topicId/merge-lifecycle`
- `GET /v1/topics/:topicId/task-allocation`
- `GET /v1/topics/:topicId/approval-holds?status=pending`
- `GET /v1/topics/:topicId/messages`
- `GET /v1/topics/:topicId/run-history`
- `PUT /v1/topics/:topicId/actors/:actorId`
- `POST /v1/topics/:topicId/approval-holds/:holdId/decisions`
- `POST /v1/topics/:topicId/messages`

Adapter routes:

- `GET /api/v0a/shell-state`
  - Returns collaboration shell view model data synthesized from stable `/v1`.
- `POST /api/v0a/approvals/:approvalId/decision`
  - Body: `{ "decision": "approve" | "reject", "operator": "<string>", "note": "<string>" }`
- `POST /api/v0a/interventions/:interventionId/action`
  - Body: `{ "action": "pause" | "resume" | "reroute" | "request_report", "operator": "<string>", "note": "<string>" }`
- `POST /api/v0a/runs/:runId/follow-up`
  - Body: `{ "operator": "<string>", "note": "<string>" }`
  - Writes a `shell_follow_up_request` status event to `/v1/topics/:topicId/messages`.
- `POST /api/v0a/intervention-points/:pointId/action`
  - Body: `{ "action": "approve" | "hold" | "escalate", "operator": "<string>", "note": "<string>" }`
