# Test Report 2026-04-11 First-Start Journey / Access-Onboarding-Chat

- Command: `pnpm test:headed-first-start-journey -- --report output/testing/headed-onboarding-studio-report.md`
- Generated At: 2026-04-13T13:46:05.529Z

## Result

- `/access` 在当前已登录但尚未完成设置的状态下，会把下一跳明确压成 `/onboarding`。
- 从 `/access` 点继续后会直接恢复到页内向导当前步骤，而不是先绕到旧的 setup 面板。
- 新向导会继续完成模板、仓库、运行环境和智能体配置，最后直接落到 `/chat/all`。
- `/setup` 会回显同一份 onboarding truth，包括模板、状态和恢复入口。
- 引导完成后回到 `/access`，下一跳会变成 `/chat/all`，first-start journey 会正确收口。
- `/access` 的继续按钮在完成首次设置后会直接进入聊天主界面。
- 重启 server 后，`/settings` 仍能读到同一份已完成 onboarding 状态，说明数据已经持久化。
- 第二个浏览器上下文打开 `/setup` 时也能读到同一份 onboarding 结果，恢复不依赖单个 tab。

## Evidence

- access-before-onboarding: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/01-access-before-onboarding.png`
- onboarding-resume-github: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/02-onboarding-resume-github.png`
- onboarding-template: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/03-onboarding-template.png`
- onboarding-github: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/04-onboarding-github.png`
- onboarding-repo: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/05-onboarding-repo.png`
- onboarding-runtime: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/06-onboarding-runtime.png`
- onboarding-agent: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/07-onboarding-agent.png`
- chat-after-onboarding: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/08-chat-after-onboarding.png`
- setup-after-onboarding: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/09-setup-after-onboarding.png`
- access-after-onboarding: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/10-access-after-onboarding.png`
- access-launch-chat: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/11-access-launch-chat.png`
- settings-after-server-restart: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/12-settings-after-server-restart.png`
- setup-second-context: `../../../tmp/openshock-tkt34-onboarding-bGOVbs/run/screenshots/13-setup-second-context.png`

## Scope

- 从 `/access` 起步，验证未完成设置时下一跳会进入 `/onboarding`，而不是继续指向旧的 setup 主路径。
- 在 `/onboarding` 从当前恢复步骤回退到模板，重新选择模板后继续完成 GitHub 跳过、仓库识别、运行环境连接和智能体保存，然后确认最终进入 `/chat/all`。
- 验证完成首次启动后，`/access`、`/setup` 和 `/settings` 会投影同一份已完成的 onboarding truth。
- 验证 server restart 与第二个浏览器上下文后，模板、状态和恢复入口仍保持一致。
