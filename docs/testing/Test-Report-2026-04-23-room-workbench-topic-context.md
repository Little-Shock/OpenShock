# 2026-04-23 Room Workbench Topic Context Report

- Command: `pnpm test:headed-room-workbench-topic-context -- --report docs/testing/Test-Report-2026-04-23-room-workbench-topic-context.md`
- Artifacts Dir: `/tmp/openshock-room-workbench-GJUBDV`

## Results
- 默认房间现在直接回到聊天主面，thread rail 仍保留在右侧，不再先展示一排一级 workbench tabs。
- Topic 摘要和最近三条消息现在并入 room context，同一条 room URL 就能继续判断当前上下文。
- Run sheet 仍可在 room 内直接执行 stop / resume / follow_thread，不需要被拆成完全独立的新工作流。
- PR sheet 继续保留在 room 语境里，可直接看到 review / merge 入口，而不是强制跳走。
- Context sheet 现在会把认领、执行、交接、继续、收口压成同一条主链，不用先翻治理明细。
- Context sheet 继续支持 query-state reload，并保留 issue / board / inbox back-links。
- Inbox back-link 仍能把人带回同一条 room context state。
- 移动端在 sidebar 隐藏时仍保留 room context 的 inbox 逃生入口，并能从 Inbox 返回同一条 context state。

## Screenshots
- room-chat: /tmp/openshock-room-workbench-GJUBDV/screenshots/01-room-chat.png
- room-context-summary: /tmp/openshock-room-workbench-GJUBDV/screenshots/02-room-context-summary.png
- room-run: /tmp/openshock-room-workbench-GJUBDV/screenshots/03-room-run.png
- room-pr: /tmp/openshock-room-workbench-GJUBDV/screenshots/04-room-pr.png
- room-context: /tmp/openshock-room-workbench-GJUBDV/screenshots/05-room-context.png
- inbox-backlink: /tmp/openshock-room-workbench-GJUBDV/screenshots/06-inbox-backlink.png
- room-context-md: /tmp/openshock-room-workbench-GJUBDV/screenshots/07-room-context-md.png
- room-context-mobile: /tmp/openshock-room-workbench-GJUBDV/screenshots/08-room-context-mobile.png
- inbox-mobile-backlink: /tmp/openshock-room-workbench-GJUBDV/screenshots/09-inbox-mobile-backlink.png

## Single Value
- `/rooms/:roomId` 现在默认回到 chat-first room shell：聊天主面始终优先，`Run / PR / Context` 退成次级 sheet，原来的 topic 摘要已并入 context，而 `follow_thread`、PR review 入口、reload persistence 与 inbox back-links 仍完整保留。
