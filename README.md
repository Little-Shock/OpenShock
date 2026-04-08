# OpenShockSwarm

Initial MVP implementation for the OpenShock collaboration shell.

## Structure

- `documents/`
  Product, technical, action-model, and design reference documents.
- `packages/contracts/`
  Contract-first API definition for the first MVP slice.
- `apps/backend/`
  Go backend with an action gateway, in-memory dev store, and HTTP API.
- `apps/daemon/`
  Go daemon skeleton for runtime registration, heartbeats, run claiming, and run event reporting.
- `apps/frontend/`
  Next.js frontend for the room shell, task board, and inbox.

## Run

Backend:

```bash
cd apps/backend
go run ./cmd/server
```

Frontend:

```bash
cd apps/frontend
npm run dev
```

Daemon:

```bash
cd apps/daemon
go run ./cmd/daemon --once
```

The frontend expects the backend at `http://localhost:8080`.
Override with `NEXT_PUBLIC_API_BASE_URL` if needed.

## Verify

Backend:

```bash
cd apps/backend
go test ./...
go build ./...
```

Frontend:

```bash
cd apps/frontend
npm run lint
npm run build
```

Daemon:

```bash
cd apps/daemon
go test ./...
go build ./...
```

## Current MVP Slice

- Room-first collaboration shell
- Task board
- Human inbox
- Contract-first backend API
- Action gateway for:
  - `RoomMessage.post`
  - `Task.create`
  - `Task.assign`
  - `Task.mark_ready_for_integration`
  - `Run.create`
  - `GitIntegration.merge.request`
- Execution control protocol for:
  - runtime registration
  - runtime heartbeats
  - run claiming
  - run event ingestion
- Minimal daemon client that exercises the execution control protocol

Persistence is still in-memory for the first executable slice.
The next major steps are:

- replacing the dev store with a PostgreSQL-backed adapter
- adding the backend-daemon control contract to `packages/contracts`
- wiring the daemon execution loop to ACP and Codex instead of simulated completion

## Demo Flow

1. Start the backend:

```bash
cd apps/backend
go run ./cmd/server
```

2. Start the frontend:

```bash
cd apps/frontend
npm run dev
```

3. Open the shell and task board.

4. From the task board:
- create a new task
- click `Queue Run` on a task card

5. In another terminal, start the daemon once:

```bash
cd apps/daemon
go run ./cmd/daemon --once
```

6. Watch the shell:
- `Execution Lanes` update from queued to running/completed
- Room receives system messages for execution events
- Inbox receives approval / blocked items when those states are emitted
