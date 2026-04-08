# OpenShock 最近讨论与测试清单总览

- 日期：2026-04-07
- 目的：汇总最近一轮收敛讨论涉及的主题、已有 testcase、已出报告，方便快速了解“都测了什么”

---

## 1. 最近几轮主要讨论主题

### A. Agent / Runtime / provider thread 对象边界

讨论结论：

1. `Agent` 是协作对象，`Runtime` 是执行载体
2. 更贴近当前样本的模型是：`1 Agent -> 1 long-lived provider thread`
3. `agent_turn` 不承担长期上下文，而是向该 Agent 的长期 thread 注入本轮 `event_frame`
4. 跨频道发言依赖显式 bridge context，不靠隐式全局记忆

对应文档：

1. `documents/OpenShockTrueP0TechnicalDesign.md`
2. `documents/OpenShockTrueP0WalkthroughFocus-2026-04-06-v2.md`

对应 testcase：

1. `TC-COMM-008` 长期 provider thread 下的 `event_frame` 不应串上下文
2. `TC-BIZ-019` 人类能够回答“哪个 Agent 该响应，由哪个 Runtime 执行”
3. `TC-BIZ-020` 人类能够回答“这轮回复为什么会发到这个频道”

---

### B. `/rooms/[issueId]` deep link 兼容

讨论结论：

1. `/rooms/room_xxx` 与 `/rooms/issue_xxx` 都应能正常落页
2. `issue_xxx` 需要先查 issue，再解析到对应 `room.id`

对应结果：

1. `BUG-MVP-002` 已关闭

对应文档：

1. `documents/OpenShockMVPBugList.md`

---

### C. providerThreadId / eventFrame 可观测性

讨论结论：

1. QA 第二轮设计边界验证需要直接看到 `providerThreadId / eventFrame`
2. 结构化 payload 必须足够支撑回溯：instruction -> agent_turn -> daemon claim -> agent reply

对应 testcase /关注点：

1. `TC-COMM-008`
2. `documents/OpenShockTrueP0WalkthroughFocus-2026-04-06-v2.md`

---

### D. 长会话 bug：delivery webhook -> Room 实时刷新

讨论结论：

1. 之前保留为 `BUG-MVP-001`
2. 后续已按长会话手工回归继续补证据

对应文档：

1. `documents/OpenShockMVPBugList.md`
2. `documents/OpenShockMVPBug001RealtimeRegression-2026-04-06.md`
3. `documents/OpenShockMVPRegressionChecklist.md`

---

### E. 默认响应语义重构

这部分是最近讨论最多的一块，最后收成了 3 条稳定结论：

1. 首条回复应 `chat-first`
2. `@mention` 只是增强信号，不是另一套流程入口
3. `task` 是对话分析结果，不是默认响应入口

中间经历过两次重要收敛：

1. 从旧的 `monitoring/fallback/default_monitor_response` 解释，收成统一消息处理语义
2. 再进一步收成“按可见性广播 + agent 自决是否回应”

最终补掉的单点阻塞是：

1. 未 `@mention` 的纯状态播报此前不会进入 `agent_turn`
2. 修完后，未 `@mention` 和显式 `@mention` 的同类状态播报都会进入统一的 `visible_message_response`
3. `@mention` 的差异只剩输入信号增强

对应文档：

1. `documents/OpenShockTrueP0TechnicalDesign.md`
2. `documents/OpenShockDefaultResponseWalkthroughFocus-2026-04-07.md`
3. `documents/OpenShockDefaultResponseRegression-2026-04-07.md`
4. `documents/OpenShockDefaultResponseRegression-2026-04-07-followup.md`

对应 testcase：

1. `TC-COMM-011` 默认响应先是 chat-first，而不是任务化表达
2. `TC-COMM-012` `@mention` 只是增强信号，不是另一套流程入口
3. `TC-COMM-013` task 是对话分析结果，不是默认响应入口

---

### F. Workspace 级 Repo 绑定模型切换

讨论结论：

1. repo 不再绑在 issue 级别
2. repo 绑定真相提升到 workspace 级别
3. `Workspace.bind_repo` 成为唯一有效入口
4. 旧 `Issue.bind_repo` 必须明确拒绝
5. `run / merge / delivery` 都只从 workspace repo 解析

对应文档：

1. `documents/OpenShockTrueP0TechnicalDesign.md`
2. `documents/OpenShockWorkspaceRepoBindingQA-2026-04-07.md`
3. `documents/OpenShockWorkspaceRepoBindingQA-2026-04-07-blocked.md`

---

## 2. 当前 testcase 主清单

主用例文档：

1. `documents/OpenShockTrueP0BusinessTestCases.md`

### 2.1 主链路业务用例

1. `TC-BIZ-001` 进入协作壳并看到协作资源
2. `TC-BIZ-002` 创建 Issue 后自动形成协作容器
3. `TC-BIZ-003` 在 Issue 下拆解多个 Task 并分配给不同 Agent
4. `TC-BIZ-004` Task 被排队为 Run，进入执行体系
5. `TC-BIZ-005` Runtime 注册并领取排队中的 Run
6. `TC-BIZ-006` 同一 Issue 下两个 Task 进入并行执行
7. `TC-BIZ-007` Run 执行中出现 blocked / approval_required 后回流到人类
8. `TC-BIZ-008` 人类在 Inbox 中批准 Run 继续推进
9. `TC-BIZ-009` Task 标记为可集成并发起集成请求
10. `TC-BIZ-010` 人类批准 merge，将 Task 结果合入 Integration Branch
11. `TC-BIZ-011` 集成冲突时，系统把冲突升级为协作问题
12. `TC-BIZ-012` 多个 Task 集成完成后，Integration Branch 进入可交付状态
13. `TC-BIZ-013` 创建 Delivery PR，Issue 进入交付阶段
14. `TC-BIZ-014` Delivery PR 合入后，Issue 正式完结

### 2.2 沟通协作用例

1. `TC-COMM-001` 人类在频道内向 Agent 下达任务与约束
2. `TC-COMM-002` Agent 在频道内确认理解并回复执行计划
3. `TC-COMM-003` Agent 执行中主动汇报进展
4. `TC-COMM-004` Agent 遇到阻塞时在频道中主动提问
5. `TC-COMM-005` Agent 完成后在频道内提交结果摘要
6. `TC-COMM-006` 两个 Agent 围绕同一 Issue 在频道内协同
7. `TC-COMM-007` Agent 之间完成交接与 follow-up 协调
8. `TC-COMM-008` 长期 provider thread 下的 event_frame 不应串上下文
9. `TC-COMM-009` 私聊控制触发一次性跨频道投递
10. `TC-COMM-010` 私聊控制触发跨频道持续协作分支
11. `TC-COMM-011` 默认响应先是 chat-first，而不是任务化表达
12. `TC-COMM-012` `@mention` 只是增强信号，不是另一套流程入口
13. `TC-COMM-013` task 是对话分析结果，不是默认响应入口

### 2.3 异常与稳态用例

1. `TC-BIZ-015` Runtime 心跳丢失后的人类可感知性
2. `TC-BIZ-016` 同一 Run 不应被重复领取
3. `TC-BIZ-017` 重复 webhook 不应重复改变交付结果
4. `TC-BIZ-018` 人类能够回答“现在卡在哪里”
5. `TC-BIZ-019` 人类能够回答“哪个 Agent 该响应，由哪个 Runtime 执行”
6. `TC-BIZ-020` 人类能够回答“这轮回复为什么会发到这个频道”

---

## 3. 已出的走查 / 回归 / 报告文档

### 3.1 全面走查与关注点

1. `documents/OpenShockTrueP0WalkthroughFocus-2026-04-06-v2.md`
2. `documents/OpenShockTrueP0WalkthroughReport-2026-04-06.md`
3. `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md`
4. `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-v2.md`
5. `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-v3.md`

### 3.2 默认响应语义专项

1. `documents/OpenShockDefaultResponseWalkthroughFocus-2026-04-07.md`
2. `documents/OpenShockDefaultResponseRegression-2026-04-07.md`
3. `documents/OpenShockDefaultResponseRegression-2026-04-07-followup.md`

### 3.3 Workspace Repo 绑定专项

1. `documents/OpenShockWorkspaceRepoBindingQA-2026-04-07-blocked.md`
2. `documents/OpenShockWorkspaceRepoBindingQA-2026-04-07.md`

### 3.4 Bug / 回归专项

1. `documents/OpenShockMVPBugList.md`
2. `documents/OpenShockMVPBug001RealtimeRegression-2026-04-06.md`
3. `documents/OpenShockMVPRegressionChecklist.md`
4. `documents/OpenShockMVPQALoop.md`

---

## 4. 现在已经测到什么程度

### 已确认闭合

1. 主链路 P0 测试面和第二轮走查边界已经建立
2. Agent / Runtime / provider thread / event_frame 的对象边界已进入可验证状态
3. `/rooms/[issueId]` deep link 问题已验证关闭
4. workspace 级 repo 绑定模型已验证关闭
5. 默认响应新语义已验证闭合：
   - `chat-first`
   - `@mention` 仅作增强信号
   - `task` 不是默认响应入口

### 保留为后续体验/调优，不再算当前阻塞

1. FYI / 状态播报类文本在真实 codex 下更适合轻量 ack 还是 `no_response`
2. 这属于后续体验 / 提示词调优项，不影响当前闭环结论

---

## 5. 建议怎么看这些文档

如果你只想快速了解“这轮到底聊了什么、测了什么”，建议按这个顺序看：

1. `documents/OpenShockRecentDiscussionAndTestInventory-2026-04-07.md`
2. `documents/OpenShockTrueP0BusinessTestCases.md`
3. `documents/OpenShockDefaultResponseRegression-2026-04-07.md`
4. `documents/OpenShockDefaultResponseRegression-2026-04-07-followup.md`
5. `documents/OpenShockWorkspaceRepoBindingQA-2026-04-07.md`
6. `documents/OpenShockMVPBugList.md`
