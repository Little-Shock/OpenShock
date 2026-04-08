# OpenShock MVP Bug List

- 版本：0.1
- 日期：2026-04-06
- 用途：MVP 收尾阶段唯一问题入口
- 关联文档：
  - `documents/OpenShockMVPQALoop.md`
  - `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md`
  - `documents/OpenShockTrueP0BusinessTestCases.md`

---

## 1. 维护规则

这份文档是当前阶段唯一的问题入口。

后续所有新发现的问题，不再散落在：

1. 聊天消息
2. 口头同步
3. walkthrough 备注
4. 临时截图说明

统一要求：

1. 新问题先录入本文件，再进入修复分流。
2. 每个问题必须带上类型、优先级、影响层、闭环影响、回归要求。
3. 已修复问题可以移到“已关闭记录”区，但不能直接删掉。
4. 已知限制和非 bug 项单独记录，避免重复提报。

---

## 2. 当前状态总览

截至 `2026-04-06` 当前基线：

1. `OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md` 对应主链路已通过。
2. 旧走查报告中暴露的核心问题已在修复后关闭：
   - Repo 绑定入口缺失
   - Room 无 Task 创建入口
   - Board Quick Create 写错 issue
   - daemon agent-turn 404 噪音
   - agent 协作入口缺失
   - run 后未自动 commit
   - delivery webhook 未推送 issue scope
3. 当前收尾阶段仍需继续跟踪的，是“新变更是否打回这些已通过主链路”以及“剩余待验证项是否真实稳定”。

---

## 3. 当前未关闭问题

当前无未关闭真 bug。

---

## 4. 当前非缺陷项 / 不纳入本轮 bug

### NONBUG-MVP-001 in-memory store 导致重启后运行态数据丢失

#### 原因
- 当前实现明确还是 in-memory store

#### 处理规则
- 默认不作为当前 bug 提报
- 仅在当前需求已明确要求持久化时才升级

### NONBUG-MVP-002 历史 seed 数据中的旧失败态

#### 原因
- 例如旧 seed issue 上遗留的 `run_review_01` 因缺失 `repoPath` 失败
- 这是旧样本状态，不代表当前修复后的新链路回归

#### 处理规则
- 不作为新 bug 统计
- 如影响演示或测试清晰度，可单独建清理任务

### NONBUG-MVP-003 未来路线图能力尚未产品化

#### 原因
- 例如 Postgres、outbox、更完整的外部平台集成

#### 处理规则
- 不按当前缺陷处理
- 只有进入明确当前范围后才纳入测试闭环

---

## 5. 已关闭记录

以下问题来自 `OpenShockTrueP0WalkthroughReport-2026-04-06.md`，并在修复后走查中确认关闭：

1. Repo 绑定缺少产品化入口
2. Issue Room 无 Task 创建入口
3. Task Board Quick Create 错误写死 `issue_101`
4. daemon agent-turn 404 噪音
5. 频道内缺少人类 / agent / agent 协作入口
6. run 完成后未自动提交，导致 merge 链路不稳
7. delivery webhook 不推送 issue scope

关闭依据：

- `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md`

第二轮新增关闭项：

### BUG-MVP-001 Delivery webhook 的 Room 实时刷新需要完整长会话回归确认

#### 类型
- 真 bug 候选 / 待完整回归确认

#### 严重度
- P1

#### 影响层
- cross-layer

#### 闭环影响
- 是
- 涉及 `delivery -> webhook -> issue status -> room realtime refresh` 闭环

#### 来源
- `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md` 的“剩余风险与说明”

#### 补充验证摘要
- 在隔离 long-running backend/frontend 会话中，使用最小真实链路创建 `issue_104 -> pr_102`
- Room 页面保持打开，不手工刷新
- webhook 回写 `externalPrId = gh_pr_102, status = merged` 后：
  - Room 内新增 `Delivery PR pr_102 merged via github webhook.` 系统消息
  - Delivery 主状态由 `open` 自动变为 `merged`
  - 重进 `/rooms/issue_104` 后状态保持一致

#### 关闭依据
- `documents/OpenShockMVPBug001RealtimeRegression-2026-04-06.md`

#### 当前状态
- closed

---

### BUG-MVP-002 Room 深链接 `/rooms/[issueId]` 直接打开时返回前端 500

#### 类型
- 真 bug

#### 严重度
- P0

#### 影响层
- frontend / cross-layer

#### 闭环影响
- 是
- 影响 Room 页面入口与主链路页面验收

#### 来源
- `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-v2.md`

#### 修复摘要
- 前端路由兼容解析 `room_...` 与 `issue_...`
- 传入 `issue_...` 时先查 issue，再取其 `room.id` 打开对应 Room

#### QA 回归结果
第二轮在隔离环境中已验证通过：

1. `/rooms/room_104`
2. `/rooms/issue_104`
3. `/rooms/room_101`
4. `/rooms/issue_101`

以上入口均正常渲染，无 500 页面，浏览器未见 console error。

#### 关闭依据
- `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-v3.md`

#### 当前状态
- closed

---

### BUG-MVP-003 `RoomMessage.post(kind=\"instruction\")` 不会创建 `agent_turn`

#### 类型
- 真 bug / 设计实现未对齐

#### 严重度
- P1

#### 影响层
- backend / cross-layer

#### 闭环影响
- 是
- 影响 `instruction -> agent_turn -> daemon claim -> agent reply` 闭环

#### 来源
- `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-v2.md`

#### 修复摘要
- 显式 `kind=\"instruction\"` 现在进入同类人类指令编排
- clarification 后的人类 `kind=\"instruction\"` follow-up 也会重新入队 `agent_turn`
- 消息本身的 `kind` 保持为 `instruction`

#### QA 回归结果
第二轮在隔离环境中已验证通过：

1. 首条 `RoomMessage.post(kind=\"instruction\")` 成功创建 `agent_session_101 / turn_101`
2. daemon 成功 claim 并完成 `turn_101`
3. agent 真实回写 `summary` 消息
4. clarification 后的人类 `kind=\"instruction\"` follow-up 成功创建 `turn_102`
5. daemon 成功 claim 并完成 `turn_102`
6. agent 真实回写 `plan` 消息

#### 关闭依据
- `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-v3.md`

#### 当前状态
- closed

---

## 6. 新问题录入模板

```md
### BUG-MVP-XXX 标题

#### 类型
- 真 bug / 需求微调 / 当前限制 / 待澄清

#### 严重度
- P0 / P1 / P2 / P3

#### 影响层
- frontend / backend / daemon / cross-layer / product-rule

#### 闭环影响
- 是 / 否
- 如果是，明确是否影响 `action / run / merge / delivery`

#### 来源
- 哪次测试、哪条消息、哪份报告

#### 复现前提
- 代码版本：
- 服务启动方式：
- 测试 repo：
- runtime / agent / provider：

#### 复现步骤
1.
2.
3.

#### 预期结果
- 

#### 实际结果
- 

#### 初步判断
- 怀疑原因：
- 是否影响状态闭环：

#### 修复后必须回归
- 

#### 当前状态
- open / in_fix / in_regression / closed
```
