# OpenShock Daemon

Go local runtime bridge for the OpenShock Phase 0 machine lane.

Current shape:

- `cmd/openshock-daemon/main.go` exposes a local HTTP daemon
- `GET /healthz` returns liveness
- `GET /v1/runtime` reports detected local providers
- `POST /v1/exec` executes prompts through local CLI tools
- detects local CLI binaries like `codex` and `claude`
- supports a `-once` mode for one-shot inspection output

Planned responsibilities:

- runtime registration and heartbeats
- local CLI discovery for Codex and Claude Code
- worktree lifecycle management
- sandbox policy enforcement
- run execution, stdout capture, and approval handoff

Run:

```powershell
go run ./cmd/openshock-daemon --workspace-root E:\00.Lark_Projects\00_OpenShock
```
