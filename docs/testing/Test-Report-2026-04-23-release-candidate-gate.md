# Test Report 2026-04-23 Release Candidate Gate

- Date: `2026-04-23`
- Recorded At: `2026-04-23T01:02:00Z`
- Branch: `main`
- Commit: `f7812c773b68`
- Target stack:
  - server: `http://127.0.0.1:39082`
  - daemon: `http://127.0.0.1:8090`
- Browser mode: `OPENSHOCK_E2E_HEADLESS=1`
- GitHub readiness contract: `ready=true`, `authMode=gh-cli`
- Goal: verify the managed current-code stack can pass the full strict release-candidate path with repo gate, integration loop, four browser chains, and strict live smoke all in one run.

## Commands

```bash
node --test ./scripts/release-gate-contract.test.mjs

OPENSHOCK_E2E_HEADLESS=1 \
pnpm verify:release:browser

OPENSHOCK_SERVER_URL=http://127.0.0.1:39082 \
OPENSHOCK_DAEMON_URL=http://127.0.0.1:8090 \
OPENSHOCK_REQUIRE_GITHUB_READY=1 \
pnpm verify:release:rc
```

## Evidence Bundle

| Evidence | Scope | Report |
| --- | --- | --- |
| RC gate summary | repo gate、integration、browser suite、strict smoke 总结果 | [Test Report 2026-04-23 Release Candidate Gate](./Test-Report-2026-04-23-release-candidate-gate.md) |
| Onboarding first-start journey | `/access -> /onboarding -> /chat/all` 与 onboarding truth recovery | [Test Report 2026-04-23 Release Gate Onboarding Studio](./Test-Report-2026-04-23-release-gate-onboarding-studio.md) |
| Fresh workspace critical loop | `打开应用 -> onboarding/setup -> chat -> board -> rooms continue -> reload/restart` | [Test Report 2026-04-23 Fresh Workspace Critical Loop](./Test-Report-2026-04-23-fresh-workspace-critical-loop.md) |
| Rooms continue entry | `/rooms` 单主动作与 blocked/unread/active 优先级 | [Test Report 2026-04-23 Rooms Continue Entry](./Test-Report-2026-04-23-rooms-continue-entry.md) |
| Config persistence recovery | `/settings` durable config 在 refresh / restart / second context 后保持一致 | [Test Report 2026-04-23 Release Gate Config Persistence Recovery](./Test-Report-2026-04-23-release-gate-config-persistence-recovery.md) |

## Result

- PASS: `node --test ./scripts/release-gate-contract.test.mjs`
  - release gate 命令、文档入口和 strict RC path contract 全绿。
- PASS: `OPENSHOCK_E2E_HEADLESS=1 pnpm verify:release:browser`
  - onboarding first-start journey 通过。
  - fresh workspace critical loop 通过。
  - rooms continue entry 通过。
  - config persistence recovery 通过。
- PASS: `OPENSHOCK_SERVER_URL=http://127.0.0.1:39082 OPENSHOCK_DAEMON_URL=http://127.0.0.1:8090 OPENSHOCK_REQUIRE_GITHUB_READY=1 pnpm verify:release:rc`
  - repo gate 通过：
    - `verify:web`
    - `verify:server`
    - `verify:daemon`
    - daemon `-once` heartbeat snapshot
    - runbook / package entry-point grep
    - release-gate contract self-check
  - `server ↔ daemon` integration loop 通过：
    - `go test -tags=integration ./apps/server/internal/integration -run TestPhaseZeroLoopThroughDaemon -count=1`
  - browser suite 4 条链路顺序通过。
  - strict live smoke 通过：
    - `GET /healthz`
    - `GET /v1/state`
    - `GET /v1/state/stream`
    - `GET /v1/experience-metrics`
    - `GET /v1/repo/binding`
    - `GET /v1/github/connection`
    - `GET /v1/runtime/registry`
    - `GET /v1/runtime/pairing`
    - `GET /v1/runtime`
    - daemon `GET /v1/runtime`
    - `POST /v1/runs/__ops_smoke_missing_run__/control` fail-closed `404 run not found`

## Reviewer Notes

- 本轮 release candidate 真值不再只靠单条 browser critical path；已升级为 `首启 + 主链 + continue + durable recovery` 四条浏览器证据一起放行。
- `onboarding` harness 在本轮修正为只把“可点击的 finish”认作 finish stage，并在最终提交时直接触发按钮点击，避免 DOM 刷新导致的假失败。
- 独立并行重跑 headed 脚本时，曾出现一次 web startup `fetch failed`，属于本地起服资源竞争；串行 RC gate 与串行 browser gate 均稳定通过。
- 本轮验证目标仍是 managed current-code stack `:39082 / :8090`，没有把 legacy `:8080` 当作放行依据。

## Sign-off

- Release gate status: `PASS`
- Reviewer sign-off: `pending human review`
