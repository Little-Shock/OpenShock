# OpenShock 默认响应新语义定向复验补充报告

- 版本：0.1
- 日期：2026-04-07
- 对应任务：`#20`
- 前置基线：`documents/OpenShockDefaultResponseRegression-2026-04-07.md`
- 目的：只验证 `#19` 中单点阻塞是否已关闭，不重跑整组默认响应语义

---

## 1. 本轮只验证什么

本轮只回归 `#20` 指向的单点阻塞：

1. 未 `@mention` 的纯状态播报是否也会进入 `visible_message_response`
2. 加不加 `@mention` 的差异是否只剩输入信号增强，而不再体现在“是否进入 turn”
3. 浏览器侧是否能在真实 codex 下观察到实际用户体验

不重跑的内容：

1. `#18` 的 prompt / `no_response` 语义基础能力
2. `chat-first`
3. `task` 非默认入口

这些内容以前一版报告为准。

---

## 2. 回归环境

### 2.1 服务

1. backend: `127.0.0.1:18087`
2. frontend: `http://localhost:13005`

### 2.2 Codex

本轮 daemon 消费使用真实 codex：

1. `codex-cli 0.118.0`
2. 不使用 fake codex

### 2.3 房间

使用干净讨论房间：

1. `room_002 / Roadmap`

---

## 3. 样本与结果

### 3.1 样本 A：未 `@mention` 的状态播报

输入消息：

- `我刚把文档同步好了。`

API 结果：

1. 成功创建 `msg_101`
2. 同时创建：
   - `turn_101`
   - `agentId = agent_guardian`
   - `intentType = visible_message_response`
   - `status = queued`

这说明：

- 未 `@mention` 的纯状态播报现在已经会进入统一 turn
- 不再被 backend 在 agent 自决之前直接拦掉

真实 codex 消费后：

1. `turn_101.status = completed`
2. room 新增 agent 回复：
   - `收到，我这边看到了。后面如果需要一起过一遍变更点，直接叫我。`

浏览器可见结果：

1. Roadmap 房间出现该人类消息
2. 紧接着出现 `agent_guardian` 的自然语言回复
3. Agent Queue 中对应 turn 显示为 `visible message response / completed`

### 3.2 样本 B：显式 `@mention` 的状态播报

输入消息：

- `@agent_shell FYI，我刚把文档同步好了。`

API 结果：

1. 成功创建 `msg_103`
2. 同时创建：
   - `turn_102`
   - `agentId = agent_shell`
   - `intentType = visible_message_response`
   - `status = queued`

真实 codex 消费后：

1. `turn_102.status = completed`
2. room 新增 agent 回复：
   - `收到，我这边知道了。后面如果需要我一起过一下变更点或补充落地项，直接叫我。`

浏览器可见结果：

1. 同类状态播报在显式 `@mention` 下仍然进入 `visible_message_response`
2. 区别主要体现在目标 agent 更明确地落到 `agent_shell`
3. 没有再出现“只有加了 `@mention` 才能进 turn”的行为差异

---

## 4. 判定

### 4.1 `#20` 结论

`通过`

### 4.2 通过依据

1. 未 `@mention` 的纯状态播报现在也会创建 `visible_message_response`
2. 显式 `@mention` 的同类状态播报同样创建 `visible_message_response`
3. 两者的共同点已经是：
   - 都进入统一 turn 语义
   - 都由 agent / prompt 决定后续如何回应
4. 两者的差异已经收缩为：
   - `@mention` 让目标 agent 更明确
   - 不再决定“是否进入 turn”

### 4.3 额外观察

本轮真实 codex 在这两个状态播报样本上都给出了轻量自然语言回复，没有选择 `no_response`。

这不构成当前 `#20` 的失败，因为：

1. `#20` 要修的是 turn 入口差异
2. 当前已验证入口差异被移除
3. “此类 FYI 文本更适合 `no_response` 还是轻量 ack”属于后续用户体验/提示词调优范围，不是本轮单点阻塞

---

## 5. 最终结论

结合上一版报告：

1. `#18`：已通过
2. `#17`：此前缺口已被 `#20` 这轮定向复验补齐
3. `#19` 里指出的唯一阻塞点：
   - `未 @mention 的纯状态播报不会进入 agent_turn`
   - 现已关闭

因此，从本轮定向复验看：

- `@mention` 在状态播报场景下已不再是“是否进入 turn”的流程开关
- 它现在只剩输入信号增强语义
