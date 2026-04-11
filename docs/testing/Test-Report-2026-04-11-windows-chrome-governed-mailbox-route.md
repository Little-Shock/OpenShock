# 2026-04-11 Governed Mailbox Route Report

- Ticket: `TKT-64`
- Checklist: `CHK-21`
- Test Case: `TC-053`
- Scope: governed default route、active handoff focus、blocked fallback
- Command: `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-route -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-route.md`
- Artifacts Dir: `/tmp/openshock-tkt64-governed-route-Yx1sUk`

## Results

- `/mailbox` 与 Inbox compose 都会读取 `workspace.governance.routingPolicy.suggestedHandoff`，并在 `ready` 状态下显式给出 `Create Governed Handoff` 一键起单入口 -> PASS
- 通过 governed route 一键起单后，`/mailbox` 与 Inbox compose 会一起切到 `active`，并提供聚焦当前 handoff 的回链，防止同一路由被重复创建 -> PASS
- 完成当前 reviewer handoff 后，两处 governed surface 会一起前滚到下一条 lane；当 QA lane 缺少可映射 agent 时，状态会显式转成 `blocked`，不会静默回退到随机接收方 -> PASS

## Screenshots

- governed-compose-ready: /tmp/openshock-tkt64-governed-route-Yx1sUk/screenshots/01-governed-compose-ready.png
- governed-route-ready: /tmp/openshock-tkt64-governed-route-Yx1sUk/screenshots/02-governed-route-ready.png
- governed-route-active: /tmp/openshock-tkt64-governed-route-Yx1sUk/screenshots/03-governed-route-active.png
- governed-compose-active: /tmp/openshock-tkt64-governed-route-Yx1sUk/screenshots/04-governed-compose-active.png
- governed-route-focus-inbox: /tmp/openshock-tkt64-governed-route-Yx1sUk/screenshots/05-governed-route-focus-inbox.png
- governed-route-next-blocked: /tmp/openshock-tkt64-governed-route-Yx1sUk/screenshots/06-governed-route-next-blocked.png
- governed-compose-next-blocked: /tmp/openshock-tkt64-governed-route-Yx1sUk/screenshots/07-governed-compose-next-blocked.png
