# OpenShock True P0 全面走查测试报告（修复后）

- 报告日期：2026-04-06
- 走查方式：本地真实启动服务 + 浏览器真实操作 + daemon 真实执行 + 本地真实 Git 仓库
- 关联用例文档：`documents/OpenShockTrueP0BusinessTestCases.md`
- 关联旧报告：`documents/OpenShockTrueP0WalkthroughReport-2026-04-06.md`

## 1. 本次走查目标

本次不是只验证页面展示，而是从 True P0 业务闭环出发，验证以下关键能力是否真的能工作：

1. 人类、agent、agent 之间能在频道内直接沟通协作。
2. Issue Room 内能完成 repo 绑定、task 创建、run 发起、merge 审批、delivery 发起。
3. daemon 能真实 claim agent turn / run / merge，并把结果回写系统。
4. 与真实本地仓库联动时，执行结果能进入 integration，再进入 delivery，再通过 webhook 完成 issue 闭环。

## 2. 环境与数据准备

### 2.1 服务环境

- Backend：本地 `go run ./cmd/server`
- Frontend：本地 `npm run start -- --hostname 127.0.0.1 -p 3000`
- Daemon：本地多次执行 `go run ./cmd/daemon --once --api-base-url http://127.0.0.1:8080 --name WalkthroughDaemon104`

### 2.2 验证命令

- Backend 回归：`go test ./...` in `apps/backend`
- Daemon 回归：`go test ./...` in `apps/daemon`
- Frontend 代码验证：`npm run lint`、`npm run build` in `apps/frontend`

### 2.3 真实仓库准备

- 仓库路径：`/tmp/openshock-true-p0-repo`
- 初始化方式：
  - `git init -b main`
  - 初始文件：`main.go`
  - 初始提交：`init walkthrough repo`

### 2.4 本次走查业务数据

- 新建 Issue：`issue_104`
- 对应 Room：`room_104`
- Delivery PR：`pr_102`
- 验证任务：
  - `task_101` Create walkthrough marker file
  - `task_102` Document merge gates

## 3. 本次修复内容

本轮不是只出报告，已经把走查中发现的真实缺口补上：

1. 增加 Issue Repo Binding 产品化入口。
   - Issue Room 右侧可直接绑定本地 repo path。
   - `Issue.bind_repo` 已可从 UI 正常触发。

2. 增加 Issue Room 内的 Task 创建入口。
   - 不再需要离开 Room 或手工调用接口。

3. 修复 Task Board Quick Create 写死 `issue_101` 的问题。
   - 现在支持 issue 选择，默认跟随当前默认 issue。
   - 本次已实际创建 task 到 `issue_104`，确认不再误写到 `issue_101`。

4. 补齐频道内的人类 / agent / agent 协作入口。
   - Room 输入区支持选择发送者。
   - 支持 agent 消息类型：`message` / `summary` / `clarification_request` / `handoff`

5. 修复 daemon 的 agent-turn 404 噪音。
   - 404 现在作为兼容性降级静默处理，不再污染真实走查日志。

6. 修复 run 完成后仓库仍是脏工作树，导致后续 merge 易失败的问题。
   - daemon 现在会在成功 run 后自动提交变更。
   - codex 临时输出文件 `.openshock_codex_last_message.txt` 不再残留在业务仓库里。

7. 修复 delivery webhook 的实时刷新 scope 不完整问题。
   - webhook 更新现在会广播 `issue:<id>` scope。
   - 这样 Issue Room 不会停留在旧状态。

## 4. 真实走查过程与结果

### 4.1 Issue 创建

- 通过左侧 `Create issue` 按钮创建 `issue_104`
- 系统自动创建：
  - Issue
  - Room
  - 默认 chat channel
  - integration branch

结果：通过

### 4.2 Repo 绑定

- 在 `room_104` 右侧通过 UI 绑定 `/tmp/openshock-true-p0-repo`
- 系统消息写入频道
- `issue.repoPath`、`run.repoPath`、`mergeAttempt.repoPath` 后续均能带出

结果：通过

### 4.3 频道协作沟通

已真实验证以下业务场景：

1. 人类 -> agent
   - Sarah 在房间内发送 `@agent_shell ...`
   - 系统创建 `agent_session` 与 `agent_turn`

2. agent -> 人类
   - `Shell_Runner` 以 `clarification_request` 发言
   - 系统创建 `agent_wait`
   - session 状态进入 `waiting_human`

3. 人类 -> agent 续接
   - Sarah 回复后
   - 系统创建 `clarification_followup` turn
   - `agent_wait` 由 `waiting_human` 变为 `resolved`

4. agent -> agent
   - `Shell_Runner` 以 `handoff` 发给 `@agent_guardian`
   - 系统创建 `handoff_record`
   - 目标 agent 获得新的 `handoff_response` turn

5. daemon 真实完成 agent turn
   - `turn_101`、`turn_102`、`turn_103` 均被 daemon claim 并完成
   - agent 回复真实写入频道

结果：通过

### 4.4 Task 创建

已验证两条路径：

1. Issue Room 右侧 Create Task
   - 创建 `task_101`

2. Task Board Quick Create
   - 在 Board 中选中 `issue_104`
   - 创建 `task_102`
   - 经接口校验，task 实际落在 `issue_104`

结果：通过

### 4.5 Run 执行

执行方式：

- `task_101` 通过 UI 发起 run
- `task_102` 通过 action 接口发起 run
- daemon 真实 claim 并执行 codex

真实结果：

1. `run_101`
   - 分支：`issue-104/task_101`
   - 产物：`walkthrough-marker-issue-104-task_101.txt`
   - 工具调用、run output、系统消息均有落库

2. `run_102`
   - 分支：`issue-104/task_102`
   - 产物：`MERGE_CHECKLIST.md`
   - 工具调用、run output、系统消息均有落库

3. 仓库结果
   - 当前 integration 分支最终含两个产物文件
   - 真实 git 历史存在 task 分支提交与 merge commit

结果：通过

说明：

- 在 `task_101` 第一次 run 完成时，暴露出“成功 run 但未自动 commit”的真实问题。
- 该问题已在本轮修复。
- 因修复发生在第一次 run 之后，`task_101` 做了一次性人工恢复提交；
  `task_102` 则是在修复后执行，已验证自动提交链路可用。

### 4.6 Merge 审批与集成

执行方式：

1. 两个 task 标记为 `Ready for Integration`
2. 系统生成待审批 merge 决策
3. 在 Inbox 中由 Sarah 执行 `Approve Merge`
4. daemon 真实 claim merge attempt 并执行 git merge

真实结果：

- `merge_101` 成功将 `task_102` 合入 `issue-104/integration`
- `merge_102` 成功将 `task_101` 合入 `issue-104/integration`
- `integrationBranch.status = ready_for_delivery`
- `mergedTaskIds = ["task_102", "task_101"]`
- 仓库真实分支图可见 merge commit

结果：通过

### 4.7 Delivery PR 创建

- 在 Issue Room 右侧按钮真实点击 `Create Delivery PR`
- 生成 `pr_102`
- issue 状态进入 `in_review`

结果：通过

### 4.8 Repo Webhook 闭环

- 模拟外部平台回调：
  - `provider = github`
  - `externalPrId = gh_pr_102`
  - `status = merged`
- 系统结果：
  - `deliveryPr.status = merged`
  - `integrationBranch.status = merged_to_main`
  - `issue.status = done`

结果：通过

## 5. 本次最终结论

### 5.1 True P0 主链路结论

在修复后，True P0 的主业务链路已经可以从真实服务和真实仓库角度完成闭环：

1. 创建 issue / room
2. 频道内人类与 agent、agent 与 agent 协作
3. 绑定真实本地 repo
4. 创建任务
5. 发起 run
6. daemon 真实执行 codex
7. run 结果进入系统
8. 人类审批 merge
9. daemon 真实执行 git merge
10. 创建 delivery PR
11. webhook 回写 merged
12. issue 收敛到 `done`

结论：True P0 主流程通过

### 5.2 本次确认已经修复的问题

- Repo 绑定缺少产品化入口：已修复
- Issue Room 无 Task 创建入口：已修复
- Board Quick Create 错误写死 `issue_101`：已修复
- daemon agent-turn 404 噪音：已修复
- 频道内缺少人类/agent/agent 协作入口：已修复
- run 后无自动提交导致 merge 链路不稳：已修复
- delivery webhook 不推送 issue scope：已修复

## 6. 剩余风险与说明

1. 现有种子数据 `issue_101` 仍保留历史待处理项。
   - 例如 `run_review_01` 仍会因未绑定 repoPath 而失败。
   - 这不是新回归，而是种子 issue 的旧状态；不影响本次 `issue_104` 主链路闭环结论。

2. Delivery webhook 的 issue 实时推送修复已完成并通过后端测试验证。
   - 由于本次 long-running backend 在修复前已启动，未在同一条长会话里重新做一遍 Room 页实时刷新观察。
   - 但代码和测试已经补齐。

3. 本次临时真实仓库仍停留在 `issue-104/integration` 分支。
   - 这是正常结果，便于后续继续人工复核 merge 产物。

## 7. 建议

建议把本报告对应的 `issue_104` 作为后续 agent 功能走查的标准演示样本，按以下顺序复用：

1. 先复用 `documents/OpenShockTrueP0BusinessTestCases.md`
2. 再按本报告中的环境准备启动服务
3. 使用新的临时 Git 仓库重跑一次 `issue -> room -> run -> merge -> delivery -> webhook`
4. 特别关注频道协作与自动提交后的 merge 稳定性

## 8. 最终判定

- 判定：通过
- 等级：可进入下一轮更系统的 agent 功能回归走查
- 前提：使用本轮修复后的代码启动服务
