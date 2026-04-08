# OpenShock True P0 第二轮回归测试报告（v3）

- 报告日期：2026-04-06
- 走查方式：隔离本地 backend/frontend/daemon + 浏览器直观验证 + API 结构化证据核对
- 关联用例文档：`documents/OpenShockTrueP0BusinessTestCases.md`
- 关联关注点文档：`documents/OpenShockTrueP0WalkthroughFocus-2026-04-06-v2.md`
- 关联上一轮报告：`documents/OpenShockTrueP0WalkthroughReport-2026-04-06-v2.md`

## 1. 本轮目标

本轮不是重跑完整主链路，而是对上一轮暴露的三项关键问题做第二轮统一回归：

1. `BUG-MVP-003`：`RoomMessage.post(kind="instruction")` 是否已恢复进入 `agent_turn` 编排闭环。
2. `#8`：`providerThreadId / eventFrame` 是否已成为可直接观察的结构化证据，并能支持设计边界验证。
3. `BUG-MVP-002`：`/rooms/[issueId]` 深链接是否已恢复，且不影响原有 `/rooms/[roomId]` 入口。

同时，本轮继续按最新技术设计验证三个边界：

1. Agent / Runtime 映射是否清晰。
2. 长活 provider thread 是否在同一 `agent_session` 内稳定复用。
3. 每轮 `agent_turn.eventFrame` 是否能定位当前回复目标，而不是依赖隐式记忆。

## 2. 环境与样本

### 2.1 隔离环境

- backend：`http://127.0.0.1:18080`
- frontend：`http://127.0.0.1:13000`
- daemon：
  - `go run ./cmd/daemon --once --api-base-url http://127.0.0.1:18080 --name QASecondRoundDaemon`
  - `go run ./cmd/daemon --once --api-base-url http://127.0.0.1:18080 --name QASecondRoundDaemon2`

说明：

- 为避免共享环境中的历史 in-memory 状态污染，本轮单独启动了隔离 backend/frontend。
- 页面侧回归与 API/daemon 回归都基于同一套隔离数据完成。

### 2.2 测试对象

- 新建 Issue：`issue_104`
- 对应 Room：`room_104`
- Agent Session：`agent_session_101`
- Agent Turns：
  - `turn_101`
  - `turn_102`
- Daemon Runtime：
  - `rt_101`
  - `rt_102`

## 3. 回归结果

### 3.1 `kind="instruction"` 已恢复进入 `agent_turn` 编排

执行步骤：

1. 向 `room_104` 发送 `RoomMessage.post(kind="instruction")`，body 为 `@agent_shell 请先确认第二轮 QA 指令 1：总结当前 issue 状态。`
2. 检查 `GET /api/v1/rooms/room_104`
3. 启动 daemon 一次，观察 claim 和 agent 回复回流

实际结果：

1. `instruction` 消息 `msg_102` 成功创建：
   - `agent_session_101`
   - `turn_101`
2. Room detail 中消息本身仍保持 `kind = instruction`，没有被偷改成 `message`
3. daemon 成功 claim `turn_101`
4. agent 真实回写 `summary` 消息 `msg_103`
5. `turn_101.status = completed`

结论：通过

### 3.2 clarification 后的人类 `kind="instruction"` follow-up 会重新入队

执行步骤：

1. 由 `agent_shell` 在 `room_104` 中发送 `clarification_request`
2. 人类再发送 `RoomMessage.post(kind="instruction")`，body 为 `@agent_shell 优先关注消息编排，并说明本轮依据。`
3. 检查 room detail 中 `agent_wait` / `agent_turn`
4. 再次启动 daemon

实际结果：

1. clarification 消息 `msg_106` 成功创建 `agent_wait_101`
2. 人类 follow-up instruction `msg_107` 成功创建 `turn_102`
3. `turn_102.intentType = clarification_followup`
4. `agent_wait_101.status = resolved`
5. daemon 成功 claim 并完成 `turn_102`
6. agent 回写 `plan` 消息 `msg_108`

结论：通过

### 3.3 `providerThreadId` 和 `eventFrame` 现已可直接观察

观察结果：

1. `agent_session_101.providerThreadId = provider_thread_agent_session_101`
2. 第二轮 follow-up 后，`agent_session_101` 没有更换 session，也没有变更 `providerThreadId`
3. `turn_101.eventFrame` 明确包含：
   - `currentTarget = issue:issue_104/room:room_104`
   - `sourceMessageId = msg_102`
   - `requestedBy = Sarah`
   - `relatedIssueId = issue_104`
   - `expectedAction = instruction_response`
4. `turn_102.eventFrame` 明确切换为：
   - `sourceMessageId = msg_107`
   - `expectedAction = clarification_followup`
5. `eventFrame.recentMessagesSummary` 与 `contextSummary` 也能解释当前 turn 为什么落在当前 Room/Issue

可直接观察位置：

1. `POST /api/v1/agent-turns/claim`
2. `GET /api/v1/rooms/:roomId`
3. `GET /api/v1/issues/:issueId`

结论：通过

### 3.4 Agent / Runtime 映射保持清晰

观察结果：

1. Room 和 turn 上的协作身份仍是 `agent_shell`
2. daemon claim 执行 runtime 则分别是：
   - `rt_101`
   - `rt_102`
3. Room timeline 中未出现把 runtime 名称误写成 agent 身份的情况

结论：

- 当前实现继续满足“由哪个 Agent 响应”和“由哪个 Runtime 执行”两层语义分离

### 3.5 Room deep link 已恢复，且兼容两种入口

执行步骤：

1. 浏览器打开 `http://127.0.0.1:13000/rooms/room_104`
2. 浏览器打开 `http://127.0.0.1:13000/rooms/issue_104`
3. 再补一组 seed 兼容性检查：
   - `/rooms/room_101`
   - `/rooms/issue_101`

实际结果：

1. `/rooms/room_104` 正常渲染，不再报错
2. `/rooms/issue_104` 正常渲染，并落到同一 Room 内容
3. `/rooms/room_101` 正常渲染
4. `/rooms/issue_101` 正常渲染
5. 浏览器未出现 500 页面，也未捕获 console error

结论：通过

## 4. 设计边界判断

### 4.1 provider thread 复用未见串台

当前证据：

1. `turn_101` 和 `turn_102` 复用同一个 `agent_session_101`
2. `providerThreadId` 在两轮间保持不变
3. 第二轮 `eventFrame.sourceMessageId` 已切换到新的 follow-up 消息 `msg_107`
4. 第二轮 agent 回复围绕“消息编排”展开，没有错误引用第一轮无关目标

结论：

- 在同一 Room 连续两轮指令样本下，未观察到 provider thread 复用导致的上下文串台

### 4.2 `eventFrame` 已足以解释当前回复目标

当前证据：

1. 每轮 turn 都能看到结构化的：
   - 当前目标
   - 来源消息
   - 请求人
   - 关联 issue
   - 预期动作
2. QA 不再需要只靠最终文案猜测“为什么回到这个频道”

结论：

- 当前实现已具备第二轮设计边界验证所需的最小可观测性

### 4.3 跨频道桥接仍未进入本轮可执行验收

观察结果：

1. 本轮没有新增 DM/控制入口
2. 仍无法真实跑：
   - 一次性跨频道投递
   - 持续协作分支
   - bridge context 可追溯性

结论：

- 该项仍属于“当前未实现或暂不可执行验收”，本轮不判失败，也不新增 bug

## 5. 本轮结论

### 已验证关闭

1. `BUG-MVP-002`：已复现修复后通过，`/rooms/room_*` 与 `/rooms/issue_*` 两种入口均正常
2. `BUG-MVP-003`：已复现修复后通过，`kind="instruction"` 与 clarification 后的 `kind="instruction"` follow-up 均能进入 `agent_turn` 闭环

### 已验证补齐

1. `#8` 对应的 `providerThreadId / eventFrame` 可观测性缺口已补齐
2. 第二轮设计边界验证现在有直接结构化证据，不再需要间接推断

### 仍保留

1. 跨频道桥接、一过性投递 vs 持续协作分支：当前未进入可执行验收路径
2. `BUG-MVP-001`：本轮未覆盖 delivery webhook 的长会话实时刷新验证，状态维持不变

### 新问题

- 本轮未发现新的真 bug
