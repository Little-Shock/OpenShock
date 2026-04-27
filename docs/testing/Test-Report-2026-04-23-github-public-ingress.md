# Test Report 2026-04-23 GitHub Public Ingress Verification

- Branch: `tkt-57-github-public-ingress`
- Scope: `TKT-57 / CHK-07 / TC-015 / TC-045`
- Evidence mode: production-style local ingress proxy + public-root callback/webhook replay
- Chromium: `/snap/bin/chromium`
- Artifacts dir: `/tmp/openshock-tkt57-github-public-ingress-Sr6uGQ`

## Scope

- 覆盖 GitHub Setup surface 暴露 public callback URL / webhook URL。
- 覆盖 `/setup/github/callback` 通过同一 public ingress root 回流 installation truth。
- 覆盖 signed webhook delivery 与 bad-signature fail-closed 都走 public ingress，而不是直打内网 server 端口。

## Commands

- `pnpm test:headed-github-public-ingress -- --report docs/testing/Test-Report-2026-04-23-github-public-ingress.md`

## Checks

### Public callback surface and callback return page
- Public ingress root: `http://127.0.0.1:44980`
- Setup readiness before callback: `未完成`
- Setup message before callback: GitHub 应用已配置，但还没完成安装；当前先使用命令行登录。
- Surfaced callback URL: `http://127.0.0.1:44980/setup/github/callback`
- Surfaced webhook URL: `http://127.0.0.1:44980/v1/github/webhook`
- GitHub installation callback page result: `GitHub 安装回跳已接住`
- Setup readiness after callback: `已连接`
- Workspace repo auth mode after callback: `github-app`

### Public webhook delivery and fail-closed probe
- Public ingress root: `http://127.0.0.1:44660`
- Signed webhook replay status: `200`
- Signed webhook pullRequestId: `pr-runtime-18`
- Bad-signature replay status: `401`

## Evidence

- callback-setup-before: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/screenshots/01-callback-setup-before.png
- callback-success: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/screenshots/02-callback-success.png
- callback-setup-after: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/screenshots/03-callback-setup-after.png
- callback-daemon log: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/logs/callback-daemon.log
- callback-server log: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/logs/callback-server.log
- callback-web log: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/logs/callback-web.log
- webhook-server log: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/logs/webhook-server.log
- ingress log: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/logs/callback-ingress.log
- ingress log: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/logs/webhook-ingress.log
- callback web build log: /tmp/openshock-tkt57-github-public-ingress-Sr6uGQ/logs/callback-web-build.log

## TC-015 GitHub App 安装与 Webhook

- 当前执行状态: Pass
- 实际结果: Setup 当前会直接暴露 public callback / webhook URL；`/setup/github/callback` 在 production-style public ingress root 下可把 installation truth 前滚回 Setup，而 signed webhook delivery 与 bad-signature fail-closed 也都已通过 ingress `/v1/github/webhook` 复核。
- 业务结论: `installation callback -> Setup refresh -> signed webhook delivery` 这条链现在不再只围内网 server contract，而是已经有同一 public root 下的 exact replay evidence。

## TC-045 GitHub Public Ingress Callback / Webhook Delivery

- 当前执行状态: Pass
- 实际结果: local ingress proxy 同时代理 web + API，callback 页与 webhook delivery 都走公开根路径；错误签名继续 401 fail-closed，没有被 ingress 误吞。
- 业务结论: `CHK-07` 剩余的 public ingress 级验证现在已经收成 exact artifact；后续若要做真正 Internet / DNS / TLS / GitHub SaaS 外网演练，那属于环境级演练，而不是产品 contract 缺口。

