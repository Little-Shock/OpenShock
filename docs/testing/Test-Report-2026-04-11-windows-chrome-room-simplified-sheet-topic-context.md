# 2026-04-11 Room Simplified Sheet / Topic Context Report

- Command: `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-room-workbench-topic-context -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-room-simplified-sheet-topic-context.md`
- Artifacts Dir: `/tmp/openshock-room-workbench-LNsEYY`

## Results
- 默认房间现在直接回到聊天主面，thread rail 仍保留在右侧，不再先展示一排一级 workbench tabs。
- Topic 继续作为 room 内的次级 sheet 保留，可从同一条 room URL 打开 topic summary 和最近 guidance。
- Run sheet 仍可在 room 内直接执行 stop / resume / follow_thread，不需要被拆成完全独立的新工作流。
- PR sheet 继续保留在 room 语境里，可直接看到 review / merge 入口，而不是强制跳走。
- Context sheet 继续支持 query-state reload，并保留 issue / board / inbox back-links。
- Inbox back-link 仍能把人带回同一条 room context state。

## Screenshots
- room-chat: /tmp/openshock-room-workbench-LNsEYY/screenshots/01-room-chat.png
- room-topic: /tmp/openshock-room-workbench-LNsEYY/screenshots/02-room-topic.png
- room-run: /tmp/openshock-room-workbench-LNsEYY/screenshots/03-room-run.png
- room-pr: /tmp/openshock-room-workbench-LNsEYY/screenshots/04-room-pr.png
- room-context: /tmp/openshock-room-workbench-LNsEYY/screenshots/05-room-context.png
- inbox-backlink: /tmp/openshock-room-workbench-LNsEYY/screenshots/06-inbox-backlink.png

## Single Value
- `/rooms/:roomId` 现在默认回到 chat-first room shell：聊天主面始终优先，`Topic / Run / PR / Context` 退成次级 sheet，但 `follow_thread`、PR review 入口、reload persistence 与 inbox back-links 仍完整保留。
