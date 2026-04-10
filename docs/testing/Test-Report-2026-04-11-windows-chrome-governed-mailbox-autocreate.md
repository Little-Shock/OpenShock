# 2026-04-11 Governed Mailbox Auto-Create Report

- Ticket: `TKT-65`
- Checklist: `CHK-21`
- Test Case: `TC-054`
- Scope: governed one-click create、dual-surface active sync、blocked replay
- Command: `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-route -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-autocreate.md`
- Artifacts Dir: `/tmp/openshock-tkt65-governed-route-ctUvF2`

## Results

- `/mailbox` 与 Inbox compose 在 `ready` governed route 下都提供 `Create Governed Handoff` 一键入口，不再要求人类重复选择 source / target -> PASS
- 通过 governed route 一键起单后，`/mailbox` 与 Inbox compose 会同步切到同一条 `active` handoff，并提供 focus 回链，避免出现双面状态分裂 -> PASS
- 当前 reviewer handoff 完成后，两处 governed surface 会围同一条 topology truth 一起前滚到下一条 lane；当 QA lane 缺少映射 agent 时，两处都显式 `blocked` -> PASS

## Screenshots

- governed-compose-ready: /tmp/openshock-tkt65-governed-route-ctUvF2/screenshots/01-governed-compose-ready.png
- governed-route-ready: /tmp/openshock-tkt65-governed-route-ctUvF2/screenshots/02-governed-route-ready.png
- governed-route-active: /tmp/openshock-tkt65-governed-route-ctUvF2/screenshots/03-governed-route-active.png
- governed-compose-active: /tmp/openshock-tkt65-governed-route-ctUvF2/screenshots/04-governed-compose-active.png
- governed-route-focus-inbox: /tmp/openshock-tkt65-governed-route-ctUvF2/screenshots/05-governed-route-focus-inbox.png
- governed-route-next-blocked: /tmp/openshock-tkt65-governed-route-ctUvF2/screenshots/06-governed-route-next-blocked.png
- governed-compose-next-blocked: /tmp/openshock-tkt65-governed-route-ctUvF2/screenshots/07-governed-compose-next-blocked.png
