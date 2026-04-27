# TKT-03 有头 Setup 端到端报告

Date: 2026-04-23T15:43:51.081Z
Project Root: /home/lark/OpenShock
Workspace Root: /tmp/openshock-tkt03-headed-setup-wbXMAA/workspace
Artifacts Root: /tmp/openshock-tkt03-headed-setup-wbXMAA
Chromium: /snap/bin/chromium

## 环境

- Web: http://127.0.0.1:44518
- Server: http://127.0.0.1:44528
- Daemon: http://127.0.0.1:44236
- First Start Entry: http://127.0.0.1:44518/

## 设置检查

- Repo Binding Status: 已绑定
- Repo Binding Message: 当前工作区已识别仓库：Larkspur-Wang/OpenShock
- GitHub Readiness Status: 已连接
- GitHub Message: GitHub 命令行已登录，可以继续处理远端拉取请求。
- 运行环境: shock-main
- 配对状态: browser-approved / 已配对
- 桥接输出（摘录）: Codex CLI 已连接，当前机器 shock-main 在线，可以开始执行。

## 链路检查

- Issue: OPS-28 / TKT-03 headed setup e2e 1776959019722
- Room: room-tkt-03-headed-setup-e2e-1776959019722
- Run: run_tkt-03-headed-setup-e2e-1776959019722_01
- PR 操作: 发起 PR (可用)
- PR 标识: 未创建 PR
- PR 状态: 可操作
- 下一步执行: 等待 worktree lane；shock-sidecar 当前不可用，已切到 shock-main，当前有 2 条执行。
- Room URL: http://127.0.0.1:44518/rooms/room-tkt-03-headed-setup-e2e-1776959019722

## 证据

- first-start-entry: /tmp/openshock-tkt03-headed-setup-wbXMAA/screenshots/01-first-start-entry.png
- setup-shell: /tmp/openshock-tkt03-headed-setup-wbXMAA/screenshots/02-setup-shell.png
- setup-binding-and-github: /tmp/openshock-tkt03-headed-setup-wbXMAA/screenshots/03-setup-binding-and-github.png
- setup-runtime-and-bridge: /tmp/openshock-tkt03-headed-setup-wbXMAA/screenshots/04-setup-runtime-and-bridge.png
- room-pr-entry-ready: /tmp/openshock-tkt03-headed-setup-wbXMAA/screenshots/05-room-pr-entry-ready.png
- trace: /tmp/openshock-tkt03-headed-setup-wbXMAA/trace.zip
- daemon log: /tmp/openshock-tkt03-headed-setup-wbXMAA/logs/daemon.log
- server log: /tmp/openshock-tkt03-headed-setup-wbXMAA/logs/server.log
- web log: /tmp/openshock-tkt03-headed-setup-wbXMAA/logs/web.log

## 结果

- TC-001 Setup shell visibility: PASS
- TC-000 Root first-start redirect: PASS
- TC-002 Repo binding via Setup: PASS
- TC-003 Runtime pairing and bridge prompt via Setup: PASS
- TC-026 Headed Setup to PR entry-ready journey: PASS
