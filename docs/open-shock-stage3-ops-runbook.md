# OpenShock Stage 3 Ops Runbook

## 文档目的

这份文档是阶段3第一拍的运维入口，范围只收四件事：

- install
- recovery
- upgrade
- handoff

这份文档不定义新 runtime truth，不新增 backend noun，不引入多人协作流程。

## 固定入口与基线

固定目录：`/Users/atou/OpenShockSwarm`

当前正式基线：`feat/initial-implementation@0116e37`

当前自动测试基线：

```bash
cd /Users/atou/OpenShockSwarm/apps/server
node --test
```

结果应为：`33/33 pass`

## Runtime Helper 边界

阶段3允许长期保留的 helper 只认下面这组：

```bash
go run ./cmd/openshock-daemon integrated-up --config runtime/shared-runtime-config.json
go run ./cmd/openshock-daemon integrated-demo --config runtime/shared-runtime-config.json
go run ./cmd/openshock-daemon integrated-publish --config runtime/shared-runtime-config.json --run-id <run_id>
```

这些 helper 的作用是 readiness、demo publish、指定 run publish，不是新的正式后端层。

阶段3不允许把下面内容作为正式入口：

- `.slock/agents/.../OpenShockSwarm` 私有副本
- 散落在个人目录的临时脚本
- 未入文档的隐含启动顺序
- 把 shell adapter 扩成第二套后端 truth

## Install

只在固定目录执行。

1. 进入固定目录。

```bash
cd /Users/atou/OpenShockSwarm
```

2. 确认共享配置文件存在。

```bash
test -f runtime/shared-runtime-config.json || cp runtime/shared-runtime-config.example.json runtime/shared-runtime-config.json
```

3. 先过自动测试基线。

```bash
cd apps/server
node --test
cd ../..
```

4. 启动 server 与 shell。

```bash
PORT=4315 node apps/server/src/index.js
SHELL_PORT=4174 SHELL_API_UPSTREAM=http://127.0.0.1:4315 node apps/shell/scripts/dev-server.mjs
```

5. 运行 daemon readiness。

```bash
go run ./cmd/openshock-daemon integrated-up --config runtime/shared-runtime-config.json
```

6. 复打最小 smoke。

```bash
curl -sS http://127.0.0.1:4315/runtime/smoke
curl -sS http://127.0.0.1:4174/api/v0a/shell-state
```

## Recovery

### 场景A：server 或 shell 不可用

```bash
pkill -f 'apps/server/src/index.js' || true
pkill -f 'apps/shell/scripts/dev-server.mjs' || true
PORT=4315 node apps/server/src/index.js
SHELL_PORT=4174 SHELL_API_UPSTREAM=http://127.0.0.1:4315 node apps/shell/scripts/dev-server.mjs
```

恢复后重跑：

```bash
go run ./cmd/openshock-daemon integrated-up --config runtime/shared-runtime-config.json
curl -sS http://127.0.0.1:4315/runtime/smoke
curl -sS http://127.0.0.1:4174/api/v0a/shell-state
```

### 场景B：daemon publish 中断

1. 先做 readiness。

```bash
go run ./cmd/openshock-daemon integrated-up --config runtime/shared-runtime-config.json
```

2. 对目标 run 重发 publish。

```bash
go run ./cmd/openshock-daemon integrated-publish --config runtime/shared-runtime-config.json --run-id <run_id>
```

3. 若没有现成 run，可重跑 demo 生成样本链路。

```bash
go run ./cmd/openshock-daemon integrated-demo --config runtime/shared-runtime-config.json
```

### 场景C：配置口径漂移

只允许修复 `runtime/shared-runtime-config.json`，不改写 runtime truth。

必须确认四个 daemon 路径都落在固定目录的 `runtime/.openshock-daemon/` 下。

## Upgrade

升级只允许在固定目录内完成。

1. 确认工作树状态。

```bash
cd /Users/atou/OpenShockSwarm
git status --short
```

2. 拉取远端并切到目标正式头（示例为跟随远端分支头）。

```bash
git fetch origin feat/initial-implementation
git checkout feat/initial-implementation
git pull --ff-only origin feat/initial-implementation
```

3. 复跑基线验证。

```bash
cd apps/server
node --test
cd ../..
node --check apps/shell/scripts/dev-server.mjs
node --check apps/shell/src/app.js
```

4. 复打最小 smoke。

```bash
curl -sS http://127.0.0.1:4315/runtime/smoke
curl -sS http://127.0.0.1:4174/api/v0a/shell-state
```

## Handoff

交接时只给同一套固定入口，不给私有路径。

最小交接包必须包含：

- 固定目录路径
- 当前 commit
- 自动测试结果
- shell `node --check` 结果
- smoke 结果
- 本文档路径
- roadmap 与 test-cases 路径

推荐交接命令：

```bash
cd /Users/atou/OpenShockSwarm
git rev-parse --short HEAD
cd apps/server && node --test
cd ../..
node --check apps/shell/scripts/dev-server.mjs
node --check apps/shell/src/app.js
```

## 阶段3第一拍 DoD 对齐

本 runbook 对齐 `#149/#153` 边界，只收交付与运维就绪：

- install、recovery、upgrade、handoff 有单一入口
- helper 边界明确，旧过渡入口不再作为正式口径
- 交接可在固定目录按文档重复执行
