# OpenShock Server

Go API shell for the OpenShock Phase 0 control plane.

Current shape:

- `cmd/openshock-server/main.go` exposes a small standard-library HTTP server
- `GET /healthz` returns liveness
- `GET /v1/workspace` returns a mock workspace snapshot
- `GET /v1/channels` returns global channel state
- `GET /v1/rooms` returns issue room state
- `GET /v1/issues` returns mock Phase 0 issues
- `GET /v1/runs` and `GET /v1/runs/:id` return mock run state
- `GET /v1/agents` returns agent state
- `GET /v1/inbox` returns inbox state
- `GET /v1/runtime` proxies the daemon runtime snapshot
- `POST /v1/exec` proxies prompt execution to the local daemon

Planned responsibilities:

- workspace, issue, room, topic, run, and inbox APIs
- realtime events for run output and presence
- GitHub integration and PR state sync
- notification fanout and approval workflows

Run:

```powershell
go run ./cmd/openshock-server
```
