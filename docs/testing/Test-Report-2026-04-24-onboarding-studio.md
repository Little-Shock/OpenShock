# Test Report 2026-04-24 Release Gate Onboarding Studio

- Command: `pnpm test:headed-onboarding-studio -- --report docs/testing/Test-Report-2026-04-24-onboarding-studio.md`
- Generated At: 2026-04-24T16:45:23.527Z

## Result

- `/access` 在当前已登录但尚未完成设置的状态下，会把下一跳明确压成 `/onboarding`。
- 从 `/access` 点继续后会直接恢复到页内向导当前步骤，而不是先绕到旧的 setup 面板。
- 新向导会按当前工作区状态补完剩余步骤；如果默认仓库和运行环境已就绪，也会直接收口到 `/chat/all`。
- `/setup` 会回显同一份 onboarding truth，包括模板、状态和恢复入口。
- 引导完成后回到 `/access`，下一跳会变成 `/chat/all`，first-start journey 会正确收口。
- `/access` 的继续按钮在完成首次设置后会直接进入聊天主界面。
- 重启 server 后，`/settings` 仍能读到同一份已完成 onboarding 状态，说明数据已经持久化。
- 第二个浏览器上下文打开 `/setup` 时也能读到同一份 onboarding 结果，恢复不依赖单个 tab。

## Evidence

- access-before-onboarding: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/01-access-before-onboarding.png`
- onboarding-resume-github: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/02-onboarding-resume-github.png`
- onboarding-template: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/03-onboarding-template.png`
- chat-after-onboarding: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/04-chat-after-onboarding.png`
- setup-after-onboarding: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/05-setup-after-onboarding.png`
- access-after-onboarding: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/06-access-after-onboarding.png`
- access-launch-chat: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/07-access-launch-chat.png`
- settings-after-server-restart: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/08-settings-after-server-restart.png`
- setup-second-context: `../../../tmp/openshock-tkt34-onboarding-GHlHvO/run/screenshots/09-setup-second-context.png`

## Scope

- 从 `/access` 起步，验证未完成设置时下一跳会进入 `/onboarding`，而不是继续指向旧的 setup 主路径。
- 在 `/onboarding` 从当前恢复步骤回退到模板，重新选择模板后补完剩余步骤，或在已具备默认能力时直接收口到 `/chat/all`。
- 验证完成首次启动后，`/access`、`/setup` 和 `/settings` 会投影同一份已完成的 onboarding truth。
- 验证 server restart 与第二个浏览器上下文后，模板、状态和恢复入口仍保持一致。
