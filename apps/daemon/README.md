# OpenShock Daemon

This directory now contains the first Go skeleton for the future local daemon.

Current shape:

- `cmd/openshock-daemon/main.go` emits heartbeat logs
- detects local CLI binaries like `codex` and `claude-code`
- supports a `-once` mode for one-shot inspection output

Planned responsibilities:

- runtime registration and heartbeats
- local CLI discovery for Codex and Claude Code
- worktree lifecycle management
- sandbox policy enforcement
- run execution, stdout capture, and approval handoff

Run target once Go is installed:

```bash
go run ./cmd/openshock-daemon --once
```
