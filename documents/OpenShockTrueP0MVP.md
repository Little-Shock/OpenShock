# OpenShock True P0 MVP

**版本:** 0.2  
**版本日期:** 2026 年 4 月 5 日  
**关联文档:** [OpenShockPRD.md](./OpenShockPRD.md), [OpenShockTrueP0TechnicalDesign.md](./OpenShockTrueP0TechnicalDesign.md)

---

## 一、文档目标

这份文档用于重新定义 OpenShock 的真正 P0。

它不再追求“最小执行闭环”，而是明确保留 OpenShock 的产品本体：

**人和多个 Agent 围绕同一个 Issue 协作，Issue 被拆解成 Task，Task 被分发给不同 Agent 执行，人类和 Agent 以及 Agent 之间可以在同一个频道内持续沟通，结果持续集成到同一个 Issue 级分支，最后再合入主干。**

如果一个版本不能支撑这件事，它就不是 OpenShock 的 P0，只是一个单 Agent 执行器。

---

## 二、True P0 一句话定义

True P0 是一个能让 1 个人和 2 到 N 个 Agent 在真实仓库里围绕 1 个 Issue 完成：

**拆解、沟通、分发、并行执行、持续集成、人类纠偏、最终交付**

的最小协作系统。

---

## 三、核心判断

OpenShock 的最小不可删能力不是“能跑一个 Run”，而是下面这组能力同时成立：

- `Agent` 是和 `Member` 一样的一等公民
- 人类和 `Agent`、以及 `Agent` 和 `Agent` 之间可以围绕同一个 Issue 在频道内持续沟通
- `Issue` 可以在协作中被拆成多个 `Task`
- 多个 `Task` 可以分配给不同 `Agent`
- 多个 `Run` 可以并行推进
- 多个结果会先汇入一个 `Integration Branch`
- 人类能在过程中纠偏、审批、改派、补任务
- 最终从 `Integration Branch` 发起正式 `Delivery PR`

这就是 OpenShock 和普通 AI IDE、普通任务系统、普通单 Agent 工作台的分界线。

---

## 四、唯一成功标准

只要下面这条链路稳定跑通，True P0 就算完成：

1. 用户进入一个 Workspace，并绑定一个真实 Repo
2. 用户配对至少一台本地 Runtime，系统检测到至少一种可用 CLI
3. 用户创建一个 Issue，系统自动创建对应 Room
4. 人类可以在该 Room 默认频道内对 Agent 发起消息，Agent 的回复、澄清和交接由 daemon 处理后回写到同一频道，从而围绕同一个 Issue 持续沟通
5. 用户或主 Agent 在 Room 中把 Issue 拆成多个 Task
6. 不同 Task 被分配给不同 Agent
7. 每个 Task 触发自己的 Run，并在独立 branch / worktree 中执行
8. 各 Task 的结果可以持续合入同一个 Issue 的 `Integration Branch`
9. `blocked`、`approval_required`、失败、冲突等状态能回流到 Room / Inbox
10. 人类可在过程中继续补 Task、改派 Agent、批准动作、停止 Run
11. 当 `Integration Branch` 达到交付条件时，系统发起或引导发起 `Delivery PR`
12. `Delivery PR` 合入主干后，Issue 完结

如果这条链路必须依赖“以后补的高级自治平台”，说明范围还没收准。

---

## 五、True P0 必须保住的产品边界

### 1. 多 Agent 协作必须存在

- 不是单 Agent 执行后再展示结果
- 而是多个 Agent 围绕同一个 Issue 同时参与推进

### 1.5 协作沟通必须存在

- Room / Channel 不能只是系统通知流
- 人类和 Agent 必须能在同一频道内直接交流
- agent 的频道消息只能来自 daemon 对 queued turn 的处理结果，不能由前端人工伪造
- 不同 Agent 必须能围绕同一个 Issue 在频道中继续协作、澄清、交接
- 这类沟通属于工作沟通，不等于自由社交

### 2. Task 必须是核心对象

- Issue 不直接等于一次执行
- Issue 需要被拆成可分发的 Task
- Task 才是 Agent 的直接执行单元

### 3. 集成面必须存在

- 多个 Agent 的结果不能只在最后一步才汇总
- 必须存在一个 Issue 级别的持续集成目标
- 这个目标在 Git 语义上应该是 `Integration Branch`

### 4. 人类必须在协作中介入

- 人类不是只在最后 review
- 人类要能在执行过程中干预协作流

### 5. PR 只保留为最终交付对象

- 协作期间的汇流对象不是 `PR`
- `PR` 只用于 `Integration Branch -> 主干`

---

## 六、True P0 明确不做

以下内容不进入 True P0：

- 自动 debate / voting / 多 Agent 政治式编排
- 任意深度任务树
- Agent 间自由社交
- 完整 Agent Mailbox 协议
- 通用 Skill Marketplace
- 通用 Memory Provider 平台
- Cloud Sandbox
- 复杂权限中心
- 成本 / token / quota 平台
- 多 Repo 协同
- 高级移动端
- 复杂邮件通知体系

这些都可以是 P1 / P2，但不应该堵住 P0。

说明：

- True P0 不做的是 `Agent` 间脱离工作上下文的自由社交
- True P0 必须做的是围绕 `Issue / Task / Run / Integration` 的频道内协作沟通

---

## 七、True P0 的核心对象

True P0 只保留下面这些前台对象。

| 对象 | 是否必须 | 说明 |
| :--- | :--- | :--- |
| `Workspace` | 是 | 协作空间 |
| `Repo` | 是 | 真实 Git 仓库接入单元 |
| `Member` | 是 | 人类成员 |
| `Agent` | 是 | 一等公民执行者 |
| `Runtime` | 是 | 本地执行环境 |
| `Issue` | 是 | 目标真相 |
| `Room` | 是 | 围绕 Issue 的主协作空间 |
| `Room Channel` | 是 | Room 内默认聊天流，承载人类与 Agent、以及 Agent 与 Agent 的协作消息 |
| `Task` | 是 | Issue 的可分发子任务 |
| `Run` | 是 | Task 的一次具体执行 |
| `Task Branch` | 是 | 某个 Task 的工作分支 |
| `Integration Branch` | 是 | Issue 级持续集成分支 |
| `Delivery PR` | 是 | 从 Integration Branch 合入主干的正式 PR |
| `Inbox Item` | 是 | 需要人类感知或处理的事件 |

下面对象在 True P0 中不作为前台主对象：

- `Session`
- `Thread`
- `Channel`
- `Agent Mailbox`
- `Memory Provider`
- `Memory Space`
- `Memory Item`
- `Credential Profile`
- `Skill`
- `Policy`

说明：

- `Session` 可以继续作为内部实现存在
- 但前台不把它当核心心智模型
- 记忆、策略、技能在 True P0 中收敛成文件和配置，不独立产品化

---

## 八、核心关系

- `Workspace -> Repo` 为 `1:N`
- `Workspace -> Member` 为 `1:N`
- `Workspace -> Agent` 为 `1:N`
- `Workspace -> Runtime` 为 `1:N`
- `Repo -> Issue` 为 `1:N`
- `Issue -> Room` 默认为 `1:1`
- `Room -> Room Channel` 在 True P0 中为 `1:1`
- `Issue -> Task` 为 `1:N`
- `Task -> Agent` 为 `N:1`
- `Task -> Run` 为 `1:N`
- `Task -> Task Branch` 通常为 `1:1`
- `Issue -> Integration Branch` 为 `1:1`
- 多个 `Task Branch` 可持续合入同一个 `Integration Branch`
- `Issue -> Delivery PR` 为 `0:1` 或 `1:N`
- `Run` 必须绑定一个 `Runtime`
- `Run` 必须绑定一个 `Task Branch`
- `Inbox Item` 可绑定 `Issue`、`Task`、`Run`、`Integration Branch` 或 `Delivery PR`

True P0 的关键约束：

- 一个 Issue 必须允许多个活跃 Task
- 一个 Issue 必须允许多个 Run 并行
- 每个 Room 必须内置一个默认聊天 Channel
- 默认聊天 Channel 必须承载人类与 Agent、以及 Agent 与 Agent 的工作沟通
- agent 的频道消息只允许来自 daemon 回写
- 但不做任意深度的 Task 嵌套
- Task 先固定为单层平铺结构

---

## 九、Git 协作模型

这是 True P0 最关键的设计之一。

### 1. Task Branch

每个 Task 默认拥有自己的工作分支：

- 命名可基于 `issue_id + task_id`
- 对应自己的 worktree
- 对应一个或多个 Run

### 2. Integration Branch

每个 Issue 默认拥有一个 `Integration Branch`：

- 这是多个 Task 成果的持续汇流面
- 它不是最终主干
- 它也不是 GitHub PR 本身
- 它是协作期间的中间集成分支

### 3. Delivery PR

当 `Integration Branch` 达到交付条件后：

- 从 `Integration Branch` 向 `main` 或目标主干发起 `Delivery PR`
- `Delivery PR` 才是正式交付对象
- Issue 完结不以 Task 全部完成为唯一标准
- 而以 `Integration Branch` 已达到可交付状态并完成主干合入为标准

结论：

- `Task Branch` 解决单 Task 的隔离执行
- `Integration Branch` 解决多 Agent 协作期的结果汇总
- `Delivery PR` 解决最终进入主干的正式交付

---

## 十、True P0 的最小页面

True P0 只要求以下页面真实可用。

### 1. Workspace 进入页

必须支持：

- 登录
- 进入 Workspace
- 看到可用 Repo、Agent、Runtime

### 2. Repo / Runtime 接入页

必须支持：

- 绑定一个 Repo
- 配对本地 Runtime
- 检测本地 CLI provider
- 显示 Runtime 在线状态

### 3. 协作壳首页

必须支持：

- 左侧看到 Issue / Room 列表
- 中间看到当前 Room 默认 Channel 的协作消息流
- 协作消息流中能看到人类消息、Agent 消息、系统消息
- 右侧看到当前 Issue 的上下文摘要
- 明确看到哪些 Task 在跑、哪些被卡住、哪些待处理
- 明确看到当前 `Integration Branch` 状态

可以先不做：

- 公共频道体系
- DM
- 复杂 Thread

### 4. Issue Room 详情页

必须支持：

- 创建 Issue
- 自动创建 Room
- 自动创建 Room 默认聊天 Channel
- 在 Room 中与 Agent 沟通、补充要求、回答问题
- 看到 Agent 在频道中的回复、进展和交接说明
- 在 Room 中拆 Task
- 为 Task 指派 Agent
- 查看 Task 列表和状态
- 查看集成进度

### 5. Run 详情页

必须支持：

- Run 状态
- 所属 Task
- 所属 Agent
- Runtime
- branch / worktree
- stdout / stderr
- tool calls
- 时间线
- blocked / approval_required / failed 信息

### 6. Integration Branch / Delivery PR 视图

必须支持：

- 查看当前 Issue 的 `Integration Branch`
- 查看哪些 Task 已合入、哪些未合入
- 查看当前是否存在冲突或阻塞
- 查看或发起 `Delivery PR`

---

## 十一、True P0 的最小工作流

### 工作流 A：接入

1. 用户登录并进入 Workspace
2. 绑定 Repo
3. 配对本地 Runtime
4. 检测可用 CLI provider
5. 创建或确认至少一个可用 Agent

### 工作流 B：Issue 建立协作面

1. 用户创建 Issue
2. 系统自动创建对应 Room
3. 系统自动创建该 Issue 的 `Integration Branch`
4. Room 成为后续人类和 Agent 以及 Agent 之间的主协作空间

### 工作流 B.5：频道内协作沟通

1. 人类可以在 Room 默认频道中向 Agent 补充目标、约束和验收标准
2. Agent 可以在频道中回复理解、汇报进展、提出问题
3. 不同 Agent 可以在频道中围绕同一个 Issue 继续澄清、交接和协同
4. 这些沟通记录与 Task、Run、集成状态共同构成该 Issue 的协作上下文

### 工作流 C：Task 拆解与分发

1. 用户或主 Agent 在 Room 中把 Issue 拆成多个 Task
2. 每个 Task 被分派给不同 Agent
3. 每个 Task 创建自己的 `Task Branch`
4. 系统为 Task 创建 queued Run

True P0 约束：

- Task 先固定为单层列表
- 不做树状 Task
- 不做复杂依赖图

### 工作流 D：并行执行

1. 不同 Runtime 或同一 Runtime 的不同执行槽开始消费 Task Run
2. 每个 Run 在自己的 worktree / branch 中执行
3. 前端实时展示各 Run 的日志、状态、工具调用
4. Room 中持续回流结构化进展信息
5. Agent 可在频道中补充自然语言进展、风险和需要的人类决策

### 工作流 E：持续集成

1. 某个 Task 达到可集成条件
2. 其 `Task Branch` 合入 `Integration Branch`
3. 系统记录本次合入来源：
   - 来自哪个 Task
   - 来自哪个 Agent
   - 来自哪次 Run
4. 如果出现冲突或失败，事件回流到 Room / Inbox
5. 人类或 Agent 继续修复、补 Task、再合入

### 工作流 F：纠偏与审批

1. Run 进入 `blocked`、`approval_required`、`failed` 或集成冲突
2. 系统生成 Inbox Item
3. 人类进入对应 Room / Task / Run 查看详情
4. 人类可执行：
   - 补充指导
   - 批准继续
   - 改派 Agent
   - 停止 Run
   - 新增 Task
   - 重新安排集成顺序
5. Agent 可在频道中继续追问、解释阻塞原因或确认新的执行边界

### 工作流 G：最终交付

1. `Integration Branch` 达到交付条件
2. 系统引导或自动发起 `Delivery PR`
3. `Delivery PR` 进入 review / merge
4. 合入主干后，Issue 完结

---

## 十二、状态机

### 1. Issue 状态

```text
todo -> in_progress -> in_review -> done
                  \-> blocked
                  \-> cancelled
```

说明：

- `in_progress` 表示至少已有 Task 被创建并开始协作推进
- `in_review` 表示已进入最终交付阶段，通常意味着 `Delivery PR` 已建立

### 2. Task 状态

```text
todo -> in_progress -> integrated
          \-> blocked
          \-> cancelled
```

说明：

- `integrated` 表示该 Task 的结果已被吸收到 `Integration Branch`
- 它不等于主干已合并

### 3. Run 状态

```text
queued -> running -> completed
          \-> blocked
          \-> approval_required
          \-> failed
          \-> cancelled
```

说明：

- `completed` 表示这次执行结束，不代表已集成
- 集成是后续动作

### 4. Runtime 状态

```text
online -> busy -> offline
```

### 5. Integration Branch 状态

```text
collecting -> integrating -> ready_for_delivery
                  \-> blocked
```

说明：

- `collecting` 表示正在等待更多 Task 结果
- `integrating` 表示正在持续合入或处理冲突
- `ready_for_delivery` 表示可以进入正式 `Delivery PR`

---

## 十三、记忆的最小方案

True P0 不做通用记忆平台，只做协作可见、可审查的文件级上下文。

必须支持：

- 工作区存在 `MEMORY.md`
- 可选 `notes/`
- 可选 `decisions/`
- Task 或 Run 结束后可写回简要结构化摘要

这些摘要至少服务于：

- 后续 Agent 接手同一 Issue
- 人类回看某个 Task 的关键结论
- 集成时理解“这个 Task 到底改了什么、为什么这么改”

不做：

- 外部 Memory Provider
- 复杂召回策略
- Memory Viewer
- promote-to-skill 自动链路

---

## 十四、Sandbox 的最小方案

True P0 只做 Local Trusted Sandbox。

必须支持：

- 每个 Task Run 在独立 worktree 中执行
- 每个 Run 有运行超时
- 记录 Runtime、Task Branch、worktree、时间线
- 高风险动作进入审批

默认需要审批的动作：

- 强制删除
- 破坏性 Git 操作
- 越界写入
- 敏感凭证注入

不做：

- 网络白名单
- 工具白名单
- 细粒度凭证面板
- Cloud Sandbox

---

## 十五、通知的最小方案

True P0 只保留三类通知面：

- `Room` 内状态回流
- `Inbox`
- 页面内实时状态变化

补充要求：

- `Room` 默认频道不仅承载系统状态回流，还承载人类与 Agent、以及 Agent 与 Agent 的协作对话
- 频道中的消息应能区分 `member`、`agent`、`system`

邮箱只保留身份链路最低能力：

- 登录验证
- 邀请
- 重置密码

浏览器 Push 不是 True P0 的阻塞项。

---

## 十六、技术实现约束

### 必须坚持

- 复用本地现有 CLI 能力，不重新发明执行器
- `Session` 仅作为内部实现细节存在
- `Task` 必须是显式产品对象
- `Integration Branch` 必须是显式产品对象
- `Delivery PR` 必须与协作期集成对象严格区分
- 多个 Task Run 必须允许并行存在
- 人类介入动作必须在协作流中可见、可追踪

### 明确不要提前做

- 自治规划大脑
- 通用插件系统
- 完整 Agent Mailbox 协议
- 复杂消息分叉模型
- 多维度用量与成本平台
- 高级组织治理

---

## 十七、真实的开发顺序

### Milestone 1：接入与可见性打通

- 登录 / Workspace
- Repo 绑定
- Runtime pairing
- CLI 检测
- Agent 基础管理

验收标准：

- 至少能看到一个在线 Runtime 和至少一个可用 Agent

### Milestone 2：Issue 协作面打通

- 创建 Issue
- 自动创建 Room
- 创建 Task
- 指派 Agent
- 展示 Task 列表与状态
- 创建 `Integration Branch`

验收标准：

- 一个 Issue 已经能成为多 Agent 协作容器

### Milestone 3：并行执行与回流打通

- Task Run 创建
- worktree / Task Branch 执行
- 多 Run 并行可见
- Room / Inbox 回流 `blocked`、`approval_required`、失败事件

验收标准：

- 同一个 Issue 下至少两个 Task 能并行执行并被人类观察和纠偏

### Milestone 4：持续集成与交付打通

- Task Branch 合入 `Integration Branch`
- 记录 Task / Agent / Run 到集成结果的映射
- 冲突展示
- 发起 `Delivery PR`
- 合入主干后完结 Issue

验收标准：

- 多个 Agent 的结果能持续汇流，并最终交付到主干

---

## 十八、最终验收句子

True P0 完成时，团队应该能说出下面这句话：

**“我们已经可以让一个人和多个 Agent 围绕同一个 Issue 协作拆解 Task、并行执行、持续集成到同一个 Integration Branch，并最终通过 Delivery PR 合入主干。”**

如果这句话还不能稳定成立，就说明还没到 OpenShock 的真正 P0。
