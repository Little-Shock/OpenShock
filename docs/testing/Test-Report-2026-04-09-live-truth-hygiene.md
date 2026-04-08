# Test Report 2026-04-09 Live Truth Hygiene

- Ticket: `TKT-38`
- Checklist: `CHK-03` `CHK-15`
- Test Case: `TC-042`
- Exact Artifact:
  - branch: `tkt-38-live-truth-hygiene-placeholder-guard`
  - base: `origin/dev @ 6a46173`
  - verification time: `2026-04-09 00:38:30 +08`

## Scope

- fail-closed sanitize `/v1/state` 与 `/v1/state/stream` 的 visible truth
- 在前台 `PhaseZeroState` adapter 上兜住 mutation-returned state
- 清理 live surfaces 中仍残留的 placeholder / stale mock wording
- 把 negative scan 拉进 release gate

## Changes Landed

- server:
  - `apps/server/internal/api/live_truth_hygiene.go`
  - `apps/server/internal/api/live_truth_hygiene_test.go`
  - `/v1/state` 改为返回 sanitized snapshot
  - `/v1/state/stream` snapshot 改为返回 sanitized state
- web:
  - `apps/web/src/lib/phase-zero-types.ts` 把 live types 从 `mock-data` 抽离
  - `apps/web/src/lib/phase-zero-helpers.ts` 新增 `sanitizePhaseZeroState(...)`
  - `apps/web/src/lib/live-phase0.ts` 在 commit 阶段统一兜住 mutation / refresh / stream 的 state
  - live detail / room / setup / settings / orchestration / inbox 等 copy 清掉 stale mock / placeholder wording
- release gate:
  - `scripts/check-live-truth-hygiene.mjs`
  - `package.json`

## Verification

### 1. Hygiene gate

- Command:
  - `pnpm check:live-truth-hygiene`
- Result:
  - `PASS`
- Notes:
  - 当前检查 59 个 web source files
  - direct `@/lib/mock-data` import、banned placeholder wording、tracked live-truth residue 均为 0 命中

### 2. Targeted server tests

- Command:
  - `./scripts/go.sh test ./apps/server/internal/api -run 'TestSanitizeLivePayloadRemovesPlaceholderLeakage|TestBuildStateStreamEventSanitizesSnapshot' -count=1`
- Result:
  - `PASS`
- Notes:
  - 覆盖 issue / room / run / inbox / runtime lease / session / memory artifact 的 fallback sanitization
  - 覆盖 SSE snapshot sanitization

### 3. Adversarial live-state probe against dirty copy

- Setup:
  - 从共享 checkout 复制 dirty `state.json` 到 `/tmp/openshock-tkt38-state.json`
  - 用 clean worktree `/tmp/openshock-tkt38` 启临时 server 在 `:18081`
- Probe:
  - 读取 `http://127.0.0.1:18081/v1/state`
  - 读取 `http://127.0.0.1:18081/v1/state/stream`
  - 只围用户可见字段做 negative scan：`??`、`placeholder|fixture|test-only`、`E2E ... 20xxxxxx`、内部路径
- Result:
  - `PASS`
- Sample sanitized values:
  - `run.branch -> 待整理分支`
  - `run.worktreePath -> 当前 worktree 路径正在整理中。`
  - `session.memoryPaths[0] -> MEMORY.md`
  - `memory[24].path -> notes/current-artifact.md`

### 4. Full release gate

- Command:
  - `pnpm verify:release`
- Result:
  - `PASS`
- Notes:
  - `verify:web` 通过
  - `verify:server` 通过
  - `verify:daemon` 通过
  - web lint 仍只有既有 4 条 `react-hooks/exhaustive-deps` warnings in `stitch-chat-room-views.tsx`，不作为本票 blocker

## Boundary / Residual

- 这张票只收 live truth hygiene / leak guard，不重做信息架构，也不把 runtime sandbox hardening 混进来
- server contract 没有被改成全局 response rewrite；只对 state / SSE 做定点 sanitization
- mutation-returned state 的 hygiene guard 落在前台 `sanitizePhaseZeroState(...)`，避免污染内部 API tests / runtime contracts
