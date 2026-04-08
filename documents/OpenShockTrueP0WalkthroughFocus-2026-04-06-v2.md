# OpenShock True P0 下一轮全面走查关注点

- 版本：0.1
- 日期：2026-04-06
- 目的：基于最新技术设计，给下一轮全面走查提供明确关注点
- 关联文档：
  - `documents/OpenShockTrueP0TechnicalDesign.md`
  - `documents/OpenShockTrueP0BusinessTestCases.md`
  - `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md`

---

## 1. 本轮走查不再重复证明什么

以下主链路已经在修复后走查里拿到通过证据，下一轮不是从零证明：

1. Issue -> Room -> Integration Branch 能创建
2. Room 内 repo 绑定可走 UI 路径
3. Task 创建、Run 发起、Merge 审批、Delivery 创建、Webhook 闭环可跑通
4. Room 内人类 -> agent -> agent 的基本协作流已拿到真实样本

下一轮的重点不是“系统能不能跑”，而是“按最新设计约束，当前实现会不会跑偏”。

---

## 2. 下一轮必须重点验证的 4 个设计边界

### 2.1 Agent 和 Runtime 不能混同

要回答清楚：

1. 哪个 Agent 被要求响应
2. 最终由哪个 Runtime 执行
3. Runtime 不可用时，是否还能保留“该由哪个 Agent 响应”的产品语义

重点观察：

1. Room 中的被点名对象
2. daemon claim 结果
3. 页面或系统消息是否把 Runtime 错当成 Agent 身份展示

### 2.2 长活 provider thread 不应吞掉业务边界

要回答清楚：

1. `provider_thread_id` 是否属于 `agent_session`
2. `agent_turn` 是否只是注入本轮 `event_frame`
3. 同一 Agent 连续多轮回复时，会不会把别的 Room / Task / Message 上下文串进来

重点观察：

1. 同一 Room 下连续两轮不同指令
2. 不同 Room 下同一 Agent 的切换
3. 回复里是否引用了错误的任务、错误的来源消息或错误的频道语境

### 2.3 私聊控制到跨频道发言必须依赖显式桥接上下文

要回答清楚：

1. 目标频道为什么是这个
2. 来源消息是哪条
3. 是谁请求 Agent 发过去的
4. 当前关联的 Issue / Task 是什么

重点观察：

1. `source_room_id`
2. `source_message_id`
3. `requested_by`
4. `related_issue_id`
5. `context_summary`

### 2.4 一次性投递和持续协作分支必须区分

要回答清楚：

1. 这次跨频道只是“去说一句话”
2. 还是“去目标频道接着协作”

重点观察：

1. 目标频道是否创建本地 `agent_session`
2. 后续回复是否继续在目标频道收敛
3. 是否错误依赖来源控制入口继续驱动所有回复

---

## 3. 下一轮建议走查顺序

建议按下面顺序推进：

1. 先跑主链路 smoke，确认当前基线没退化
2. 再跑 Agent / Runtime 映射
3. 再跑长期 provider thread + event frame
4. 再跑同频道内 Agent-Agent 交接
5. 最后如果入口具备，再跑私聊控制和跨频道桥接

这样可以避免：

1. 主链路还没稳就去测跨频道
2. Agent / Runtime 语义还没看清就去判断跨频道行为

---

## 4. 报告里必须额外写清的观察项

下一轮报告除了常规通过/失败外，建议额外单列下面几项：

1. Agent / Runtime 映射是否清晰
2. provider thread 复用是否发生上下文串台
3. `event_frame` 是否足以支撑每轮回复的目标定位
4. 跨频道桥接是否可追溯
5. 一次性投递和持续协作是否被正确区分

---

## 5. 结论标准

下一轮如果要给出“设计与实现基本对齐”的结论，至少要满足：

1. 主链路继续通过
2. Agent / Runtime 没有语义混淆
3. 长期 provider thread 没有造成上下文串台
4. 如果跨频道能力已具备，桥接上下文必须可解释、可追溯

如果其中任一项不成立，就不能只写成“体验问题”，而要进一步判断这是：

1. 真 bug
2. 设计缺口
3. 需求微调
4. 当前尚未实现
