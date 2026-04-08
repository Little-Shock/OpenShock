# OpenShock True P0 全面走查测试报告（v2）

- 报告日期：2026-04-06
- 走查方式：本地真实服务 + API action gateway + daemon 真实执行 + 本地真实 Git 仓库 + 浏览器核对
- 关联用例文档：`documents/OpenShockTrueP0BusinessTestCases.md`
- 关联关注点文档：`documents/OpenShockTrueP0WalkthroughFocus-2026-04-06-v2.md`
- 关联上一轮报告：`documents/OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md`

## 1. 本轮目标

这轮不是重复证明主链路“能跑”，而是要回答两类问题：

1. 在最新技术设计约束下，主链路是否仍然能完成闭环。
2. 新增的设计边界有没有被当前实现打穿。

本轮特别关注 5 项观察点：

1. Agent / Runtime 映射是否清晰
2. 长活 provider thread 是否存在上下文串台风险
3. `event_frame` 是否足以定位当前回复目标
4. 跨频道桥接是否可追溯
5. 一次性投递 vs 持续协作分支是否被正确区分

## 2. 环境与数据

### 2.1 预检结果

- `apps/backend`: `go test ./...` 通过
- `apps/daemon`: `go test ./...` 通过
- `apps/frontend`: `npm run build` 通过

### 2.2 服务环境

- backend：复用当前本地运行中的 `http://127.0.0.1:8080`
- frontend：复用当前本地运行中的 `http://127.0.0.1:3000`
- daemon：多次执行 `go run ./cmd/daemon --once --api-base-url http://127.0.0.1:8080 --name QAWalkthroughV2`

### 2.3 测试仓库

- 仓库路径：`/tmp/openshock-true-p0-repo-v2`
- 初始化方式：
  - `git init -b main`
  - 初始文件：`main.go`
  - 初始提交：`init walkthrough repo v2`

### 2.4 本轮测试对象

- 新建 Issue：`issue_105`
- 对应 Room：`room_105`
- 任务：
  - `task_101` Document merge gates for issue 105
  - `task_102` Create walkthrough marker for issue 105
- Run：
  - `run_101`
  - `run_102`
- Merge Attempt：
  - `merge_101`
  - `merge_102`
- Delivery PR：
  - `pr_102`

## 3. 主链路结果

### 3.1 Issue 创建与 Repo 绑定

执行结果：

1. 通过 action gateway 创建 `issue_105`
2. 成功生成 `room_105`
3. 通过 `Issue.bind_repo` 成功绑定 `/tmp/openshock-true-p0-repo-v2`
4. `issue.repoPath` 在后续 run / merge 详情中可见

结论：通过

### 3.2 Room 内人类 -> agent 协作

执行结果：

1. 以 `message` 类型在 `room_105` 中发送 `@agent_shell ...`
2. 成功创建 `agent_session_102`
3. 成功创建 `turn_103`
4. daemon 真实 claim `turn_103` 并回写 `plan` 类型消息

结论：通过

补充说明：

- 同一条内容若以 `kind: instruction` 提交，则当前实现不会创建 `agent_turn`
- 只有默认 `message` 路径会进入当前 agent turn 编排

### 3.3 Task 创建与 Run 执行

执行结果：

1. 成功创建两个 task，分别指派给 `agent_guardian` 与 `agent_shell`
2. 成功创建 `run_101`、`run_102`
3. daemon 分别真实 claim 两个 run
4. 两个 run 均完成，并将结果写入真实仓库：
   - `docs/issue-105-merge-checklist.md`
   - `issue-105-walkthrough-marker.txt`
5. 两个 task branch 均产生真实提交：
   - `issue-105/task_101`
   - `issue-105/task_102`
6. `tool_call`、`run output`、Room 系统消息均有回流

结论：通过

### 3.4 集成与 Delivery

执行结果：

1. 两个 task 均被标记 `ready_for_integration`
2. Inbox 中生成两条 merge approval
3. 人工审批后生成 `merge_101`、`merge_102`
4. daemon 真实完成两次 merge
5. `integrationBranch.status = ready_for_delivery`
6. 成功创建 `pr_102`
7. 正确使用 `externalPrId = gh_pr_102` 发送 webhook 后：
   - `deliveryPr.status = merged`
   - `integrationBranch.status = merged_to_main`
   - `issue.status = done`

结论：通过

## 4. 设计边界观察

### 4.1 Agent / Runtime 映射

观察结果：

1. Agent 语义和 Runtime 语义在数据层可以区分：
   - `turn_103.agentId = agent_shell`
   - `run_101.agentId = agent_guardian`
   - `run_102.agentId = agent_shell`
   - `run_101.runtimeId = rt_105`
   - `run_102.runtimeId = rt_106`
2. Room 中的协作者身份仍以 agent 表达，执行日志和 run 详情里才出现 runtime
3. 从这一轮证据看，没有出现把 Runtime 名称当成 Agent 身份回写到 Room 的情况

结论：

- 当前实现基本满足“先决定谁该响应，再由哪个 runtime 执行”的边界
- 但前端直接 deep link 进入 Room 失败，导致这层语义暂时只能从 API 和消息证据确认，不能稳定从页面直接观察

### 4.2 provider thread / `event_frame`

观察结果：

1. 本轮成功验证到 `agent_session` 与 `agent_turn` 的创建、claim、完成
2. 但当前 API / Room detail 中并未暴露 `provider_thread_id`
3. 当前也没有结构化字段直接暴露 `event_frame`

结论：

- 本轮只能间接验证“agent turn 被创建并消费”
- 还不能直接证明：
  - 同一 `agent_session` 是否真的复用了长期 provider thread
  - 每轮 `agent_turn` 是否显式注入了完整 `event_frame`
  - 是否存在跨 Room / Task / Message 的隐式串台风险

判定：

- 这更像“当前未充分可观测”，不是本轮已证实的故障

### 4.3 跨频道桥接

观察结果：

1. 本轮没有可执行的 DM / 控制入口
2. 因此无法真实跑：
   - 一次性跨频道投递
   - 持续协作分支
   - bridge context 可追溯性

结论：

- 当前仍属“未实现或至少未进入可执行验收路径”
- 本轮不应给通过或失败结论，只能记为未覆盖

### 4.4 一次性投递 vs 持续协作分支

观察结果：

1. 没有控制入口可触发该场景
2. 因而也无法观察目标侧是否创建新的本地 `agent_session`

结论：

- 当前未覆盖

## 5. 主要发现

### F1. 直接打开 `/rooms/[issueId]` 会 500，但根数据接口正常

严重级别：`P0`

证据：

1. 浏览器访问 `/rooms/issue_105` 直接出现 `This page couldn’t load`
2. 同样访问 `/rooms/issue_104` 也复现
3. 同时 `GET /api/v1/issues/issue_105` 与 `GET /api/v1/rooms/room_105` 均返回正常数据

影响：

1. Room 深链接不可用
2. 无法从浏览器侧稳定验证新建 issue 的 room 页面状态
3. 影响主链路页面验收与 realtime 观察

### F2. `RoomMessage.post(kind=\"instruction\")` 不会创建 `agent_turn`

严重级别：`P1`

证据：

1. 以 `kind: instruction` 向 `room_105` 发送 `@agent_shell ...` 后，`agentSessions` 和 `agentTurns` 都没有新增
2. 同一内容不带 `kind`，按默认 `message` 发送后，立即生成：
   - `agent_session_102`
   - `turn_103`
3. 当前技术设计已经把 `instruction` 定义为正式消息契约之一

影响：

1. 设计和实现未对齐
2. 后续若前端或 CLI 开始正式发送 `instruction`，agent 编排会直接失效

### F3. `provider_thread_id` / `event_frame` 当前不可观测

严重级别：`P2`

证据：

1. `room detail` 返回了 `agent_session`、`agent_turn`
2. 但没有 `provider_thread_id`
3. 也没有结构化 `event_frame` 证据

影响：

1. 无法直接验证最新技术设计里最关键的长期 thread / 事件帧边界
2. QA 当前只能间接推断，无法做精确回归

判定：

- 更像设计落地后的可观测性缺口，不是已确认功能失败

## 6. 用例结果摘要

### 已通过

1. `TC-BIZ-002` Issue 创建后自动形成协作容器
2. `TC-COMM-002` Agent 在频道内确认理解并回复执行计划
3. `TC-BIZ-003` 在 Issue 下拆解多个 Task 并分配给不同 Agent
4. `TC-BIZ-004` Task 被排队为 Run，进入执行体系
5. `TC-BIZ-005` Runtime 注册并领取排队中的 Run
6. `TC-BIZ-009` Task 标记为可集成并发起集成请求
7. `TC-BIZ-010` 人类批准 merge，将 Task 结果合入 Integration Branch
8. `TC-BIZ-012` 多个 Task 集成完成后，Integration Branch 进入可交付状态
9. `TC-BIZ-013` 创建 Delivery PR，Issue 进入交付阶段
10. `TC-BIZ-014` Delivery PR 合入后，Issue 正式完结
11. `TC-BIZ-019` 人类能够回答“哪个 Agent 该响应，由哪个 Runtime 执行”

### 通过但带观察项

1. `TC-COMM-001`
   - 通过的前提是当前实现仍把“触发 agent 编排”的人类消息视为默认 `message`
   - 若按 `instruction` 正式语义发送，当前实现不会入队

### 失败

1. 与 Room 页面直接深链接相关的页面验收
   - `/rooms/issue_104`
   - `/rooms/issue_105`

### 未覆盖 / 当前不可执行

1. `TC-COMM-008`
   - 缺少 `provider_thread_id` / `event_frame` 的可观察证据
2. `TC-COMM-009`
3. `TC-COMM-010`
4. `TC-BIZ-020`

## 7. 最终结论

### 7.1 主链路结论

在当前代码下，True P0 的核心主链路仍然可以真实完成闭环：

1. 创建 issue / room
2. 绑定 repo
3. 创建任务
4. 创建 run
5. daemon 真实执行
6. 结果回流 Room 与 run/tool-call 结构
7. merge 审批
8. daemon 真实执行 merge
9. 创建 delivery PR
10. webhook 回写 merged
11. issue 收敛到 `done`

结论：主链路通过

### 7.2 设计边界结论

1. **Agent / Runtime 映射**
   - 当前证据基本成立
2. **provider thread / `event_frame`**
   - 当前仍不可直接验证
3. **跨频道桥接**
   - 当前未进入可执行验收阶段
4. **消息契约与编排触发**
   - 已发现一个明确未对齐点：`instruction` 不会触发 `agent_turn`

### 7.3 下一步建议

1. 先修 `Room` 深链接 500
2. 修正 `instruction` 与 `agent_turn` 编排的不一致
3. 给 `agent_session` / `agent_turn` 增加足以支持 QA 的 `provider_thread_id` / `event_frame` 观察证据
4. 再进入跨频道桥接能力的真实走查
