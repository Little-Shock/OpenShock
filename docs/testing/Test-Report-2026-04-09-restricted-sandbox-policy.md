# Test Report 2026-04-09 Restricted Sandbox Policy

- Command: `pnpm test:headed-restricted-sandbox-policy -- --report docs/testing/Test-Report-2026-04-09-restricted-sandbox-policy.md`
- Generated At: 2026-04-09T08:27:34.548Z

## Result

- `/runs/:id` 现在可直接编辑 run-level sandbox profile 与 allowlist，不再只剩后端隐式判断。
- 命中 allowlist 的 network target 会在 run detail 上直接回 `allowed`，并同步回当前 decision truth。
- 非 allowlisted command 会 fail-closed 到 `approval_required`，而且 override 按钮只会在同 target 的 review state 之后放开。
- owner 侧 `workspace.manage` 可以对同一条 `approval_required` action 执行 override retry；target 漂移时 UI 会重新收紧。
- reload 后，run policy 与 latest decision 会继续从 persisted state 读回，不会退回默认 trusted / idle。

## Evidence

- run-sandbox-before-edit: `../tkt46-run-artifacts/run/screenshots/run-sandbox-before-edit.png`
- run-sandbox-after-save: `../tkt46-run-artifacts/run/screenshots/run-sandbox-after-save.png`
- run-sandbox-allowed-check: `../tkt46-run-artifacts/run/screenshots/run-sandbox-allowed-check.png`
- run-sandbox-approval-required: `../tkt46-run-artifacts/run/screenshots/run-sandbox-approval-required.png`
- run-sandbox-override: `../tkt46-run-artifacts/run/screenshots/run-sandbox-override.png`
- run-sandbox-after-reload: `../tkt46-run-artifacts/run/screenshots/run-sandbox-after-reload.png`

## Scope

- Edited run-level sandbox profile / allowlists from `/runs/run_runtime_01`.
- Verified allowlisted network action -> `allowed`.
- Verified blocked command -> `approval_required` -> same-target override retry -> `overridden`.
- Verified reload and `/v1/state` both read the same persisted run sandbox truth.
