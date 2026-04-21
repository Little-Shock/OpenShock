# OpenShock Execution Tickets

**版本:** 1.62
**更新日期:** 2026 年 4 月 20 日
**关联文档:** [PRD](./PRD.md) · [Checklist](./Checklist.md) · [Test Cases](../testing/Test-Cases.md)

---

## 一、使用方式

- 这份文档承接 **当前票面状态** 的 canonical backlog，并保留最近完成批次的状态和映射。
- 已完成能力的详细证据继续以 [Checklist](./Checklist.md) 和记实测试报告为准，不在这里重复展开。
- 每张票必须绑定对应 `Checklist` 和 `Test Case`，否则不能 claim。

### 状态定义

- `todo`: 还没开始
- `active`: 已 claim，正在实现
- `review`: 已提测，等待 reviewer / QA
- `done`: 已过 gate 并进入主线

---

## 二、当前批次优先级

1. 已经站住的前端壳、onboarding、mailbox、profile、persistence 不再反复假装“未完成”；后续票只围剩余 GAP 开。
2. 当前主线已经吸收 PR conversation、usage/quota、identity recovery、restricted sandbox、delivery gate 和 configurable topology；下一批不再重复补旧口，而是继续往更深治理和体验收尾推进。
3. 聊天、Room、Inbox、Topic、Run 的真相仍高于 Board；Board 继续只做 planning mirror。
4. 多 Agent 协作当前已经收进 SLA / routing / aggregation、formal comment、governed next-route default、one-click auto-create、governed auto-advance、delivery closeout backlink、delivery delegation signal、delegated closeout handoff auto-create、delegated closeout lifecycle sync、delivery delegation automation / auto-complete policy、delegated closeout response orchestration、retry attempt truth、parent surface context preservation、child response context sync、child response timeline sync、parent response timeline sync、room main-trace sync（含 blocked response trace）、PR detail collaboration thread + inline thread actions、mailbox 当前 room ledger 的 multi-select batch queue、governed batch policy auto-advance、workspace governance escalation queue mirror、cross-room escalation rollup，以及 room-level governed create action；下一批继续前滚到更重的 multi-room dependency graph / auto-closeout。
5. memory provider orchestration 与 health/recovery 已补到正式产品面；下一批继续围后台整理、真实 remote external durable adapter 和更重的多 Agent 自治策略。

### Frontend Batch Merge Gate

- 每张前端票都必须补 headed browser walkthrough 证据，不接受用默认 headless 冒充。
- 每张前端票都必须更新 `Checklist -> Test Cases -> Ticket` 的映射。
- 每张前端票都必须做桌面主视口走查；改布局还要补窄屏抽查。
- 每张前端票都必须显式检查:
  - composer 是否常驻可见
  - 历史消息是否能稳定回滚
  - 左栏 / 下拉 / 高亮是否紧凑易读
  - Board 是否没有重新抢回主导航心智

### Config / Governance Batch Merge Gate

- 涉及 Agent / Machine / onboarding / preference 的票，必须补 reload 或 restart 之后的 persistence 证据。
- 涉及多 Agent 的票，必须显式展示 handoff ledger、ack / blocked、human override。
- 不接受只做前端 mock 表单、不写后端 truth 的配置票。

---

## 三、当前票面状态

## TKT-21 Real Quick Search / Search Result Surface

- 状态: `done`
- 优先级: `P0`
- 目标: 把当前静态 Quick Search 做成真正可切换 `channel / room / issue / run / agent` 的结果面。
- 范围:
  - 搜索输入与结果列表
  - 结果高亮、键盘导航、跳转后保持当前壳层上下文
  - `channel / room / issue / run / agent` 最小结果卡
- 依赖: `TKT-16`
- Done When:
  - Quick Search 不再只是入口按钮，而是真正可切换工作面的命令面板
  - 搜索后能跳到目标页面，并保持当前壳层高亮正确
  - 有 headed walkthrough 证据覆盖 `open -> search -> jump`
- Checklist: `CHK-01` `CHK-16`
- Test Cases: `TC-033`

## TKT-22 DM / Followed Thread / Saved Later Surface

- 状态: `done`
- 优先级: `P0`
- 目标: 补齐 `DM / followed thread / saved later` 这条消息工作流。
- 范围:
  - DM 数据模型与前台入口
  - followed thread 列表
  - saved / later 列表
  - 基础 unread 语义与回访入口
- 依赖: `TKT-21`
- Done When:
  - 用户可从同一套壳层进入 DM、followed thread 和 saved later
  - thread 不再只停在右 rail 回复区，而是可被 follow / reopen
  - 至少有一条 headed browser walkthrough 覆盖 `channel -> thread -> follow -> reopen`
- Checklist: `CHK-16` `CHK-17`
- Test Cases: `TC-029`

## TKT-23 Room Workbench Tabs / Topic Context

- 状态: `done`
- 优先级: `P0`
- 目标: 把 Room 收成默认工作台，让 `Chat / Topic / Run / PR / Context` 在同一页稳定切换。
- 范围:
  - room header tabs
  - topic summary / run truth / PR truth / context back-links
  - room-first navigation and state persistence
- 依赖: `TKT-16`
- Done When:
  - 用户围绕一个 room 完成讨论、执行、PR、回看，不需要频繁跳详情页
  - run control、PR entry、inbox back-link 保持可用
  - room 切 tab 不丢当前上下文
- Checklist: `CHK-06` `CHK-17`
- Test Cases: `TC-031`

## TKT-24 Frontend Interaction Polish Sweep

- 状态: `done`
- 优先级: `P0`
- 目标: 系统化收前端的人机工学问题，不再靠零散截图驱动微调。
- 范围:
  - sidebar / channel / room dropdown 与高亮位置
  - channel / room scrollback 稳定性
  - composer 常驻可见性
  - 字号、间距、密度、Work 页卡片收缩
  - 下拉、hover、focus 和点击区的人类可用性
- 依赖: `TKT-16`
- Done When:
  - 主要聊天与工作面不存在“输入框看不到”“历史消息滚不回去”“高亮位置飘”“空白过大”这类高频问题
  - 有明确的 headed walkthrough 覆盖桌面主视口和窄屏抽查
  - 文档里形成固定的 interaction polish 验收项
- Checklist: `CHK-01` `CHK-16` `CHK-17`
- Test Cases: `TC-028` `TC-034`

## TKT-25 Agent / Machine / Human Profile + Presence

- 状态: `done`
- 优先级: `P1`
- 目标: 把 `Agent / Machine / Human` 做成可 drill-in 的 profile surface，而不是散落的 badge。
- 范围:
  - profile routes / panels
  - presence、activity、capability、最近 room/run 关系
  - shell / room 内的统一 drill-in entry
- 依赖: `TKT-23`
- Done When:
  - 任一 `Agent / Machine / Human` 都可从壳层或 room 进入 profile surface
  - presence / capability / 最近活动直接消费 live truth
  - profile 不再只是孤立详情页
- Checklist: `CHK-02` `CHK-17`
- Test Cases: `TC-030`

## TKT-26 Board Light Planning Cleanup

- 状态: `done`
- 优先级: `P2`
- 目标: 保留 Board 的次级位置，但把 planning card 和回跳关系做轻。
- 范围:
  - board card 信息压缩
  - room / issue / board 回跳关系
  - planning 语言与主壳一致，不再像独立后台
- 依赖: `TKT-20`
- Done When:
  - Board 明显是 planning mirror，而不是默认中心
  - 从 room / issue 打开 planning surface 再回来足够顺手
  - card 语言比当前更轻、更少噪音
- Checklist: `CHK-05` `CHK-18`
- Test Cases: `TC-032`

## TKT-27 DM / Thread / Search Backend Contracts

- 状态: `done`
- 优先级: `P1`
- 目标: 给下一轮消息型前端补最小 server truth，不靠纯本地 mock 撑 DM / followed thread / search。
- 范围:
  - `directMessages / directMessageMessages / followedThreads / savedLaterItems` 的 state contract
  - `quickSearchEntries` search result contract
  - unread / reopen / jump target contract
- 依赖: 无
- Done When:
  - 前端不需要再拿硬编码占位结构伪装 DM / thread search
  - DM composer、thread follow、saved later 能直接打 live API
  - Quick Search 能直接消费 server-backed `dm / followed / saved` result truth
  - 合同有对应后端 tests
- Checklist: `CHK-03` `CHK-16` `CHK-17`
- Test Cases: `TC-029` `TC-033`

## TKT-28 GitHub App Installation-Complete Callback / Repo Sync

- 状态: `done`
- 优先级: `P1`
- 目标: 补齐 GitHub App 安装完成后的 live callback、repo 持续同步与前台回流。
- 范围:
  - installation-complete callback
  - repo sync / webhook backfill
  - room / inbox / PR state 回流
- 依赖: `TKT-06`
- Done When:
  - 完整 GitHub App 安装后，OpenShock 能持续收到 repo truth
  - 不再只停在 installation pending 的 blocked-path
  - 有实机或近实机证据覆盖 callback -> sync -> UI update
- Checklist: `CHK-07`
- Test Cases: `TC-015`

## TKT-29 Device Authorization / Email Verification / Reset

- 状态: `done`
- 优先级: `P1`
- 目标: 把 invite / role / quick login 补成完整身份恢复链。
- 范围:
  - device authorization
  - email verification / reset
  - session recovery / external identity binding
- 依赖: `TKT-08`
- Done When:
  - 新成员、换设备、忘记密码这些链路都能被产品化验证
  - 身份真相会回写到 session / member / permission surface
- Checklist: `CHK-13`
- Test Cases: `TC-035`

## TKT-30 Destructive Guard / Secret Boundary

- 状态: `done`
- 优先级: `P1`
- 目标: 把 destructive action approval、secret boundary 和越界写保护做成产品化 guard。
- 范围:
  - destructive git / filesystem approval
  - sandbox boundary visibility
  - secret / credential scope
- 依赖: 无
- Done When:
  - 高风险动作不会直接执行，而会进入 approval required
  - secrets 和 runtime capability 边界清晰
  - room / inbox / run 都能看到 guard truth
- Checklist: `CHK-12`
- Test Cases: `TC-027`

## TKT-31 Runtime Lease Conflict / Scheduler Hardening

- 状态: `done`
- 优先级: `P1`
- 目标: 在当前 failover 基线上继续补 lease conflict guard、scheduler observability 和恢复策略。
- 范围:
  - lease conflict
  - scheduler policy visibility
  - failover / recover consistency
- 依赖: `TKT-14`
- Done When:
  - 多 runtime 不会因为 lease 漂移或 stale state 做出错误调度
  - `/setup` 与 `/agents` 能稳定显示当前决策原因
  - 对应 release / browser verify 能稳定回放
- Checklist: `CHK-14` `CHK-15`
- Test Cases: `TC-020` `TC-021`

## TKT-57 GitHub Public Ingress Callback / Webhook Delivery Verification

- 状态: `done`
- 优先级: `P1`
- 目标: 把 GitHub installation callback / webhook delivery 从近实机 contract 推到 public ingress 级 exact evidence。
- 范围:
  - Setup surface 暴露 public callback URL / webhook URL
  - installation callback 通过同一 public ingress root 回流
  - signed webhook delivery + bad-signature fail-closed 走 public ingress 回放
- 依赖: `TKT-28`
- Done When:
  - `/v1/github/connection` 与 Setup UI 会明确给出 public callback / webhook URL
  - `/setup/github/callback` 能在 public ingress root 下把 installation truth 写回 Setup
  - `/v1/github/webhook` 的 signed delivery 与 bad-signature fail-closed 都有同一 public root 下的 exact artifact
- Checklist: `CHK-07`
- Test Cases: `TC-015` `TC-045`

## TKT-32 Agent Profile Editor / Prompt Avatar Memory Binding

- 状态: `done`
- 优先级: `P1`
- 目标: 把 Agent 从只读对象补成真正可编辑的 profile surface。
- 范围:
  - role / avatar / prompt / operating instructions 编辑
  - memory binding / recall policy / provider preference
  - next-run preview 与审计差异
- 依赖: `TKT-25` `TKT-12`
- Done When:
  - 用户可在 Agent profile 中编辑 prompt、avatar、role 与 memory binding
  - 编辑结果会回写到后端 truth，并影响下一次 run 的 injection preview
  - 至少有一条 headed walkthrough 覆盖 `open profile -> edit -> save -> verify next run`
- Checklist: `CHK-02` `CHK-10` `CHK-19`
- Test Cases: `TC-030` `TC-036`

## TKT-33 Machine Profile / Local CLI Model Capability Binding

- 状态: `done`
- 优先级: `P1`
- 目标: 把 Runtime / Machine 的本地能力发现与 Agent 偏好绑定做成正式产品面。
- 范围:
  - machine profile：hostname / OS / shell / daemon / capability summary
  - 本地 CLI / provider truth + provider model catalog
  - Agent default provider / model / runtime affinity 绑定
- 依赖: `TKT-14`
- Done When:
  - `/setup`、`/agents` 或 machine profile 能看到 machine capability truth
  - Agent 可声明 default provider / model / runtime affinity，并与 machine/provider truth 对齐；model catalog 只作 suggestion，不按静态列表硬拒绝
  - 有 store / API tests 加浏览器级 walkthrough
- Checklist: `CHK-14` `CHK-19` `CHK-22`
- Test Cases: `TC-037` `TC-040`

## TKT-34 Onboarding Studio / Dev Team + Research Team Templates

- 状态: `done`
- 优先级: `P1`
- 目标: 把首次启动和团队模板做成真正可恢复的 onboarding 流。
- 范围:
  - onboarding wizard / resumable progress
  - `开发团队 / 研究团队 / 空白自定义` 模板
  - 默认 channels / roles / agents / notification policy / onboarding notes 物化
- 依赖: `TKT-32` `TKT-33` `TKT-37`
- Done When:
  - 新 workspace 可以选择模板并完成首次启动
  - onboarding 可中断后继续，而不是一次性魔法流程
  - 有 headed walkthrough 覆盖 `create workspace -> choose template -> pair runtime -> finish`
- Checklist: `CHK-20` `CHK-22`
- Test Cases: `TC-038` `TC-040` `TC-041`

## TKT-35 Agent Mailbox / Handoff Contract

- 状态: `done`
- 优先级: `P1`
- 目标: 给 Agent-to-Agent 正式协作建立可观测、可追踪的消息与交接合同。
- 范围:
  - agent mailbox message model
  - handoff request / ack / blocked / complete lifecycle
  - room / inbox back-link 与 human visibility
- 依赖: `TKT-27`
- Done When:
  - 一个 Agent 可以正式把上下文交给另一个 Agent
  - handoff 生命周期能在 Room / Inbox / Mailbox surface 中被追踪
  - 后端有 contract tests，前台有 walkthrough evidence
- Checklist: `CHK-03` `CHK-21`
- Test Cases: `TC-039`

## TKT-36 Multi-Agent Governance / Role Topology / Reviewer-Tester Loop

- 状态: `done`
- 优先级: `P1`
- 目标: 把多 Agent 分工、审批和 response aggregation 变成可治理的团队拓扑，而不是口头约定。
- 范围:
  - `PM / Architect / Splitter / Developer / Reviewer / QA` 与研究团队变体
  - handoff rules / approval gates / escalation path
  - human override 与 response aggregation
- 依赖: `TKT-34` `TKT-35`
- Done When:
  - 用户可基于模板起出多 Agent 分工链
  - review / test / blocked escalation 有显式治理面
  - 至少有一条端到端 walkthrough 覆盖 issue -> handoff -> review -> test -> final response
- Checklist: `CHK-20` `CHK-21`
- Test Cases: `TC-041`

## TKT-37 Workspace / User / Agent Config Persistence + Database Truth

- 状态: `done`
- 优先级: `P1`
- 目标: 把 workspace / member / agent profile 的配置读写与治理快照从临时前端状态补成 durable store truth。
- 范围:
  - workspace / member durable config schema / store / migration
  - preference / onboarding / profile / repo-binding / GitHub-installation snapshot persistence
  - restart / reload / device switch recovery contract
- 依赖: 无
- Done When:
  - 关键配置可跨刷新、重启、换设备恢复
  - API 与 UI 读取到的是同一份 durable truth
  - 至少有一条测试覆盖 persistence + recovery
- Checklist: `CHK-22`
- Test Cases: `TC-040`

## TKT-38 Live Truth Hygiene / Placeholder Leak Guard

- 状态: `done`
- 优先级: `P0`
- 目标: 把 live truth 面里的 placeholder、乱码、fixture / test residue 和内部路径泄漏收成 fail-closed contract，不再把脏 seed/fallback 直接送到用户面前。
- 范围:
  - `/v1/state` 与 `/v1/state/stream` 的 visible truth sanitization
  - mutation-returned state 的前台 state adapter guard
  - live detail / room / setup / settings / orchestration / inbox 的 placeholder wording cleanup
  - `check:live-truth-hygiene` release gate
- 依赖: 无
- Done When:
  - `/chat/all`、`/issues`、`/rooms`、`/runs`、`/inbox` 用户可见文案不再出现 placeholder、乱码、fixture、test residue 或内部 worktree 路径
  - 如果底层 state 含脏值，前台回退到产品级 fallback，而不是把 seed/fallback 真值直接吐给用户
  - release gate 能稳定拦下 direct mock-data import、placeholder wording 和 tracked live-truth residue
- Checklist: `CHK-03` `CHK-15`
- Test Cases: `TC-042`

## TKT-40 Run History / Incremental Fetch / Resume Context

- 状态: `done`
- 优先级: `P1`
- 目标: 把 `/runs` 收成可渐进展开的历史面，并让 run detail / room run tab 直接暴露当前可恢复的 session continuity。
- 范围:
  - `/v1/runs/history` paginated contract
  - `/v1/runs/:id/detail` resume-context + same-room history contract
  - `/runs` incremental fetch / `Load Older Runs`
  - run detail / room run tab 的 session-backed resume context 与 prior-run reopen
- 依赖: `TKT-23`
- Done When:
  - `/runs` 首屏只展示最新一页 history，旧 run 通过显式增量展开
  - run detail 能稳定显示 branch / worktree / memory paths / control note 这类 resume context
  - 同一条 room 的前序 run 可被 reopen，且回到 room run tab 时仍锚定当前 active continuity
- Checklist: `CHK-06`
- Test Cases: `TC-043`

## TKT-47 Mobile Web Light Observation / Notification Triage

- 状态: `done`
- 优先级: `P1`
- 目标: 把 mobile web 上的 `/inbox` 收成“能打开、能查看、能处理轻量通知”的 exact triage 面，而不是把桌面 workbench 整套硬塞进手机。
- 范围:
  - mobile-only triage summary card（open / unread / blocked / recent）
  - approval center signal card 的 mobile density 收缩
  - guard / backlinks / recent ledger 的折叠式 reveal
  - mobile headed verification for `/inbox`
- 依赖: `TKT-10` `TKT-11`
- Done When:
  - 390px 级视口下 `/inbox` 不出现横向溢出
  - 首屏能直接看到 open triage 摘要与 decision，不需要先横向滚动或穿过整块 guard copy
  - 更重的 notification policy / subscriber / delivery truth 继续明确回跳到 `/settings`
  - 有独立 headed mobile walkthrough 证据，而不是拿桌面截图代替
- Checklist: `CHK-11`
- Test Cases: `TC-044`

## TKT-52 Topic Route / Edit Lifecycle / Resume Deep Link

- 状态: `done`
- 优先级: `P1`
- 目标: 把 Topic 从 room workbench 子 tab 补成可独立直达、可注入 guidance、可直接恢复 continuity 的一等 route。
- 范围:
  - standalone topic route / quick-search backlinks
  - topic guidance edit surface
  - room / run continuity resume deep link
- 依赖: `TKT-23` `TKT-40`
- Done When:
  - Topic 不再只能从 room `?tab=topic` 里打开
  - 人类能直接在 Topic route 注入 guidance，并沿同一条 room / run truth 继续
  - 至少有一条 walkthrough 覆盖 `open topic -> edit guidance -> reload -> resume`
- Checklist: `CHK-06`
- Test Cases: `TC-031` `TC-046`

---

## 四、后续 Backlog / 延伸票

## TKT-39 Review Comment Sync / PR Conversation Backfill

- 状态: `done`
- 优先级: `P1`
- 目标: 把 PR review comment / thread resolution 从“只靠 webhook 粗同步”补成可回看、可回链的产品真相。
- 范围:
  - review comment / thread normalized state
  - PR detail、Room、Inbox 的 conversation back-link
  - reopen / re-sync / backfill consistency
- 依赖: `TKT-05` `TKT-28`
- Done When:
  - review comment、thread resolution、change request 能稳定回写到 PR / Room / Inbox
  - reload 或 webhook replay 后不会丢失 review conversation truth
  - 至少有一组 API + browser evidence 覆盖 `comment -> sync -> room/inbox back-link`
- 最新证据:
  - `go test ./internal/api` 已锁住 review sync、repeat replay dedupe、PR detail backlink contract
  - `docs/testing/Test-Report-2026-04-11-windows-chrome-pr-conversation-usage-observability.md`
- Checklist: `CHK-07` `CHK-08`
- Test Cases: `TC-025` `TC-026`

## TKT-41 Usage / Token / Quota Observability

- 状态: `done`
- 优先级: `P1`
- 目标: 把上下文窗口、token、quota 与执行成本补成正式可观察真相。
- 范围:
  - run / room / workspace usage summary
  - token / quota / context visibility
  - release / ops verify 的 usage regression hooks
- 依赖: `TKT-14`
- Done When:
  - 用户能看到 run / workspace 级 usage、quota 与 context cost
  - 关键 usage 指标不再只藏在日志或 CLI 输出里
  - verify / report 至少有一条证据覆盖 usage observability
- 最新证据:
  - `pnpm verify:web`
  - `docs/testing/Test-Report-2026-04-11-windows-chrome-pr-conversation-usage-observability.md`
- Checklist: `CHK-06` `CHK-15`
- Test Cases: `TC-021` `TC-026`

## TKT-42 Memory Viewer / Correction / Forget Surface

- 状态: `done`
- 优先级: `P1`
- 目标: 把记忆中心从“可浏览”补成“可纠正、可撤销、可追溯”的产品面。
- 范围:
  - memory detail audit trail
  - correction / feedback / forget actions
  - viewer-side provenance visibility
- 依赖: `TKT-12` `TKT-32`
- Done When:
  - 人类能查看 memory 来源、版本和作用域，并执行 correction / forget
  - correction / forget 会回写到同一份 governed truth
  - 至少有一条 walkthrough 覆盖 `open memory -> correct/forget -> verify audit`
- Checklist: `CHK-10` `CHK-22`
- Test Cases: `TC-023` `TC-036`

## TKT-43 Memory Cleanup / TTL / Promotion Worker

- 状态: `done`
- 优先级: `P1`
- 目标: 给 memory 增加去重、TTL、批量整理与 promote 队列，不让治理只停在单条人工操作。
- 范围:
  - dedupe / TTL / cleanup job
  - promote-to-skill / policy queue hardening
  - cleanup observability / recovery
- 依赖: `TKT-12`
- Done When:
  - memory cleanup 不再只能靠手工回收
  - TTL / dedupe / promote 结果有可见 ledger 与回归测试
  - 至少有一条验证覆盖 `cleanup -> promote -> verify next-run truth`
- Checklist: `CHK-10`
- Test Cases: `TC-019` `TC-023`

## TKT-44 Invite / Verify / Reset Notification Template Delivery

- 状态: `done`
- 优先级: `P1`
- 目标: 把 invite / verify / reset / blocked escalation 收成同一条恢复与通知模板链。
- 范围:
  - notification template catalog
  - invite / verify / reset / escalation email delivery
  - cross-device recovery touchpoint
- 依赖: `TKT-11` `TKT-29`
- Done When:
  - invite、verify、reset、高优先级 blocked escalation 都走同一份 delivery truth
  - 用户能在通知面看到模板与最近投递结果
  - 至少有一条验证覆盖 `invite/verify/reset -> delivery -> recovery`
- Checklist: `CHK-11` `CHK-13` `CHK-20`
- Test Cases: `TC-017` `TC-035` `TC-038`

## TKT-45 Credential Profile / Encrypted Secret Scope

- 状态: `done`
- 优先级: `P1`
- 目标: 把凭证从隐性环境依赖补成有边界、可审计的 Credential Profile。
- 范围:
  - encrypted secret storage / scope
  - workspace / agent / run credential binding
  - secret visibility / approval boundary
- 依赖: `TKT-30`
- Done When:
  - secret / credential 不再只能靠外部手配环境变量
  - workspace / agent / run 对 secret scope 的读取边界清晰
  - 至少有一条验证覆盖 `bind secret -> execute -> guard/audit`
- Checklist: `CHK-12` `CHK-13`
- Test Cases: `TC-024` `TC-027`

## TKT-46 Restricted Local Sandbox / Network / Tool Policy

- 状态: `done`
- 优先级: `P1`
- 目标: 在 trusted sandbox 之上继续补 network / tool / command 白名单和 profile 化策略。
- 范围:
  - sandbox profile / policy surface
  - network / command / tool allowlist
  - denial / approval-required recovery flow
- 依赖: `TKT-30` `TKT-45`
- Done When:
  - workspace / agent / run 能声明 restricted sandbox profile
  - 越权网络、命令或工具调用会显式进入 denied / approval required
  - 至少有一条验证覆盖 `restricted profile -> denied action -> override/retry`
- Checklist: `CHK-12` `CHK-15`
- Test Cases: `TC-021` `TC-027`

## TKT-48 Workspace Plan / Usage Limit / Retention Surface

- 状态: `done`
- 优先级: `P2`
- 目标: 把 workspace 计划、上限、usage 与 retention policy 做成用户可见的产品面。
- 范围:
  - workspace plan / limits summary
  - max machines / agents / channels / history retention visibility
  - usage / limit warning surface
- 依赖: `TKT-41`
- Done When:
  - 用户能看到当前 workspace plan、usage、limits 与 retention truth
  - 关键 limit 不再只存在文档或 server 默认值里
  - 至少有一条验证覆盖 `view plan -> hit warning -> inspect usage`
- Checklist: `CHK-15` `CHK-22`
- Test Cases: `TC-021` `TC-026`

## TKT-49 Delivery Entry / Release Gate / Handoff Note Contract

- 状态: `done`
- 优先级: `P2`
- 目标: 把交付入口、release-ready 标准与 handoff note 收成单一可执行契约。
- 范围:
  - delivery entry / operator handoff note
  - release gate checklist / acceptance contract
  - closeout / customer-facing evidence bundle
- 依赖: `TKT-39` `TKT-41` `TKT-44`
- Done When:
  - 团队能用一份 contract 判断“是否 release-ready”
  - handoff note、release gate、customer evidence 不再散落在多份临时说明里
  - 至少有一条验证覆盖 `prepare release -> verify gate -> publish handoff note`
- Checklist: `CHK-15` `CHK-21`
- Test Cases: `TC-026` `TC-041`

## TKT-58 Control-Plane `/v1` Command / Event / Debug Read Model

- 状态: `done`
- 优先级: `P1`
- 目标: 把公开 control-plane 收成稳定 `/v1` contract，明确 command write、event read 和 debug / replay read-model 的边界。
- 范围:
  - versioned `/v1` resource contract
  - command write / event read split
  - debug history / rejection reason / replay anchor
  - stable error family / idempotency / cursor semantics
- 依赖: 无
- Done When:
  - 外部 consumer 可不依赖前台私有逻辑直接写 command、读 event、读 debug history
  - 错误返回能稳定区分 `not_found / conflict / boundary_rejection / internal`
  - 至少有一条 API + browser evidence 覆盖 `write -> replay -> rejection/debug readback`
- Checklist: `CHK-03` `CHK-15`
- Test Cases: `TC-047`

## TKT-59 Shell Adapter / No-Shadow-Truth Contract

- 状态: `done`
- 优先级: `P1`
- 目标: 收紧 shell adapter discipline，确保 projection 只 fan-in 稳定真相，不再留下 shadow truth。
- 范围:
  - adapter projection boundary
  - fail-closed fallback contract
  - stale / dirty projection adversarial probes
  - release gate for no-shadow-truth regressions
- 依赖: `TKT-38`
- Done When:
  - 新 surface 不会因为局部 projection 或 mock residue 显示与 `/v1` 冲突的状态
  - adapter 缺字段或上游脏值时，前台统一 fail-closed 回退到产品级 fallback
  - 至少有一条 verify / browser evidence 覆盖 dirty projection 对抗性场景
- Checklist: `CHK-03` `CHK-15`
- Test Cases: `TC-048`

## TKT-60 Runtime Publish Cursor / Replay Evidence Packet

- 状态: `done`
- 优先级: `P1`
- 目标: 把 daemon -> server 的 publish、closeout 和 replay 收成可重放、可解释、可复核的 evidence packet。
- 范围:
  - publish cursor / sequence dedupe
  - failure / closeout evidence packet
  - replay / closeout read-model
  - runtime readiness regression hooks
- 依赖: `TKT-31`
- Done When:
  - daemon 重发事件不会破坏 sequence，也不会重复落账
  - run closeout / replay 可读到 failure anchor、closeout reason 与 publish cursor truth
  - 至少有一条 contract + headed evidence 覆盖 `publish -> retry -> replay/closeout readback`
- Checklist: `CHK-14` `CHK-15`
- Test Cases: `TC-049`

## TKT-61 Multi-Agent Routing SLA / Response Aggregation Hardening

- 状态: `done`
- 优先级: `P1`
- 目标: 在现有 team topology / mailbox / human override 基线上，补齐正式 routing policy、escalation SLA、notification policy 与 final-response aggregation contract。
- 范围:
  - handoff routing matrix
  - escalation SLA / timeout / retry policy
  - multi-agent notification policy
  - final-response aggregation audit + human override trace
- 依赖: `TKT-36` `TKT-44`
- Done When:
  - 多 Agent 协作不再只显示 topology，而能解释为什么发给谁、谁超时、谁聚合最终回复
  - blocked / review / test / escalation 都走同一份 routing + notification policy
  - 至少有一条端到端证据覆盖 `issue -> handoff -> escalation -> aggregated final response`
- Checklist: `CHK-21`
- Test Cases: `TC-050`

## TKT-62 Configurable Team Topology / Governance Persistence

- 状态: `done`
- 优先级: `P1`
- 目标: 把 `PM / Architect / Developer / Reviewer / QA` 这类治理拓扑从只读模板预览收成真正可编辑、可恢复的 workspace truth。
- 范围:
  - `/settings` team topology editor
  - workspace durable topology persistence
  - `/setup` `/mailbox` `/agents` governance replay 读同一份 topology
  - reload / restart / second-context recovery evidence
- 依赖: `TKT-36` `TKT-37` `TKT-61`
- Done When:
  - 用户可以在 `/settings` 直接修改 lane / role / default agent / handoff path
  - `workspace.governance` 会优先围 durable topology 派生，而不是退回固定模板
  - 至少有一条 Windows Chrome 有头证据覆盖 `settings edit -> setup/mailbox/agents replay -> reload/restart recovery`
- 最新证据:
  - `go test ./internal/store -run TestWorkspaceConfig`
  - `go test ./internal/api -run TestWorkspaceConfigRoutePersistsDurableSnapshot`
  - `docs/testing/Test-Report-2026-04-11-windows-chrome-configurable-team-topology.md`
- Checklist: `CHK-21` `CHK-22`
- Test Cases: `TC-051`

## TKT-63 Formal Mailbox Comment / Bilateral Handoff Communication

- 状态: `done`
- 优先级: `P1`
- 目标: 在现有 mailbox lifecycle 上补齐 source / target 双边 formal comment，让 handoff 不只剩 request / ack / blocked / complete 的单向状态推进。
- 范围:
  - `POST /v1/mailbox/:id` comment action
  - source / target actor guard
  - same-handoff ledger / inbox / room trace writeback
  - blocked / completed lifecycle preservation
- 依赖: `TKT-35` `TKT-62`
- Done When:
  - source agent 与 target agent 都能在同一条 handoff 上补 formal comment
  - comment 不会偷偷改 lifecycle status，也不会冲掉 blocked / completed 的关键 note
  - 至少有一条 Windows Chrome 有头证据覆盖 `create -> source comment -> blocked -> target comment -> ack -> complete`
- 最新证据:
  - `go test ./internal/store -run TestAdvanceHandoffComment`
  - `go test ./internal/api -run TestMailboxRoutesComment`
  - `docs/testing/Test-Report-2026-04-11-windows-chrome-mailbox-formal-comment.md`
- Checklist: `CHK-21`
- Test Cases: `TC-052`

## TKT-64 Governed Mailbox Route / Default Role Handoff

- 状态: `done`
- 优先级: `P1`
- 目标: 把 team topology 从只读治理预览推进到当前 room truth 驱动的默认下一棒 handoff 建议，避免 mailbox compose 静默随机挑人。
- 范围:
  - `workspace.governance.routingPolicy.suggestedHandoff` contract
  - current room / run owner lane resolution
  - `/mailbox` 与 Inbox compose governed-route surface
  - active handoff focus / missing target blocked fallback
- 依赖: `TKT-61` `TKT-62` `TKT-63`
- Done When:
  - governance snapshot 能围当前 room / run truth 给出下一棒 governed handoff suggestion
  - 当前 room 已有未完成 handoff 时，surface 会切成 `active` 并回链当前 ledger，防止重复创建
  - 下一条 lane 缺少可映射 agent 时，surface 会显式 `blocked`，不再静默回退到随机接收方
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-route -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-route.md`
- Checklist: `CHK-21`
- Test Cases: `TC-053`

## TKT-65 Governed Mailbox Auto-Create / Compose Shortcut

- 状态: `done`
- 优先级: `P1`
- 目标: 把 governed route 从“会建议”推进到“可一键起单”，减少 `/mailbox` 与 Inbox compose 上的重复选择和二次确认摩擦。
- 范围:
  - `/mailbox` governed route create shortcut
  - Inbox compose governed route create shortcut
  - active focus back-link after auto-create
  - same-route blocked replay on both surfaces
- 依赖: `TKT-64`
- Done When:
  - `/mailbox` 与 Inbox compose 在 `ready` governed route 下都提供一键创建 formal handoff 入口
  - auto-create 后两处 surface 会同步切到 `active` 并提供同一条 focus handoff 回链
  - handoff 完成后，两处 surface 都会前滚到下一条 lane；如果缺少 target agent，则同样显式 `blocked`
- 最新证据:
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-route -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-autocreate.md`
- Checklist: `CHK-21`
- Test Cases: `TC-054`

## TKT-66 Governed Mailbox Auto-Advance

- 状态: `done`
- 优先级: `P1`
- 目标: 把 governed route 从“能一键起单”推进到“当前一棒完成后能继续自动前滚”，减少 reviewer/tester 链路中的重复 closeout + recreate 摩擦。
- 范围:
  - `POST /v1/mailbox/:id` governed auto-advance contract
  - `/mailbox` acknowledged handoff `Complete + Auto-Advance`
  - Inbox mailbox ledger `Complete + Auto-Advance`
  - same-truth governed followup replay
- 依赖: `TKT-64` `TKT-65`
- Done When:
  - acknowledged handoff 在完成时允许显式请求 `continueGovernedRoute`
  - 若下一条 governed lane 已映射合法 default agent，则 server 会自动创建 followup handoff，而不是要求前端串两次 mutation
  - `/mailbox` 与 Inbox compose 会一起切到 followup handoff 的 `active`，并维持同一条 focus backlink
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-auto-advance -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-auto-advance.md`
- Checklist: `CHK-21`
- Test Cases: `TC-055`

## TKT-67 Governed Closeout / Delivery Entry Bridge

- 状态: `done`
- 优先级: `P1`
- 目标: 让 final lane 的 governed closeout 不再只停在 mailbox 文案，而是显式回链到 PR delivery entry，并把 closeout note 带进 operator handoff note / evidence。
- 范围:
  - `workspace.governance.routingPolicy.suggestedHandoff` final-lane done href
  - `/mailbox` / Inbox compose closeout backlink
  - PR delivery handoff note governed closeout sync
  - PR delivery evidence governed closeout item
- 依赖: `TKT-66` `TKT-49`
- Done When:
  - final lane handoff 完成后，governed suggestion 会切到 `done` 并给出 delivery entry closeout 回链
  - `/mailbox` 与 Inbox compose 都能直接从 governed surface 打开同一条 PR delivery entry
  - PR detail 的 operator handoff note 与 evidence 会显式包含最新 governed closeout note，而不是继续只读 review / quota / notification
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-closeout -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-closeout.md`
- Checklist: `CHK-21`
- Test Cases: `TC-056`

## TKT-68 Governed Delivery Delegation Signal

- 状态: `done`
- 优先级: `P1`
- 目标: 让 final lane closeout 不只回链 PR delivery entry，还要显式派生最终 delivery delegate，并把这条委派信号写进 PR detail / related inbox truth。
- 范围:
  - `PullRequestDeliveryEntry.delegation` contract
  - final closeout -> delivery delegate topology fallback
  - PR detail `Delivery Delegation` card
  - PR-related inbox delegation signal / backlink
- 依赖: `TKT-67` `TKT-36`
- Done When:
  - final QA closeout 后，delivery entry 会显式给出 `delegate ready|blocked|done` 的 delegation truth，而不是只停在 closeout backlink
  - 委派目标会优先取 publish/closeout lane，缺省时回退到 owner/final-response lane；默认 dev-team 会回到 `PM / Spec Captain`
  - related inbox 会出现 deterministic delivery delegation signal，并回链到同一条 PR detail
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegation -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegation.md`
- Checklist: `CHK-21`
- Test Cases: `TC-057`

## TKT-69 Delegated Closeout Handoff Auto-Create

- 状态: `done`
- 优先级: `P1`
- 目标: 让 final QA closeout 后的 delivery delegate 不只停在 signal，而是自动生成一条独立的 formal closeout handoff，并从 PR detail 直接回链到这条 handoff。
- 范围:
  - delivery-closeout handoff kind
  - final closeout -> delegated handoff auto-create
  - missing delegate agent auto-materialization
  - PR detail delegation handoff status / deep link
- 依赖: `TKT-68` `TKT-35`
- Done When:
  - final QA closeout 后，系统会自动创建 `final verifier -> delivery delegate` 的 formal closeout handoff，而不是只停在 `delegate ready`
  - delegated handoff 不会把 governed route 的 done-state closeout 回链冲回 active；governance truth 与 closeout orchestration 保持解耦
  - PR detail 的 `Delivery Delegation` card 会显式显示 handoff status，并能深链到对应 Inbox / Mailbox handoff
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-handoff -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-handoff.md`
- Checklist: `CHK-21`
- Test Cases: `TC-058`

## TKT-70 Delegated Closeout Lifecycle Sync

- 状态: `done`
- 优先级: `P1`
- 目标: 让 delegated closeout handoff 的 `requested -> blocked -> completed` 生命周期，不只停留在 Mailbox ledger，而要即时回写到 PR detail delegation card 和 deterministic related inbox signal。
- 范围:
  - delegated closeout handoff lifecycle -> delivery delegation sync
  - PR detail `Delivery Delegation` blocked / completed state
  - deterministic delegation inbox signal blocker note / completed status sync
  - governance done-state isolation during delegated closeout lifecycle
- 依赖: `TKT-69` `TKT-68`
- Done When:
  - delegated closeout handoff 进入 `blocked` 后，PR detail 的 delegation card 会立即切到 `delegate blocked`，并把 blocker note 同步回 related inbox signal
  - delegated closeout handoff 重新 acknowledge 并 `completed` 后，PR detail 会切到 `delegation done` / `handoff completed`
  - 整个 delegated closeout lifecycle 不会把 governed route 的 final-lane done-state closeout 错误冲回 active
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-lifecycle -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-lifecycle.md`
- Checklist: `CHK-21`
- Test Cases: `TC-059`

## TKT-71 Delivery Delegation Automation Policy

- 状态: `done`
- 优先级: `P1`
- 目标: 把 final lane closeout 之后的 delivery delegate 自动化策略做成正式 workspace governance 配置，而不是把“永远自动起 delegated handoff”写死在代码里。
- 范围:
  - workspace governance `formal-handoff / signal-only` delivery delegation mode
  - `/settings` delivery delegation policy editor / durable truth
  - signal-only policy -> PR detail delegation signal without auto-created closeout handoff
  - Mailbox / related inbox policy-aligned closeout behavior
- 依赖: `TKT-68` `TKT-69` `TKT-70`
- Done When:
  - workspace governance 支持 `formal-handoff` 与 `signal-only` 两种 delivery delegation automation policy，并能持久化恢复
  - `signal-only` 模式下，final QA closeout 后 PR detail 仍会给出 `Delivery Delegation` card 和 related inbox signal，但不会自动创建 `delivery-closeout` handoff
  - `/settings`、PR detail 和 Mailbox 会读取同一份 policy truth，而不是出现某页改了、某页继续按旧默认运行的分裂
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-policy -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-policy.md`
- Checklist: `CHK-21`
- Test Cases: `TC-060`

## TKT-72 Delivery Delegation Auto-Complete Policy

- 状态: `done`
- 优先级: `P1`
- 目标: 把 final lane closeout 之后更重的 auto-closeout 策略做成正式 workspace governance 配置，让 delivery delegate 可以被直接自动收口，而不是只能在 `formal-handoff / signal-only` 两档之间二选一。
- 范围:
  - workspace governance `auto-complete` delivery delegation mode
  - auto-complete policy -> PR detail `delegation done` truth
  - related inbox signal auto-closeout sync
  - `/settings` durable policy readback without delegated handoff materialization
- 依赖: `TKT-68` `TKT-71`
- Done When:
  - workspace governance 支持 `auto-complete` delivery delegation automation policy，并能持久化恢复
  - `auto-complete` 模式下，final QA closeout 后 PR detail 会直接把 `Delivery Delegation` 收成 `delegation done`，而不是额外创建 `delivery-closeout` handoff
  - related inbox、PR detail 和 `/settings` 会读取同一份 auto-closeout policy truth，Mailbox 里也不会偷偷物化 delegated closeout handoff
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-auto-complete -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-auto-complete.md`
- Checklist: `CHK-21`
- Test Cases: `TC-061`

## TKT-73 Delegated Closeout Comment Sync

- 状态: `done`
- 优先级: `P1`
- 目标: 把 delegated closeout handoff 上的 formal comment 从“只留在 Mailbox card”推进成正式 delivery contract，让 source / target 的最新 closeout 沟通能同步回 PR detail 与 related inbox。
- 范围:
  - delegated closeout latest formal comment -> PR detail delegation summary
  - related inbox latest-comment sync
  - source / target dual-comment closeout coverage
  - lifecycle preservation during comment sync
- 依赖: `TKT-69` `TKT-70`
- Done When:
  - delegated closeout handoff 上的 source / target formal comment 会同步回 PR detail `Delivery Delegation` summary
  - related inbox signal 会同步带回最新 delegated closeout formal comment，而不是继续只显示旧 summary
  - comment sync 不会把 delegated handoff 的 `requested / blocked / completed` lifecycle 偷偷改坏
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-comment-sync -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-comment-sync.md`
- Checklist: `CHK-21`
- Test Cases: `TC-062`

## TKT-74 Delegated Closeout Response Handoff Orchestration

- 状态: `done`
- 优先级: `P1`
- 目标: 当 delegated closeout handoff 被 target `blocked` 时，把 unblock work 明确物化成一条回给 source 的 formal response handoff，而不是只把 blocker note 留在原 handoff 文案里。
- 范围:
  - `delivery-reply` handoff kind / parent linkage
  - blocked delegated closeout -> response handoff auto-create
  - PR detail `Delivery Delegation` response status / deep link
  - governance done-state isolation during delegated response lifecycle
- 依赖: `TKT-69` `TKT-70` `TKT-73`
- Done When:
  - delegated closeout handoff 进入 `blocked` 后，系统会自动创建 `target -> source` 的 `delivery-reply` formal handoff，并保留 parent linkage
  - PR detail 的 `Delivery Delegation` card 会显式显示 `reply requested / reply completed` 与 response deep link
  - source 完成 unblock response 后，原 delegated closeout handoff 仍保持 `blocked`，直到 target 显式重新 acknowledge，而不是被 response completion 偷偷改成 done
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-response -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-response.md`
- Checklist: `CHK-21`
- Test Cases: `TC-063`

## TKT-75 Delegated Closeout Retry Attempt Truth

- 状态: `done`
- 优先级: `P1`
- 目标: 把 delegated closeout 的第二轮及后续 retry attempt 收成正式产品真相，让人类能明确看到当前是第几轮 unblock response，而不是只能靠历史 ledger 自己数。
- 范围:
  - delegated response retry attempt counting
  - latest retry handoff deep-link rollover
  - PR detail `reply xN` visibility
  - retry-attempt summary sync back to related delivery contract
- 依赖: `TKT-74`
- Done When:
  - delegated closeout 发生第二轮及后续 `blocked -> response -> re-ack -> blocked` 时，系统会自动创建新的 `delivery-reply` handoff，而不是复用旧 response ledger
  - PR detail 的 `Delivery Delegation` card 会显式显示 `reply xN` 这类 retry attempt truth，并始终 deep-link 到最新一轮 response handoff
  - 第二轮 response 完成后，主 delegated closeout handoff 仍保持 blocked，直到 target 重新 acknowledge，retry visibility 不会偷偷篡改主 lifecycle
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-retry -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-retry.md`
- Checklist: `CHK-21`
- Test Cases: `TC-064`

## TKT-76 Delegated Response Comment Sync

- 状态: `done`
- 优先级: `P1`
- 目标: 把 `delivery-reply` response handoff 上的 formal comment 也纳入同一条 delivery contract，让 source / target 的 unblock 沟通不只留在 response ledger 局部卡片里。
- 范围:
  - response handoff latest formal comment -> PR detail delegation summary
  - related inbox latest response-comment sync
  - source / target dual-comment response coverage
  - response lifecycle preservation during comment sync
- 依赖: `TKT-74` `TKT-75`
- Done When:
  - `delivery-reply` response handoff 上的 source / target formal comment 会同步回 PR detail `Delivery Delegation` summary
  - related inbox signal 会同步带回最新 response formal comment，而不是继续停在旧 unblock summary
  - response comment sync 不会把 `reply requested` lifecycle 偷偷改坏
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-response-comment-sync -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-response-comment-sync.md`
- Checklist: `CHK-21`
- Test Cases: `TC-065`

## TKT-77 Delegated Response Resume Signal

- 状态: `done`
- 优先级: `P1`
- 目标: 把 `delivery-reply` 的 response progress 继续回推到父级 delegated closeout handoff 本身，让 target 不必只盯 PR detail，也能在 Mailbox / Inbox / run next action 里看到“source 已回复，轮到你 re-ack”的明确恢复信号。
- 范围:
  - response progress -> parent delegated handoff last-action sync
  - parent handoff inbox latest-response summary
  - run/session next-action resume guidance
  - parent blocked lifecycle preservation during response sync
- 依赖: `TKT-74` `TKT-75` `TKT-76`
- Done When:
  - `delivery-reply` response comment / completion 会直接回推父级 delegated closeout handoff 的 latest action，而不是只写在 child ledger 或 PR detail
  - 父级 handoff 自己的 inbox signal 会明确写回 blocker + latest unblock response，target 打开 Inbox 就能知道何时重新 acknowledge 主 closeout
  - run/session next action 也会切到同一条 resume guidance，同时父级 delegated closeout 继续保持 `blocked`，直到 target 显式 re-ack
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-resume -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-resume.md`
- Checklist: `CHK-21`
- Test Cases: `TC-066`

## TKT-78 Delegated Response Mailbox Visibility

- 状态: `done`
- 优先级: `P1`
- 目标: 把 delegated closeout 和 `delivery-reply` 的 parent/child orchestration 直接做进 Mailbox 壳层，不让用户必须切去 PR detail 才能看懂 reply 进度和回链。
- 范围:
  - parent delegated closeout mailbox reply-status chip
  - `reply xN` attempt visibility inside mailbox
  - child `delivery-reply` parent chip + parent deep-link
  - parent blocked lifecycle preservation after response completion
- 依赖: `TKT-74` `TKT-75` `TKT-77`
- Done When:
  - 父级 delegated closeout handoff card 会直接显示 `reply requested / reply completed` 与 `reply xN`
  - child `delivery-reply` handoff card 会显式展示 parent closeout，并支持 `Open Parent Closeout`
  - response 完成后，回到父级 closeout card 仍能看到最新 reply 状态，而主 closeout 继续保持 `blocked`
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-visibility -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-visibility.md`
- Checklist: `CHK-21`
- Test Cases: `TC-067`

## TKT-79 Delegated Response Parent Resume Action

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 的完成态继续升级成可操作 orchestration，让 blocker agent 能直接从 child ledger 把父级 delegated closeout re-ack 回来，而不是再手动回找 parent card。
- 范围:
  - child `delivery-reply` resume-parent action
  - parent closeout re-ack from child ledger
  - response chip preservation after parent resume
  - common governed-route ready-state stabilization
- 依赖: `TKT-77` `TKT-78`
- Done When:
  - child `delivery-reply` 在 completed 且 parent closeout 仍 blocked 时，会出现 `Resume Parent Closeout`
  - 点击后父级 delegated closeout 会直接切到 `acknowledged`
  - parent closeout 被重新接住后，父级 card 仍保留 `reply completed`，不会把 response evidence 冲掉
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-resume-parent -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-resume-parent.md`
- Checklist: `CHK-21`
- Test Cases: `TC-068`

## TKT-80 Delegated Response History Sync After Parent Resume

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 带来的 unblock 历史继续保留到 parent re-ack / complete 之后，让 PR detail 和 related inbox 这条 single delivery contract 不会在 parent 恢复后把 reply 轨迹吞掉。
- 范围:
  - response history preservation after parent resume
  - response history preservation after parent complete
  - PR detail delegation summary sync
  - related inbox history sync
- 依赖: `TKT-79`
- Done When:
  - parent delegated closeout 被重新 `acknowledged` 后，PR detail `Delivery Delegation` summary 仍会显示 `第 N 轮 unblock response / reply xN` 历史
  - parent delegated closeout 最终 `completed` 后，related inbox signal 仍会带着这段 response 历史一起收口
  - response history 不再只留在 Mailbox parent card，而会同步留存在统一交付合同
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -count=1'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-history-sync -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-history-sync.md`
- Checklist: `CHK-21`
- Test Cases: `TC-069`

## TKT-81 Delivery Reply Parent Status Visibility

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 从“能回跳 parent”继续升级成“能直接看见 parent 现在到底 blocked / acknowledged / completed”，避免 source agent 每次都要离开 child ledger 才知道主 closeout 有没有真的被接住。
- 范围:
  - child response parent-status chip
  - parent blocked/acknowledged/completed visibility inside child ledger
  - live mailbox + inbox mailbox surface alignment
  - headed browser walkthrough for parent status replay
- 依赖: `TKT-79` `TKT-80`
- Done When:
  - child `delivery-reply` card 会直接显示 `parent blocked / parent acknowledged / parent completed`
  - parent closeout 被重新接住或最终完成后，child card 的 parent-status chip 会一起前滚
  - source agent 不需要离开 child ledger 也能读懂主 closeout 当前所处状态
- 最新证据:
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-parent-status -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-parent-status.md`
- Checklist: `CHK-21`
- Test Cases: `TC-070`

## TKT-82 Delegated Parent Surface Context Preservation

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 带来的 unblock 历史继续保留到 parent delegated closeout 自己的 Mailbox / handoff inbox / run-session context，不让 parent re-ack / complete 一下就退回抽象通用文案。
- 范围:
  - parent mailbox card response-history preservation
  - parent handoff inbox summary preservation after resume/completion
  - run next-action + session resume context preservation
  - Windows Chrome walkthrough for parent surfaces
- 依赖: `TKT-80` `TKT-81`
- Done When:
  - parent delegated closeout 被重新 `acknowledged` 后，parent Mailbox card 会继续显示 `第 N 轮 unblock response` 历史
  - Run detail 的 `下一步` 与 session / resume context 仍会保留这段历史，而不是退回抽象 resume 文案
  - parent delegated closeout 最终 `completed` 后，这些 parent surfaces 会带着 history 一起收口
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -count=1'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-parent-context -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-parent-context.md`
- Checklist: `CHK-21`
- Test Cases: `TC-071`

## TKT-83 Delivery Reply Child Context Sync

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 从“chip 能看到 parent 进度”继续升级成“正文和 child inbox signal 也跟着 parent 前滚”，避免 source agent 看到已更新的 parent status，却还读到过期的旧说明。
- 范围:
  - child response `lastAction` sync after parent resume/completion
  - child handoff inbox summary sync after parent follow-through
  - parent-status chip + child body consistency
  - Windows Chrome walkthrough for child ledger context replay
- 依赖: `TKT-81` `TKT-82`
- Done When:
  - child `delivery-reply` 在 parent 重新 `acknowledged` 后，`lastAction` 会同步切到 parent acknowledged 的真实上下文
  - parent 最终 `completed` 后，child card 的正文与 child inbox summary 会继续前滚到 parent completed，而不是停在旧的 unblock response 文案
  - source agent 在 child ledger 内即可同时读到 parent status 与 parent follow-through 的正文真相
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestAdvanceHandoffLifecycleUpdatesOwnerAndLedger|TestDeliveryDelegationResponseRetryAttemptsSyncBackToPullRequest" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -count=1'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-child-context -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-child-context.md`
- Checklist: `CHK-21`
- Test Cases: `TC-072`

## TKT-84 Delivery Reply Parent Progress Timeline

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 的 parent follow-through 从“卡片摘要知道了”继续升级成“child ledger 时间线里也明确可回放”，并保证这些后续 lifecycle event 不会把 PR detail 里的 latest formal comment 洗掉。
- 范围:
  - child response lifecycle `parent-progress` messages after parent resume/completion
  - latest formal comment preservation across response complete + parent follow-through
  - child ledger timeline + PR detail consistency
  - Windows Chrome walkthrough for child timeline replay
- 依赖: `TKT-76` `TKT-83`
- Done When:
  - parent 重新 `acknowledged` / `completed` 后，child `delivery-reply` 的 lifecycle messages 会显式新增 `parent-progress` entry
  - source agent 深看 child ledger 历史时，能直接看到 parent follow-through 事件，而不只是一段被改写过的卡片摘要
  - PR detail `Delivery Delegation` summary 会继续保留最新 formal comment，不会因为新的 lifecycle event 被回退成“没有 comment 的版本”
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -run "TestDeliveryDelegationResponseProgressSyncsBackToParentHandoff|TestDelegatedCloseoutCommentsSyncToDeliveryContract|TestDelegatedCloseoutHandoffLifecycleReflectsInPullRequestDetail|TestDelegatedResponseCommentsReflectInPullRequestDetail" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestAdvanceHandoffLifecycleUpdatesOwnerAndLedger|TestDeliveryDelegationResponseRetryAttemptsSyncBackToPullRequest" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -count=1'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-child-timeline -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-child-timeline.md`
- Checklist: `CHK-21`
- Test Cases: `TC-073`

## TKT-85 Delegated Parent Response Timeline

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 的 formal comment / response complete 正式写进 parent delegated closeout 自己的 lifecycle messages，而不是只更新 parent `lastAction`。target 深看 parent ledger 时，必须能回放 child response 轨迹。
- 范围:
  - parent delegated closeout `response-progress` timeline messages
  - parent ledger preservation after parent resume/completion
  - live mailbox + inbox mailbox timeline label alignment
  - Windows Chrome walkthrough for parent timeline replay
- 依赖: `TKT-77` `TKT-82` `TKT-84`
- Done When:
  - child `delivery-reply` 的 formal comment 和 response complete 会在 parent delegated closeout 自己的 lifecycle messages 里显式新增 `response-progress` entry
  - parent 自己后续重新 `acknowledged` / `completed` 后，这些 child-response timeline entry 仍会保留在 parent ledger 历史里
  - target 打开 parent card 时，可以直接从 parent timeline 回放 child response 的关键节点，而不只依赖一条会被后续动作覆盖的 `lastAction`
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -run "TestDeliveryDelegationResponseProgressSyncsBackToParentHandoff|TestDelegatedCloseoutHandoffLifecycleReflectsInPullRequestDetail|TestDelegatedResponseProgressReflectsInParentMailboxAndRun|TestDelegatedResponseCommentsReflectInPullRequestDetail" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -count=1'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-parent-timeline -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-parent-timeline.md`
- Checklist: `CHK-21`
- Test Cases: `TC-074`

## TKT-86 Delegated Response Room Trace Sync

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 对 parent delegated closeout 的关键 progress，从 Mailbox / PR / Inbox 再推进到 Room 主消息流，让房间里直接可回放“child 已回复、parent 现在该怎么接”的 orchestration 叙事。
- 范围:
  - parent-synced child response progress -> room main trace writeback
  - `[Mailbox Sync]` narration for response comment / response complete
  - room-history preservation across comment + completion sync
  - Windows Chrome walkthrough for room chat replay
- 依赖: `TKT-77` `TKT-85`
- Done When:
  - child `delivery-reply` 的 formal comment 会在 Room 主消息流里追加一条 `[Mailbox Sync]` 叙事，明确 parent closeout 已收到这轮 unblock context
  - child `delivery-reply` 完成后，Room 主消息流会继续写出同步后的 completion guidance，而不只留在 Mailbox / PR / Inbox
  - Room 历史里会同时保留 comment sync 和 completion sync 两条记录，跨 Agent closeout 的关键轨迹不再只藏在局部 ledger
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -run "TestDeliveryDelegationResponseProgressSyncsBackToParentHandoff|TestDelegatedResponseProgressReflectsInParentMailboxAndRun" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestAdvanceHandoffLifecycleUpdatesOwnerAndLedger|TestDeliveryDelegationResponseRetryAttemptsSyncBackToPullRequest" -count=1'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-room-trace -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-room-trace.md`
- Checklist: `CHK-21`
- Test Cases: `TC-075`

## TKT-87 Delegated Blocked Response Room Trace

- 状态: `done`
- 优先级: `P1`
- 目标: 把 child `delivery-reply` 自己再次 `blocked` 的状态，也正式写回 Room 主消息流，让房间里可以直接看到 unblock 链本身又被卡住，而不是只在 Mailbox / PR / Inbox 留下一层隐蔽阻塞。
- 范围:
  - blocked child response -> room main trace writeback
  - `[Mailbox Sync]` narration for response blocked
  - blocked response blocker note + parent blocked guidance preservation
  - Windows Chrome walkthrough for blocked response room replay
- 依赖: `TKT-74` `TKT-86`
- Done When:
  - child `delivery-reply` 如果再次进入 `blocked`，Room 主消息流会追加一条 `[Mailbox Sync]` 阻塞叙事
  - 这条 room trace 会保留 child blocker note，并明确写出“当前也 blocked / 主 closeout 继续保持 blocked”的 parent guidance
  - 房间里不再只回放乐观的 comment / completion sync；二次阻塞同样属于正式 orchestration truth
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api -run "TestDeliveryDelegationBlockedResponseSyncsIntoParentRoomTrace|TestDelegatedBlockedResponseReflectsInParentRoomTrace" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestAdvanceHandoffLifecycleUpdatesOwnerAndLedger|TestDeliveryDelegationResponseRetryAttemptsSyncBackToPullRequest" -count=1'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-room-trace-blocked -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-room-trace-blocked.md`
- Checklist: `CHK-21`
- Test Cases: `TC-076`

## TKT-88 Shell Profile Hub Entry

- 状态: `done`
- 优先级: `P1`
- 目标: 把当前 `Human / Machine / Agent` 收成 app.slock.ai 式壳层 footer profile hub，不再要求用户绕到右栏 summary 或独立列表页找 profile 入口。
- 范围:
  - sidebar footer `Profile Hub`
  - current human / paired machine / preferred agent selection
  - unified profile drill-in from shell footer
  - Windows Chrome walkthrough + room-context regression
- 依赖: `TKT-25`
- Done When:
  - sidebar footer 会常驻显示当前 `Human / Machine / Agent` 三个 profile entry
  - 三个 entry 都会进入统一 profile surface，而不是跳到分裂详情页
  - room context drill-in 不回退，shell / room 会共享同一份 live profile truth
- 最新证据:
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-profile-surface -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-shell-profile-hub.md`
- Checklist: `CHK-16`
- Test Cases: `TC-077`

## TKT-89 PR Detail Delivery Collaboration Thread

- 状态: `done`
- 优先级: `P1`
- 目标: 把 parent `delivery-closeout` 与 child `delivery-reply` 的 formal request / blocker / comment / progress 收成同一条 PR detail timeline，不再只剩一段不断被覆盖的 delegation summary。
- 范围:
  - `PullRequestDeliveryDelegation.communication` contract
  - parent / child mailbox message aggregation
  - PR detail `Delivery Collaboration Thread` 面板
  - chronological ordering with precise mailbox event timestamps
  - Windows Chrome walkthrough + report
- 依赖: `TKT-76` `TKT-80` `TKT-85`
- Done When:
  - PR detail 会新增 `Delivery Collaboration Thread`
  - parent closeout 与 child reply 的 formal request / blocker / comment / progress 会按真实时间顺序同屏显示
  - 每条 thread entry 都能 deep-link 回对应 Mailbox handoff，而不是只停在 PR summary
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestDeliveryDelegationCommunicationThreadAggregatesParentAndReplyMessages" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/api -run "TestDeliveryDelegationCommunicationThreadRoute" -count=1'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-communication-thread -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-communication-thread.md`
- Checklist: `CHK-21`
- Test Cases: `TC-078`

## TKT-90 PR Detail Delivery Thread Actions

- 状态: `done`
- 优先级: `P1`
- 目标: 把 PR detail 里的 `Delivery Collaboration Thread` 从只读回放推进成正式 action surface，让当前 delegated closeout / `delivery-reply` 能直接在 PR 页执行。
- 范围:
  - PR detail `Thread Actions` 面板
  - current parent / child mailbox handoff lookup
  - inline `acknowledged / blocked / comment / completed` mutation
  - child reply complete 后的 `Resume Parent Closeout`
  - Windows Chrome walkthrough + report
- 依赖: `TKT-79` `TKT-89`
- Done When:
  - PR detail 会直接显示当前 active parent / child handoff action card，而不必先跳去 Mailbox
  - parent closeout 与 child reply 都能在 PR detail 内直接做 formal ack / block / comment / complete
  - child response 完成后，用户能同页 `Resume Parent Closeout`，并看到 parent status 刷新到最新 mailbox truth
- 最新证据:
  - `pnpm --dir apps/web typecheck`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/pull-request-detail-view.tsx'`
  - `pnpm verify:web`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-delegate-thread-actions -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-delegate-thread-actions.md`
- Checklist: `CHK-21`
- Test Cases: `TC-079`

## TKT-91 Mailbox Batch Queue

- 状态: `done`
- 优先级: `P1`
- 目标: 把 `/mailbox` 从单卡逐条操作推进到当前 room ledger 的多选批量处理面，让 open handoff 能用同一条 batch queue 顺序完成 `acknowledged / comment / completed`。
- 范围:
  - `/mailbox` live ledger 的 multi-select state
  - batch selected chips / note / actor mode surface
  - sequential `updateHandoff` bulk replay
  - selection auto-clear after closeout
  - Windows Chrome walkthrough + report
- 依赖: `TKT-63` `TKT-64` `TKT-90`
- Done When:
  - `/mailbox` 会出现 `Batch Queue`，并能围当前可见 open handoff 做多选
  - batch `acknowledged / comment / completed` 会顺序落到每条 selected handoff，而不是只做前端假状态
  - handoff complete 后 selection 会自动清空，closeout note 与 inbox summary 会跟随正式 ledger 前滚
- 最新证据:
  - `pnpm --dir apps/web typecheck`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/live-mailbox-views.tsx src/components/stitch-board-inbox-views.tsx'`
  - `node --check scripts/headed-mailbox-batch-actions.mjs`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-mailbox-batch-actions -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-mailbox-batch-queue.md`
- Checklist: `CHK-21`
- Test Cases: `TC-080`

## TKT-92 Governance Escalation Queue

- 状态: `done`
- 优先级: `P1`
- 目标: 把 workspace governance 的 escalation 从抽象 SLA summary 推进成正式 queue truth，让 active handoff 与 blocked inbox signal 能以同一条队列 entry 出现在 `/mailbox` 与 `/agents`。
- 范围:
  - `workspace.governance.escalationSla.queue` contract
  - handoff / blocked inbox -> queue entry 派生
  - `/mailbox` governance escalation queue panel
  - `/agents` orchestration governance queue mirror
  - Windows Chrome walkthrough + report
- 依赖: `TKT-61` `TKT-63` `TKT-64` `TKT-91`
- Done When:
  - governance escalation 不再只显示 aggregate counter，而是有正式 queue entry truth
  - active handoff 与 blocked inbox signal 都会以 `label / source / owner / next-step / deep-link` 出现在队列里
  - `/mailbox` 与 `/agents` 会镜像同一份 escalation queue，handoff closeout 后队列自动清空
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestMailboxLifecycleHydratesWorkspaceGovernance" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/api -run "TestStateRouteExposesGovernanceSnapshot|TestMailboxLifecycleUpdatesGovernanceSnapshot" -count=1'`
  - `pnpm --dir apps/web typecheck`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/live-mailbox-views.tsx src/components/live-orchestration-views.tsx src/lib/phase-zero-helpers.ts src/lib/live-phase0.ts src/lib/phase-zero-types.ts'`
  - `node --check scripts/headed-governance-escalation-queue.mjs`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governance-escalation-queue -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governance-escalation-queue.md`
- Checklist: `CHK-21`
- Test Cases: `TC-081`

## TKT-93 Governance Escalation Room Rollup

- 状态: `done`
- 优先级: `P1`
- 目标: 把 governance escalation 从“当前焦点 queue”继续前滚到“整个 workspace 的 room-level rollup”，让人类一眼看见哪些 room blocked、哪些 room 仍 active。
- 范围:
  - `workspace.governance.escalationSla.rollup` contract
  - mailbox / inbox blocker -> room-level aggregation
  - `/mailbox` cross-room escalation rollup panel
  - `/agents` orchestration rollup mirror
  - Windows Chrome walkthrough + report
- 依赖: `TKT-92`
- Done When:
  - governance escalation 除了当前焦点 queue，还会给出整个 workspace 的 hot-room rollup
  - blocked room 与 active room 会同时出现在 rollup，并带出 `room / status / count / latest escalation / deep-link`
  - `/mailbox` 与 `/agents` 会镜像同一份 rollup truth；room closeout 后 rollup 自动回退到 baseline
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestMailboxLifecycleHydratesWorkspaceGovernance" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/api -run "TestStateRouteExposesGovernanceSnapshot|TestMailboxLifecycleUpdatesGovernanceSnapshot" -count=1'`
  - `pnpm verify:web`
  - `node --check scripts/headed-governance-escalation-rollup.mjs`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governance-escalation-rollup -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governance-escalation-rollup.md`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governance-escalation-queue -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governance-escalation-queue.md`
- Checklist: `CHK-21`
- Test Cases: `TC-082`

## TKT-94 Mailbox Governed Batch Policy

- 状态: `done`
- 优先级: `P1`
- 目标: 把 `/mailbox` 的 batch queue 从“能批量 closeout”推进到“能按治理 policy 批量续下一棒”，让 pure governed selection 直接做 bulk `Complete + Auto-Advance`。
- 范围:
  - create handoff `kind=governed` contract
  - `/mailbox` `Governed Batch Policy` 面板
  - bulk `completed + continueGovernedRoute` orchestration
  - Windows Chrome walkthrough + batch queue regression
- 依赖: `TKT-64` `TKT-91`
- Done When:
  - `Create Governed Handoff` 会把 `kind=governed` 写进正式 mailbox contract，而不是落成 manual handoff
  - pure governed selection 会显示正式 policy 状态，并在可 complete 时开放 `Batch Complete + Auto-Advance`
  - bulk closeout 后只会物化一条 next-lane followup handoff，selection 自动清空，routing policy 聚焦到 followup
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/api -run "TestMailboxRoutesCreateAndListLiveTruth|TestMailboxRoutesAdvanceLifecycleAndGuardrails" -count=1'`
  - `pnpm verify:web`
  - `node --check scripts/headed-mailbox-batch-policy.mjs`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-mailbox-batch-policy -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-mailbox-batch-policy.md`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-mailbox-batch-actions -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-mailbox-batch-queue.md`
- Checklist: `CHK-21`
- Test Cases: `TC-083`

## TKT-95 Cross-Room Governance Orchestration

- 状态: `done`
- 优先级: `P1`
- 目标: 把 cross-room governance 从“能看见哪些 room 在冒烟”推进到“能直接从 hot room 上发起下一棒 governed handoff”，让 `/mailbox` rollup 成为真正可执行的跨 room 治理面。
- 范围:
  - `workspace.governance.escalationSla.rollup` room-level route metadata
  - `POST /v1/mailbox/governed`
  - `/mailbox` cross-room rollup `Create Governed Handoff`
  - `/agents` orchestration rollup route mirror
  - Windows Chrome walkthrough + report
- 依赖: `TKT-93` `TKT-94`
- Done When:
  - cross-room rollup 不只显示 `room / status / count / latest escalation`，还会给出 `current owner / current lane / next governed route`
  - `/mailbox` 能对 `nextRouteStatus=ready` 的 room 直接发起 room-level governed handoff，而不是逼用户先切回当前 room compose
  - create 后 `/mailbox` 与 `/agents` 都会把 room-level route 从 `ready` 前滚到 `active`，并 deep-link 到新 handoff
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestCreateGovernedHandoffForRoomUsesRoomSpecificSuggestion|TestAdvanceHandoffCanAutoAdvanceGovernedRoute|TestMailboxLifecycleHydratesWorkspaceGovernance" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/api -run "TestMailboxRoutesCreateGovernedHandoffForRoom|TestMailboxRoutesCreateAndListLiveTruth|TestStateRouteExposesGovernanceSnapshot|TestMailboxLifecycleUpdatesGovernanceSnapshot" -count=1'`
  - `pnpm verify:web`
  - `node --check scripts/headed-cross-room-governance-orchestration.mjs`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-cross-room-governance-orchestration -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-cross-room-governance-orchestration.md`
- Checklist: `CHK-21`
- Test Cases: `TC-084`

## TKT-96 Memory Provider Orchestration

- 状态: `done`
- 优先级: `P1`
- 目标: 把 memory provider 从 PRD 概念推进成正式产品真相，让 `workspace-file / search-sidecar / external-persistent` 的 binding、scope、retention 和 degraded fallback 能被同页编辑并进入 next-run preview。
- 范围:
  - `memory-center.json` provider binding durable state
  - `GET/POST /v1/memory-center/providers`
  - `/memory` provider orchestration editor
  - next-run preview / prompt summary provider projection
  - Windows Chrome walkthrough + report
- 依赖: `TKT-12` `TKT-37` `TKT-42` `TKT-43`
- Done When:
  - `/memory` 能读写 `workspace-file / search-sidecar / external-persistent` provider binding truth，而不是只在文档里提及 provider
  - next-run preview 不只显示 mounted files / tools，还要显式显示 active providers、scope、retention 和 degraded fallback
  - provider enabled/status 在 reload 后保持一致，并有 store / API tests + Windows Chrome evidence
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestMemoryCenterBuildsInjectionPreviewAndPromotionLifecycle|TestMemoryCleanupPrunesStaleQueueAndKeepsPromotionPathLive|TestMemoryProviderBindingsPersistAndAnnotatePromptSummary" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/api -run "TestMemoryCenterRoutesExposePolicyPreviewAndPromotionLifecycle|TestMemoryCenterCleanupRoutePrunesQueueAndKeepsPromotionFlowLive|TestMemoryCenterProviderRoutesExposeDurableProviderBindings|TestMutationRoutesRequireActiveAuthSession|TestMemberRoleGuardsAllowReviewAndExecutionButDenyAdminAndMergeMutations|TestViewerRoleCannotMutateProtectedSurfaces" -count=1'`
  - `pnpm verify:web`
  - `node --check scripts/headed-memory-provider-orchestration.mjs`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-memory-provider-orchestration -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-memory-provider-orchestration.md`
- Checklist: `CHK-10` `CHK-22`
- Test Cases: `TC-085`

## TKT-97 Memory Provider Health Recovery

- 状态: `done`
- 优先级: `P1`
- 目标: 把 memory provider 从“静态 binding”推进成有真实 health / recovery 生命周期的产品面，让 `workspace-file / search-sidecar / external-persistent` 都能显式检查、恢复、记账并持久化。
- 范围:
  - provider health observation / next-action truth
  - `POST /v1/memory-center/providers/check`
  - `POST /v1/memory-center/providers/:id/recover`
  - `/memory` provider health summary、failure count、activity timeline、manual recovery actions
  - Windows Chrome walkthrough + report
- 依赖: `TKT-96`
- Done When:
  - provider 不再在缺少 index / adapter stub / workspace scaffold 时假装健康
  - `/memory` 能逐 provider 执行 health check 和 recovery，并把结果写回 durable `memory-center.json`
  - next-run preview / prompt summary 会显示恢复后的 provider health truth
  - store / API tests、`verify:web`、script syntax 和 Windows Chrome evidence 全部通过
- 最新证据:
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store -run "TestMemoryProviderBindingsPersistAndAnnotatePromptSummary|TestMemoryProviderHealthCheckAndRecoveryLifecycle" -count=1'`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/api -run "TestMemoryCenterProviderRoutesExposeDurableProviderBindings|TestMemoryCenterProviderHealthRoutesRecoverDurableBindings|TestMutationRoutesRequireActiveAuthSession|TestMemberRoleGuardsAllowReviewAndExecutionButDenyAdminAndMergeMutations|TestViewerRoleCannotMutateProtectedSurfaces" -count=1'`
  - `pnpm verify:web`
  - `node --check scripts/headed-memory-provider-health-recovery.mjs`
  - `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-memory-provider-health-recovery -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-memory-provider-health-recovery.md`
- Checklist: `CHK-10` `CHK-22`
- Test Cases: `TC-086`

## TKT-98 Persistent Session Workspace Envelope

- 状态: `done`
- 优先级: `P0`
- 目标: 把 daemon 执行从“只跑一次命令”推进到“每个 session 都有可复用的本地工作区锚点”，让 turn continuity、文件级记忆与恢复链开始落到真实文件上。
- 范围:
  - daemon runtime session workspace root
  - `MEMORY.md / SESSION.json / CURRENT_TURN.md / notes/work-log.md`
  - `OPENSHOCK_AGENT_SESSION_ROOT` override
  - runtime/service 单测
  - daemon exec route 回归
- 依赖: `TKT-13` `TKT-14`
- Done When:
  - 同一 `sessionId` 的多轮执行会复用同一个 daemon-managed 目录
  - 每轮执行都会刷新 `CURRENT_TURN.md`
  - `notes/work-log.md` 会累积多轮 turn 记录，而不是只保留最后一轮
  - `SESSION.json` 会固定暴露 `sessionId / runId / roomId / provider / cwd / appServerThreadId`
  - daemon `/v1/exec` 路由回归能证明这层 envelope 真实落盘
- 最新证据:
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test ./internal/runtime -run "TestRunPromptPersistsSessionWorkspaceEnvelope|TestStreamPromptRefreshesCurrentTurnAndAccumulatesWorkLog|TestRunPromptSessionWorkspaceRootRespectsEnvOverride" -count=1'`
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test ./internal/api -run "TestExecRoutePersistsSessionWorkspaceEnvelope|TestExecConflictGuardRejectsSameCwdAndAllowsDifferentCwd|TestExecConflictGuardAllowsReentrantReuseForSameLease" -count=1'`
- Checklist: `CHK-10` `CHK-14`
- Test Cases: `TC-093`

## TKT-99 Local-First Provider Thread Continuity

- 状态: `done`
- 优先级: `P0`
- 目标: 把 Codex resume continuity 做成 daemon 自己的本地真相，让 `resume --last` 只围当前 session 的本地 home 运作，而不是共享全局 CLI 状态。
- 范围:
  - session-scoped `OPENSHOCK_CODEX_HOME`
  - `SESSION.json.codexHome`
  - daemon restart 后的 local resume continuity
  - runtime / API 回归
- 依赖: `TKT-98`
- Done When:
  - 同一 `sessionId` 的 Codex 执行会稳定使用同一个 session-scoped `OPENSHOCK_CODEX_HOME`
  - daemon restart 后再 resume，仍会落回同一个 local home，而不是继续吃全局 `--last`
  - `SESSION.json` 会显式暴露 `codexHome`
- 最新证据:
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test ./internal/runtime -run "TestRunPromptUsesSessionScopedCodexHome|TestResumeSessionReusesSessionScopedCodexHomeAcrossRestart" -count=1'`
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test ./internal/api -run "TestExecRouteUsesSessionScopedCodexHome" -count=1'`
- Checklist: `CHK-10` `CHK-14` `CHK-15`
- Test Cases: `TC-094`

## TKT-100 Daemon Real-Process Continuity Harness

- 状态: `done`
- 优先级: `P1`
- 目标: 把多智能体协同、session continuity 与恢复链做成可重复的 daemon system harness，避免关键行为只靠零散 store/api 单测守着。
- 范围:
  - built daemon binary + real daemon subprocess
  - httptest control plane + fake Codex CLI
  - two-turn same-session reuse across daemon restart
  - `CURRENT_TURN.md` refresh、`notes/work-log.md` 累积与 `SESSION.json` continuity assertions
  - provider thread continuity reinjection proof
- 依赖: `TKT-98` `TKT-99` `TKT-102`
- Done When:
  - real daemon process 能稳定重放同一 session 的连续两轮 turn
  - daemon restart 后，同一 session 的 `codex-home`、`CURRENT_TURN.md`、`notes/work-log.md` 与 `appServerThreadId` continuity 都能在 system 级测试里被证明
  - heartbeat、exec bridge 与恢复链在同一 harness 里一起成立，后续恢复票默认接这套 harness
- 最新证据:
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test -tags=integration ./internal/integration -run TestDaemonContinuityHarnessAcrossRestart -count=1'`
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test -tags=integration ./internal/integration -count=1'`
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test ./... -count=1'`
- Checklist: `CHK-14` `CHK-15`
- Test Cases: `TC-095`

## TKT-101 Phase 0 Shell Subtractive Flow Sweep

- 状态: `active`
- 优先级: `P1`
- 目标: 持续把 chat-first 壳做减法，让常见路径更短、更顺，而不是靠堆更多 summary、tab、sheet 和提示文案解决复杂度。
- 范围:
  - room / inbox / run / governance surface 重复信息清理
  - 二级 sheet / action strip / helper copy 减法
  - message flow / follow-up action / hot path micro-friction 收敛
  - `open-shock-shell.tsx` chrome 层级减法
  - `stitch-chat-room-views.tsx` room 顶部重复 strip 与默认右栏信息量收敛
  - `run-control-surface.tsx` 默认动作块减法
  - `live-detail-views.tsx` topic/run 概览重复块压缩
  - 浏览器级 walkthrough 与对照截图
- 依赖: `TKT-16` `TKT-23` `TKT-88`
- Done When:
  - 房间主面、Inbox 和 run/governance 次级面不再重复展示同一条 owner/status/action truth
  - 首屏默认动作比当前更短，不靠阅读长解释才能继续推进
  - headed walkthrough 能证明主要路径点击次数和视觉干扰都下降
- 当前已收第一刀:
  - shared `RunControlSurface` 已压掉长解释段，改成状态摘要 + 权限信号，避免 room / topic / run 三处重复讲同一套控制说明
  - `/topics/:topicId` 已删除重复的 `topic-resume-context` 卡，避免同页继续入口、run snapshot 与 continuity truth 三次重复
  - headed verification scripts 已对齐当前控制真值，不再把“空草稿发送按钮可点击”当成错误前提
- 当前已收第二刀:
  - room `context` tab 已压成“当前焦点 + 待处理”，不再把 run / PR / 记忆 / timeline / guard / mailbox truth 在同一页重复铺开
  - `RoomWorkbenchRailSummary` 已把 `overview / delivery / system` 的重复双卡压回单卡表达，同时保住 `room-workbench-open-inbox`、`room-workbench-open-mailbox`、`room-workbench-pr-detail-link`、`room-workbench-run-status` 等稳定锚点
  - 房间右栏已补回 `room-workbench-machine-profile` 与 `room-workbench-active-agent-*`，保证减法后 agent / machine profile 仍能从房间工作面直接深链
- 当前已收第三刀:
  - `/mailbox` 的 cross-room governance rollup 已把 owner / current-lane / next-route 的解释收回 `GovernanceEscalationGraph` 主视图，rollup 列表卡只保留 room 热点、route 状态与动作入口
  - `mailbox-governance-escalation-rollup-*`、`mailbox-governance-escalation-graph-*` 与 `route-create` 锚点保持不变；减法后仍能继续 `ready -> active -> done` 的治理前滚
  - headed cross-room regression 已新增“rollup 卡不再重复 current-owner / next-route copy”断言，避免后续又把 graph 与列表卡的真相重新写两遍
- 当前已收第四刀:
  - `/inbox` 的 governed compose 已改成“自动建议优先、手动改写次级展开”；在 route 已可用时，首屏不再同时摊开自由表单与治理建议两套 source / target / title / summary truth
  - `mailbox-compose-governed-route*` 热路径保持不变，approval-center 的 `approval-center-action-*` 与 handoff ledger 的 `mailbox-card/status/action*` 也未受影响
  - headed governed-route regression 已新增“manual compose 默认收起，但可手动展开”断言，避免后续又把 inbox 首屏堆回长表单
- 当前已收第五刀:
  - `/agents` 的 cross-room governance rollup 已把 `current owner / current lane / next-route` 解释收回 `GovernanceEscalationGraph` 主视图，rollup 列表卡只保留 room 热点、双状态与 deep-link 动作入口
  - `orchestration-governance-escalation-rollup-*`、`orchestration-governance-escalation-graph-*`、`orchestration-governance-summary`、`orchestration-governance-human-override` 与 `orchestration-governance-response-aggregation` 锚点保持不变；减法后仍能继续读取同一份治理镜像真相
  - headed cross-room regression 已把 orchestration mirror 也锁进“rollup 卡不再重复 current-owner / next-route copy”断言，避免后续又把 graph 与列表卡的真相重新写两遍
- 当前已收第六刀:
  - `/agents` 的 `responseAggregation` 已删掉重复的 `决策路径 / 接管记录` 尾巴；回复聚合卡只保留 final response、summary、sources 与 audit trail，不再把已由 walkthrough / human override 主面持有的说明再写一遍
  - `/agents` 右栏独立 `协作规则` 卡组已删除；`handoffRules` 不再作为第二块 standalone 面板重复渲染，formal handoff / review / test / blocked / human override 的治理真相继续由 walkthrough、escalation queue、human override 与 response aggregation 主面持有
  - `orchestration-governance-human-override`、`orchestration-governance-response-aggregation`、`orchestration-governance-step-*` 与 orchestration planner queue 锚点保持不变；减法后 `/agents` 仍围同一份治理镜像前滚
  - headed planner replay 已新增“`responseAggregation` 不再重复 `决策路径 / 接管记录` 文案，且 routing rules 已存在时不再渲染第二块 standalone `协作规则` 面板”断言，避免后续又把说明尾巴和辅助规则卡组堆回治理镜像
- 当前已收第七刀:
  - `/agents` 的 walkthrough 卡组已删掉逐步 helper/detail copy，只保留步骤标题、当前摘要和状态，不再把 `Mailbox ledger` / `review verdict` / `final-response aggregation` 这类说明层再重复一遍
  - `orchestration-governance-step-*` 锚点保持不变；planner replay 仍能围 `issue / handoff` 当前摘要前滚，不需要额外 helper 文案才能理解当前治理状态
  - headed planner replay 已新增“walkthrough 不再渲染 handoff / review helper copy”断言，避免后续又把第二层说明堆回关键流程卡
- 当前已收第八刀:
  - `/agents` 的人工接管卡已删掉泛化 `打开接管链路` 动作；blocked 状态继续由 escalation queue 和 Inbox 持有主导航，不再在右栏再堆一层重复入口
  - `orchestration-governance-human-override` 锚点保持不变；planner replay 仍能围 `关注 / 需要处理` 状态前滚，不需要额外 open-link 才能表达当前治理状态
  - headed planner replay 已新增“human-override 不再渲染重复 open-link”断言，避免后续又把第二层人工接管入口堆回右栏
- 当前已收第九刀:
  - `/mailbox` 与 `/agents` 的 cross-room governance rollup 已删掉重复 `latestSummary` 和次级 `查看该讨论` 链接；列表卡继续只保留 room 热点、双状态与主推进动作，room 上下文与导航统一回到 `GovernanceEscalationGraph`
  - `mailbox-governance-escalation-rollup-room-*`、`orchestration-governance-escalation-rollup-room-*`、`...route-status-*`、`...graph-*` 与 `打开下一步` / `创建自动交接` 热路径保持不变；减法后 mailbox / agents 仍围同一份 cross-room governance truth 前滚
  - headed cross-room orchestration 已新增“rollup 卡不再重复 latest-summary，也不再渲染次级 room-link”断言，避免后续又把 graph 已持有的 room context / navigation 再堆回列表卡
- 当前已收第十刀:
  - `/agents` 的升级时限卡已删掉 `下一次升级` helper copy；升级节奏继续由 SLA 摘要和下方 escalation queue 持有，不再在卡头再写一层重复时间提示
  - `orchestration-governance-escalation-entry-*`、`orchestration-governance-escalation-status-*`、`协作规则和通知一页看清`、`升级时限`、`通知策略` 与 escalation queue 主体锚点保持不变；减法后 `/agents` 仍围同一份治理镜像前滚
  - headed escalation queue 已新增“升级时限卡不再渲染 `下一次升级：` helper copy”断言，避免后续又把 queue 已持有的升级真相重新堆回卡头
- 当前已收第十一刀:
  - `/inbox` 的 approval-center 桌面信号卡已删掉右侧重复 `打开详情` 链接；在 `Room / Run / PR / PR Detail` 已经提供主导航时，不再额外堆同一张卡的次级 deep-link
  - `approval-center-room-link-*`、`approval-center-run-link-*`、`approval-center-pr-link-*`、`approval-center-pr-detail-link-*`、`approval-center-action-*` 与移动端 `approval-center-open-context-mobile-*` 热路径保持不变；减法后桌面 triage 仍围同一份 signal truth 前滚
  - headed approval-center lifecycle 已新增“桌面 signal 不再渲染重复 `打开详情` 次级入口”断言，避免后续又把已由 Room/Run/PR 链接持有的导航重复堆回右栏
- 当前已收第十二刀:
  - `/mailbox` 的人工确认卡已删掉泛化 `打开处理入口` 动作；blocked / required 状态继续由 escalation queue、Inbox 和 handoff ledger 持有主导航，不再在右栏再堆一层重复入口
  - `mailbox-governance-human-override`、`mailbox-governance-escalation-queue`、`mailbox-card-*` 与 handoff action 热路径保持不变；减法后 `/mailbox` 仍围同一份治理镜像前滚
  - headed multi-agent governance 已新增“mailbox human-override 不再渲染重复 open-link”断言，避免后续又把第二层人工确认入口堆回右栏
- 当前已收第十三刀:
  - `/mailbox` 的 governance escalation queue 单卡已删掉重复 `nextStep` 和泛化 `打开详情` 入口；active / blocked entry 现在只保留 label、chips、status 与 summary，不再把 handoff ledger、Inbox 已持有的下一步说明和导航再堆一层
  - `mailbox-governance-escalation-entry-*`、`mailbox-governance-escalation-status-*`、`mailbox-governance-escalation-chip-*` 与 escalation queue 主体锚点保持不变；减法后 `/mailbox` 仍能围同一份治理镜像继续 `requested -> blocked -> cleared` 前滚
  - headed escalation queue 已新增“mailbox escalation entry 不再渲染 standalone next-step helper copy，也不再渲染 generic `打开详情` CTA”断言，避免后续又把 queue、Inbox 与 handoff ledger 已持有的导航/动作真相重新堆回列表卡
- 当前已收第十四刀:
  - room PR sheet 已把重复 inbox / mailbox 导航统一做减法：卡头那组 `收件箱 / 交接箱` 快捷入口已删掉，signal 卡内逐条重复的 `收件箱详情 / 回到讨论间` 二级按钮也已一并收掉；PR sheet 只保留 `房间 PR / PR 详情` 主导航，room-level inbox / mailbox 入口继续由 context / 待处理主面持有
  - `room-workbench-pr-panel`、`room-workbench-pr-primary-action`、`room-workbench-pr-detail-link` 与 `room-workbench-signal-*` 锚点保持不变；减法后 PR sheet 仍保留 review / merge 主动作、PR 主导航和 signal 摘要
  - headed room workbench regression 已新增“PR sheet 不再渲染 duplicate inbox / mailbox CTA，也不再渲染 per-signal inbox-detail / return-to-room CTA”断言，避免后续又把同一条 room/inbox/navigation truth 重新堆回 PR sheet
- 当前已收第十五刀:
  - room PR panel 已继续只保留 PR 专属导航；泛化的 `收件箱评审` 与 `话题上下文` CTA 已删掉，Inbox 入口继续由 shell / room context 持有，context tab 切换继续由 room workbench 顶部 tabs 持有
  - `room-workbench-pr-panel`、`room-workbench-pr-primary-action`、`room-pr-detail-link` 与 PR review summary 锚点保持不变；减法后 PR panel 仍可直接完成 review / merge、打开 PR detail 和远端 PR
  - headed room workbench regression 已新增“PR panel 不再渲染 generic inbox-review / context-tab CTA”断言，避免后续又把 shell / tabs 已持有的导航重新堆回 PR panel
- 当前已收第十六刀:
  - room delivery rail 在用户已位于 PR tab 时，不再渲染自引用 `房间 PR` CTA；该入口只在其他 tab 里作为跳转保留，避免在同一屏里出现“自己跳自己”的无效导航
  - `room-rail-pr-panel`、`room-workbench-pr-panel`、`room-workbench-pr-primary-action` 与 `room-workbench-pr-detail-link` 锚点保持不变；减法后 PR tab 里仍保留 PR detail / remote PR 等真正专属导航
  - headed room workbench regression 已新增“PR tab 下的 delivery rail 不再渲染 self-referential room-pr CTA”断言，避免后续又把自引用导航堆回同一屏
- 当前已收第十七刀:
  - Inbox / Mailbox 合并面里的 focused handoff card 在已经带 `当前查看` 时，不再继续渲染自引用 `打开收件箱` CTA；focus link 只在非当前卡上保留，用来跳到对应 handoff
  - `mailbox-card-*`、`mailbox-focus-link-*`、`mailbox-room-link-*`、`mailbox-parent-link-*` 与 `mailbox-response-link-*` 锚点保持不变；减法后 focused card 仍保留讨论 / 运行 / 事项 / 主交接 / 回复这些真正非自引用导航
  - headed governed mailbox visibility regression 已新增“focused mailbox card 不再渲染 self-referential open-inbox CTA”断言，避免后续又把同一页内的 focus 自跳转堆回当前卡
- 当前已收第十八刀:
  - `/inbox` approval center 的 recent ledger 现在只保留历史状态摘要；移动端和桌面端 recent card 上泛化的 `打开上下文` CTA 已删除，避免把已完成/最近事项继续伪装成待处理动作
  - `approval-center-recent-*`、`approval-center-mobile-recent-*`、`approval-center-recent-count` 与所有 open signal 的 `Room / Run / PR / PR Detail` 主导航保持不变；减法后 active triage 仍有导航，recent ledger 只做回看
  - headed approval center lifecycle 已新增“recent ledger 不再渲染 generic open-context CTA”断言，避免后续又把信息历史区堆成第二个 action queue
- 当前已收第十九刀:
  - `/inbox` approval center 的 active signal 在移动端不再保留泛化 `打开详情` CTA；卡片继续保留批准 / 解除阻塞 / 评审这些主动作，辅助导航则统一收回 `更多信息` 折叠里的 `Room / Run / PR / PR Detail`
  - `approval-center-mobile-details-*`、`mobile-approval-center-room-link-*`、`mobile-approval-center-run-link-*`、`mobile-approval-center-pr-link-*` 与 `mobile-approval-center-pr-detail-link-*` 锚点保持不变；减法后移动端 triage 不再额外堆一层 generic jump，而是只暴露真实目的地
  - headed approval center lifecycle 现已补上移动端断言，明确禁止 active signal 再把 `打开详情` 这种泛化 CTA 堆回 cards，同时验证 mobile details drawer 里的 room/run/pr 真导航仍然可用
- 当前已收第二十刀:
  - `/rooms/:roomId?tab=pr` 的 `RoomRelatedSignalsPanel` 不再继续渲染泛化 `打开收件箱` CTA；PR 面板尾部这块现在只保留和当前 PR 直接相关的信号摘要，不再把 room context 已持有的 inbox 入口又堆回信息区
  - `room-workbench-signal-*` 锚点保持不变；减法后 room context 面板里的 `打开收件箱 / 打开交接箱` 仍是正式主入口，PR 面板只做信号回看，不再伪装成第二套导航
  - headed room workbench topic context 已新增“PR panel signal summary 不再保留 generic open-inbox CTA”断言，避免后续又把已被 context 面板持有的 inbox 入口重新堆回 PR 面板尾部
- 当前已收第二十一刀:
  - `/mailbox` focused handoff detail card 不再保留泛化 `打开收件箱` CTA；卡片继续保留 `room / parent / response` 这些具体 lineage 导航与正式推进动作，不再额外堆一层抽象 jump
  - `mailbox-room-link-*`、`mailbox-parent-link-*`、`mailbox-response-link-*` 与各类 `mailbox-action-*` 锚点保持不变；减法后 focused mailbox card 只暴露具体目的地，而不是再把 inbox 当成通用中转层
  - headed agent mailbox handoff 已新增“focused mailbox handoff card 不再渲染 generic open-inbox CTA”断言，并继续验证 handoff 完成后 `/inbox?handoffId=...` 里的 mailbox ledger truth 仍可见
- 当前已收第二十二刀:
  - `/rooms/:roomId?tab=context` 的 pending panel 不再保留泛化 `打开交接箱` CTA；当当前房间没有待跟进交接时，这块只明确显示“当前没有待跟进交接”，不再把 mailbox 当抽象兜底跳转
  - `room-workbench-open-inbox` 与 `room-workbench-handoff-*` 锚点保持不变；减法后 inbox 仍是 room 里的主 triage 入口，而 handoff 恢复继续由具体 card 深链持有，不再额外堆一层 generic mailbox jump
  - headed room workbench topic context 已新增“context panel 不再渲染 generic open-mailbox CTA”断言，并显式验证当前 fixture 会把“没有待跟进交接”写回 panel，避免后续又把空态信息区重新堆成导航区
- 当前已收第二十三刀:
  - `/rooms/:roomId?tab=context` 的 pending panel 不再在桌面端继续渲染泛化 `打开收件箱` CTA；桌面 inbox 主入口回到 shell sidebar，避免 room 信息区和全局壳同时重复暴露同一条导航
  - `room-workbench-open-inbox` 仍保留为移动端逃生路径，因为 `StitchSidebar` 在 `md` 以下隐藏；`sidebar-inbox-link` 成为桌面 headed regression 的正式 inbox 跳转锚点
  - headed room workbench topic context 已同时新增“桌面端 visible `room-workbench-open-inbox` 数量为 0，并通过 `sidebar-inbox-link` 打开 Inbox”、“`768px` 断点处 local CTA 已退出且 sidebar inbox link 已接管”以及“移动端必须显示 `room-workbench-open-inbox`，且 sidebar inbox link 不可见、点击后仍能回到同一条 room context state”的断言，避免后续把桌面重复 CTA 堆回 context panel，或误删移动端唯一逃生路径
- 当前已收第二十四刀:
  - `/pull-requests/:pullRequestId` 右栏的 `相关收件箱提醒` 卡不再继续渲染泛化 `打开详情` CTA；PR detail 页头已经持有 `返回收件箱` 主导航，这块现在只保留 reminder summary 和 kind，不再把同一条 inbox 跳转在信息卡里重复堆一层
  - `pull-request-related-inbox-*` 锚点保持不变；减法后 related inbox 仍继续同步 delegation / reply / history truth，但导航职责交回 PR detail 主动作区，不再把摘要卡伪装成第二个 action strip
  - headed governed mailbox delegation 已新增“PR detail related inbox signal 不再包含 generic `打开详情` 文案”的断言，避免后续又把页头 `返回收件箱` 已持有的导航重新堆回 summary card
- 当前已收第二十五刀:
  - `/topics/:topicId` overview 不再继续渲染泛化 `回到讨论间` CTA；topic route 已经通过 `打开讨论页话题` 持有回到 room topic workbench 的正式 backlink，不再把 room return path 在同一块 overview 里重复堆一层
  - `topic-route-overview` 与 `topic-open-room-workbench` 锚点保持不变；减法后 standalone topic route 仍继续保留 guidance、run control、reload continuity 和 room-topic backlink，不再把 overview 做成第二条导航条
  - headed topic-route resume lifecycle 已新增“topic-route-overview 不再包含 `回到讨论间` link”的断言，避免后续又把 room-topic backlink 已持有的返回路径重新堆回 topic overview
- 当前已收第二十六刀:
  - `/settings` 的“来源信号”面板不再继续渲染泛化 `打开收件箱` CTA；settings 本身已经挂在统一 `OpenShockShell` 内，Inbox 主入口继续由全局壳层导航持有，不再把同一条跳转在通知来源摘要上重复堆一层
  - `notification-source-*` 锚点保持不变；减法后 settings 里的 routed signal 仍继续保留 kind / title / summary / time 这些通知真相，而账号恢复入口继续由 `账号中心` 持有，不再把 source panel 伪装成第二个 inbox action strip
  - headed notification preference delivery 已新增“settings 页不再包含 generic `打开收件箱` link”的断言，并同时确认页面仍保留至少一条 `账号中心` 恢复路径，避免后续又把全局 Inbox 导航重新堆回设置摘要区
- 当前已收第二十七刀:
  - `/pull-requests/:pullRequestId` 的 `review-merge` delivery gate 不再继续渲染泛化 `打开详情` CTA；这条 gate 原先只会自引用回当前 PR detail 页，本身不提供新的 drill-in，因此现在只保留 status / label / summary 真相，不再把当前页堆成第二个自链接动作
  - `delivery-gate-review-merge` 与 `delivery-gate-run-usage` 锚点保持不变；减法后 `run-usage` 等真正的跨页 gate 深链仍继续保留，只有 review gate 的自引用 jump 被收掉，避免把 release gate 区做成混杂的真假导航条
  - headed delivery entry release gate 已新增“review merge gate 不再包含 generic `打开详情` link、run usage gate 仍保留 run-detail deep link”的断言；server contract 也显式锁住 `review-merge.href` 为空，避免后续又把当前页自链接重新投回 API truth
- 当前已收第二十八刀:
  - `/rooms/:roomId?tab=run` 的右侧 run rail 不再继续渲染自引用 `房间执行` CTA；当前用户已经位于 room run tab，这条 link 只会回到同一个 room run 工作区，因此现在只保留 run status / owner / workspace / agents 等摘要真相
  - `room-rail-run-panel`、`room-workbench-run-panel` 与 `room-run-control-*` 锚点保持不变；减法后 room 内 stop / resume / follow_thread 仍在 run workbench 内可用，真正跨页的 `执行详情` deep link 继续保留
  - headed room workbench topic context 已新增“run rail 不再包含 `房间执行` self-link、但仍保留 `执行详情` deep link”的断言，避免后续又把当前 tab 自链接重新堆回 run rail
- 当前已收第二十九刀:
  - `/mailbox` 的 cross-room governance rollup 在 route `ready` 时不再同时保留 `创建自动交接` 与 `打开下一步` 两个主动作；ready 态现在只保留正式 mutation `创建自动交接`，避免同一张紧凑卡片在真正起单前就堆两条推进按钮
  - `mailbox-governance-escalation-rollup-route-create-*`、`mailbox-governance-escalation-rollup-route-status-*` 与 active 后的 `nextRouteHref` 仍保持正式真相；减法后 ready 态只剩一个主动作，route 进入 active 后仍继续通过 `打开下一步` deep link 跳进正式 governed handoff
  - headed cross-room governance orchestration 已新增“ready 态 compact rollup card 只保留 `创建自动交接`，不再保留 `打开下一步`；active 态仍保留 next-step link”的断言，避免后续又把 ready-stage 的双主动作堆回 mailbox rollup
- 当前已收第三十刀:
  - `/pull-requests/:pullRequestId` 的 delivery template 卡不再继续渲染逐卡 `打开详情` CTA；每张 template 原先都只会重复跳到同一个 `/settings`，现在这块只保留 template label / status / ready-blocked-sent-failed 真相，不再把信息卡伪装成并排的设置入口
  - `delivery-template-*` 锚点保持不变；减法后 `/settings` 的正式导航继续由 `delivery-gate-notification-delivery` 持有，template 卡只承担聚合读数，不再和 notification gate 争夺同一条设置跳转
  - headed delivery entry release gate 已新增“notification delivery gate 继续保留 settings 入口，而 template card 不再包含 generic `打开详情` link”的断言，避免后续又把逐卡 settings CTA 堆回 PR detail
- 当前已收第三十一刀:
  - `/agents` 的 orchestration cross-room rollup 在 route `ready` 时不再继续渲染 `打开下一步` CTA；当前 `/agents` 页里 governance graph 已经持有 next-route 说明和正式深链，所以 rollup summary 现在只保留 room/status/source 真相，不再和 graph 争夺同一条 route surface
  - `orchestration-governance-escalation-rollup-room-*`、`orchestration-governance-escalation-rollup-route-status-*` 与 `orchestration-governance-escalation-graph-route-*` 锚点保持不变；减法后 ready 态的 route deep-link 统一由 graph 持有，route 进入 active 后 rollup 仍可继续恢复 `打开下一步`
  - headed cross-room governance orchestration 已新增“`/agents` ready 态 rollup card 不再包含 `打开下一步`，但 active 态会恢复 next-step link”的断言，避免后续又把 ready-stage 的重复 route CTA 堆回 orchestration summary
- 当前已收第三十二刀:
  - `/rooms/:roomId?tab=topic` 的 topic 面板不再继续渲染泛化 `回到聊天` CTA；当前用户已经位于同一条 room 壳内，这条链接只会回到同一条 room chat shell，因此现在只保留具体的 `打开话题页` drill-out，不再把 topic sheet 堆成第二个壳内返回按钮
  - `room-workbench-topic-panel` 与 `room-topic-open-route` 锚点保持不变；减法后 topic 面板仍继续保留 highlights 和 topic-route deep link，而 chat-first 返回路径继续由 room shell 本身持有
  - headed room workbench topic context 已新增“topic sheet 不再包含 `回到聊天`，但仍保留 `打开话题页` deep link”的断言，避免后续又把同壳自引用按钮重新堆回 topic panel
- 当前已收第三十三刀:
  - `/pull-requests/:pullRequestId` 的 release gate 剩余 deep-link 现在不再继续复用泛化 `打开详情` CTA；server contract 已把 `run-usage / workspace-quota / notification-delivery` 明确收成 `执行详情 / 工作区设置 / 通知设置`，PR detail 只消费这份动作语义，不再让用户猜链接到底会跳去哪
  - `delivery-gate-run-usage`、`delivery-gate-workspace-quota` 与 `delivery-gate-notification-delivery` 锚点保持不变；减法后 release gate 仍只保留真实跨页动作，但动作名已经和目标页面一一对应，不再把三条不同导航伪装成同一个 generic CTA
  - headed delivery entry release gate 与 server contract 已新增显式动作名断言，避免后续又把 gate deep-link 退回不可辨认的 `打开详情`
- 当前已收第三十四刀:
  - workspace governance 的 next-route deep-link 现在也不再继续复用泛化 `打开下一步` CTA；server contract 已把 room rollup / graph 的 route action 收成 `查看交接建议 / 查看当前交接 / 待处理升级 / 交付详情` 等明确动作名，`/mailbox`、`/agents` 和 governance graph 共用同一份动作语义
  - `mailbox-governance-escalation-rollup-*`、`orchestration-governance-escalation-rollup-*` 与 `*-governance-escalation-graph-route-*` 锚点保持不变；减法后 ready / active / done route 仍继续保留正式 deep-link，但动作名已经和真实目的地对应，不再把 mailbox handoff、room mailbox 和 PR delivery detail 伪装成同一个 `打开下一步`
  - headed cross-room governance orchestration 与 governance contract 已新增显式 route-action label 断言，避免后续又把 route deep-link 退回不可辨认的 generic CTA
- 当前已收第三十五刀:
  - `live-detail-views.tsx`、`live-orchestration-views.tsx` 与 `phase-zero-views.tsx` 上残留的 detail-surface CTA 现在也继续做了目标名减法；`打开交接箱 / 打开讨论间 / 回到讨论间 / 打开 Run 详情 / 查看执行 / 查看事项` 已统一收成 `查看该智能体交接 / 进入讨论间 / 讨论间执行面 / 讨论间上下文 / 执行详情 / 事项详情`
  - 这些 detail surface 的正式 deep-link 与 `run-history-open-*` 等锚点保持不变；减法后合法跨页路径仍全部保留，但动作名已经直接说明目标页面，不再让用户猜这是 mailbox 过滤页、room context 还是 run detail
  - 本轮不改路由真相，只收动作语义；避免 detail 页继续把“打开/回到/查看”混用成一组需要额外理解成本的次级按钮
- 当前已收第三十六刀:
  - `GovernanceEscalationGraph` 左侧 room-context deep-link 现在也不再继续硬编码成泛化 `查看讨论`；server contract 已把 rollup `href` 对应的动作收成 `查看当前交接 / 查看收件箱信号 / 查看交接箱 / 进入讨论间 / 执行详情 / 事项详情 / 交付详情` 等明确动作名，graph 直接消费这份 room-context 语义
  - `mailbox-governance-escalation-graph-room-*` 与 `orchestration-governance-escalation-graph-room-*` 锚点保持不变；减法后 room node 仍保留正式 deep-link，但动作名已经和实际目的地对应，不再出现“文案写讨论、点击却落到 mailbox / inbox”的误导
  - governance contract 与 headed cross-room orchestration 已新增显式 room-context action label 断言，避免后续又把 graph room link 退回不可辨认的 generic CTA
- 当前已收第三十七刀:
  - topic / run / orchestration detail 顶部动作条现在也继续统一成目标名，而不是继续混用 `打开当前执行 / 打开话题页 / 打开讨论页话题 / 查看执行 / 查看事项`；当前统一收成 `执行详情 / 话题详情 / 讨论间话题 / 事项详情`
  - `topic-open-room-workbench`、`topic-open-run-link`、`run-detail-open-topic` 与 orchestration PR summary 的 deep-link 保持不变；减法后路径完全不变，但按钮不再要求用户额外猜“这是打开、查看还是回到哪一层”
  - 本轮只收动作文案，不改 route truth；避免 topic/run 顶部 strip 继续长成一排近义词按钮
- 当前已收第三十八刀:
  - governance graph / rollup 与 PR detail release gate 的兼容路径现在也不再退回泛化 `打开下一步 / 打开详情` fallback；即使旧数据或局部 contract 暂时没带 `nextRouteHrefLabel / hrefLabel`，前端也会按真实目标推断成 `查看当前交接 / 查看交接建议 / 待处理升级 / 交付详情 / 执行详情 / 工作区设置 / 通知设置`
  - `mailbox-governance-escalation-rollup-*`、`orchestration-governance-escalation-rollup-*`、`*-governance-escalation-graph-route-*` 与 `delivery-gate-*` 锚点保持不变；减法后 route truth 与 gate truth 完全不变，只把兼容空 label 的兜底文案收成真实目的地
  - 本轮不新增后端字段，只把前端 fallback 语义和现有 contract 对齐；避免旧 snapshot、sanitize 后空值或回放数据把已收好的动作名重新退回 generic CTA
- 当前已收第三十九刀:
  - `/rooms/:roomId?tab=topic` 的 topic-route drill-out 现在也不再继续使用泛化 `打开话题页`；同一仓库里其他 topic deep-link 已统一成 `话题详情`，room topic sheet 现在也直接沿用同一套目标名，不再在 room/topic 两层之间留下一个额外近义词
  - `room-workbench-topic-panel` 与 `room-topic-open-route` 锚点保持不变；减法后 topic panel 仍继续保留 highlights 和 topic-route deep link，只有动作名从泛化“打开”收成直接目标页
  - headed room workbench topic context 已把断言同步成 `话题详情`；避免后续又把 room topic 面板退回另一套与 topic detail 顶部 strip 不一致的 CTA 文案
- 当前已收第四十刀:
  - handoff lineage deep-link 现在也不再继续混用泛化 `打开收件箱 / 打开主交接 / 打开回复`；`/inbox?handoffId=...` 的 focus jump 已明确收成 `收件箱定位`，parent / response lineage deep-link 统一收成 `主交接详情 / 回复详情`，不再让用户额外猜这些按钮到底会落到 inbox、parent handoff 还是 response handoff
  - `mailbox-focus-link-*`、`mailbox-parent-link-*`、`mailbox-response-link-*` 与 `delivery-delegation-response-open` 锚点保持不变；减法后 lineage route truth 完全不变，只把按钮文案和真实目的地对齐
  - headed agent mailbox handoff 里一个已经漂移的旧断言 id 也已补回真实 `mailbox-focus-link-*`；避免脚本继续对不存在的旧 id 做空通过，保证 focused mailbox card 的自引用 CTA 确实被验证掉
- 当前已收第四十一刀:
  - PR delivery delegation 的动作名现在也不再由前端靠 `handoffHref ? ... : ...` 猜；server contract 已给 `PullRequestDeliveryDelegation` 补 `hrefLabel / handoffHrefLabel / responseHandoffHrefLabel`，后端明确产出 `交付详情 / 交接详情 / 回复详情`，而 delegation communication thread 上剩余的 handoff deep-link 也已继续统一成 `交接详情 / 回复详情`
  - `delivery-delegation-open`、`delivery-delegation-response-open` 与 delegation communication thread 内的 handoff deep-link 锚点保持不变；减法后 PR detail 的 delivery delegation 区仍保留同一条 handoff / response / PR delivery route truth，但按钮直接消费 contract-level action label 或同口径 fallback
  - live truth hygiene 与 server contract test 已一起补上这些 label，避免旧 snapshot、sanitize 后空值或后续重构又把 delivery delegation 退回前端局部猜测
- 当前已收第四十二刀:
  - mailbox / board 上的 governed closeout helper 现在也不再继续混用 `打开交付详情`；`/pull-requests/...` 的 closeout deep-link 统一收成 `交付详情`，`/pull-requests` 之外则继续显示 `查看交付结果`，不再让同一份 helper 在同类面上保留旧口径
  - `mailbox-governed-route-closeout` 与 `mailbox-compose-governed-route-closeout` 锚点保持不变；减法后 governed closeout 仍然只是一条 PR delivery route truth，只是文案和 contract-level 目标名对齐
  - 这刀只收前端 helper，不改路由或 contract；避免 mailbox / board 两个 surface 继续各自长出一套近义词按钮
- 当前已收第四十三刀:
  - governed handoff active-route CTA 现在也不再继续分裂成 `打开交接 / 打开当前交接` 两套近义词；`/mailbox` 和 compose 卡上的 active route 统一收成 `查看当前交接`，直接和治理 graph / rollup 已有口径对齐
  - `mailbox-governed-route-focus` 与 `mailbox-compose-governed-route-focus` 锚点保持不变；减法后 active governed handoff 仍只是一条 mailbox deep-link，不再让两个 surface 各自保留一套“打开/查看”混用文案
  - 这刀不改 contract，只收前端 active-route 文案；避免 governed compose 与 mailbox 主面继续出现同义动作按钮
- 当前已收第四十四刀:
  - detail surface 上残留的 `查看话题 / 查看 Run 详情 / 查看 Issue / 打开执行页签` 现在也已继续收成 `话题详情 / 执行详情 / 事项详情 / 讨论间执行面`，和前面已收的 topic / run / issue 目标名保持同口径
  - 这刀只改按钮文案，不改路由、锚点或 contract；避免旧 Phase 0 detail 面继续把同层深链写成另一套“查看/打开”近义词
  - `live-detail-views.tsx` 与 `phase-zero-views.tsx` 的合法跨页入口仍保留，只把动作名对齐到真实目标页面
- 当前已收第四十五刀:
  - governed closeout helper 的非 PR fallback 现在也不再继续分裂成 `查看收尾结果 / 查看交付结果` 两套口径；当 closeout deep-link 实际落到 `/mailbox` 时，board 和 mailbox 统一收成 `查看交接箱`，未知目标才退到 `收尾详情`
  - `mailbox-governed-route-closeout` 与 `mailbox-compose-governed-route-closeout` 锚点保持不变；减法后 done-route 仍保留原有 closeout 深链，只把动作名继续对齐到真实目标页
  - 这刀只收前端 helper，不改 route truth 或 contract；避免同一个 governed closeout helper 在两个 surface 上继续保留两套“结果/交付”近义词
- 当前已收第四十六刀:
  - PR delivery gate 的兼容路径现在也不再回退到泛化 `查看关联页面`；后端 `PullRequestDeliveryHrefLabel` 会按真实 href 补出 `执行详情 / 工作区设置 / 通知设置 / 交付详情 / 查看交接箱 / 讨论间话题` 等目标名，API sanitize 也会给旧 snapshot 的空 `hrefLabel` 自动补齐
  - `pull-request-detail-view.tsx` 继续保留同口径前端 fallback，但未知 href 会 fail-closed 不再渲染链接；新 contract、旧 snapshot 和前端兼容路径不再各自保留三套动作命名
  - 这刀不改任何 gate 路由或 release gate 状态，只把 action label 的责任往后端 contract / sanitize 收拢，并用 API 单测锁住空 label 回填
- 当前已收第四十七刀:
  - 旧 Phase 0 run detail 的 PR 收口卡上残留的 `打开 Issue` 现在也已收成 `事项详情`，和当前 live detail / topic / run surface 的 issue 目标名保持同口径
  - 这刀只改按钮文案，不改 `/issues/:issueKey` 路由或 PR 收口卡结构；避免旧 detail surface 继续把同一类 issue deep-link 写成另一套英文混杂动作
  - 移动端 room context 里的 `打开收件箱` 仍保留为 sidebar 隐藏后的逃生路径，本轮不误删合法主入口
- 当前已收第四十八刀:
  - settings 页里带动词的账号中心 CTA 现在也已收成 `账号中心`，把身份通知模板和来源信号里的 recovery link 再压短一层，不再保留空动词
  - `"/access"` 路由与恢复流程不变；这刀只改动作文案，并同步 headed 回归脚本的 link 断言
  - settings 仍保留至少一个恢复入口，只是把 label 压成名词式入口，避免信息页继续像 action strip
- 当前已收第四十九刀:
  - PR 外跳 CTA 上残留的动词现在也已继续收掉；room PR workbench、PR detail 与 review thread 的外链统一直接按目标对象命名，分别收成 `远端 PR` 与 `原评论`
  - 这刀不改任何远端链接、target 或 review thread 结构；只把外跳按钮继续压成目标名，并和同页已存在的 `远端评论` 口径对齐
  - `room-pr-detail-link`、PR detail 顶部动作条与 review thread 外链都继续保留正式 drill-out，只是不再把同一组按钮写成“打开 + 目标名”的空动词形式
- 当前已收第五十刀:
  - PR detail 的 delivery evidence 也已补上 contract-level `hrefLabel`；后端 `PullRequestDeliveryEvidenceHrefLabel` 会把 room PR、run、远端 PR、交付、交接、review conversation 和通知设置分别产出 `讨论间 PR / 执行详情 / 远端 PR / 交付详情 / 交接详情 / PR 详情 / 通知设置`
  - live truth hygiene 会给旧 snapshot 的空 evidence label 自动回填，前端只消费 contract label 或同口径 fallback，不再把所有 evidence link 统一渲染成泛化材料按钮
  - PR detail 还会隐藏指回当前 `/pull-requests/:id` 的 evidence 自链接；review conversation、governed closeout、delivery delegate 这类当前页材料只保留摘要，真正跨页的 room/run/remote/settings 链接继续保留
  - headed delivery entry release gate 已补“没有泛化材料 CTA、当前页 evidence 不再自链接、剩余 evidence 按明确目标名渲染”的断言，避免旧 generic action strip 回流
- 当前已收第五十一刀:
  - GitHub 安装入口上的空动词现在也已继续收掉；onboarding、setup GitHub connection、repo binding 三处安装 CTA 已统一收成 `GitHub 安装页`
  - 这刀不改任何 `installationUrl`、新标签页外跳、repo bind blocked-path 或安装完成后的回流说明；只把 supporting flow 里的外部安装入口继续压成目标名
  - headed GitHub app onboarding 已补按钮文案断言，避免后续又把 setup/supporting flow 的安装入口退回 generic open CTA
- 当前已收第五十二刀:
  - `/setup` 相关的入口文案再压一层；onboarding 末步和断线 shell 里的设置入口现在统一收成 `设置`
  - 这刀不改 `/setup` 路由、disconnect 状态、sidebar 行为或设置页结构；只把 supporting flow 里直达设置面的入口从动词式再压成页面名
  - 后续若再碰 `打开列表`，会先确认它是不是同壳自引用，再决定能不能继续减法
- 当前已收第五十三刀:
  - channel thread 回访区里的原视图自链接也已收掉；followed / saved rail 的 `打开原视图` 被删去，只保留 `重新打开线程`
  - 这刀不改 follow / save / reopen 的实际路由与状态，只把回访卡里那个回到同一选中态的重复入口去掉
  - headed DM followed/saved later walkthrough 已补“followed panel 和 saved panel 都不应再渲染原视图自链接”的断言，防止 thread supporting flow 回流 generic self-link
- 当前已收第五十四刀:
  - channel thread 回访区右侧详情里的 `打开列表` 也已继续收掉；当前 followed / saved 面已经直接承载同一份队列上下文，详情 rail 只保留真正改变位置的 `重新打开线程`，不再把当前队列自引用成第二条次级导航
  - 这刀不改跨频道选择、回访详情内容或 reopen 路由；只把 desktop rail 上残留的列表自链接删掉，并顺手清理掉 `surfaceHref` 的旧引用，避免 thread supporting flow 继续带着无效字段拖住 typecheck
  - headed DM followed/saved later walkthrough 已补“当前页不应再渲染 `打开列表`”的断言，防止回访 rail 又长回重复列表入口
- 当前已收第五十五刀:
  - governance graph 房间侧链接的最后一层 generic fallback 现在也已收掉；room node 不再把缺省动作退回 `查看上下文`，而是继续按真实 href 收成 `查看当前交接 / 查看收件箱信号 / 查看交接箱 / 执行详情 / 事项详情 / 进入讨论间 / 交付详情`
  - 后端 live truth hygiene 这次也补齐了 room rollup `hrefLabel / nextRouteHrefLabel` 的旧 snapshot 回填；governance graph / rollup 不再只能依赖当前内存态生成的 label，历史或 sanitize 后的状态也会直接带着正式目标名进入前端
  - API hygiene 单测已新增 governance rollup label 回填断言，避免后续又把 room action 退回空 label 或前端局部猜测
- 当前已收第五十六刀:
  - governed route closeout 的动作名也从前端 helper 收回 contract；`WorkspaceGovernanceSuggestedHandoff` 现在显式携带 `hrefLabel`，active handoff 产出 `查看当前交接`，done closeout 会按真实 href 产出 `交付详情 / 查看交接箱`
  - `/mailbox` 与 Inbox compose 不再各自维护 `governedCloseoutLabel`，只消费 `governedSuggestion.hrefLabel`，旧 state 则由 server live truth hygiene 和 web state sanitizer 同口径回填，避免 board / mailbox 两个 surface 又各自漂出一套 closeout CTA
  - 这刀不改 governed route 的创建、完成、auto-advance 或 closeout 路由，只把 action label 责任下沉到后端 contract，并用 store/API 单测锁住 active 与旧 snapshot 回填
- 当前已收第五十七刀:
  - governance next-route 的最后一层抽象兜底现在也已收掉；未知 `nextRouteHref` 不再继续伪装成 `查看下一棒 / 查看收口详情`，server helper、web helper 和三处 route surface 都改成 fail-closed，只在动作名能明确落到真实目标时才渲染链接
  - `GovernanceEscalationGraph`、`/mailbox` rollup 和 `/agents` orchestration rollup 现在都共享这条纪律：ready 态仍保留正式 mutation，active / blocked / done 只在 `handoff / mailbox / PR` 等已知目标存在时保留 deep-link，未知目标不再占据按钮位
  - store 与 API 单测已补未知 href 返回空 label 的断言，避免后续又把 opaque route 塞回 generic CTA
- 当前已收第五十八刀:
  - PR delivery gate / evidence 的最后一层 `关联详情` fallback 也已收掉；`PullRequestDeliveryHrefLabel` 对未知 href 返回空 label，PR detail 只有在目标能明确映射到 `执行详情 / 工作区设置 / 通知设置 / 交付详情 / 查看交接箱 / 事项详情 / 话题详情 / 讨论间... / 智能体详情` 时才渲染链接
  - 这刀不改任何真实 delivery gate、evidence href 或 remote PR 外跳；只让 opaque delivery href fail-closed，避免把不可解释目标伪装成泛化“关联”
  - API hygiene 单测已补 opaque gate / evidence 的空 label 断言，防止旧 snapshot sanitize 后又长出 generic CTA
- 当前已收第五十九刀:
  - `watch` 状态的最后一层动作态文案也已收掉；`/chat`、`/setup`、`/settings` 与首页运行概览里的 quota / budget badge 不再写成 `进入观察`，统一改成更短、更像状态本身的 `观察中`
  - 这刀不改任何 quota、budget、warning 阈值、颜色或路由；只把 supporting flow 里残留的动作式状态文案压回状态态，避免用户把 badge 误读成下一步操作
  - 这次继续不碰 contract；全文搜索确认 `进入观察` 已不再作为产品面的状态文案残留，后续可把注意力转回剩余的次级导航和 handoff 标签噪音
- 当前已收第六十刀:
  - handoff kind label 的最后一层前端本地猜测也已收掉；`AgentHandoff` 现在显式携带 `kindLabel`，`/mailbox`、`/inbox` 和 PR detail 不再各自维护 `mailboxKindLabel` helper，旧 snapshot 则由 server hygiene 与 web sanitizer 同口径回填
  - 这刀顺手把 `delivery-reply` 的显示名从内部味更重的 `收尾回复` 压成更直白的 `补充回复`；不改任何 parent/child orchestration、resume-parent、PR thread action 或 `delivery-reply` kind 本身，只收口产品面和 headed script 上的用户语言
  - store/API 单测已补 `kindLabel` 产出与回填断言，避免后续又把 handoff badge 文案散回多个前端 surface 或旧 snapshot 漂出另一套 reply 名字
- 当前已收第六十一刀:
  - supporting flow 的 section label 和 agent detail 次级入口现在也继续做目标名减法；Setup 里的 `查看连接细节 / 查看回流地址 / 查看绑定依据`、Onboarding 的 `查看高级选项` 以及 agent detail 的 `查看该智能体交接` 已统一收成 `连接细节 / 回流地址 / 绑定依据 / 高级选项 / 交接箱`
  - 这刀不改任何 `<details>` 展开行为、GitHub public ingress 地址、Setup / Onboarding 路由或 `mailbox?agentId=` 过滤逻辑；只把 supporting flow 上残留的空动词继续压掉，避免折叠区标题和 mailbox 深链继续伪装成操作句
  - headed public ingress 脚本与票据文案已同步更新，避免后续回归继续用旧 `查看...` 口径把 supporting flow 长回动作条
- 当前已收第六十二刀:
  - detail surface 的解释性开头现在也继续收掉；`live-detail-views` 上讨论间总览、智能体总览、执行总览、话题详情和执行详情的 `这里查看... / 这里集中查看...` 已统一压成直接对象描述，不再像旁白式说明卡
  - 这刀不改任何 detail shell 结构、context rail、路由或数据来源；只把首屏描述继续压短，避免用户先读一层“这里可以做什么”才能进入当前对象
  - 这次只动前端 copy；定向搜索与 typecheck 会锁住旧描述不再回流到 detail surface
- 当前已收第六十三刀:
  - PR 交付、Mailbox、Profile、Memory 和通知概览上的解释性开头这轮也继续收掉；`在这里查看... / 这里查看... / 这里集中查看... / 这里可以... / 这里会...` 现在统一压成直接对象描述，首屏不再像产品旁白
  - 这刀不改任何对象结构、卡片布局、通知设置、资料来源或 mailbox 行为；只把 supporting flow 的首屏 copy 继续压短，让用户直接看到对象而不是界面说明
  - 这次同样只动前端文案；定向 lint、typecheck 和旧句式搜索会一起锁住这些旁白式开头不再回流
- 当前已收第六十四刀:
  - 空状态和帮助提示里的剩余旁白句式也继续收掉；Memory、Settings、Profile 和 PR detail 的等待态 / 空态不再写 `这里会... / 这里可以... / 稍后这里会...`，而是直接说明同步后会出现什么或当前可做什么
  - 这刀不改任何通知 worker、memory cleanup、profile editor、PR delivery thread 或空态条件；只把辅助提示继续压短，避免用户把容器位置当成下一步动作
  - 这次仍是前端 copy 减法；定向搜索会锁住当前触达文件里这些空态旁白不再回流
- 当前已收第六十五刀:
  - `access / orchestration / sandbox` 上残留的容器式说明这轮也继续收掉；身份恢复、成员偏好、调度队列、运行环境压力、治理指标和高风险动作面板不再写 `在这里... / 这里会...`，`run-sandbox` 标题也从 `查看并调整这次执行能访问什么` 压成 `这次执行的访问范围`
  - 这刀不改任何恢复流程、成员偏好持久化、调度镜像、运行环境状态或 sandbox 控制行为；只把 supporting flow 上仍像“界面说明”的标题和说明继续压回对象本身
  - 这次仍只动前端 copy；定向 lint、typecheck 和旧句式搜索会锁住当前触达文件里的旁白式说明不再回流
- 当前已收第六十六刀:
  - inbox signal 的最后一层 generic action fallback 现在也已收掉；当前生成中的 `/rooms / runs / setup / inbox focus` signal 不再继续写 `打开房间 / 打开评审 / 打开配置 / 打开 Mailbox / 重新配对 / 解除阻塞 / 查看批准`，统一按 `执行详情 / 进入讨论间 / 设置 / 收件箱定位` 这类目标名产出
  - `InboxItem.action` 这次不新增字段；server producer、seed、API hygiene 和 web sanitizer 统一走 `InboxItemActionLabel(href)` 同口径回填，旧 snapshot 的空 action 也会按已知目标恢复动作名，未知 href 则 fail-closed 留空，Phase 0 inbox 卡不再硬渲染空按钮或 generic `查看详情`
  - store/API 单测已补 inbox action label 映射与 sanitize 回填断言，避免后续又把 inbox 深链文案散回多处 producer 或旧 snapshot 再长出 generic fallback
- 当前已收第六十七刀:
  - governance / delivery 深链的最后一层空动词也继续收掉；`/mailbox / inbox / settings / rooms tab` 现在统一由共享 helper 产出 `当前交接 / 交接箱 / 交接建议 / 待处理升级 / 收件箱定位 / 收件箱 / 设置 / 讨论间执行面 / 讨论间上下文`，不再在 PR detail、governance graph、mailbox 和 board compose 四处各自猜 `查看当前交接 / 查看交接箱 / 查看收件箱信号`
  - 这刀顺手把 web state sanitizer 的一个旧坑补平：`sanitizeDisplayText(..., fallback)` 遇到空字符串不会自动落回 fallback，导致旧 snapshot 仍会把 `hrefLabel` 留空；现在 governance suggested handoff 与 escalation rollup 会显式做空值回填，旧 state 进入前端后也能直接拿到正式目标名
  - 这刀不改 handoff / inbox / PR / settings 的真实路由和 mutation，只把目标名责任进一步收回 helper + sanitizer + contract；同时保留 `/inbox?handoffId=...` 这类真实聚焦路径的 `收件箱定位`，不误把 inbox focus 和 mailbox handoff detail 混成同一个入口
- 当前已收第六十八刀:
  - detail/profile/settings/mailbox/PR/governance 里的剩余容器式说明这轮继续压短；空态、说明和标题不再写 `这里会显示 / 在这里处理 / 在这里调整`，而是直接说明交接、事项、说明记录、通知结果和治理链路本身
  - 这刀顺手把 issue / room 的 live truth hygiene fallback 继续去内部词；后端与 web sanitizer 的兜底从 `live truth / 执行真相` 改成更直接的 `当前状态 / 最新执行状态`，对应 state hygiene contract test 一起更新
  - 这刀不改任何路由、mutation 或 governance contract，只继续收用户面 copy；定向 ESLint、typecheck、store/API 测试和残留词搜索已锁住当前触达面不再回流旁白式句子
- 当前已收第六十九刀:
  - `/memory`、`/setup`、GitHub 安装回跳、branch-head 对齐和 chat room workbench 的页面壳层这轮也继续减法；`在这里查看 / 集中在这里 / 这里会显示` 统一压成资料、诊断、同步状态、PR 评审状态和频道摘要本身
  - chat room 这刀只动壳层 copy，不动消息数据、线程 reopen、room workbench tab、远端 PR 外跳和真实 CTA；像 `远端 PR / 话题详情 / 重新打开线程` 这种真正改变位置的入口继续保留
  - 这刀继续不碰控制面或后端状态机；定向 ESLint、typecheck 和残留词搜索已确认当前触达页面不再保留这批容器式说明
- 当前已收第七十刀:
  - 默认频道和空白工作区 seed 的 customer-facing copy 这轮也继续去容器味；`#all / #roadmap` 不再写“都在这里 / 先在这里”，统一压成轻松聊天、路线讨论，以及“频道承载轻量讨论，正式工作升级成讨论间”这类直接对象描述
  - runtime lease 冲突的 inbox action 这轮也继续收回统一 helper；后端不再硬写 `查看冲突`，而是按 run href 走 `InboxItemActionLabel`，动作名会和其他 run deep-link 一样稳定落成 `执行详情`
  - issues / onboarding / quick search 的壳层说明也继续压短；`集中查看当前事项 / 打开聊天主界面 / 打开当前结果 / 需要时再打开即可` 已统一改成 `查看当前事项 / 进入聊天主界面 / 进入当前结果 / 按需展开`
- 当前已收第七十一刀:
  - 首页跳转和默认私聊的最后一层产品团队口吻这轮也继续收掉；首页加载提示不再写“打开正确入口”，`dm-mina` 的 summary / purpose / saved-later 文案不再写“收口面 / 一等入口需求”，统一压成“正在进入工作区”“文案和稍后查看习惯”“正式入口”这类直接用户语言
  - 这刀顺手把 mobile 房间逃生入口和 Viewer 摘要也继续收口到目标名；`room-workbench-open-inbox` 已压成 `收件箱`，Viewer 不再写“查看控制面 / 历史真值”，统一改成“只读控制面和历史记录”
  - 这刀不改任何 room workbench 路由、移动端逃生逻辑、权限矩阵或 saved-later 数据结构；只继续压 customer-facing 文案，并保持 web mock 与 server seed 一致
- 当前已收第七十二刀:
  - inbox / mailbox / access 这轮继续把动作名收回真实目标页；GitHub 阻塞不再写 `处理 GitHub 阻塞`，delivery delegation inbox 不再写 `Open Delivery Entry`，账号恢复通知也不再写 `打开 /access...`，统一直接落成 `执行详情 / 交付详情 / 账号中心`
  - supporting flow 剩余的内部味也继续压回用户语言；身份恢复通知、治理阻塞摘要、稍后查看说明和跨讨论间阻塞汇总不再写 `verify / recovery / blocked escalation / planning lane / workspace truth / rooms` 这类内部词，首屏只保留用户能直接理解的状态和目标
  - 这刀不改 GitHub / delivery / access 的路由和 mutation，只继续收口动作语义与摘要文案，并保持 room shell、本地默认数据和 server seed 同口径
- 当前已收第七十三刀:
  - governance graph 和 governance rules 这轮继续压掉英文与内部图例；治理规则不再显示 `Formal Handoff / Review Gate / Test / Verify Gate / Blocked Escalation / Human Override`，统一改成 `交接 / 评审 / 验证 / 阻塞 / 人工接管`
  - graph 主视图上的 `多房间 / hot room / 当前负责人 / 下一棒 / rooms` 也继续改成更直接的 `讨论间 / 当前处理人 / 下一步 / 个讨论间`；默认说明和空态也同步压短，不再像内部治理面板
  - 这刀不改 governance graph 的链接逻辑、route 状态机或 escalation 数据结构，只继续收用户面 copy，并新增 store 单测锁住 customer-facing 规则标签
- 当前已收第七十四刀:
  - workspace governance 后端产出的客户可见文案这轮继续去内部词；模板、路由、升级队列、提醒、人工接管、最终回复和 walkthrough 不再输出 `governed handoff / routing matrix / review gate / final response` 这类控制台口径，而是统一落成短中文
  - `/mailbox`、`/agents` 和旧 Phase 0 fallback 同步收口；`人工确认 / 当前治理升级队列 / 通知策略 / 回复聚合 / 当前负责人 / Runtime Replay / 泳道 / 人工闸门` 已改成 `待拍板 / 待处理升级 / 提醒设置 / 最终回复 / 当前处理人 / 执行回放 / 当前事项 / 待拍板事项`
  - 这刀不改任何 route、handoff 状态机、governance 数据结构或 mutation；只继续收 customer-facing copy，并用 store 测试锁住后端 governance hydrate 不再回流内部词
- 当前已收第七十五刀:
  - detail / orchestration / supporting flow 这轮继续去掉残留控制台味；`负责人 / 执行泳道 / 自动合并闸门 / 这里显示...` 这一批已在 `/agents`、detail、旧 Phase 0、board inbox、chat room、branch-head 与 setup 调度说明里收成 `当前处理人 / 执行信息 / 自动合并检查 / 直接对象描述`
  - 后端 store helper 和 API sanitizer 同步补齐空值 fail-closed 的 customer-facing fallback；`治理阻塞 / 未命名治理角色 / 未命名治理步骤 / 当前多 Agent 治理摘要` 现在统一回填成 `待处理升级 / 未命名分工 / 未命名步骤 / 当前协作摘要`，旧 snapshot 不会再把前端刚减掉的词重新灌回来
  - 这刀不改任何 route、state contract 或 mutation；只继续收 copy 与 fallback，并新增 store/API 测试锁住 blocked mailbox label 和 dirty governance sanitizer 的用户语言
- 当前已收第七十六刀:
  - setup / board / room supporting flow 这轮继续去掉容器旁白；onboarding、GitHub connection、repo binding、board inbox 和 chat room 里的 `这里... / 交接列表 / 待处理列表 / 交接记录 / 回到这里` 已收成 `这组仓库信息 / 先完成默认连接即可 / 当前仓库有没有接通 / 交接 / 待处理 / 回到任务板` 这类对象名或目标名
  - 这刀只动前端 copy，不改任何路由、表单字段、test id、安装外跳、回流逻辑或 thread 行为；board、inbox 和 room 的 supporting flow 继续保留真实主入口，只删掉容器式说明
  - 这刀不新增后端 contract；通过定向 ESLint、web typecheck、残留词搜索和 `git diff --check` 锁住这批 supporting flow 文案不再回流
- 当前已收第七十七刀:
  - `live-detail / live-mailbox` 这轮继续把剩余容器标题压成对象名；`交接记录 / 正在获取当前交接记录 / 交接记录会同步更新` 已统一收成 `交接 / 正在获取当前交接 / 交接会同步更新`
  - mailbox cross-room 阻塞说明里的 `这里把...` 也继续压成直接描述；当前工作区里的阻塞讨论间会直接摊平显示，不再把这块解释成一个“这里做什么”的容器
  - 这刀只动前端 copy，不改任何路由、mutation、message 结构或深链；通过定向 ESLint、web typecheck、残留词搜索和 `git diff --check` 锁住 `交接记录` 这类剩余容器词不再回流
- 当前已收第七十八刀:
  - 默认频道和 room workbench 这轮继续按 `slock.ai` 的“频道目的直接说用途”收口；`#announcements` 在 web mock 和 server seed 里的 purpose 已统一改成 `只发版本、Runtime 变化和制度公告，不在这里展开讨论`
  - chat room thread、频道 fallback 和暂停提示里的 `总览页 / 用途说明 / 控制面板` 也同步压成 `不再额外铺一层总览 / 当前还没有同步频道说明 / 先恢复当前执行`；不改任何消息结构、暂停逻辑、频道路由或回复权限
  - 这刀同时保持前后端默认口径一致；通过 web lint/typecheck、store 定向测试、残留词搜索和 `git diff --check` 锁住 mock data、server seed 与 room surface 不再漂回旧口吻
- 当前已收第七十九刀:
  - live truth hygiene、web sanitizer 和 run control 这轮继续把 fallback 里的内部术语压回用户语言；`真值 / Topic / Run / 控制说明` 已统一收成 `当前仓库信息 / 待整理话题 / 当前执行摘要 / 当前执行备注`，旧 snapshot 进入前端后也不会再把这批旧词灌回来
  - Memory Clerk 的 seed/mock prompt 也同步从 `可解释真值` 压成 `记在同一条记录里，方便回看`；memory preview、followup prompt 和默认数据继续共用同一份更直接的说明，不改任何 provider、handoff 或恢复逻辑
  - access / bridge supporting flow 剩余的 `这里...` 旁白这轮也继续收口；高级权限和直连机器面板改成直接描述当前能做什么或当前要确认什么，不再先解释容器位置
- 当前已收第八十刀:
  - `settings / profile` 的 supporting flow 这轮继续把 `这里显示 / 这里定义 / 这里管理 / 这里集中...` 压成对象描述；凭据范围、沙箱策略、模型建议、工作区额度和设置概览现在直接说当前对象或状态，不再先解释容器位置
  - 这刀不改任何权限、凭据、沙箱或设置结构；只继续收 front-end copy，确保 profile / settings 这些支持路径也遵守 chat-first 壳的减法纪律
  - 通过定向 ESLint、web typecheck、残留词搜索和 `git diff --check` 锁住这批 supporting flow 文案不再回流
- 当前已收第八十一刀:
  - `setup` 模板卡、已落地启动包和默认 onboarding materialization 这轮继续把样板名压短；`角色 / 起步智能体 / Owner / Research Lead / Lead Operator / review` 这一批现在统一收成 `分工 / 默认智能体 / 所有者 / 方向 / 总控智能体 / 评审`
  - 这刀同时把前端 fallback 和后端 materialization 对齐；`live-setup-views`、`workspace_config.go` 和 blank workspace bootstrap 默认包不再各说一套模板分工与通知口径
  - orchestration supporting flow 顺手收掉一处容器旁白，`下一步和提醒都在这里` 已压成 `下一步和提醒`，不改任何调度、升级或通知逻辑
- 当前已收第八十二刀:
  - 旧 onboarding materialization 现在也不会把英文样板名重新灌回前端；server live hygiene 和 web sanitizer 会把 `Owner / Member / Viewer / Research Lead / Lead Operator / Review Runner / review 事件` 映射成当前中文短口径
  - 这刀不改模板创建、governance topology 或真实 agent 名称；只补旧 snapshot / dirty state 的客户可见回填，确保第八十一刀的前后端口径不会被历史状态冲掉
  - API 的 pure state stream sanitize 测试已补 roles / agents / notification policy / notes 的旧词回填断言
- 当前已收第八十三刀:
  - Settings 通知页继续把解释腔压成状态句；身份通知、默认通知、当前浏览器接收和待发送信号里的 `会实时显示 / 统一显示 / 这里就是实际生效 / 直接显示 / 说明目前...` 已改成更直接的状态说明
  - 这刀不改通知策略、浏览器授权、subscriber 偏好、worker receipt 或 delivery source；只继续收 front-end copy，保留所有 test id 和操作路径
  - 通过定向 ESLint、web typecheck、残留句式搜索和 `git diff --check` 锁住这批 Settings 通知文案
- 当前已收第八十四刀:
  - `profile / memory` 支持流继续把页面说明压成对象本身；`管理资料来源 / 机器档案集中展示... / 成员档案集中展示... / 文件栈会直接显示` 已改成更短的对象描述
  - 这刀不改 profile 路由、memory provider、会话预览、记忆清理或任何 mutation；只继续收标题和描述，保留现有 test id
  - 通过定向 ESLint、web typecheck、残留句式搜索和 `git diff --check` 锁住这批 supporting flow 文案
- 当前已收第八十五刀:
  - `orchestration / setup` 这轮继续把调度摘要、空态和页头说明压成对象与状态本身；`把智能体协作、调度和合并状态放到一个面板里 / 当前还没有... / 当前这一列...` 已改成 `协作、调度和合并状态 / ...还没同步 / ...会出现在这一列` 这类更直接的句子
  - runtime scheduler 的 server/web 兜底这轮也同步收口；store 生成文案、API hygiene、web sanitizer 和 mock fallback 现在会把 `fallback state / workspace selection / failover / active lease / Runtime 已...` 统一改成 `工作区默认运行环境 / 切到 / 条执行 / 运行环境已...`，旧 snapshot 和默认数据不会再把英文或控制台味话术灌回前台
  - 这刀不改任何调度策略、lease 选择、运行环境状态机或页面结构；只继续收 copy 与 fallback，并补 store/API 测试锁住 failover summary、candidate reason、run/session timeline 的客户可见文案
- 当前已收第八十六刀:
  - `profile / settings / access / memory` 这轮继续把剩余帮助文案和空态压成对象与状态本身；`显示这个智能体绑定了哪些凭据档案 / 显示智能体默认的沙箱档位和白名单 / 当前没有... / 请切换到管理员账号后再操作 / 当前成员还没有已授权设备 / 邀请成员与角色管理` 已改成更直接的对象说明、当前状态或短标题
  - 这刀不改任何凭据绑定、沙箱规则、成员权限、通知投递、记忆清理或路由结构；只继续收 front-end copy，保留现有 test id、表单、折叠层级和 mutation 路径
  - 通过定向 ESLint、web typecheck、残留句式搜索和 `git diff --check` 锁住这批 supporting flow 文案不再回流
- 当前已收第八十七刀:
  - `access / memory / orchestration / setup` 这轮继续把剩余空态和说明压短；`最近还没有执行记录 / 被卡住的升级会直接显示，不再只藏在消息里 / 还没有状态说明 / 还没有检查记录 / 还没有清理记录 / 当前账号没有修改权限，只能查看 / 还没有已注册运行环境 / 成员管理` 已改成更短的状态句或对象名
  - 这刀不改任何调度、成员权限、记忆 provider、清理策略、折叠结构或 test id；只继续收 front-end copy，保留现有 mutation、空态条件和页面结构
  - 通过定向 ESLint、web typecheck、残留句式搜索和 `git diff --check` 锁住这批 supporting flow 文案不再回流
- 当前已收第八十八刀:
  - `GitHub / onboarding` 这轮继续把安装与跳过支持流压短；`当前还没有完成 GitHub 应用配置，请先补充设置 / 当前还没有配置公开回跳地址 / 当前还没有配置公开回调地址 / 可以先跳过，之后再补充 GitHub 配置 / 如果你当前就在目标项目目录中，可以直接读取` 已改成更短的状态句和引导句
  - 这刀同时把 web mock 和 server seed 的默认连接说明同步收口；`当前还没有完成 GitHub App 安装...` 已改成 `GitHub App 还没装好...`，避免 Setup / Onboarding 页面改短后，旧默认数据继续吐出另一套长句
  - 这刀不改任何 GitHub 安装链接、回流地址、仓库绑定逻辑或 onboarding 步骤；只继续收 front-end copy 和 seed/mock 默认口径
- 当前已收第八十九刀:
  - `chat room / board inbox / live detail / mailbox / PR detail / governance fallback` 这轮继续把高频空态和解释旁白压短；`当前没有新信号 / 暂无待处理信号或交接 / 暂无交接项 / 暂无事项 / 暂无讨论间 / 暂无智能体 / 暂无执行记录 / 暂无说明记录 / 暂无评审回流 / 暂无用量或配额提醒` 已替换掉更长的旧句子，前台现在只说对象本身或当前状态
  - `workspace_governance` 的 issue fallback 也同步收口到 `暂无事项`，让后端治理 walkthrough 不再吐出更长的空态句子；`pull-request-detail` 的交接空态也同步压短，保持 PR detail 与 room / mailbox 口径一致
  - 这刀同样只改 customer-facing copy 与后端兜底，不动路由、权限、mutation 或对象结构；验证已继续覆盖 web lint/typecheck、store 定向测试、残留词搜索和 `git diff --check`
- 当前已收第九十刀:
  - `setup / onboarding / settings / profile / memory / run detail` 这轮继续把 supporting flow 的长句压成对象或状态本身；`继续设置入口 / 工作区模板、启动进度、仓库绑定、浏览器入口和安全范围 / 这位智能体已绑定的凭据档案 / 资料内容、来源调整和下一次任务会带上的上下文预览 / 执行详情不只显示分支和工作目录...` 这一批现在都已收成更短的中文口径
  - GitHub 和 onboarding 的成功提示也继续收口；`账号已创建，继续选择模板 / 模板已保存，继续配置 GitHub / GitHub 已连接，可以继续 / 仓库已识别，继续连接运行环境 / 运行环境已连接，继续设置智能体` 已统一压成状态本身，不再把下一步旁白写进提示
  - 这刀只动 front-end copy，不改路由、权限、mutation 或数据结构；验证继续覆盖残留词搜索、定向 ESLint、web typecheck 和 `git diff --check`
- 当前已收第九十一刀:
  - `live-orchestration / live-access` 这轮继续把协作和身份支持流里的解释句压短；`团队分工直接贴当前协作状态 / 等待分配或继续推进的事项数量 / 新的事项会显示分配和推进状态 / 你已经登录，可以继续了 / 当前账号不能管理成员。切换到管理员账号后再操作 / 所有者可管理` 这一批已统一收成更直接的状态句或对象名
  - 这刀不改任何调度、成员权限、登录流程、路由或 mutation；只继续收 front-end copy，避免 orchestration 和 access 支持流再长回“告诉你页面在做什么”的句子
  - 验证继续覆盖残留词搜索、定向 ESLint、web typecheck 和 `git diff --check`
- 当前已收第九十二刀:
  - `live-orchestration / live-access` 这轮继续把剩余的度量说明和权限问句压回对象本身；`请求、接手、阻塞和完成会继续围绕同一条协作链路汇总 / 当前身份能不能... / 高级权限默认收起。大多数情况下...` 这一批已进一步收成更短的状态句和对象短语
  - 这刀仍只动 front-end copy，不改调度、权限、登录流程、路由或 mutation；目标是继续把 supporting flow 从“帮助文案”收成“状态面”
  - 验证继续覆盖残留词搜索、定向 ESLint、web typecheck 和 `git diff --check`
- 当前已收第九十三刀:
  - `live-orchestration / live-access` 这轮继续压剩余的 detail 句尾和权限短句；`被卡住的升级会显示在这里 / 当前仍占用上下文的会话数量 / 机器列表返回后会显示占用、切换和恢复情况 / 新建事项并推进执行。` 这一批已继续收成更短的状态或对象短语
  - 这刀仍只动 front-end copy，不改调度、权限、登录流程、路由或 mutation；重点是继续去掉“解释界面行为”的尾巴
  - 验证继续覆盖残留词搜索、定向 ESLint、web typecheck 和 `git diff --check`
- 当前已收第九十四刀:
  - `live-setup / live-settings / live-mailbox / run-control / phase-zero / stitch-shell-primitives` 这轮继续把剩余支持流按钮和帮助句压成目标名或状态本身；`继续入口 / 继续地址 / 打开 / 当前选择里包含其他类型的交接... / 当前讨论还没有现成的下一步建议 / 当前没有额外需要你拍板的事项 / 当前还没有验证结果` 这一批已继续收成 `回跳地址 / 切换 / 自动续接... / 当前讨论还没有现成下一步建议 / 暂无需要你拍板的事项 / 暂无验证结果`
  - `phase-zero-helpers`、`live_truth_hygiene`、`workspace_governance` 和 `seed` 也同步把 `当前还没有同步频道说明 / 当前私聊说明还没同步 / 当前交接继续摘要正在整理中 / 当前 GitHub 连接说明正在整理中` 收成更短的用户口径，旧 snapshot 和默认数据不会再把长句回灌到前台
  - 这刀不改任何路由、mutation 或治理状态机；验证已继续覆盖定向 ESLint、定向 Go 合同测试、`pnpm typecheck:web`、`pnpm verify:web` 和 `git diff --check`
- 当前已收第九十五刀:
  - `stitch-board-inbox / stitch-chat-room / live-settings / live-setup / stitch-shell-primitives` 这轮继续把热路径里残留的说明腔压成状态句和动作句；board 的回跳提示、交接默认摘要、mailbox 顶部说明，chat 的频道/讨论摘要 fallback、消息空态、PR fallback、followed thread 说明，以及 settings/setup 的凭据/通知空态和 onboarding 回跳摘要都已进一步压短
  - `workspace_config.go` 也同步把 onboarding 模板里的 `支持中断后继续` 改成 `支持续接`，避免 setup 前端改短后，server materialization 继续吐出旧口径
  - 为了把完整 headed 验证从“环境里起本地服务”解耦，`headed-room-workbench-topic-context / headed-board-planning-surface / headed-notification-preference-delivery / headed-setup-e2e` 现在也支持通过 `--web-url`、`--server-url` 或 `OPENSHOCK_E2E_WEB_URL`、`OPENSHOCK_E2E_SERVER_URL` 复用已有 live stack；当前沙箱里复跑后，失败点已从本地 `listen EPERM` 变成目标服务不可达 `fetch failed`
  - 这刀不改任何路由、mutation、状态机或对象结构；验证已继续覆盖定向 ESLint、`pnpm typecheck:web`、`pnpm verify:web`、`apps/server/internal/store` 编译校验和 `git diff --check`。另外已尝试重跑 `pnpm test:headed-room-workbench-topic-context`，但当前沙箱仍禁止 `127.0.0.1` listen，浏览器链路证据在本会话里仍被环境阻断
- 最新证据:
  - `rg -n "被卡住的升级会显示在这里|需要你拍板的事项会和升级、审批一起更新|当前仍占用上下文的会话数量|当前仍持有运行环境或工作树的会话数量|机器列表返回后会显示占用、切换和恢复情况|正在拉取当前事项状态|新建事项并推进执行。|在房间里发言并驱动执行。|处理评审和阻塞事项。|修改仓库和运行环境。" apps/web/src/components/live-orchestration-views.tsx apps/web/src/components/live-access-views.tsx`
  - `cd apps/web && pnpm exec eslint src/components/live-orchestration-views.tsx src/components/live-access-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-setup-views.tsx src/components/live-settings-views.tsx src/components/live-mailbox-views.tsx src/components/run-control-surface.tsx src/components/phase-zero-views.tsx src/components/stitch-shell-primitives.tsx src/lib/phase-zero-helpers.ts`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api ./internal/store -run 'Test(SanitizeWorkspaceGovernanceRollupBackfillsHrefLabels|SanitizeWorkspaceSuggestedHandoffBackfillsHrefLabel|BuildStateStreamEventSanitizesSnapshot|StateRouteSanitizesPlaceholderResidue|HydrateWorkspaceGovernanceUsesCustomerFacingCopy|MailboxLifecycleHydratesWorkspaceGovernance|InboxItemActionLabelUsesKnownTargetNames|BuildGovernanceSuggestedHandoffCarriesActiveHrefLabel|WorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref)$' -count=1`
  - `pnpm typecheck:web`
  - `pnpm verify:web`
  - `git diff --check`
  - `rg -n "支持中断后继续|需要继续时回到|当前频道或私聊的说明会显示|当前讨论间的摘要会显示|这个消息面当前还没有内容|当前还没有 PR。|当前还没有评审回流。|默认值会直接保存到服务端。|最近一次发送的尝试数、送达数和失败数保持同步。|还没有接收端|还没有发送记录|还没有凭证|还没有身份通知记录" apps/web/src/components apps/server/internal/store`
  - `cd apps/web && pnpm exec eslint src/components/stitch-board-inbox-views.tsx src/components/stitch-chat-room-views.tsx src/components/live-settings-views.tsx src/components/live-setup-views.tsx src/components/stitch-shell-primitives.tsx`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run '^$' -count=1`
  - `pnpm typecheck:web`
  - `pnpm verify:web`
  - `git diff --check`
  - `node --check scripts/lib/headed-service-targets.mjs`
  - `node --check scripts/headed-room-workbench-topic-context.mjs`
  - `node --check scripts/headed-board-planning-surface.mjs`
  - `node --check scripts/headed-notification-preference-delivery.mjs`
  - `node --check scripts/headed-setup-e2e.mjs`
  - `node -e "import('./scripts/lib/headed-service-targets.mjs').then(({resolveProvidedServiceTargets})=>{console.log(JSON.stringify(resolveProvidedServiceTargets(['--web-url','http://example.com/','--server-url','http://api.example.com/'],{requireServerURL:true})))})"`
  - `OPENSHOCK_CHROMIUM_PATH=/usr/bin/chromium node ./scripts/headed-room-workbench-topic-context.mjs --web-url http://127.0.0.1:8080 --report /tmp/openshock-external-e2e-report.md`
  - `OPENSHOCK_CHROMIUM_PATH=/usr/bin/chromium node ./scripts/headed-setup-e2e.mjs --web-url http://127.0.0.1:8080 --server-url http://127.0.0.1:8080 --report /tmp/openshock-setup-external-e2e-report.md`
  - `rg -n "围绕同一条协作链路|一起同步|超时的协作事项会直接抬到治理快照里|新的分配或交接会出现在这一列|机器列表返回后，会看到占用、切换和恢复情况|正在拉取当前事项的分配与推进状态|高级权限默认收起。大多数情况下|当前身份能不能" apps/web/src/components/live-orchestration-views.tsx apps/web/src/components/live-access-views.tsx`
  - `cd apps/web && pnpm exec eslint src/components/live-orchestration-views.tsx src/components/live-access-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `git diff --check`
  - `rg -n "会直接显示|会直接展示|直接贴|等待分配或继续推进|新的事项会显示分配和推进状态|无法登录和继续使用|切换到管理员账号后再操作|你已经登录，可以继续了|直接回到聊天就行|现在只需要继续完成工作区配置|继续发言和驱动执行|所有者可管理" apps/web/src/components/live-orchestration-views.tsx apps/web/src/components/live-access-views.tsx`
  - `cd apps/web && pnpm exec eslint src/components/live-orchestration-views.tsx src/components/live-access-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `git diff --check`
  - `rg -n "你可以从开发团队|继续设置入口|当前步骤会根据|可以直接调度|运行环境调度摘要还没同步|再继续选择和调度验证|工作区模板、启动进度|换设备后也会继续读取同一份设置|凭证说明和密钥已更新|凭证说明已更新|密钥明文不会返回到|只显示凭证说明和使用状态|浏览器通知和邮件通知的默认值会直接保存到服务端|这位智能体还没有文件栈|这位智能体已绑定的凭据档案|保存后会立即刷新下一次执行预览|当前账号没有编辑权限|模型列表只作建议，也可以直接输入|资料内容、来源调整|资料还没同步|只有基线版本，暂时没有上一版可对比|不会删除历史|同步完成后会显示下一次任务会带上的内容|当前无需处理，已有内容可以继续使用|运行一次清理后会显示处理结果|方便后续任务直接使用|说明为什么这条内容值得长期复用|没有补充说明|同步完成后会显示版本变化|当前还没有恢复摘要|当前自动接棒摘要正在整理中|当前交接继续摘要正在整理中|高风险动作已经暂停|先回看同一房间里的前序执行|当前还没有可回看的房间执行历史|执行详情不只显示分支和工作目录|当前还没有暴露 token / quota warning|GitHub 状态已刷新，可以继续使用远端功能|GitHub 应用安装已就绪|GitHub 应用安装已经完成|账号已创建，继续选择模板|模板已保存，继续配置 GitHub|GitHub 已连接，可以继续|已跳过 GitHub，继续下一步|仓库已识别，继续连接运行环境|运行环境已连接，继续设置智能体|在目标项目目录中就直接读取|保存智能体并继续|完成后会直接进入聊天主界面" apps/web/src/components`
  - `cd apps/web && pnpm exec eslint src/components/live-setup-views.tsx src/components/live-settings-views.tsx src/components/live-profile-views.tsx src/components/live-memory-views.tsx src/components/phase-zero-views.tsx src/components/github-connection-console.tsx src/components/repo-binding-console.tsx src/components/onboarding-wizard.tsx`
  - `cd apps/web && pnpm typecheck`
  - `git diff --check`
  - `rg -n "当前还没有事项|当前还没有讨论间|当前还没有智能体|当前还没有执行记录|当前还没有可继续的上下文|还没有说明记录|当前没有需要升级处理的事项|当前还没有交接项|当前这条讨论间还没有挂住新的审批|当前没有待处理信号|当前没有待跟进交接|当前讨论间还没有远端或本地 PR 对象|当前还没有 webhook 回流的评审会话|当前还没有独立回复|当前还没有条目|当前没有用量或配额提醒|当前没有待处理提醒|当前还没有最近更新|当前还没有交接项；创建后会直接显示|当前房间只保留最值得继续处理的信号和交接|当前这条讨论间没有新的审批、阻塞、评审或交接需要继续处理|当前还没有事项。|当前没有待处理信号或交接|当前还没有独立回复|当前没有待处理信号" apps/web/src/components apps/server/internal/store`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/stitch-chat-room-views.tsx src/components/stitch-board-inbox-views.tsx src/components/live-detail-views.tsx src/components/live-mailbox-views.tsx src/components/pull-request-detail-view.tsx`
  - `cd apps/web && pnpm typecheck`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'Test(BuildGovernanceRulesUsesCustomerFacingLabels|HydrateWorkspaceGovernanceUsesCustomerFacingCopy|MailboxLifecycleHydratesWorkspaceGovernance)$' -count=1`
  - `cd apps/web && pnpm exec eslint src/components/github-connection-console.tsx src/components/repo-binding-console.tsx src/components/onboarding-wizard.tsx src/lib/mock-data.ts`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "当前还没有完成 GitHub 应用配置|当前还没有配置公开回跳地址|当前还没有配置公开回调地址|可以先跳过，之后再补充 GitHub 配置|可以先跳过这一步，之后再到设置页补充 GitHub 配置|如果你当前就在目标项目目录中，可以直接读取|当前还没有完成 GitHub App 安装" apps/web/src/components/github-connection-console.tsx apps/web/src/components/repo-binding-console.tsx apps/web/src/components/onboarding-wizard.tsx apps/web/src/lib/mock-data.ts apps/server/internal/store/seed.go`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-orchestration-views.tsx src/components/live-memory-views.tsx src/components/live-access-views.tsx src/components/live-setup-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "最近还没有执行记录|会直接显示，不再只藏在消息里|还没有状态说明|还没有检查记录|当前账号没有修改权限，只能查看|还没有清理记录|还没有历史版本|还没有已注册运行环境|成员管理" apps/web/src/components/live-orchestration-views.tsx apps/web/src/components/live-memory-views.tsx apps/web/src/components/live-access-views.tsx apps/web/src/components/live-setup-views.tsx`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-profile-views.tsx src/components/live-settings-views.tsx src/components/live-access-views.tsx src/components/live-memory-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "显示这个智能体|显示智能体|当前还没有可回跳|当前草稿还没有匹配到可用运行环境|当前智能体还没有暴露文件级记忆栈|当前账号没有编辑权限。仍可|当前这条凭证还没有补齐说明|凭证管理|当前没有身份通知记录|当前还没有接收端|当前没有待发送信号|请切换到管理员账号后再操作|当前成员还没有已授权设备|邀请成员与角色管理|当前没有连续异常记录|当前没有待清理项" apps/web/src/components/live-profile-views.tsx apps/web/src/components/live-settings-views.tsx apps/web/src/components/live-access-views.tsx apps/web/src/components/live-memory-views.tsx`
  - `git diff --check`
  - `cd apps/server && gofmt -w internal/store/runtime_scheduler.go internal/store/store_test.go internal/api/live_truth_hygiene.go internal/api/live_truth_hygiene_test.go`
  - `cd apps/web && pnpm exec eslint src/components/live-orchestration-views.tsx src/components/live-setup-views.tsx src/lib/phase-zero-helpers.ts src/lib/mock-data.ts`
  - `cd apps/web && pnpm typecheck`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'TestCreateIssueFailsOverToLeastLoadedRuntimeWhenPreferredRuntimeIsOffline$' -count=1`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'TestBuildStateStreamEvent(SanitizesSnapshot|RewritesRuntimeSchedulerCopy)$' -count=1`
  - `rg -n "fallback state|workspace selection|active lease|Runtime 已 failover|当前还没有最近执行记录|当前还没有运行环境调度信息|当前还没有已注册运行环境" apps/server/internal/store/runtime_scheduler.go apps/server/internal/api/live_truth_hygiene.go apps/server/internal/api/live_truth_hygiene_test.go apps/web/src/lib/phase-zero-helpers.ts apps/web/src/lib/mock-data.ts apps/web/src/components/live-orchestration-views.tsx apps/web/src/components/live-setup-views.tsx`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-profile-views.tsx src/components/live-memory-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "管理资料来源|集中展示|会直接显示" apps/web/src/components/live-profile-views.tsx apps/web/src/components/live-memory-views.tsx`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-settings-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "这里就是|统一显示|直接显示|会实时显示|说明目前" apps/web/src/components/live-settings-views.tsx`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/lib/phase-zero-helpers.ts`
  - `cd apps/web && pnpm typecheck`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'TestBuildStateStreamEventSanitizesSnapshot$' -count=1`
  - `rg -n "Owner / Member / Viewer|Research Lead|Lead Operator|review 事件" apps/server/internal/api/live_truth_hygiene.go apps/web/src/lib/phase-zero-helpers.ts`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-setup-views.tsx src/components/live-orchestration-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'TestWorkspaceConfigAndMemberPreferencesPersistAcrossReload$' -count=1`
  - `rg -n "Research Lead|Lead Operator|Owner / Member / Viewer|review 事件|起步智能体|下一步和提醒都在这里" apps/server/internal/store/workspace_config.go apps/server/internal/store/bootstrap.go apps/web/src/components/live-setup-views.tsx apps/web/src/components/live-orchestration-views.tsx`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-profile-views.tsx src/components/live-settings-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "这里显示|这里定义|这里管理|这里集中|这里的模型列表只是建议|这里只负责选择" apps/web/src/components/live-profile-views.tsx apps/web/src/components/live-settings-views.tsx`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-access-views.tsx src/components/live-bridge-console.tsx src/components/run-control-surface.tsx src/lib/phase-zero-helpers.ts src/lib/mock-data.ts`
  - `cd apps/web && pnpm typecheck`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'TestSanitizeLivePayloadRewritesFallbacks|TestStateAPIHidesDirtyProjectionBytes|TestMemoryCenterPersistsCurrentOwnerAcrossReload|TestRoomMessageUsesCurrentSessionOwnerInMemoryPreview|TestServerCarriesCurrentOwnerIntoFollowupPrompt|TestServerPreservesMemoryPreviewAcrossReload' -count=1`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'TestMemoryCenterTracksCurrentOwnerAfterSequentialRoomMessages|TestMemoryCenterPersistsCurrentOwnerAcrossReload' -count=1`
  - `rg -n "可解释真值|当前仓库真值|runtime 真值|当前频道说明正在整理中|当前私信用途正在整理中|当前 Topic 的摘要正在整理中|当前 Run 正在整理执行摘要|等待当前执行真相同步|当前控制说明正在整理中|待整理 Topic|这里只放高级权限信息|这里用于确认当前浏览器已经连到哪台机器" apps/web apps/server`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/stitch-chat-room-views.tsx src/lib/mock-data.ts`
  - `cd apps/web && pnpm typecheck`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'TestHydrateWorkspaceGovernanceUsesCustomerFacingCopy|TestMailboxLifecycleHydratesWorkspaceGovernance' -count=1`
  - `rg -n "这里只做广播|总览页|用途说明|控制面板里恢复" apps/web/src/components/stitch-chat-room-views.tsx apps/web/src/lib/mock-data.ts apps/server/internal/store/seed.go`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-detail-views.tsx src/components/live-mailbox-views.tsx src/components/onboarding-wizard.tsx src/components/github-connection-console.tsx src/components/repo-binding-console.tsx src/components/stitch-board-inbox-views.tsx src/components/stitch-chat-room-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "交接记录|这里|待处理列表|交接列表|回到这里|下一条就从这里继续|先在聊天里打开" apps/web/src/components/live-detail-views.tsx apps/web/src/components/live-mailbox-views.tsx apps/web/src/components/onboarding-wizard.tsx apps/web/src/components/github-connection-console.tsx apps/web/src/components/repo-binding-console.tsx apps/web/src/components/stitch-board-inbox-views.tsx apps/web/src/components/stitch-chat-room-views.tsx`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/onboarding-wizard.tsx src/components/github-connection-console.tsx src/components/repo-binding-console.tsx src/components/stitch-board-inbox-views.tsx src/components/stitch-chat-room-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "这里|交接列表|待处理列表|交接记录|待处理列表同步失败|只回答一件事|回到这里|下一条就从这里继续|先在聊天里打开" apps/web/src/components/onboarding-wizard.tsx apps/web/src/components/github-connection-console.tsx apps/web/src/components/repo-binding-console.tsx apps/web/src/components/stitch-board-inbox-views.tsx apps/web/src/components/stitch-chat-room-views.tsx`
  - `git diff --check`
  - `cd apps/server && gofmt -w internal/store/actions.go internal/store/workspace_governance.go internal/api/live_truth_hygiene.go internal/api/live_truth_hygiene_contract_test.go internal/store/workspace_governance_test.go internal/store/inbox_labels_test.go`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'Test(InboxItemActionLabelUsesKnownTargetNames|MailboxHrefLabelUsesCustomerFacingNames|BuildGovernanceSuggestedHandoffCarriesActiveHrefLabel|WorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref|BuildGovernanceRulesUsesCustomerFacingLabels|HydrateWorkspaceGovernanceUsesCustomerFacingCopy|MailboxLifecycleHydratesWorkspaceGovernance|GovernanceSuggestedHandoffTracksDefaultRoleRoute|AdvanceHandoffCanAutoAdvanceGovernedRoute|CreateGovernedHandoffForRoomUsesRoomSpecificSuggestion|SnapshotKeepsGovernanceResponseAggregationAuditTimestampsStable)$' -count=1`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'TestSanitizeWorkspaceGovernanceRollupBackfillsHrefLabels$|TestSanitizeWorkspaceSuggestedHandoffBackfillsHrefLabel$|TestSanitizeLiveStateFailClosesGovernanceAndAdapterResidue$' -count=1`
  - `cd apps/web && pnpm exec eslint src/components/live-orchestration-views.tsx src/components/live-detail-views.tsx src/components/phase-zero-views.tsx src/components/governance-escalation-graph.tsx src/components/stitch-board-inbox-views.tsx src/components/stitch-chat-room-views.tsx src/components/branch-head-truth-console.tsx src/components/live-setup-views.tsx src/lib/phase-zero-helpers.ts`
  - `cd apps/web && pnpm typecheck`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api ./internal/store -run '^$' -count=1`
  - `node --check scripts/headed-cross-room-governance-orchestration.mjs && node --check scripts/headed-control-plane-runtime-governance.mjs && node --check scripts/headed-planner-dispatch-replay.mjs && node --check scripts/headed-board-planning-surface.mjs`
  - `rg -n "治理阻塞|未命名治理角色|未命名治理步骤|当前治理步骤正在整理中|当前多智能体治理摘要正在整理中|当前多 Agent 治理摘要|负责人|执行泳道|自动合并闸门|这里显示|这里集中显示|这里就会|等待负责人|当前负责人|等待下一棒|下一棒" apps/web/src/components/live-orchestration-views.tsx apps/web/src/components/live-detail-views.tsx apps/web/src/components/phase-zero-views.tsx apps/web/src/components/governance-escalation-graph.tsx apps/web/src/components/stitch-board-inbox-views.tsx apps/web/src/components/stitch-chat-room-views.tsx apps/web/src/components/branch-head-truth-console.tsx apps/web/src/components/live-setup-views.tsx apps/web/src/lib/phase-zero-helpers.ts apps/server/internal/store/actions.go apps/server/internal/api/live_truth_hygiene.go scripts/headed-cross-room-governance-orchestration.mjs scripts/headed-control-plane-runtime-governance.mjs`
  - `git diff --check`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'Test(BuildGovernanceSuggestedHandoffCarriesActiveHrefLabel|WorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref|BuildGovernanceRulesUsesCustomerFacingLabels|HydrateWorkspaceGovernanceUsesCustomerFacingCopy|MailboxLifecycleHydratesWorkspaceGovernance|GovernanceSuggestedHandoffTracksDefaultRoleRoute|AdvanceHandoffCanAutoAdvanceGovernedRoute|CreateGovernedHandoffForRoomUsesRoomSpecificSuggestion|SnapshotKeepsGovernanceResponseAggregationAuditTimestampsStable)$' -count=1`
  - `cd apps/web && pnpm exec eslint src/lib/phase-zero-helpers.ts src/components/live-mailbox-views.tsx src/components/live-orchestration-views.tsx src/components/phase-zero-views.tsx`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api ./internal/store -run '^$' -count=1`
  - `cd apps/web && pnpm typecheck`
  - `rg -n "人工闸门" apps/web scripts`
  - `git diff --check`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'Test(BuildGovernanceSuggestedHandoffCarriesActiveHrefLabel|WorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref|BuildGovernanceRulesUsesCustomerFacingLabels)$' -count=1`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'Test(InboxItemActionLabelUsesKnownTargetNames|BuildGovernanceSuggestedHandoffCarriesActiveHrefLabel|WorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref|UpdateMessageSurfaceCollectionPersistsFollowedAndSavedTruth|CreateHandoffPersistsMailboxInboxAndRoomTruth|AutoCompleteDeliveryDelegationKeepsBlockedRuntimeRoomHotButMarksRouteDone)$' -count=1`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api ./internal/store -run '^$' -count=1`
  - `cd apps/web && pnpm exec eslint src/components/live-mailbox-views.tsx src/components/stitch-chat-room-views.tsx src/components/governance-escalation-graph.tsx`
  - `cd apps/web && pnpm typecheck`
  - `node --check scripts/headed-cross-room-governance-orchestration.mjs && node --check scripts/headed-governance-escalation-rollup.mjs`
  - `git diff --check`
  - `node --check scripts/headed-multi-agent-governance.mjs`
  - `node --check scripts/headed-approval-center-lifecycle.mjs`
  - `node --check scripts/headed-agent-mailbox-handoff.mjs`
  - `node --check scripts/headed-governance-escalation-queue.mjs`
  - `node --check scripts/headed-room-workbench-topic-context.mjs`
  - `node --check scripts/headed-notification-preference-delivery.mjs`
  - `node --check scripts/headed-delivery-entry-release-gate.mjs`
  - `node --check scripts/headed-governed-mailbox-route.mjs`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'TestInboxItemActionLabelUsesKnownTargetNames$|TestBuildGovernanceSuggestedHandoffCarriesActiveHrefLabel$|TestWorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref$' -count=1`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'TestSanitizePullRequestDeliveryGateBackfillsHrefLabel$|TestSanitizeWorkspaceGovernanceRollupBackfillsHrefLabels$|TestSanitizeWorkspaceSuggestedHandoffBackfillsHrefLabel$' -count=1`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api ./internal/store -run '^$' -count=1`
  - `cd apps/web && pnpm exec eslint src/lib/phase-zero-helpers.ts src/components/pull-request-detail-view.tsx src/components/governance-escalation-graph.tsx src/components/live-mailbox-views.tsx src/components/stitch-board-inbox-views.tsx`
  - `cd apps/web && pnpm typecheck`
  - `git diff --check`
  - `cd apps/web && pnpm exec eslint src/components/live-detail-views.tsx src/components/live-profile-views.tsx src/components/live-settings-views.tsx src/components/pull-request-detail-view.tsx src/components/governance-escalation-graph.tsx src/components/live-mailbox-views.tsx src/components/stitch-board-inbox-views.tsx src/lib/phase-zero-helpers.ts`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'TestSanitizePullRequestDeliveryGateBackfillsHrefLabel$|TestSanitizeWorkspaceGovernanceRollupBackfillsHrefLabels$|TestSanitizeWorkspaceSuggestedHandoffBackfillsHrefLabel$|TestStateRouteSanitizesPlaceholderResidue$' -count=1`
  - `cd apps/web && pnpm exec eslint src/app/memory/page.tsx src/app/setup/page.tsx src/app/setup/github/callback/page.tsx src/components/live-memory-views.tsx src/components/branch-head-truth-console.tsx src/components/stitch-chat-room-views.tsx`
  - `cd apps/web && pnpm exec eslint src/app/issues/page.tsx src/components/onboarding-wizard.tsx src/components/stitch-shell-primitives.tsx src/lib/mock-data.ts`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'TestInboxItemActionLabelUsesKnownTargetNames$|TestBuildGovernanceSuggestedHandoffCarriesActiveHrefLabel$|TestWorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref$' -count=1`
  - `cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run '^$' -count=1`
  - `cd apps/web && pnpm exec eslint src/app/page.tsx src/components/stitch-chat-room-views.tsx src/lib/mock-data.ts`
  - `node --check scripts/headed-cross-room-governance-orchestration.mjs`
  - `node --check scripts/headed-planner-dispatch-replay.mjs`
  - `bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/api -run TestPullRequestDetailRouteReturnsConversationAndBacklinks -count=1'`
  - `pnpm test:headed-delivery-entry-release-gate`
  - `pnpm test:headed-room-workbench-topic-context`
  - `pnpm test:headed-cross-room-governance-orchestration`
  - `pnpm typecheck:web`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-chat-room-views.tsx'`
  - `node --check scripts/headed-dm-followed-thread-saved-later.mjs`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-chat-room-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "打开列表|surfaceHref" apps/web/src/components/stitch-chat-room-views.tsx scripts/headed-dm-followed-thread-saved-later.mjs`
  - `gofmt -w apps/server/internal/store/workspace_governance.go apps/server/internal/api/live_truth_hygiene.go apps/server/internal/api/live_truth_hygiene_test.go`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run TestSanitizeWorkspaceGovernanceRollupBackfillsHrefLabels -count=1'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/governance-escalation-graph.tsx'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "查看上下文" apps/web/src/components/governance-escalation-graph.tsx apps/server/internal/api/live_truth_hygiene.go`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run TestBuildGovernanceSuggestedHandoffCarriesActiveHrefLabel -count=1'`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'Test(SanitizeWorkspaceSuggestedHandoffBackfillsHrefLabel|SanitizeWorkspaceGovernanceRollupBackfillsHrefLabels)$' -count=1'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/live-mailbox-views.tsx src/components/stitch-board-inbox-views.tsx src/lib/phase-zero-helpers.ts src/lib/live-phase0.ts'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "收尾详情|governedCloseoutLabel\\(" apps/web/src/components/live-mailbox-views.tsx apps/web/src/components/stitch-board-inbox-views.tsx`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/store -run 'Test(BuildGovernanceSuggestedHandoffCarriesActiveHrefLabel|WorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref)$' -count=1'`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'Test(SanitizeWorkspaceSuggestedHandoffBackfillsHrefLabel|SanitizeWorkspaceGovernanceRollupBackfillsHrefLabels)$' -count=1'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/governance-escalation-graph.tsx src/components/live-mailbox-views.tsx src/components/live-orchestration-views.tsx src/lib/phase-zero-helpers.ts'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "查看下一棒|查看收口详情" apps/web/src/components/governance-escalation-graph.tsx apps/web/src/components/live-mailbox-views.tsx apps/web/src/components/live-orchestration-views.tsx apps/web/src/lib/phase-zero-helpers.ts apps/server/internal/store/workspace_governance.go apps/server/internal/api/live_truth_hygiene_test.go`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'TestSanitizePullRequestDelivery(Gate|Evidence)BackfillsHrefLabel$' -count=1'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/pull-request-detail-view.tsx'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "关联详情" apps/web/src/components/pull-request-detail-view.tsx apps/server/internal/store/delivery_entry.go apps/server/internal/api/live_truth_hygiene_test.go`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/live-settings-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/pull-request-detail-view.tsx'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-chat-room-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `node --check scripts/headed-notification-preference-delivery.mjs`
  - `node --check scripts/headed-delivery-entry-release-gate.mjs`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api -run 'TestSanitizePullRequestDelivery(Gate|Evidence)BackfillsHrefLabel' -count=1'`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api ./internal/store -run '^$' -count=1'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/onboarding-wizard.tsx src/components/github-connection-console.tsx src/components/repo-binding-console.tsx'`
  - `node --check scripts/headed-github-app-onboarding.mjs`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-shell-primitives.tsx'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/pull-request-detail-view.tsx'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/live-orchestration-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/live-detail-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-board-inbox-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/live-mailbox-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/live-orchestration-views.tsx'`
  - `pnpm build:web`
  - `pnpm test:headed-governed-mailbox-delegate-visibility`
  - `pnpm test:headed-approval-center-lifecycle`
  - `pnpm test:headed-agent-mailbox-handoff`
  - `pnpm test:headed-governed-mailbox-delegation`
  - `pnpm test:headed-room-workbench-topic-context`
  - `pnpm test:headed-topic-route-resume-lifecycle`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/governance-escalation-graph.tsx src/components/live-mailbox-views.tsx src/components/live-orchestration-views.tsx src/components/pull-request-detail-view.tsx'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "打开下一步|打开详情" apps/web/src/components/governance-escalation-graph.tsx apps/web/src/components/live-mailbox-views.tsx apps/web/src/components/live-orchestration-views.tsx apps/web/src/components/pull-request-detail-view.tsx`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-chat-room-views.tsx'`
  - `node --check scripts/headed-room-workbench-topic-context.mjs`
  - `git diff --check`
  - `rg -n "打开话题页" apps/web/src/components/stitch-chat-room-views.tsx scripts/headed-room-workbench-topic-context.mjs`
  - `pnpm test:headed-planner-dispatch-replay`
  - `pnpm test:headed-governance-escalation-queue`
  - `pnpm test:headed-governance-escalation-rollup`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-board-inbox-views.tsx src/components/live-mailbox-views.tsx src/components/pull-request-detail-view.tsx'`
  - `node --check scripts/headed-agent-mailbox-handoff.mjs`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "打开收件箱|打开主交接|打开回复" apps/web/src/components/stitch-board-inbox-views.tsx apps/web/src/components/live-mailbox-views.tsx apps/web/src/components/pull-request-detail-view.tsx`
  - `gofmt -w apps/server/internal/store/types.go apps/server/internal/store/delivery_entry.go apps/server/internal/api/live_truth_hygiene.go apps/server/internal/api/server_contract_test.go`
  - `bash -lc 'cd apps/server && GOCACHE=/tmp/openshock-go-cache ../../scripts/go.sh test ./internal/api ./internal/store -run "^$" -count=1'`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/pull-request-detail-view.tsx'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "打开交接项|打开交付详情" apps/web/src/components/pull-request-detail-view.tsx`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-board-inbox-views.tsx src/components/live-mailbox-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "打开交付详情" apps/web/src/components/stitch-board-inbox-views.tsx apps/web/src/components/live-mailbox-views.tsx`
  - `bash -lc 'cd apps/web && pnpm exec eslint src/components/stitch-board-inbox-views.tsx src/components/live-mailbox-views.tsx'`
  - `bash -lc 'cd apps/web && pnpm typecheck'`
  - `git diff --check`
  - `rg -n "打开交接|打开当前交接" apps/web/src/components/stitch-board-inbox-views.tsx apps/web/src/components/live-mailbox-views.tsx`
  - `pnpm test:headed-cross-room-governance-orchestration`
  - `pnpm test:headed-cross-room-governance-auto-closeout`
- Checklist: `CHK-01` `CHK-16`
- Test Cases: `TC-096`

## TKT-102 Explicit Provider Thread State Persistence

- 状态: `done`
- 优先级: `P0`
- 目标: 把显式 provider thread state 做成 daemon-managed local truth；即便真实 app-server transport 还没接进来，daemon 也要先把 thread state 的写回、持久化和 resume 注入 contract 站住。
- 范围:
  - `SESSION.json.appServerThreadId` 写回与复用
  - thread-state file contract
  - daemon restart 后的 thread state env reinjection
  - runtime / API contract tests
- 依赖: `TKT-99`
- Done When:
  - 同一 session 的 provider thread state 能由执行进程写回 daemon 提供的 thread-state file
  - daemon restart 后再 resume，会把已持久化的 `appServerThreadId` 重新注入执行进程环境
  - `SESSION.json` 不再只有占位 `appServerThreadId`
- 最新证据:
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test ./internal/runtime -run "TestRunPromptPersistsAppServerThreadIDFromProviderStateFile|TestResumeSessionExportsPersistedAppServerThreadIDAcrossRestart" -count=1'`
  - `bash -lc 'cd apps/daemon && ../../scripts/go.sh test ./internal/api -run "TestExecRoutePersistsAndReusesAppServerThreadID" -count=1'`
- Checklist: `CHK-14` `CHK-15`
- Test Cases: `TC-097`

---

## 五、已完成批次归档

- `TKT-01` `done`
  - Runtime pairing 冷启动一致性已收平，Setup 首跳不再因旧 daemon URL 漂移而 502。
- `TKT-02` `done`
  - `ops:smoke` / release gate 已能显式拦截 pairing 漂移。
- `TKT-03` `done`
  - headed Setup 主链自动化已建立，并能输出截图、trace、日志与报告。
- `TKT-04` `done`
  - GitHub App onboarding / repo binding blocked UX 已在浏览器里可复核。
- `TKT-05` `done`
  - signed webhook replay / review sync exact evidence 已补齐。
- `TKT-06` `done`
  - 真实远端 PR create / sync / merge browser loop 已通过。
- `TKT-07` `done`
  - login / logout / session persistence foundation 已站住。
- `TKT-08` `done`
  - workspace invite / member / role lifecycle 已站住。
- `TKT-09` `done`
  - action-level authz matrix 已接到 live frontend + backend guards。
- `TKT-10` `done`
  - approval center lifecycle 已落到 `/inbox`。
- `TKT-11` `done`
  - browser push / email preference / delivery chain 已站住。
- `TKT-12` `done`
  - memory injection / promotion / governance surface 已站住，并已在 2026-04-08 再次完成 headed 重跑。
- `TKT-13` `done`
  - stop / resume / follow-thread 人类接管链已站住，并已在 2026-04-08 再次完成 headed 重跑。
- `TKT-14` `done`
  - multi-runtime scheduler / lease / failover 已站住。
- `TKT-15` `done`
  - 权限矩阵已站住，但更完整 destructive guard 已拆成新的 `TKT-30`。
- `TKT-16` `done`
  - 统一 workspace shell、shared sidebar/topbar、同源 `/api/control/*` proxy、Work 激活态与 2026-04-08 work-shell smoke 已收口。
- `TKT-17` `done`
  - 原大票已拆分为 `TKT-21` `TKT-22` `TKT-23`，不再把 search / DM / thread / workbench 混成一个不可收口的范围。
- `TKT-18` `done`
  - 原 profile 方向已重组为更清晰的 `TKT-25`。
- `TKT-19` `done`
  - 原 room workbench 方向已重组为更清晰的 `TKT-23`。
- `TKT-20` `done`
  - Board 已降到左下角次级入口；后续轻量 planning cleanup 继续由 `TKT-26` 收尾。

---

## 六、2026-04-21 增量证据

- Setup 协作预览补上 `defaultAgent` 可见性，`setup-governance-lane-${lane.id}-agent` 现在会直接显示当前 lane 的默认智能体。
- seed / mock 补入真实 developer agent `Build Pilot`，用于 4-agent 网站交付链路的 architect -> developer -> reviewer -> qa 接力。
- 新增 `pnpm test:headed-website-four-agent-delivery`，覆盖网站需求从 setup / planner / mailbox governance 到最终 response aggregation 的完整四棒回放。
- `scripts/headed-planner-dispatch-replay.mjs` 已补 `--web-url` / `--server-url` external live stack 模式；在当前沙箱里复跑后，失败点已从本地 listen 前移到目标 `healthz` 不可达。
- 本轮验证:
  - `node --check scripts/headed-planner-dispatch-replay.mjs`
  - `node --check scripts/headed-website-four-agent-delivery.mjs`
  - `pnpm typecheck:web`
  - `pnpm lint:web`
  - `git diff --check`
  - `OPENSHOCK_CHROMIUM_PATH=/usr/bin/chromium node ./scripts/headed-planner-dispatch-replay.mjs --web-url http://127.0.0.1:8080 --server-url http://127.0.0.1:8080 --report /tmp/openshock-planner-external-report.md`
  - `OPENSHOCK_CHROMIUM_PATH=/usr/bin/chromium node ./scripts/headed-website-four-agent-delivery.mjs --web-url http://127.0.0.1:8080 --server-url http://127.0.0.1:8080 --report /tmp/openshock-website-four-agent-report.md`
