# OpenShock True P0 业务测试用例

**版本:** 0.3  
**日期:** 2026-04-07  
**定位:** 手工功能走查用例，按业务闭环编写，不按接口或模块拆解。

---

## 一、文档目标

这份文档不是技术测试清单，而是站在产品和业务理解上的走查脚本。

它要回答三件事：

1. OpenShock 的 **True P0** 到底要验证什么业务真相。
2. 当前项目实现到哪一步，哪些业务用例已经能跑，哪些还只能设计、暂时不能执行。
3. 等本地真实启动 backend、frontend、daemon 之后，应该按什么顺序做完整功能走查。

---

## 二、走查前准备

这部分是给后续执行走查的 Agent 和人类测试者看的。

原则很简单：

- 先确认环境，再启动服务，再准备测试数据，最后才开始执行用例。
- 环境问题、安装问题、数据问题，不应直接记为产品功能失败。
- 每次走查都要记录本次使用的 repo、runtime、agent、provider 和启动方式。

### 1. 环境准备

目标是保证本地具备运行 OpenShock 当前实现所需的最小基础环境。

必须确认：

1. 本机已安装 `Go`，可运行 `go build`、`go test`、`go run`。
2. 本机已安装 `Node.js` 和 `npm`，可运行前端 `npm run dev`、`npm run build`。
3. 本机已安装 `git`，并且可以在本地创建、切换、合并分支。
4. 如果要跑真实 Agent 执行链路，本机要能运行目标 CLI provider。
5. 如果要跑真实 Codex 执行链路，需要确认 `codex` 可执行命令存在，或者通过环境变量指定可执行路径。

建议额外确认：

1. 本机 shell 环境稳定，后续 daemon 进程能继承到必要环境变量。
2. 本机对测试仓库目录有读写权限。
3. 本机没有会干扰测试仓库的 Git 全局 hook 或危险 alias。

### 2. 安装准备

目标是保证各服务能独立启动，而不是边跑边补依赖。

建议执行：

1. 在 [apps/backend](/Users/feifantong/code/OpenShockSwarm/apps/backend) 运行 `go build ./...`。
2. 在 [apps/daemon](/Users/feifantong/code/OpenShockSwarm/apps/daemon) 运行 `go build ./...`。
3. 在 [apps/frontend](/Users/feifantong/code/OpenShockSwarm/apps/frontend) 运行 `npm install`。
4. 在 [apps/frontend](/Users/feifantong/code/OpenShockSwarm/apps/frontend) 运行 `npm run lint`。
5. 如需更严格预检，可额外执行 `go test ./...` 与 `npm run build`。

当前版本特别提醒：

1. backend 和 daemon 使用 Go 工程，前端使用 Next.js。
2. 当前项目仍是 in-memory store，重启服务后大部分运行态数据会丢失。
3. 如果要重复执行同一轮场景，建议每轮都从新启动的服务和新的测试 repo 状态开始。

### 3. 启动准备

目标是确保走查时各服务以明确顺序启动，并且调用链路清晰。

建议启动顺序：

1. 启动 backend。
2. 启动 frontend。
3. 确认页面可访问。
4. 再启动 daemon。

参考启动方式：

1. backend：
   在 [apps/backend](/Users/feifantong/code/OpenShockSwarm/apps/backend) 运行 `go run ./cmd/server`
2. frontend：
   在 [apps/frontend](/Users/feifantong/code/OpenShockSwarm/apps/frontend) 运行 `npm run dev`
3. daemon：
   在 [apps/daemon](/Users/feifantong/code/OpenShockSwarm/apps/daemon) 运行 `go run ./cmd/daemon`

当前版本默认关系：

1. frontend 默认访问 `http://localhost:8080`
2. backend 默认提供 API 与 realtime
3. daemon 默认连接 backend，并注册 runtime

如果启动失败，必须先区分：

1. 是进程没起来。
2. 是依赖没装好。
3. 是端口冲突。
4. 是 provider CLI 不可用。
5. 是产品功能本身失败。

### 4. 数据准备

目标是保证每条测试用例都有稳定、可重复的测试上下文。

最少需要准备 4 类数据：

1. **测试 Workspace**
   当前版本主要依赖 seed 数据和启动后的内存态。
2. **测试 Repo**
   如果要走真实执行与 merge，用一个专门的本地 Git 测试仓库，不要直接用生产仓库。
3. **测试 Agent**
   至少准备 2 个 Agent，方便覆盖多 Agent 协作和 Agent-Agent 沟通场景。
4. **测试 Runtime**
   至少准备 1 个可在线 runtime；如果要验证并行执行，建议准备 2 个 runtime 或一个多槽 runtime。

建议测试 repo 满足：

1. 有 `main` 分支。
2. 已完成初始 commit。
3. 内容足够简单，便于构造 task branch、integration branch、merge conflict。
4. 测试过程中允许反复新建分支和回滚仓库状态。

### 5. 当前版本的特殊数据前提

这是当前项目和理想 True P0 之间最重要的差别，必须提前说明给执行走查的 Agent。

1. **Repo 绑定现在已有 Room 内产品化入口。**
   因此凡是依赖真实本地仓库的执行和 merge 用例，已经可以按真实 UI 路径走查。
2. **Agent 的长期上下文现在应理解为 `agent_session.provider_thread_id`。**
   一个 Agent 可复用长期 provider thread，但每一轮协作都必须显式注入新的 `event_frame`，不能把 Room / Task / Message 边界寄托在隐式记忆里。
3. **Runtime 不是 Agent。**
   Agent 是协作对象，Runtime 是执行载体；测试时必须区分“谁应该响应”和“由哪个 runtime 执行”。
4. **Delivery PR 目前主要是业务对象和 webhook 模拟。**
   因此交付闭环可以走查业务语义，但不等于已经接通完整 GitHub 生产链路。
5. **重启后数据会丢失。**
   所以用例执行顺序和记录非常重要。

### 6. 走查记录要求

每次实际走查建议至少记录下面信息：

1. 走查日期和执行人。
2. 使用的代码版本或 commit。
3. backend / frontend / daemon 的启动命令。
4. provider 类型和版本。
5. 使用的测试 repo 路径。
6. 使用的 Agent 名称和 Runtime 名称。
7. 每条用例的结果：
   `通过 / 失败 / 阻塞 / 不适用`
8. 如果失败，需区分：
   `环境问题 / 安装问题 / 数据问题 / 产品功能问题 / 可观测性不足`

---

## 三、True P0 的业务真相

从业务角度看，OpenShock 的 True P0 不是“能跑一个 Agent”，而是下面这句话稳定成立：

**一个人和多个 Agent 围绕同一个 Issue 协作拆解 Task、并行执行、持续集成到同一个 Integration Branch，并最终通过 Delivery PR 合入主干。**

这里的“协作”不能被弱化成“人类下命令，Agent 静默执行”。

它至少还包括下面这层沟通真相：

- 人类可以在 Room / Channel 中对 Agent 发起指令、补充上下文、纠偏。
- Agent 可以在 Room / Channel 中主动汇报进展、解释判断、请求决策。
- 不同 Agent 之间可以围绕同一个 Issue 在频道内继续沟通、澄清、交接和协同。
- 这些沟通必须进入同一个可追溯协作流，而不是散落在外部聊天工具或本地黑盒日志中。

因此，True P0 的业务测试必须覆盖下面 6 个业务阶段：

1. **接入准备**
   用户进入协作空间，看到 Repo、Runtime、Agent 这些协作资源是可用的。
2. **Issue 建立协作面**
   一个 Issue 被创建后，不只是多一条记录，而是自动形成 Room 和 Integration Branch。
3. **Task 拆解与分发**
   Issue 必须能被拆成多个 Task，并且这些 Task 可以明确分配给不同 Agent。
4. **并行执行与回流**
   多个 Task Run 可以独立推进，执行中的风险和阻塞会回流给人类。
5. **持续集成**
   Task 的结果不是各做各的，而是持续汇入同一个 Issue 级 Integration Branch。
6. **最终交付**
   当 Integration Branch 达到交付条件后，系统能发起 Delivery PR，并在合入后完成 Issue。

如果这 6 段业务链路中任何一段不能成立，OpenShock 还不能算达到 True P0。

同时，还必须额外成立一条横向协作要求：

**同一个 Issue 的频道必须能够承载人类与 Agent、以及 Agent 与 Agent 之间的持续沟通。**

如果频道只能承载系统消息回流，而不能承载协作对话，OpenShock 仍然不算完成真正的协作壳。

---

## 四、当前项目现状

下面的判断是结合当前仓库中的 `documents/`、`README.md`、`apps/backend`、`apps/daemon`、`apps/frontend` 代码得出的，重点关注业务可走查性。

| 业务能力 | True P0 要求 | 当前现状 | 结论 |
| :--- | :--- | :--- | :--- |
| Workspace / Shell 进入 | 能看到协作壳、Room、Agent、Runtime | 已有壳首页、Room 列表、Task Board、Inbox 页面 | **可部分走查** |
| Repo 绑定 | 用户可绑定真实 Repo，后续 Run/merge 都依赖它 | Issue Room 已有 repo path 绑定入口，后续 `run.repoPath`、`mergeAttempt.repoPath` 可随链路带出 | **可走查** |
| Runtime pairing / online 状态 | 能注册 Runtime、上报 heartbeat、展示在线状态 | backend/daemon 协议存在，daemon 可注册和 heartbeat；缺少完整配对页面 | **可部分走查** |
| Agent / Runtime 映射 | 系统先决定哪个 Agent 需要响应，再选择可服务它的 Runtime | 技术设计已明确边界，但仍需通过走查确认 UI、状态和 claim 结果不会混淆 Agent 与 Runtime | **条件性走查** |
| CLI provider 检测 | 系统检测可用 provider | 当前 provider 只有 Codex，且主要体现在 daemon 执行侧 | **部分具备** |
| Issue 创建后自动形成协作容器 | 创建 Issue 时自动创建 Room、默认 Channel、Integration Branch | 当前 backend 已实现 `Issue.create` 同时创建 Issue、Room、Integration Branch | **可走查** |
| 人类与 Agent 在频道内对话 | 人类可下达指令，Agent 可回复、解释、澄清 | 人类消息可直接在 Room 内发送；agent 消息必须通过 daemon 消费 turn 后回写，前端不提供人工 agent 发言入口 | **可走查** |
| Agent 与 Agent 在频道内对话 | 不同 Agent 可围绕同一 Issue 继续交流、协同、交接 | 已有显式 `handoff` / follow-up 路径；但跨频道桥接、一次性投递与持续协作分支仍需进一步走查 | **可走查，但有新增关注点** |
| Task 拆解与分发 | Issue 可创建多个 Task 并分派给 Agent | 前后端都已支持 Task 创建，assignee 可指定 | **可走查** |
| 多 Run 并行 | 同一 Issue 下多个 Task 可并行执行 | 数据模型和协议支持；前端有看板和 Room，但没有独立 Run 详情页 | **可部分走查** |
| Run 日志 / tool calls / 状态回流 | 执行过程应可见 | backend 存在 run output/tool call 数据结构；frontend 未形成独立 Run 详情页；后端自动化里有一条 daemon E2E 因 tool call 未回流而失败 | **存在风险，部分可走查** |
| Inbox 审批 / 人类纠偏 | blocked / approval_required / failed 要回流给人类处理 | backend / frontend 都已有 Inbox Item 和审批动作按钮 | **可走查** |
| Integration Branch 持续集成 | 多 Task 结果持续合入同一个 Integration Branch | merge attempt、integration branch、merge conflict 状态机已有雏形 | **可走查** |
| Delivery PR | 从 Integration Branch 发起正式交付并回写状态 | 当前是本地对象 + webhook 模拟，不是真实 GitHub PR | **可做业务走查，非真实外部集成** |
| Issue 完结 | Delivery PR 合入主干后 Issue 进入 done | webhook 模拟链路已具备 | **可走查** |
| Memory 写回 | `MEMORY.md`、`notes/`、`decisions/` 形成可追溯上下文 | 当前未见产品化实现 | **未实现** |
| 持久化 | P0 最终应为可维护的正式存储 | 当前仍为 in-memory store | **仅适合 demo/走查，不适合发布验收** |

### 当前版本对业务走查的直接影响

1. **Issue / Task / Inbox / Integration / Delivery PR 这条业务骨架已经出现了。**
2. **Repo 绑定路径已打通**，所以下一轮走查重点不再是“能不能绑上 repo”，而是“绑定后 repoPath 是否沿 run / merge / delivery 链稳定传递”。
3. **Run 详情观察能力还不完整**，当前更像“Room + 看板 + Inbox”三处拼起来看执行过程，不是完整的 Run Detail 体验。
4. **Delivery PR 目前是模拟业务对象，不是完整 GitHub 交付集成。**
5. **有一条真实自动化已暴露风险**：daemon 相关 E2E 里，`tool_call` 回流当前不稳定，说明执行观测链路还没完全稳住。
6. **Agent 沟通能力依赖 daemon 真正消费 turn。** 下一轮验收重点应从“能不能发消息”转为：
   - `agent_turn` 是否正确绑定到长期 `provider_thread`
   - 每轮 `event_frame` 是否足以让 Agent 不串 Room / Task / Message 上下文
   - 跨频道发言是否靠显式 bridge context，而不是隐式全局记忆

---

## 五、测试用例设计原则

本轮测试用例按下面 4 条原则组织：

1. **先验业务闭环，再验页面细节。**
2. **每个用例都要能回答“这一步为什么是 OpenShock 的核心业务真相”。**
3. **每个用例都标明当前是否可执行。**
4. **异常链路和人工纠偏必须和主链路同等重要。**

当前执行状态分三类：

- `可立即走查`：现有项目基本具备执行条件。
- `条件性走查`：业务本身已做，但缺少某个前置入口、夹具或观察面。
- `仅设计，暂不可执行`：True P0 必须有，但当前项目还没有产品化实现。

---

## 六、业务走查主链路

### TC-BIZ-001 进入协作壳并看到协作资源

**业务目标**  
验证用户进入系统后，不是只看到聊天页，而是能感知当前协作空间、Room、Agent、Runtime 这些协作资源已经存在。

**当前执行状态**  
`可立即走查`

**前置条件**  
backend 已启动。frontend 已启动。

**测试步骤**

1. 打开首页。
2. 观察左侧 Room 列表是否可见。
3. 观察页面是否能显示 Workspace 名称。
4. 切换到 Task Board、Inbox 页面。
5. 观察页面是否能获取 Agent 和 Runtime 基础信息。

**预期结果**

1. 用户能进入统一协作壳，而不是多个分裂页面。
2. 至少能看到 Room、Agent、Runtime 的存在。
3. Task Board 和 Inbox 能正常打开，不依赖手工刷新数据文件。

**业务判定**

如果连协作资源都不可见，说明产品入口还不是协作系统，只是零散 demo 页。

---

### TC-BIZ-002 创建 Issue 后自动形成协作容器

**业务目标**  
验证 Issue 不是一条孤立记录，而是自动成为一个可协作的容器。

**当前执行状态**  
`可立即走查`

**前置条件**  
已进入 frontend 首页。

**测试步骤**

1. 在系统中创建一个新的 Issue。
2. 创建成功后观察 Room 列表。
3. 进入新 Issue 对应的 Room。
4. 观察是否存在默认消息流。
5. 观察右侧是否能看到 Integration Branch 状态。

**预期结果**

1. 创建 Issue 后，系统自动生成对应 Room。
2. Room 进入后能看到默认 Channel 的消息流。
3. Issue 关联的 Integration Branch 已存在，初始状态应可见。
4. 新 Issue 应成为后续 Task 和 Run 的归属容器。

**业务判定**

如果创建 Issue 后还需要手工再建 Room 或手工再建集成对象，就不符合 True P0。

---

### TC-BIZ-003 在 Issue 下拆解多个 Task 并分配给不同 Agent

**业务目标**  
验证 OpenShock 的基本执行单元是 Task，而不是“一个 Issue 只跑一次 Agent”。

**当前执行状态**  
`可立即走查`

**前置条件**  
已有一个新建或已有的 Issue Room。

**测试步骤**

1. 在同一个 Issue 下创建 Task A。
2. 给 Task A 指定 Agent 1。
3. 在同一个 Issue 下创建 Task B。
4. 给 Task B 指定 Agent 2。
5. 查看 Task Board 和 Room 右侧 Task 列表。

**预期结果**

1. 同一 Issue 下可同时存在多个 Task。
2. 不同 Task 可以分配给不同 Agent。
3. Task 能在 Task Board 中以状态维度显示。
4. Room 右侧能把该 Issue 作为任务容器展示出来。

**业务判定**

如果一个 Issue 不能稳定容纳多个活跃 Task，就还不是多 Agent 协作系统。

---

### TC-BIZ-004 Task 被排队为 Run，进入执行体系

**业务目标**  
验证 Task 不只是待办项，而是可以进入真实执行生命周期。

**当前执行状态**  
`可立即走查`

**前置条件**  
Issue 下至少已有 1 个已分配 Agent 的 Task。

**测试步骤**

1. 在 Task 上点击 `Queue Run`。
2. 返回 Task Board。
3. 观察 Task 状态变化。
4. 观察 Room 消息和相关状态是否变化。

**预期结果**

1. Task 关联的 Run 被创建。
2. Task 进入 `in_progress` 或等价执行中状态。
3. 系统中能看到 Run 已进入待消费状态。

**业务判定**

如果 Task 不能进入 Run 生命周期，它仍然只是普通项目管理卡片。

---

### TC-BIZ-005 Runtime 注册并领取排队中的 Run

**业务目标**  
验证本地 Runtime 不是装饰信息，而是真正参与执行消费。

**当前执行状态**  
`条件性走查`

**前置条件**  
存在 queued Run。daemon 已能连接 backend，且测试 Issue 已绑定真实 repo。

**测试步骤**

1. 启动 daemon。
2. 观察 backend 中 runtime 是否变为在线。
3. 观察 daemon 是否领取 queued Run。
4. 观察 Run 是否从 `queued` 变为 `running`。

**预期结果**

1. daemon 成功注册 runtime。
2. runtime 状态从不可见变为在线。
3. queued Run 被某个 runtime 领取。
4. 领取结果在业务上可追溯到具体 runtime。

**业务判定**

如果 runtime 只能注册但不能真正消费任务，执行面仍然是假的。

---

### TC-BIZ-006 同一 Issue 下两个 Task 进入并行执行

**业务目标**  
验证 True P0 的关键能力之一：多个 Agent 围绕同一个 Issue 并行推进，而不是串行轮流跑。

**当前执行状态**  
`条件性走查`

**前置条件**  
同一 Issue 下至少有两个 queued Run。需要有可用 runtime 和已绑定 repo。

**测试步骤**

1. 为同一 Issue 下两个不同 Task 分别创建 Run。
2. 启动一个或多个 daemon。
3. 观察两个 Run 的领取和执行状态。
4. 观察 Room 和看板是否能体现两个 Task 同时推进。

**预期结果**

1. 两个 Task 的 Run 可以同时存在。
2. 系统能区分每个 Run 归属的 Task、Agent、Runtime。
3. 人类能从界面上感知“这是同一 Issue 下的并行协作”，而不是多个无关执行。

**业务判定**

如果同一 Issue 只能有效串行推进，就不满足 True P0 的多 Agent 协作定义。

---

### TC-BIZ-007 Run 执行中出现 blocked / approval_required 后回流到人类

**业务目标**  
验证系统不是把失败藏在后台，而是能把需要人类介入的情况回流到协作面。

**当前执行状态**  
`可立即走查`

**前置条件**  
需要能制造或模拟一个 blocked / approval_required / failed 事件。

**测试步骤**

1. 让一个 Run 进入 `blocked` 或 `approval_required`。
2. 打开对应 Issue Room。
3. 打开 Inbox。
4. 检查是否生成对应待处理项。

**预期结果**

1. Room 中出现结构化系统消息，明确说明哪个 Run 被卡住。
2. Inbox 中出现待人类处理的条目。
3. 条目与对应 Run 存在明确关联。

**业务判定**

如果风险不能回流到人类，OpenShock 只是“自动执行器”，不是协作系统。

---

### TC-BIZ-008 人类在 Inbox 中批准 Run 继续推进

**业务目标**  
验证人工纠偏不是旁路操作，而是协作流程中的正式动作。

**当前执行状态**  
`可立即走查`

**前置条件**  
已有一个处于 `blocked`、`approval_required` 或 `failed` 的 Run，且 Inbox 中有对应条目。

**测试步骤**

1. 进入 Inbox。
2. 对对应条目点击 `Approve`。
3. 返回 Task Board 和 Room。
4. 观察 Run 与 Inbox 条目的变化。

**预期结果**

1. 对应 Run 被重新入队或恢复到可继续状态。
2. Inbox 中对应待处理项被移除或视为已解决。
3. Room 中出现“某人批准继续”的协作记录。

**业务判定**

如果人工动作没有进入系统可见协作流，就不满足 True P0 中“人类持续介入”的定义。

---

### TC-BIZ-009 Task 标记为可集成并发起集成请求

**业务目标**  
验证 Task 完成执行后，不是直接结束，而是进入集成流程。

**当前执行状态**  
`可立即走查`

**前置条件**  
已有一个完成执行或准备进入集成的 Task。

**测试步骤**

1. 对 Task 执行 `Ready for Integration`。
2. 观察 Task 状态是否变化。
3. 观察系统是否创建或排队 merge attempt。

**预期结果**

1. Task 进入 `ready_for_integration`。
2. 系统生成对应 merge attempt 或合并请求。
3. 后续集成目标明确指向该 Issue 的 Integration Branch。

**业务判定**

如果 Task 完成后没有进入统一集成面，多 Agent 的成果仍然是分裂的。

---

### TC-BIZ-010 人类批准 merge，将 Task 结果合入 Integration Branch

**业务目标**  
验证集成动作是显式业务动作，并且结果归并到同一个 Issue 级集成目标。

**当前执行状态**  
`条件性走查`

**前置条件**  
已有 ready_for_integration 的 Task。需要 repo 绑定和 daemon merge 执行条件。

**测试步骤**

1. 在 Inbox 或其他入口执行 `Approve Merge`。
2. 启动 daemon 领取 merge attempt。
3. 观察 merge attempt 状态变化。
4. 返回 Room 查看 Integration Branch 状态。

**预期结果**

1. merge attempt 从 `queued/running` 到 `succeeded`。
2. 对应 Task 状态变为 `integrated`。
3. Integration Branch 记录已合入 Task。
4. Room 中有清晰的集成结果消息。

**业务判定**

如果 Task 结果无法明确汇总进 Integration Branch，就没有真正的协作集成面。

---

### TC-BIZ-011 集成冲突时，系统把冲突升级为协作问题

**业务目标**  
验证冲突不是静默失败，而是成为一个可见、可处理的协作事件。

**当前执行状态**  
`条件性走查`

**前置条件**  
需要构造两个 Task 在同一文件/区域上产生冲突，并具备真实 repo merge 条件。

**测试步骤**

1. 让某个 merge attempt 产生冲突。
2. 观察 Task 状态、Integration Branch 状态、Room、Inbox。
3. 检查是否能定位到是哪一个 Task 的哪次集成失败。

**预期结果**

1. merge attempt 状态变为 `conflicted`。
2. 对应 Task 进入 `blocked`。
3. Integration Branch 进入 `blocked`。
4. Room 和 Inbox 同时出现清晰冲突信息。

**业务判定**

如果冲突不能被结构化表达和追踪，人类就没法真正接管协作流。

---

### TC-BIZ-012 多个 Task 集成完成后，Integration Branch 进入可交付状态

**业务目标**  
验证系统知道“何时可以交付”，而不是只能做分散任务管理。

**当前执行状态**  
`条件性走查`

**前置条件**  
同一 Issue 下多个关键 Task 已成功集成。

**测试步骤**

1. 完成 Issue 下所有需要集成的 Task。
2. 观察 Integration Branch 状态。
3. 检查 Delivery PR 按钮或入口是否可用。

**预期结果**

1. Integration Branch 状态变为 `ready_for_delivery`。
2. 系统明确表达该 Issue 已达交付条件。
3. Delivery PR 创建入口进入可操作状态。

**业务判定**

如果系统不能判断何时交付，说明它只有执行能力，没有交付编排能力。

---

### TC-BIZ-013 创建 Delivery PR，Issue 进入交付阶段

**业务目标**  
验证 PR 在 OpenShock 里是最终交付对象，而不是协作期的临时汇流面。

**当前执行状态**  
`可立即走查`

**前置条件**  
Integration Branch 已达到 `ready_for_delivery`。

**测试步骤**

1. 在 Room 右侧点击 `Create Delivery PR`。
2. 观察 Delivery PR 状态变化。
3. 观察 Issue 状态变化。

**预期结果**

1. 系统创建 Delivery PR 对象。
2. Issue 状态进入 `in_review` 或等价交付阶段。
3. Room 中出现明确的交付动作记录。

**业务判定**

如果 PR 只是 merge 过程中的随意副产物，而不是正式交付节点，就偏离了 True P0 设计。

---

### TC-BIZ-014 Delivery PR 合入后，Issue 正式完结

**业务目标**  
验证协作成果最终落到主干，Issue 生命周期完整闭环。

**当前执行状态**  
`条件性走查`

**前置条件**  
已有 Delivery PR。当前版本主要依赖 webhook 模拟合并结果回写。

**测试步骤**

1. 对 Delivery PR 发送 merged webhook 或触发等价回写。
2. 观察 Delivery PR 状态。
3. 观察 Issue 状态。
4. 观察 Room 中是否出现最终完结消息。

**预期结果**

1. Delivery PR 变为 `merged`。
2. Issue 状态进入 `done`。
3. Integration Branch 状态同步到最终完成态。
4. 协作链路出现明确闭环记录。

**业务判定**

如果 PR 合入后 Issue 还不能自动闭环，系统交付能力仍然是不完整的。

---

## 七、沟通协作用例

这组用例验证的不是“系统有没有消息列表”，而是：

- 频道是否真的是协作空间。
- Agent 是否真的是协作者，而不只是后台执行器。
- 多 Agent 是否能在同一个上下文中继续交流，而不是各自沉默执行。

### TC-COMM-001 人类在频道内向 Agent 下达任务与约束

**业务目标**  
验证频道不仅承载系统回流，也承载人类对 Agent 的明确工作指令。

**当前执行状态**  
`可立即走查`

**前置条件**  
已有 Issue Room。

**测试步骤**

1. 人类在 Room / Channel 中发送一条明确任务消息。
2. 消息中包含目标、限制条件、优先级或验收要求。
3. 观察消息是否进入该 Issue 的统一消息流。

**预期结果**

1. 消息以人类 actor 身份出现在 Room 中。
2. 消息不会丢到 Issue 之外的公共区域。
3. 后续 Agent 的行为可以围绕这条消息继续展开。

**业务判定**

如果人类不能在频道里直接对 Agent 发出工作指令，频道就不是协作空间，只是状态看板。

---

### TC-COMM-002 Agent 在频道内确认理解并回复执行计划

**业务目标**  
验证 Agent 不是静默消费任务，而是会以协作者身份回应人类。

**当前执行状态**  
`可立即走查`

**前置条件**  
已有人类消息触发 queued `agent turn`，且 daemon 可运行。

**测试步骤**

1. 人类先在 Room 中发出任务要求，并通过 `@agent_xxx` 明确点名。
2. 启动 daemon 消费对应 queued `agent turn`。
3. 观察 daemon 完成后，频道中是否出现 Agent 回复。
4. 回复内容应包含对目标的理解、计划或风险提示。

**预期结果**

1. 消息以 Agent actor 身份出现在同一频道内。
2. 人类可以在统一消息流中连续看到“指令 -> Agent 回复”。
3. Agent 回复不是系统通知，而是可读的协作内容。

**业务判定**

如果 Agent 只能执行、不能回复，就不是真正的一等协作者。

---

### TC-COMM-003 Agent 执行中主动汇报进展

**业务目标**  
验证 Agent 在执行过程中可以主动向频道同步阶段性进展，而不是只依赖系统状态变化。

**当前执行状态**  
`条件性走查`

**前置条件**  
存在可继续消费的 queued `agent turn`，且 daemon 可运行。

**测试步骤**

1. 创建一个正在执行的 Task / Run。
2. 让人类在频道中继续追加上下文或 follow-up，形成新的 queued `agent turn`。
3. 启动 daemon。
4. 观察 Agent 是否在频道中写回阶段性进展。
5. 内容包括已完成内容、接下来计划、当前风险。

**预期结果**

1. 频道中可见 Agent 的进展汇报。
2. 人类可以仅通过频道理解执行推进情况。
3. 这类消息与系统自动生成的 `running/completed` 消息能明显区分。

**业务判定**

如果执行期只有状态机变化、没有 Agent 语义化汇报，协作体验会退化成黑盒执行。

---

### TC-COMM-004 Agent 遇到阻塞时在频道中主动提问

**业务目标**  
验证 Agent 不只是被动等待审批，而是能把问题以对话形式抛回协作面。

**当前执行状态**  
`可立即走查`

**前置条件**  
存在一个需要补充上下文、确认方向或批准动作的场景。

**测试步骤**

1. 让 Agent 在执行中遇到一个明确阻塞点。
2. 启动 daemon 消费对应 `agent turn`。
3. 观察 Agent 是否在 Room 中写回阻塞问题。
4. 人类在同一频道中给出回答或补充要求。

**预期结果**

1. 频道中能看到完整的问答链路。
2. Agent 的问题与具体 Task / Run 背景相关，不是脱离上下文的闲聊。
3. 人类答复后，后续执行可继续推进。

**业务判定**

如果阻塞只能通过系统状态码表达，而不能形成协作对话，OpenShock 的沟通层是不完整的。

---

### TC-COMM-005 Agent 完成后在频道内提交结果摘要

**业务目标**  
验证 Agent 能把结果以人类可消费的方式回写到协作面。

**当前执行状态**  
`可立即走查`

**前置条件**  
已有一个完成的 Task 或 Run。

**测试步骤**

1. 让 Agent 在任务完成后仍存在需要回写频道的 queued `agent turn`。
2. 启动 daemon。
3. 观察 Agent 是否向频道发送总结。
4. 总结应包含修改内容、原因、风险和是否需要 follow-up。
5. 人类在同一频道中进行确认或追问。

**预期结果**

1. 频道中出现 Agent 的结果摘要。
2. 摘要内容能帮助人类做 review、集成或补任务决策。
3. 结果摘要与纯系统 completion message 有明显区别。

**业务判定**

如果结果只存在于 git diff 或后台日志中，协作知识并没有进入共享沟通流。

---

### TC-COMM-006 两个 Agent 围绕同一 Issue 在频道内协同

**业务目标**  
验证多 Agent 协作不是后台并发执行，而是真能在同一上下文中互相沟通。

**当前执行状态**  
`条件性走查`

**前置条件**  
至少有两个 Agent，可分别被人类消息或 daemon 生成的交接消息触发 turn。

**测试步骤**

1. 为同一 Issue 分配 Agent A 和 Agent B。
2. 人类在频道中先触发 Agent A 的 turn。
3. 启动 daemon，观察 Agent A 回复。
4. 继续通过人类消息或 Agent A 的交接消息触发 Agent B 的 turn。
5. 再次启动 daemon，观察 Agent B 回复。
6. 人类在频道中协调优先级或边界。

**预期结果**

1. 同一频道中可以看到多 Agent 连续对话。
2. 对话围绕同一 Issue 和 Task 边界展开。
3. 这种交流会直接影响执行或集成决策。

**业务判定**

如果多 Agent 只能各自跑各自，不能在统一频道里协同，就还不是完整的多 Agent 协作系统。

---

### TC-COMM-007 Agent 之间完成交接与 follow-up 协调

**业务目标**  
验证 Agent 间沟通不仅是闲聊，而是能完成真实工作交接。

**当前执行状态**  
`条件性走查`

**前置条件**  
存在一个 Task 结果需要另一个 Agent 接力的场景。

**测试步骤**

1. 人类先触发 Agent A 的 turn。
2. 启动 daemon，观察 Agent A 是否在频道中写回交接消息。
3. 观察系统是否因此创建 Agent B 的 follow-up turn。
4. 再次运行 daemon，观察 Agent B 是否确认接手内容。
5. 人类确认是否创建 follow-up Task 或调整优先级。

**预期结果**

1. 交接信息留存在同一频道内。
2. 后续 Task / Run 的变化能和这次交接关联起来。
3. 人类能追溯为什么任务从一个 Agent 交到另一个 Agent。

**业务判定**

如果交接只能在线下完成，系统就没有真正承载协作过程。

---

### TC-COMM-008 长期 provider thread 下的 event_frame 不应串上下文

**业务目标**  
验证 Agent 可以复用长期 provider thread，但不会因为隐式记忆把不同 Room、Task、Message 的上下文混在一起。

**当前执行状态**  
`条件性走查`

**前置条件**  
同一个 Agent 已在同一 Room 中形成 active `agent_session`，并至少处理过两轮不同触发消息。

**测试步骤**

1. 在同一 Room 中先给 Agent 一条围绕 Task A 的指令。
2. 等 Agent 回复后，再给同一 Agent 一条围绕 Task B 或另一条消息的 follow-up。
3. 启动 daemon 消费对应 `agent_turn`。
4. 观察第二轮回复是否仍明确引用当前 `source_message_id`、当前 Task/Issue 语境，而不是把上一轮上下文误带进来。
5. 如条件允许，再切换到另一个 Room 对同一 Agent 发起指令，观察上下文是否被正确隔离。

**预期结果**

1. 同一 Agent 可以复用长期 provider thread。
2. 每一轮回复都围绕本轮 `event_frame` 的当前目标展开。
3. 不会出现把别的 Room、别的 Task、上一轮未相关上下文误带入当前回复的情况。

**业务判定**

如果长期 thread 复用会让上下文串台，说明 OpenShock 还没有真正掌控协作边界。

---

### TC-COMM-009 私聊控制触发一次性跨频道投递

**业务目标**  
验证人类可以从 DM 或其他控制入口要求 Agent 去目标频道说一句话，并且这次跨频道发言带着明确桥接上下文。

**当前执行状态**  
`仅设计，暂不可执行`

**前置条件**  
系统具备 DM 或等价控制入口，且 Agent 能收到“去目标频道发言”的指令。

**测试步骤**

1. 人类在 DM 或控制入口中要求 Agent 去目标 Room 发送一条一次性说明。
2. 启动 daemon 消费对应 `agent_turn`。
3. 观察目标 Room 是否收到消息。
4. 检查消息是否保留来源和桥接元数据，例如来源房间、来源消息、requested_by、context summary。
5. 确认目标 Room 没有因此自动展开新的长期协作 session。

**预期结果**

1. 目标 Room 收到一次性投递消息。
2. 消息可追溯到来源和请求人。
3. 这次动作不会错误地把一次性投递升级成长期协作分支。

**业务判定**

如果跨频道只是“把一句话扔过去”却没有桥接上下文，后续协作会不可追溯。

---

### TC-COMM-010 私聊控制触发跨频道持续协作分支

**业务目标**  
验证跨频道发言不是只有一次性投递，还能在目标频道建立本地持续协作 session。

**当前执行状态**  
`仅设计，暂不可执行`

**前置条件**  
系统具备 DM 或等价控制入口，且目标频道允许后续继续对话。

**测试步骤**

1. 人类在 DM 或控制入口中要求 Agent 去目标 Room 接手或继续推进某项工作。
2. 启动 daemon 消费对应 `agent_turn`。
3. 观察目标 Room 是否出现带桥接上下文的初始消息。
4. 在目标 Room 继续追问或补充要求。
5. 再次运行 daemon，观察后续回复是否在目标频道本地继续收敛，而不是继续依赖来源控制入口。

**预期结果**

1. 目标 Room 能形成自己的本地 `agent_session`。
2. 后续对话在目标频道本地继续推进。
3. 来源控制入口与目标频道之间的桥接关系可追踪，但不会把两个频道混成一个隐式全局上下文。

**业务判定**

如果跨频道持续协作不能在目标侧建立本地会话，系统就还没有真正支持跨频道协作分支。

---

### TC-COMM-011 默认响应先是 chat-first，而不是任务化表达

**业务目标**  
验证 Room / 私聊中的普通消息如果触发 agent 回应，首条响应必须先是自然语言接话，而不是默认进入“接任务 / 分派任务 / 创建任务”语义。

**当前执行状态**  
`条件性走查`

**前置条件**  
默认响应新语义已落地，且 frontend / backend / daemon 可真实启动。

**测试步骤**

1. 在 room 中发送一条呼叫、提问或请求帮助的普通消息，例如“有人吗？”、“这个谁能帮我看一下？”。
2. 观察系统是否产生 agent 回复。
3. 如有必要，启动 daemon 消费对应响应。
4. 检查首条 agent 回复的内容和口吻。

**预期结果**

1. 首条回复是自然语言沟通内容。
2. 回复可以是确认、澄清、轻量判断或建议。
3. 不应先出现“请某 agent 跟进”“开始执行某 task”“为此创建 task”这类任务化表达。

**业务判定**

如果普通消息触发的第一反应仍是任务编排口吻，说明系统还没有真正进入 `chat-first` 协作语义。

---

### TC-COMM-012 `@mention` 只是增强信号，不是另一套流程入口

**业务目标**  
验证显式 `@mention` 只增强消息对某个 agent 的指向性，而不会把消息送进另一套完全不同的系统流程。

**当前执行状态**  
`条件性走查`

**前置条件**  
默认响应新语义已落地，且系统能观察到被 `@mention` 的 agent 是否更倾向回应。

**测试步骤**

1. 在同一 room 中准备两条语义相近的消息：
   - 一条不带 `@mention`
   - 一条带显式 `@agent_xxx`
2. 分别发送并观察响应。
3. 比较这两条消息在系统中的表现：
   - 是否共享同一类消息理解与响应过程
   - 被 `@mention` 的 agent 是否更明确地承担回应责任
   - 回复风格是否都保持 `chat-first`

**预期结果**

1. 两条消息都走统一的消息处理语义。
2. `@mention` 只是更强的输入信号，不应触发另一套任务化/编排化流程。
3. 被 `@mention` 的消息，其首条回复仍然应先是自然语言接话。

**业务判定**

如果显式 `@mention` 仍被系统解释成“另一套流程入口”，说明新语义还没有真正收拢成统一消息处理模型。

---

### TC-COMM-013 task 是对话分析结果，不是默认响应入口

**业务目标**  
验证 task 只会在对话目标、执行边界已经清晰时作为后续分析结果出现，而不是普通消息一开始就进入 task 语义。

**当前执行状态**  
`条件性走查`

**前置条件**  
默认响应新语义已落地，且系统已具备从对话进一步形成 task 的能力或雏形。

**测试步骤**

1. 在 room 中先发送一条普通沟通消息，例如“有人吗？”、“这里谁能帮我看一下？”。
2. 观察系统是否只产生自然语言回复，而不直接形成 task。
3. 再继续补充更明确的目标、边界、责任与执行要求。
4. 观察系统是否只在对话已经足够清楚后，才进一步进入 task 语义。

**预期结果**

1. 普通聊天消息不会直接触发 task 化表达。
2. 系统先完成自然语言沟通。
3. 只有在目标、边界和执行意图已经清楚后，task 才可能作为后续分析结果出现。

**业务判定**

如果 task 仍是默认响应入口，说明系统把协作对话和任务编排混成了一件事。

---

## 八、异常与稳态用例

### TC-BIZ-015 Runtime 心跳丢失后的人类可感知性

**业务目标**  
验证执行面异常不会被系统吞掉。

**当前执行状态**  
`条件性走查`

**测试步骤**

1. 让 daemon 停止心跳或直接退出。
2. 观察 runtime 状态是否变化。
3. 检查 queued/running Run 是否出现风险提示。

**预期结果**

1. runtime 不应长期伪装成健康在线。
2. 人类应能感知执行环境异常。
3. 受影响的 Run 应具备可追踪性。

---

### TC-BIZ-016 同一 Run 不应被重复领取

**业务目标**  
验证一个 Task Run 不会被多个 Runtime 重复消费，避免执行污染。

**当前执行状态**  
`条件性走查`

**测试步骤**

1. 准备一个 queued Run。
2. 用两个 daemon 或两次并发 claim 行为同时抢占。
3. 观察 claim 结果。

**预期结果**

1. 只有一个 runtime 成功 claim。
2. Run 的归属保持单一。
3. 系统中不存在双重 running 的同一 Run。

---

### TC-BIZ-017 重复 webhook 不应重复改变交付结果

**业务目标**  
验证外部回调具备幂等性，避免交付状态被重复污染。

**当前执行状态**  
`可立即走查`

**测试步骤**

1. 对同一个 Delivery PR 发送一次 merged webhook。
2. 再发送一次相同事件 ID 的 webhook。
3. 观察返回和状态变化。

**预期结果**

1. 第二次回调被识别为 replay。
2. Delivery PR 和 Issue 状态不发生重复副作用。

---

### TC-BIZ-018 人类能够回答“现在卡在哪里”

**业务目标**  
验证系统具备最低的协作可观测性。

**当前执行状态**  
`条件性走查`

**测试步骤**

1. 找一个正常执行中的 Issue。
2. 让测试人员不看代码，只通过前端页面回答下面问题：
3. 当前有几个 Task 在推进。
4. 哪个 Task 被哪个 Agent 负责。
5. 哪个 Run 被哪个 Runtime 领取。
6. 哪个集成成功，哪个被卡住。
7. 当前是否已经可以发 Delivery PR。

**预期结果**

1. 这些问题大部分应能从产品界面直接回答。
2. 如果只能靠查日志或看后台内存数据回答，说明产品可观测性不足。

---

### TC-BIZ-019 人类能够回答“哪个 Agent 该响应，由哪个 Runtime 执行”

**业务目标**  
验证系统没有把 Agent 和 Runtime 混成一个对象，人类能区分协作者和执行载体。

**当前执行状态**  
`条件性走查`

**测试步骤**

1. 在 Room 中点名一个 Agent 发起指令。
2. 启动 daemon 消费对应 `agent_turn` 或 `run`。
3. 观察界面、日志或系统消息是否能回答：
4. 是哪个 Agent 被要求响应。
5. 最终由哪个 Runtime claim 并执行。
6. 若 Runtime 不可用，系统是否还能保留“目标 Agent 是谁”的语义。

**预期结果**

1. Agent 和 Runtime 在系统中有不同职责表达。
2. 用户能看懂“谁负责回复”和“谁实际执行”。
3. 不会出现把 Runtime 名称当作 Agent 身份展示的混淆。

**业务判定**

如果系统不能区分 Agent 和 Runtime，人类将无法判断协作责任和执行责任。

---

### TC-BIZ-020 人类能够回答“这轮回复为什么会发到这个频道”

**业务目标**  
验证跨频道或跨消息回复不是黑盒跳转，而是由显式 `event_frame` / bridge context 决定。

**当前执行状态**  
`仅设计，暂不可执行`

**测试步骤**

1. 触发一次需要跨频道投递或跨频道持续协作的场景。
2. 观察目标频道中的回复。
3. 检查是否能解释：
4. 来源是谁。
5. 来自哪条消息。
6. 为什么目标是这个频道。
7. 当前相关的 Issue / Task 是什么。

**预期结果**

1. 用户能从系统可见信息理解这次跨频道回复的来源与目的。
2. 不是只能依赖 Agent 自己“记得”上下文。

**业务判定**

如果跨频道回复的来源和目的不可解释，后续一旦跑偏，人类就没法纠偏。

---

## 九、当前版本建议的走查顺序

为了贴近真实业务闭环，建议实际走查按下面顺序进行：

1. `TC-BIZ-001`
2. `TC-BIZ-002`
3. `TC-COMM-001`
4. `TC-COMM-002`
5. `TC-BIZ-019`
6. `TC-BIZ-003`
7. `TC-BIZ-004`
8. `TC-BIZ-007`
9. `TC-BIZ-008`
10. `TC-BIZ-009`
11. `TC-BIZ-013`
12. `TC-BIZ-017`

这是一组 **当前最容易先落地的业务走查集**。

然后再进入依赖真实 repo / daemon / merge 的增强走查：

1. `TC-COMM-003`
2. `TC-COMM-004`
3. `TC-BIZ-005`
4. `TC-BIZ-006`
5. `TC-BIZ-010`
6. `TC-BIZ-011`
7. `TC-BIZ-012`
8. `TC-BIZ-014`
9. `TC-BIZ-015`
10. `TC-BIZ-016`
11. `TC-BIZ-018`
12. `TC-COMM-005`
13. `TC-COMM-006`
14. `TC-COMM-007`
15. `TC-COMM-011`
16. `TC-COMM-012`
17. `TC-COMM-013`
18. `TC-COMM-008`
19. `TC-COMM-009`
20. `TC-COMM-010`
21. `TC-BIZ-020`

---

## 十、下一轮全面走查前的重点关注项

如果目标是按最新技术设计做一轮新的完整走查，当前最需要优先盯住的是下面 6 个关注点：

1. **明确 Agent / Runtime 映射的观察方法。**  
   下一轮不仅要看“有没有回复”，还要看清“哪个 Agent 被点名”“哪个 Runtime 实际执行”，避免把协作责任和执行责任混在一起。

2. **明确长期 provider thread 的验证方法。**  
   需要能判断：
   - `provider_thread_id` 是否随 `agent_session` 复用
   - 每轮 `agent_turn` 是否都带了新的 `event_frame`
   - 回复有没有串错 Room / Task / Message 上下文

3. **定义跨频道桥接证据。**  
   如果开始覆盖私聊控制和跨频道发言，就必须提前定义清楚要观察哪些证据：
   - `source_room_id`
   - `source_message_id`
   - `requested_by`
   - `related_issue_id`
   - `context_summary`

4. **区分一次性投递和持续协作分支。**  
   下一轮走查不能只看“消息发过去了没有”，而要明确判断它到底是：
   - 一次性跨频道投递
   - 还是在目标频道开启了新的持续协作 session

5. **继续盯住执行可观测性。**  
   尤其是 `tool_call` 回流、Run 输出、Room / Board / Inbox 三处状态一致性，这些仍然直接影响全面走查结论。

6. **默认响应新语义要单独验证。**  
   下一轮不能再沿用旧的 `monitoring / fallback / default_monitor_response` 口径，而要优先验证：
   - 首条回复是否 `chat-first`
   - `@mention` 是否只是增强信号
   - task 是否只作为后续分析结果出现

---

## 十一、结论

从业务理解看，当前项目已经不再只是“能跑一个动作”的原型，`Issue -> Task -> Run -> Integration Branch -> Delivery PR -> Issue Done` 这条主骨架已经有了。

但它离 True P0 还有三个最关键的差距：

1. **主链路已经能走通，但设计边界验证还没补齐。**
   特别是 Agent / Runtime 映射、长期 provider thread 与 `event_frame` 注入，这些现在是新的高风险点。

2. **跨频道协作已经进入正式验收范围。**
   不能再只验证同一 Room 内的人类-Agent-Agent 协作，还要开始区分一次性投递和持续协作分支。

3. **真实执行可观测性仍然是最终结论的关键前提。**
   尤其是 tool call 回流、Run 输出、Room/Board/Inbox 一致性，还需要继续盯稳。

因此，这份测试用例可以直接作为下一轮全面走查脚本使用，但执行时应优先按第十部分的关注点组织观察和记录。
