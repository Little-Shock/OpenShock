# Test Report 2026-04-09 Onboarding Studio / Scenario Templates

- Command: `pnpm test:headed-onboarding-studio -- --report docs/testing/Test-Report-2026-04-09-onboarding-studio.md`
- Generated At: 2026-04-09T00:53:31.545Z

## Result

- `/setup` 现在可以直接选择 `研究团队` 模板，并把 bootstrap package 写回 workspace onboarding truth。
- repo binding / runtime pairing 的 live truth 会把 onboarding progress 前滚到可 finish 状态，而不会把已有 `plan / browserPush / memoryMode` 静默覆盖回模板默认值。
- 完成首次启动后，`/setup` 会把 status、resume route 和 materialized package 一起收平到 durable workspace snapshot。
- 立即 reload 后，模板选择、done 状态和 `/rooms` resume route 继续从同一份 workspace truth 读取。
- 重启 server 后，`/settings` 仍投影同一份 template + onboarding progress durable truth。
- 第二个浏览器上下文仍读到同一份 onboarding studio truth，说明恢复不依赖单个 tab。

## Evidence

- setup-before-template: `../openshock-tkt34-onboarding-XuuXPq/run/screenshots/01-setup-before-template.png`
- setup-after-template-select: `../openshock-tkt34-onboarding-XuuXPq/run/screenshots/02-setup-after-template-select.png`
- setup-progress-ready: `../openshock-tkt34-onboarding-XuuXPq/run/screenshots/03-setup-progress-ready.png`
- setup-finished: `../openshock-tkt34-onboarding-XuuXPq/run/screenshots/04-setup-finished.png`
- setup-after-reload: `../openshock-tkt34-onboarding-XuuXPq/run/screenshots/05-setup-after-reload.png`
- settings-after-server-restart: `../openshock-tkt34-onboarding-XuuXPq/run/screenshots/06-settings-after-server-restart.png`
- setup-second-context: `../openshock-tkt34-onboarding-XuuXPq/run/screenshots/07-setup-second-context.png`

## Scope

- 在 `/setup` 选择 `研究团队` 模板，并验证 materialized bootstrap package。
- 依据当前 repo binding / runtime pairing live truth 刷新 onboarding progress，再完成首次启动，同时验证自定义 `plan / browserPush / memoryMode` 不会被模板默认值静默覆盖。
- 验证 reload、server restart 与 second browser context 之后仍能读回同一份 onboarding truth。
