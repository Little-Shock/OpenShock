# OpenShock True P0 功能走查报告

**日期:** 2026-04-06  
**执行方式:** 本地真实启动服务后进行手工走查，辅以浏览器上下文 API 调用补齐当前未产品化的 agent/数据入口。  
**参考用例:** [OpenShockTrueP0BusinessTestCases.md](./OpenShockTrueP0BusinessTestCases.md)

---

## 一、结论摘要

本轮走查结论是：

**当前项目已经具备 True P0 的协作壳骨架，但仍未达到可完整吃狗粮的 True P0。**

核心判断如下：

1. **频道内的人类-Agent、Agent-Agent 沟通链路已经可以被系统承载。**
   Room 消息流能同时展示 `member`、`agent`、`system` 三类消息，这一点已被实际验证。

2. **Issue -> Room -> Task -> Run -> Inbox -> Integration Attempt 的主业务骨架已经能跑出状态变化。**
   这说明当前版本已经不是单纯静态 demo。

3. **真实执行与真实集成仍被同一个关键缺口卡住：缺少 repo 绑定产品化入口。**
   daemon 已经能注册 runtime、claim run、claim merge attempt，但实际执行和 merge 都因为 `repoPath` 缺失而失败。

4. **Task 创建体验还不符合业务设计。**
   新 Issue 的 Room 页面缺少显式 Task 创建入口；Task Board 的 Quick Create 经实测错误地固定创建到 `issue_101`。

5. **Delivery PR 收尾链路当前只能部分验证。**
   UI 能展示交付状态和按钮 gating，但本轮未能在真实新建 Issue 上把 Integration Branch 推到 `ready_for_delivery`，因此未完成完整交付闭环实测。

综合评估：

- **协作沟通能力：部分通过**
- **Issue / Task 协作容器能力：部分通过**
- **本地执行能力：阻塞**
- **集成能力：阻塞**
- **交付能力：部分通过**

---

## 二、走查环境

### 1. 服务环境

- backend: `http://127.0.0.1:8080`
- frontend: `http://localhost:3000`
- daemon: 本轮手动执行 `go run ./cmd/daemon --once --api-base-url http://127.0.0.1:8080 --name WalkthroughDaemon`

### 2. 走查方式

- 前端页面操作使用浏览器真实交互
- agent 消息、部分 task 创建等能力使用浏览器上下文中的本地 API 调用辅助触发
- daemon 使用真实本地 Go 进程执行

### 3. 本轮新建测试对象

- Issue: `issue_104`
- Room: `room_104`
- Integration Branch: `issue-104/integration`
- Task:
  - `task_101` `Validate channel communication flow`
  - `task_102` `Validate execution and delivery flow`
- Run:
  - `run_101`
  - `run_102`
- Merge Attempt:
  - `merge_101`

---

## 三、执行结果

### 1. 已通过

#### TC-BIZ-001 进入协作壳并看到协作资源

结果：`通过`

证据：

- 首页正常打开，显示 Workspace、Rooms、Active Agents
- Task Board 与 Inbox 页面可访问

#### TC-BIZ-002 创建 Issue 后自动形成协作容器

结果：`通过`

证据：

- 通过 UI 创建 `Channel Collaboration Walkthrough`
- Room 数从 5 变为 6
- 新 Issue 自动生成 `room_104`
- Room 首条系统消息明确提示 Room、默认频道、integration branch 已创建

#### TC-COMM-001 人类在频道内向 Agent 下达任务与约束

结果：`通过`

证据：

- `Sarah` 在 `room_104` 中发送工作指令
- 消息进入统一频道消息流

#### TC-COMM-002 Agent 在频道内确认理解并回复执行计划

结果：`通过，但依赖 API 辅助`

证据：

- `agent_lead` 在 `room_104` 中回复理解与计划
- UI 正常渲染为 `agent` actor

说明：

- 当前不是 agent 自动行为，而是用 API 辅助模拟 agent actor 发言

#### Agent-Agent 频道内连续沟通

结果：`通过，但依赖 API 辅助`

证据：

- `agent_systems` 在同一 Room 中连续跟进
- 频道中形成 `member -> agent -> agent` 连续对话

这证明：

- 频道并不只是系统消息流
- Room 已能承载人类-Agent-Agent 的协作对话

#### TC-BIZ-003 在 Issue 下拆解多个 Task 并分配给不同 Agent

结果：`通过，但依赖 API 辅助`

证据：

- 在 `issue_104` 下创建了两个 task
- `task_101` 分配给 `agent_lead`
- `task_102` 分配给 `agent_systems`
- Task Board 正确展示 issue 归属与 assignee

#### TC-BIZ-004 Task 被排队为 Run，进入执行体系

结果：`通过`

证据：

- `task_101`、`task_102` 都成功创建 run
- Task Board 状态由 `todo` 进入 `in_progress`

#### TC-BIZ-007 Run 执行异常回流到 Room / Inbox

结果：`通过`

证据：

- daemon claim `run_101` 后，Room 中出现 started / failed 系统消息
- Inbox 中生成 `Run Failed`
- 错误原因明确为 `run is missing repoPath`

#### TC-BIZ-008 人类在 Inbox 中批准 Run 继续推进

结果：`通过`

证据：

- 在 Inbox 点击 Approve 后，对应 issue_104 的 failed run 条目消失
- Room 中出现 `Sarah approved ... for another execution attempt`
- `run_101` 从 failed 回到 queued

#### TC-COMM-004 Agent 在阻塞时向频道说明问题

结果：`通过，但依赖 API 辅助`

证据：

- 在 run / merge 失败后，`agent_systems` 向 Room 明确说明阻塞原因是缺少 `repoPath`
- 该消息与系统自动 blocked 消息共存于同一协作流

---

### 2. 部分通过

#### TC-BIZ-009 Task 标记为可集成并发起集成请求

结果：`部分通过`

证据：

- 在 Task Board 操作中，`task_102` 被置入需要集成审批的路径
- Room 中出现 `Merge request ... needs human approval`
- Inbox 中出现 `Merge Request Needs Approval`

问题：

- 本次是因为菜单误操作触发 `Ready for Integration`
- 但从产品效果看，审批链路本身确实存在

#### TC-BIZ-010 人类批准 merge，将 Task 结果合入 Integration Branch

结果：`部分通过`

证据：

- 在 Inbox 中点击 `Approve Merge`
- 系统创建 `merge_101`
- daemon 成功 claim `merge_101`
- Room 中有 merge started / merge failed 回流

阻塞原因：

- merge 失败，错误为 `merge attempt is missing repoPath`

结论：

- “审批 -> 创建 merge attempt -> daemon claim -> Room / Inbox 回流” 这条链是通的
- “真实 merge 成功并更新 integration branch” 本轮未能完成

#### Delivery PR 视图与 gating

结果：`部分通过`

证据：

- `issue_104` 右侧 Delivery 区正常展示
- 在 Integration Branch 未 ready 时，`Create Delivery PR` 按钮正确禁用
- `issue_103` 页面能展示已有 open 状态的 Delivery PR

问题：

- 本轮没有在新建 issue 上真正达到 `ready_for_delivery`
- `issue_103` 的 seed 数据缺少更完整的交付上下文，无法当作完整闭环证据

---

### 3. 阻塞

#### TC-BIZ-005 Runtime 注册并领取排队中的 Run

结果：`部分通过后阻塞`

通过部分：

- daemon 可真实注册 runtime
- runtime 出现在 bootstrap 数据中
- daemon 可 claim queued run

阻塞部分：

- 被 claim 的 run 无法真实执行，因为 issue 未绑定 repo path

#### TC-BIZ-006 同一 Issue 下两个 Task 并行执行

结果：`阻塞`

原因：

- `run_101` 被 claim 后立即因缺 `repoPath` 失败
- `run_102` 仍停留 queued
- 因此本轮未形成真正有意义的并行执行观察

#### TC-BIZ-011 集成冲突时，系统把冲突升级为协作问题

结果：`阻塞`

原因：

- 还未进入真实 merge 阶段，缺少 repo 绑定和真实 branch/worktree 上下文
- 当前只验证到了 “merge attempt 因缺 repoPath 失败”，没有进入真实 conflict 场景

#### TC-BIZ-012 Integration Branch 进入 ready_for_delivery

结果：`阻塞`

原因：

- 没有任何 task 真正集成成功

#### TC-BIZ-013 创建 Delivery PR

结果：`阻塞于新建 issue`

原因：

- `issue_104` 的 integration branch 未 ready
- 按钮被正确 gating，但本轮未能进入可创建状态

#### TC-BIZ-014 Delivery PR 合入后 Issue 完结

结果：`阻塞`

原因：

- 新建 issue 未走到 delivery 阶段

---

## 四、关键发现

### F1. 缺少 Repo 绑定产品化入口，直接卡死真实执行和真实集成

严重级别：`P0`

表现：

- `run_101` 被 daemon claim 后失败，错误为 `run is missing repoPath`
- `merge_101` 被 daemon claim 后失败，错误为 `merge attempt is missing repoPath`

影响：

- True P0 中最关键的 “真实 repo 上执行 / 集成” 无法成立

结论：

- 这是当前版本最核心的发布阻塞项

### F2. 新建 Issue 的 Room 页面缺少显式 Task 创建入口

严重级别：`P0`

表现：

- `room_104` 页面可发消息、可看任务列表、可看 Delivery 区
- 但页面内没有看到直接创建 Task 的入口

影响：

- “在 Room 中拆 Task” 是 True P0 的核心工作流
- 当前体验迫使测试者改用 API 或跳到其他页面/实现细节

### F3. Task Board 的 Quick Create 错误地固定写入 `issue_101`

严重级别：`P0`

表现：

- 在 Task Board 右侧 Quick Create 创建 `Board quick create smoke task`
- 结果实际落到 `issue#101`，而不是当前正在走查的新 issue

影响：

- 这会把新 Issue 的任务拆解直接写错目标容器
- 属于明确业务错误，不是体验细节

### F4. daemon 每次执行都会先出现 `agent turn claim failed: 404`

严重级别：`P1`

表现：

- 两次 `daemon --once` 日志里都出现：
  `agent turn claim failed: request failed: 404 Not Found`

影响：

- 说明 daemon 里还有一条未对齐的协议路径或过时调用
- 即使不阻塞当前 run claim，也会污染运行日志并降低系统可信度

### F5. Agent 沟通已经能被频道承载，但仍未产品化打通

严重级别：`P1`

表现：

- Room 能正确展示 `member`、`agent`、`system` 三类消息
- 但本轮 agent 发言仍依赖 API 辅助，而不是完整产品化自动行为

影响：

- 业务语义上已经成立
- 产品体验上仍不能认为“已完成”

### F6. Delivery 侧 seed 数据可展示状态，但不足以证明完整交付闭环

严重级别：`P2`

表现：

- `issue_103` 显示 `Delivery PR open`
- 但页面中缺少任务、消息、集成进度上下文

影响：

- 可用于验证 UI 展示
- 不能作为完整交付链路已打通的证据

---

## 五、用例结果汇总

| 用例 | 结果 | 说明 |
| :--- | :--- | :--- |
| TC-BIZ-001 | 通过 | 协作壳、Rooms、Agents、导航可见 |
| TC-BIZ-002 | 通过 | UI 创建 Issue，自动生成 Room / Integration Branch |
| TC-BIZ-003 | 通过但依赖 API | Room 无 Task 创建入口，靠 API 建 task |
| TC-BIZ-004 | 通过 | Task 可进入 Run 队列 |
| TC-BIZ-005 | 部分通过后阻塞 | runtime 注册与 claim 成功，但执行卡在 repoPath |
| TC-BIZ-006 | 阻塞 | 未形成真实并行执行 |
| TC-BIZ-007 | 通过 | run 失败回流到 Room / Inbox |
| TC-BIZ-008 | 通过 | Inbox Approve 能 requeue failed run |
| TC-BIZ-009 | 部分通过 | 集成审批链存在，但本轮由误操作触发 |
| TC-BIZ-010 | 部分通过 | merge attempt 可审批并 claim，但实际 merge 因 repoPath 失败 |
| TC-BIZ-011 | 阻塞 | 未进入真实 merge conflict |
| TC-BIZ-012 | 阻塞 | integration branch 未 ready |
| TC-BIZ-013 | 阻塞于新建 issue | Delivery PR 按钮 gating 正常，但不可创建 |
| TC-BIZ-014 | 阻塞 | 未进入可合入交付阶段 |
| TC-COMM-001 | 通过 | 人类可在频道内下达工作指令 |
| TC-COMM-002 | 通过但依赖 API | agent 可在频道内回复理解 |
| TC-COMM-003 | 未完成 | 无真实执行进展输出，受 repoPath 阻塞 |
| TC-COMM-004 | 通过但依赖 API | agent 可在频道中明确说明阻塞 |
| TC-COMM-005 | 未完成 | 无真实成功执行后的 agent 结果总结 |
| TC-COMM-006 | 通过但依赖 API | 两个 agent 可围绕同一 issue 在频道连续发言 |
| TC-COMM-007 | 未完成 | 未走到真实交接和 follow-up |

---

## 六、建议动作

按优先级建议先做下面 5 件事：

1. **补齐 Repo 绑定产品化入口**
   这是当前所有真实执行与集成场景的总阻塞。

2. **在 Issue Room 页面补 Task 创建入口**
   不要把 Task 拆解能力放到 API 或隐蔽绕路里。

3. **修正 Task Board Quick Create 的 issue 归属**
   当前实测写死到 `issue_101`，属于明确功能错误。

4. **把 agent 发言能力产品化**
   当前频道模型已经成立，下一步应让 agent 发言不再依赖测试注入。

5. **清理 daemon 的 404 claim 噪音**
   先保证执行面日志可信，再继续扩展协议。

---

## 七、最终判断

当前版本已经证明了两件重要的事：

1. OpenShock 的频道确实可以成为协作面，而不只是系统状态展示面。
2. OpenShock 的业务骨架已经能把 Issue、Task、Run、Inbox、Integration Attempt 串起来。

但也已经明确证明：

**在“真实仓库执行和真实集成”这一步，系统仍然没有跨过 True P0 的门槛。**

在修复 `repoPath / repo binding`、Task 创建体验、Quick Create 错误归属这几个问题之前，这个版本还不能算完成 True P0。
