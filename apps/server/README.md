# OpenShock Server

Server-side coordination truth for OpenShock.

For Stage 3 release/handoff entry, start from repo-level files:

- `README.md`
- `docs/stage3-delivery-ops-entry.md`
- `docs/stage3-release-gate.md`

Current stage focus is Stage 4A1 governance foundation, with boundaries locked to:

- account identity/member/workspace-installation/repo-binding control-plane contract
- installation bound to workspace scope (not personal install scope)
- no 4A2/4B/4C backflow and no new backend truth source

## Run

```bash
cd apps/server
node --test
node src/index.js
```

Default HTTP port is `4300`.

## Primary Contract Surface

The product/consumer contract is `/v1/*`.

Representative surfaces used by shell and gates:

- control plane: `/v1/topics/*`, `/v1/channels/*`
- execution plane: `/v1/runs/*`, `/v1/execution/runs/*`, `/v1/runtime/*`
- integration projections: `/v1/compatibility/shell-adapter`, `/v1/debug/*`

Stage 4A1 governance contract is carried by:

- `GET /v1/channels/:channelId/context`
- `PUT /v1/channels/:channelId/context`
- `GET /v1/channels/:channelId/repo-binding`
- `PUT /v1/channels/:channelId/repo-binding`

These contract projections include `auth_identity`, `member`, `github_installation`, `repo_binding`,
permission matrix, state graph, and channel audit anchors.

## Compatibility Alias Boundary

Compatibility aliases are bounded and documented by:

- `GET /v1/compatibility/shell-adapter`

The contract includes:

- allowed `/api/v0a/*` adapter routes
- bounded `/runtime/*` helper routes
- legacy transition paths and their `/v1/*` replacements
- current release baseline (`feat/initial-implementation@0116e37`, `apps/server 33/33 pass`)

`/api/v0a/*` is compatibility-only. It must stay adapter/projection-only and cannot define backend truth.

## Runtime Helper Boundary

`/runtime/*` routes are ops helpers, not long-term product consumer APIs:

- `GET /runtime/config`
- `POST /runtime/fixtures/seed`
- `POST /runtime/daemon/events`
- `GET /runtime/smoke`

They are allowed for bring-up/recovery/verification workflows only.

## Legacy Transition Surface

`/topics/*` routes are transition-only legacy paths.

Stage 3 cleanup requires:

- `/v1/*` remains the source contract
- old transition paths do not become long-term parallel public commitments
- docs/tests/release gate all anchor to the same `/v1` truth and current baseline
