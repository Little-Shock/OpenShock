# OpenShock Server

This directory now contains the first Go skeleton for the future API and realtime server.

Current shape:

- `cmd/openshock-server/main.go` exposes a small standard-library HTTP server
- `GET /healthz` returns liveness
- `GET /v1/workspace` returns a mock workspace snapshot
- `GET /v1/issues` returns mock Phase 0 issues
- `GET /v1/runs` and `GET /v1/runs/:id` return mock run state

Planned responsibilities:

- workspace, issue, room, topic, run, and inbox APIs
- realtime events for run output and presence
- GitHub integration and PR state sync
- notification fanout and approval workflows

Run target once Go is installed:

```bash
go run ./cmd/openshock-server
```
