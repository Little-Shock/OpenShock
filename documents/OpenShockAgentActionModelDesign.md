# OpenShock Agent Action Model Design

**版本:** 0.1  
**版本日期:** 2026 年 4 月 5 日  
**关联文档:** [OpenShockTrueP0TechnicalDesign.md](./OpenShockTrueP0TechnicalDesign.md), [OpenShockTrueP0MVP.md](./OpenShockTrueP0MVP.md)

---

## 一、目标

这份文档定义 True P0 中 Agent 如何驱动系统。

核心结论：

**Agent 不是“只能跑代码的执行器”，而是 OpenShock 中的一等 Actor。**

但 Agent 也不是可以直接改数据库、直接操作 Git、直接推送系统状态的超级用户。

因此 True P0 采用下面的设计原则：

**所有由 Agent 发起的系统变更，都必须被建模为受控 Action。**

这意味着：

- Agent 通过 Action 驱动系统
- Action 经过权限和策略校验
- Action 被路由到明确的业务模块
- Action 结果被审计、事件化、回流到协作面

这份方案的目标，是把“Agent 驱动沟通、任务、执行、集成和交付”的产品想法，压成一个可落地的技术模型。

---

## 二、设计原则

### 1. Actor 与 Action 分离

系统中的“谁在做事”和“做了什么事”必须明确分开。

- `Actor` 表示参与者
- `Action` 表示意图和操作

### 2. Agent 不直连业务对象

Agent 不允许：

- 直接写 `task` 表
- 直接改 `run.status`
- 直接 git merge
- 直接创建 `delivery_pr`

这些都必须通过 Action Gateway 执行。

### 3. 人和 Agent 共用同一行为模型

不要为 Agent 发明一套平行接口系统。

True P0 中：

- `Member`
- `Agent`
- `System`

都应被抽象为 `Actor`。

差异不在接口形态，而在：

- capability
- policy
- risk level
- approval requirement

### 4. 所有写操作必须可审计

任何由 Agent 发起的有效写操作，都必须留下：

- 发起者是谁
- 作用目标是什么
- 输入 payload 是什么
- 是否通过了策略校验
- 最终由哪个模块执行
- 结果是什么

### 5. 沟通、任务、Git、交付都统一动作化

True P0 不允许把 agent 能力只局限在 Run。

至少以下域必须动作化：

- Communication
- Task
- Run
- Git
- Inbox / Approval
- Knowledge / Summary

---

## 三、Actor 模型

### 1. Actor 类型

True P0 定义 3 类 Actor：

- `member`
- `agent`
- `system`

说明：

- `member` 是人类成员
- `agent` 是可被分派、可发起动作的执行者
- `system` 是后台自动流程或规则引擎产生的动作主体

### 2. Actor 标准字段

所有 Actor 至少需要：

- `actor_type`
- `actor_id`
- `workspace_id`
- `display_name`
- `capability_set`
- `policy_profile_id`

### 3. Actor 作用范围

True P0 中每个 Actor 的作用范围至少要能约束到：

- `workspace`
- `repo`
- `issue`
- `room`
- `task`

Agent 默认不应拥有跨 Workspace 的动作能力。

### 4. Actor 与身份的关系

- `member` 绑定真实登录身份
- `agent` 绑定系统中的 Agent 对象
- `system` 绑定内部服务名或自动规则名

说明：

- `agent` 不等于 `runtime`
- `runtime` 是执行环境
- `agent` 是动作和协作主体

---

## 四、Action 模型总览

### 1. Action 的定义

Action 是一个 Actor 针对某个目标对象发起的、受策略约束的受控操作请求。

### 2. Action 生命周期

建议采用下面的统一状态：

```text
submitted -> validated -> authorized -> dispatched -> completed
                       \-> rejected
                       \-> approval_required
                       \-> failed
```

说明：

- `submitted`：动作请求已进入系统
- `validated`：payload 和目标对象合法
- `authorized`：通过 capability / policy 校验
- `dispatched`：已路由给具体业务模块
- `approval_required`：需要人类批准后继续
- `completed`：动作执行完成
- `rejected`：被策略或校验拒绝
- `failed`：业务模块执行失败

### 3. Action 与领域状态的关系

Action 不是业务对象状态本身。

例如：

- `Task.assign` 是一个 Action
- `task.status = in_progress` 是领域状态

两者必须分开存储。

### 4. Action 的标准字段

建议所有 Action 至少包含：

- `action_id`
- `workspace_id`
- `actor_type`
- `actor_id`
- `action_type`
- `target_type`
- `target_id`
- `scope`
- `payload`
- `risk_level`
- `idempotency_key`
- `status`
- `approval_state`
- `submitted_at`
- `completed_at`
- `result_summary`
- `error_code`

### 5. 幂等要求

以下动作必须支持幂等：

- `Task.create`
- `Task.assign`
- `Run.create`
- `GitIntegration.merge.request`
- `DeliveryPR.create.request`
- `RoomMessage.post`

原因：

- Agent 可能重试
- daemon 可能断线重发
- UI 可能重复提交

---

## 五、Action Gateway

### 1. 定义

`Action Gateway` 是 True P0 中所有 Actor 写操作的统一入口。

它不是独立服务，但必须是明确模块。

### 2. 职责

- 接收 Action 请求
- 解析 Actor 和作用域
- 做 schema 校验
- 做 capability 校验
- 做 policy 校验
- 判断是否需要审批
- 生成审计日志
- 将 Action 路由到对应业务模块
- 产出 outbox 事件

### 3. 不负责什么

`Action Gateway` 不负责：

- 执行业务状态机
- 执行 Git 命令
- 直接修改 Task / Run / PR 真相状态

它只负责：

- 准入
- 路由
- 审计
- 结果归一化

### 4. 推荐接口

对内统一为：

`SubmitAction(actor, action_type, target, payload, idempotency_key)`

业务模块不要暴露“agent 专用写接口”。

### 5. 路由原则

Action Gateway 按 `action_type` 路由到明确模块：

- Collaboration
- Planning & Tasking
- Run Control
- Git Integration Manager
- Repo Integration
- Inbox & Notification

一个 Action 只能有一个主处理模块。

---

## 六、Capability 模型

### 1. 目标

Capability 用于定义“Actor 可以发起哪些动作”。

### 2. 结构

建议 capability 由两部分组成：

- `action permission`
- `scope restriction`

例如：

- `task.create` on `issue:123`
- `room.message.write` on `room:456`
- `git.integration.merge.request` on `issue:123`

### 3. True P0 首批 capability

建议首批定义这些 capability：

- `room.read`
- `room.message.write`
- `room.message.reply`
- `task.read`
- `task.create`
- `task.update`
- `task.assign`
- `task.cancel`
- `run.read`
- `run.create`
- `run.stop`
- `run.retry`
- `git.task_branch.create`
- `git.integration.merge.request`
- `git.integration.status.read`
- `delivery_pr.create.request`
- `delivery_pr.update.request`
- `memory.summary.write`

### 4. P0 的实际权限策略

True P0 不做复杂权限中心，但必须有基本边界：

- Agent 默认可以在被分配的 Issue / Room 中发消息
- Agent 默认可以创建和更新自己负责范围内的 Task
- Agent 默认可以请求创建 Run
- Agent 默认可以请求合入 Integration Branch
- Agent 默认不应直接执行高风险 Git 动作

### 5. 作用域限制

Capability 必须支持至少以下 scope：

- `workspace`
- `repo`
- `issue`
- `room`
- `task`

例如：

- 某 Agent 只对一个 Issue 有 `task.assign`
- 某 Agent 只对某个 Room 有 `room.message.write`

---

## 七、风险分级与审批模型

### 1. 风险分级

建议所有 Action 统一分 4 档。

#### L0 只读

例如：

- 读取 Task
- 读取 Run
- 读取 Integration Branch 状态

#### L1 低风险写

例如：

- 发 Room 消息
- 回复消息
- 写 Task 摘要
- 报告 blocked

默认允许，但必须审计。

#### L2 中风险写

例如：

- 创建 Task
- 指派 Task
- 创建 Run
- 请求合入 Integration Branch
- 请求更新 Delivery PR 描述

默认允许，但可被 policy 收紧。

#### L3 高风险写

例如：

- 取消 Task
- 强制停止关键 Run
- 执行破坏性 Git 操作
- 发起 Delivery PR
- 敏感凭证相关动作

必须进入审批或强制人工确认链路。

### 2. 审批触发条件

Action Gateway 必须能基于下列条件决定是否进入 `approval_required`：

- action type
- actor type
- workspace policy
- 当前 issue 状态
- 当前 integration 状态
- 是否涉及敏感 Git 动作

### 3. 审批结果

审批结果必须标准化：

- `approved`
- `rejected`
- `expired`

审批结果必须回流到：

- 原 Action
- Room 结构化消息
- Inbox Item

---

## 八、Action 分类

### 1. Communication Actions

用途：

- 让 Agent 参与协作沟通
- 把状态变化转成可消费的消息

首批动作：

- `RoomMessage.post`
- `RoomMessage.reply`
- `RoomMessage.mention`
- `RoomStatus.post_summary`
- `RoomStatus.post_blocked`
- `RoomStatus.post_integration_ready`

原则：

- Room 内允许 Agent 发言
- Workspace 级公共频道默认限制 Agent 发言
- 高噪音信息优先结构化，不鼓励长篇自由刷屏

### 2. Task Actions

用途：

- 让 Agent 真正参与任务拆解和推进

首批动作：

- `Task.create`
- `Task.update`
- `Task.assign`
- `Task.cancel`
- `Task.mark_ready_for_integration`
- `Task.create_followup`

说明：

- True P0 支持 Agent 创建 follow-up Task
- 但不支持无限层级任务树

### 3. Run Actions

用途：

- 让 Agent 驱动执行生命周期

首批动作：

- `Run.create`
- `Run.retry`
- `Run.stop.request`
- `Run.report_blocked`
- `Run.request_approval`
- `Run.complete`

说明：

- daemon 可以上报执行事件
- 但真正的业务状态变化必须由 Run Control 写入

### 4. Git Actions

用途：

- 让 Agent 推动分支协作和持续集成

首批动作：

- `GitTaskBranch.create`
- `GitTaskBranch.sync`
- `GitIntegration.merge.request`
- `GitIntegration.conflict.report`
- `GitIntegration.status.refresh`
- `DeliveryPR.create.request`
- `DeliveryPR.update.request`

原则：

- Agent 可以提出 merge request
- 但不应绕过 Git Integration Manager 直接 merge
- 所有 merge 行为都必须产生 `merge_attempt`

### 5. Inbox / Approval Actions

用途：

- 让 Agent 能请求人类决策和协作协助

首批动作：

- `Approval.request`
- `Approval.respond`
- `InboxItem.create_request`
- `InboxItem.resolve_request`
- `HumanHelp.request`

说明：

- `Approval.respond` 通常由 Member 发起
- 但仍属于统一 Action 模型

### 6. Knowledge / Summary Actions

用途：

- 让 Agent 把协作过程沉淀成可复用信息

首批动作：

- `TaskSummary.write`
- `RunSummary.write`
- `IntegrationSummary.write`
- `DecisionNote.write`
- `MemoryFile.append`

说明：

- P0 不做复杂 Memory Center
- 但允许 Agent 通过 Action 驱动文件级摘要写回

---

## 九、模块路由规则

### 1. Communication -> Collaboration

例如：

- `RoomMessage.post`
- `RoomMessage.reply`
- `RoomStatus.post_summary`

### 2. Task -> Planning & Tasking

例如：

- `Task.create`
- `Task.assign`
- `Task.cancel`

### 3. Run -> Run Control

例如：

- `Run.create`
- `Run.retry`
- `Run.stop.request`

### 4. Git -> Git Integration Manager / Repo Integration

路由规则：

- 与 `Task Branch` / `Integration Branch` 相关的动作，路由到 `Git Integration Manager`
- 与 `Delivery PR` 外部同步相关的动作，路由到 `Repo Integration`

### 5. Approval / Inbox -> Inbox & Notification

例如：

- `Approval.request`
- `HumanHelp.request`

### 6. Summary / Memory -> Collaboration 或独立 writer

True P0 建议：

- 写回 `MEMORY.md` / `notes/` / `decisions/` 的动作
- 通过一个轻量 `Summary Writer` 执行

但这个 writer 仍然必须受 Action Gateway 调度。

---

## 十、Action 结果模型

Action 完成后，不应只返回一个 HTTP 成功码。

必须标准化结果：

- `accepted`
- `completed`
- `rejected`
- `approval_required`
- `failed`

同时必须给出：

- `result_code`
- `result_message`
- `affected_entities`
- `produced_events`

例如：

一个 `GitIntegration.merge.request` 成功后，结果里至少应包含：

- 更新的 `merge_attempt`
- 更新的 `task`
- 更新的 `integration_branch`
- 产生的 `room.message`
- 产生的 `inbox_item`（若冲突）

---

## 十一、系统消息与事件回流

### 1. 为什么要单独定义

如果 Action 成功或失败后只改状态，不回流到协作面，用户会失去上下文。

因此所有关键 Action 都必须至少回流到两处：

- 领域对象状态
- 协作可见面

### 2. 回流目标

首批回流目标：

- `Room Channel`
- `Inbox`
- `Run Detail`
- `Integration Branch View`

### 3. 结构化系统消息

建议每个高价值 Action 都生成结构化消息，而不是纯文本。

例如：

- `task.created`
- `task.assigned`
- `run.blocked`
- `merge.conflicted`
- `delivery_pr.created`

消息内容至少包含：

- 谁触发的
- 影响了哪个对象
- 结果是什么
- 下一步建议是什么

### 4. GitHub webhook 的位置

GitHub webhook 不是前端 UI 的直接事件源。

正确链路应该是：

1. webhook 进入 Repo Integration
2. Repo Integration 归一化成系统事件
3. 更新 `delivery_pr`
4. 通过 outbox 回流到 Room / Inbox / Issue

---

## 十二、推荐的数据对象

如果要把 Action 正式落库，建议新增下面对象：

### 1. `action_request`

记录原始 Action 请求：

- 谁发起
- 发起什么
- 发给谁
- payload 是什么
- 幂等键是什么

### 2. `action_execution`

记录 Action 实际执行情况：

- 路由到了哪个模块
- 是否需要审批
- 执行结果如何
- 失败原因是什么

### 3. `action_approval`

记录审批链：

- 谁审批
- 审批结果
- 审批时间
- 关联的 action

### 4. `actor_capability_grant`

记录 Actor 在某个 scope 下拥有哪些 capability。

说明：

- True P0 不一定要把这些对象一次性全部产品化
- 但如果不在数据模型上预留，后面会非常难补

---

## 十三、与现有技术方案的关系

这份文档不替代主技术方案，而是补齐其中缺的一层：

**Agent 如何驱动系统，而不破坏系统边界。**

与主方案的关系如下：

- `Action Gateway` 是控制面统一写入口
- 各业务模块依旧拥有自己的领域对象
- daemon 依旧只负责执行面
- Git 依旧由 Git Integration Manager / Repo Integration 接管

关键结论：

- Agent 的“能做事”，不应实现为“给 Agent 更多内部 API”
- 而应实现为“给 Agent 一套统一受控 Action 模型”

---

## 十四、风险点

### 1. 动作泛滥

风险：

- 如果动作命名过细，会导致系统复杂度飙升

策略：

- P0 只保留最小动作集合
- 用统一 payload 模式扩展，不随便新增 action type

### 2. Capability 设计过早平台化

风险：

- 把 capability 做成过于灵活的策略语言，会拖慢 P0

策略：

- P0 只做枚举式 capability
- 不做 DSL

### 3. Agent 噪音污染协作面

风险：

- 如果 Agent 可以自由发大量消息，Room 会失控

策略：

- 默认限制公共频道发言
- Room 内消息允许，但要优先结构化
- 高频动作只产生状态消息，不产生自由文本

### 4. Git 动作绕开受控模型

风险：

- daemon 或 CLI 直接执行 merge，导致控制面失真

策略：

- 所有 merge、PR、Delivery 动作都必须经过 Action Gateway 和 Git Integration Manager

### 5. 审批链路割裂

风险：

- approval_required 只在 Run 里出现，无法统一处理 Git / Task 高风险动作

策略：

- 审批必须属于通用 Action 结果，不属于 Run 私有概念

---

## 十五、测试策略

### 1. Action Gateway 单元测试

覆盖：

- schema 校验
- capability 校验
- risk level 判断
- approval_required 判断
- 路由选择
- 幂等去重

### 2. 动作到模块路由测试

覆盖：

- `Task.create` 是否进入 Planning & Tasking
- `Run.create` 是否进入 Run Control
- `GitIntegration.merge.request` 是否进入 Git Integration Manager
- `DeliveryPR.create.request` 是否进入 Repo Integration

### 3. 权限和 scope 测试

覆盖：

- Agent 是否只能操作授权 Issue 下的 Task
- Agent 是否不能向无权限公共频道发言
- Agent 是否不能直接发起高风险 Git 动作而绕过审批

### 4. 审批链测试

覆盖：

- 高风险 Task / Git / DeliveryPR 动作是否正确进入审批
- 审批通过后是否继续执行
- 审批拒绝后是否正确回流 Room / Inbox

### 5. 事件回流测试

覆盖：

- Action 完成后是否正确生成系统消息
- 是否正确生成 Inbox Item
- 是否正确写审计日志

### 6. 幂等测试

覆盖：

- 重复提交同一 `Task.create`
- 重复提交同一 `merge.request`
- webhook 重放后的回流动作

---

## 十六、True P0 建议的首批 Action 集合

建议第一批只实现下面这些 Action。

### Communication

- `RoomMessage.post`
- `RoomStatus.post_summary`
- `RoomStatus.post_blocked`

### Task

- `Task.create`
- `Task.update`
- `Task.assign`
- `Task.mark_ready_for_integration`
- `Task.create_followup`

### Run

- `Run.create`
- `Run.report_blocked`
- `Run.request_approval`
- `Run.complete`

### Git

- `GitIntegration.merge.request`
- `GitIntegration.conflict.report`
- `DeliveryPR.create.request`

### Summary

- `TaskSummary.write`
- `IntegrationSummary.write`

原因：

- 这组动作已经足以让 Agent 驱动沟通、拆解、执行、集成和交付
- 再多会拖慢 P0

---

## 十七、最终结论

True P0 中，Agent 的正确建模方式不是“一个会跑代码的 worker”，而是：

**一个能够在受控边界内发起沟通、推动 Task、驱动执行、请求集成、请求交付，并把整个协作过程向前推进的一等 Actor。**

而这件事的技术落点，不是散落的接口集合，而是：

**统一的 Agent Action Model。**
