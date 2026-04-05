# Runbook

这份文档只回答一件事：怎么把 OpenShock Phase 0 在本地跑起来。

## Prerequisites

- Node.js 20+
- `pnpm`
- Go 1.26+
- 已安装并可直接运行的 `claude` 和 `codex`

## Start The Stack

打开 3 个终端。

### 1. Web

```powershell
cd E:\00.Lark_Projects\00_OpenShock
pnpm dev
```

默认访问：

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

如果 3000 被占用，Next.js 会自动切到其他端口。

### 2. Server

```powershell
cd E:\00.Lark_Projects\00_OpenShock\apps\server
go run ./cmd/openshock-server
```

默认访问：

- [http://127.0.0.1:8080/healthz](http://127.0.0.1:8080/healthz)

### 3. Daemon

```powershell
cd E:\00.Lark_Projects\00_OpenShock\apps\daemon
go run ./cmd/openshock-daemon --workspace-root E:\00.Lark_Projects\00_OpenShock
```

默认访问：

- [http://127.0.0.1:8090/healthz](http://127.0.0.1:8090/healthz)

## What Works Right Now

- `web -> server -> daemon -> claude`
- `web -> server -> daemon -> codex`
- Setup 页 live bridge
- Chat / Rooms / Inbox / Board 多路由骨架
- Room / Run / Agent / Inbox 的 mock control surface

## What Is Still Mocked

- 邮箱登录
- GitHub 绑定
- Worktree 生命周期
- PR 创建与状态回写
- 持久化状态存储
- Realtime 流式日志

## Quick Verification

先确认 server 和 daemon 在线：

```powershell
Invoke-RestMethod http://127.0.0.1:8080/healthz
Invoke-RestMethod http://127.0.0.1:8090/healthz
```

再确认 bridge 可用：

```powershell
$body = @{
  provider = 'claude'
  prompt   = 'Reply with exactly: OpenShock bridge online.'
  cwd      = 'E:\00.Lark_Projects\00_OpenShock'
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8080/v1/exec `
  -ContentType 'application/json' `
  -Body $body
```
