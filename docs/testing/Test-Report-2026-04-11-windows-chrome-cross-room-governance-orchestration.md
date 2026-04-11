# 2026-04-11 Cross-Room Governance Orchestration Report

- Ticket: `TKT-95`
- Checklist: `CHK-21`
- Test Case: `TC-084`
- Scope: cross-room rollup route metadata, room-level governed create action, mailbox + orchestration mirror, inbox deep-link
- Command: `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-cross-room-governance-orchestration -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-cross-room-governance-orchestration.md`
- Artifacts Dir: `/tmp/openshock-tkt95-cross-room-governance-NoJSip`

## Results

- runtime room 通过真实 blocked inbox replay 进入 cross-room governance rollup 后，会带出 `current owner / current lane / next governed route` 元数据，不再只剩 room 状态摘要 -> PASS
- `/mailbox` 上的 cross-room rollup 在 route `ready` 时会开放 `Create Governed Handoff`，并通过正式 `POST /v1/mailbox/governed` 合同起单，而不是前端本地拼接 mutation -> PASS
- governed create 成功后，runtime room 的 route metadata 会从 `ready` 切成 `active`，`Open Next Route` 也会深链到新建 handoff；说明 room-level orchestration 已进入正式产品面 -> PASS
- `/agents` 会镜像同一份 route status 与 deep-link，不会出现 mailbox 已 active、orchestration 仍停在 ready 的分裂真相 -> PASS

## Assertions

- Baseline rollup length: 1
- Ready route: Codex Dockmaster / Architect / Codex Dockmaster -> Claude Review Runner
- Created handoff: handoff-1775884531227764874 (Codex Dockmaster -> Claude Review Runner)
- Active route href: /inbox?handoffId=handoff-1775884531227764874&roomId=room-runtime

## Screenshots

- mailbox-cross-room-baseline: /tmp/openshock-tkt95-cross-room-governance-NoJSip/screenshots/01-mailbox-cross-room-baseline.png
- mailbox-cross-room-route-ready: /tmp/openshock-tkt95-cross-room-governance-NoJSip/screenshots/02-mailbox-cross-room-route-ready.png
- orchestration-cross-room-route-ready: /tmp/openshock-tkt95-cross-room-governance-NoJSip/screenshots/03-orchestration-cross-room-route-ready.png
- mailbox-cross-room-route-active: /tmp/openshock-tkt95-cross-room-governance-NoJSip/screenshots/04-mailbox-cross-room-route-active.png
- inbox-cross-room-route-focus: /tmp/openshock-tkt95-cross-room-governance-NoJSip/screenshots/05-inbox-cross-room-route-focus.png
- orchestration-cross-room-route-active: /tmp/openshock-tkt95-cross-room-governance-NoJSip/screenshots/06-orchestration-cross-room-route-active.png
