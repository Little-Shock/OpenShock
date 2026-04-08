# OpenShock 默认响应新语义回归报告

- 版本：0.1
- 日期：2026-04-07
- 对应任务：`#17` / `#18` / `#19`
- 结论摘要：
  - `#18` prompt / `no_response` 语义：`通过`
  - `#17` 对象层 / 分发层边界：`未完全通过`
  - 整组默认响应新语义是否闭合：`未闭合`

---

## 1. 回归范围与方法

本轮按以下基线执行：

1. `documents/OpenShockTrueP0BusinessTestCases.md`
   - `TC-COMM-011`
   - `TC-COMM-012`
   - `TC-COMM-013`
2. `documents/OpenShockDefaultResponseWalkthroughFocus-2026-04-07.md`

执行方式：

1. 启动真实 backend / frontend。
2. 使用浏览器观察 `room_001` 的消息落页与首条 agent 回复。
3. 使用 API 直接提交 room 消息并读取 `room detail / bootstrap` 结构化 payload。
4. 使用可控 fake `codex` 跑 daemon，一次性验证：
   - 自然语言 `message`
   - `no_response`

本轮实际使用的关键输入：

1. 未 `@mention` 呼叫消息：
   - `有人吗？我想确认一下下一步怎么推进。`
2. 显式 `@mention` 呼叫消息：
   - `@agent_shell 这里你先回应一下。`
3. 未 `@mention` 纯状态播报：
   - `我刚把文档同步好了。`
4. 显式 `@mention` 的 FYI 状态播报：
   - `@agent_shell FYI，我刚把文档同步好了。`

---

## 2. `#18` prompt / `no_response` 语义

### 2.1 结论

`通过`

### 2.2 证据

#### A. chat-first 已落地到 daemon 消费结果

未 `@mention` 呼叫消息进入：

- `turn_101.agentId = agent_guardian`
- `turn_101.intentType = visible_message_response`
- daemon 回写首条 agent 消息：
  - `在，我在。你想让我先看哪一块？`

显式 `@mention` 呼叫消息进入：

- `turn_102.agentId = agent_shell`
- `turn_102.intentType = visible_message_response`
- daemon 回写首条 agent 消息：
  - `在，我先接一下。你希望我直接给判断，还是先帮你梳理选项？`

两条首响都先是自然语言接话，没有先进入“接任务 / 分派任务 / 创建任务”表达。

#### B. `no_response` 已真实生效

对消息：

- `@agent_shell FYI，我刚把文档同步好了。`

系统行为是：

1. 创建 `turn_103`
2. `turn_103.intentType = visible_message_response`
3. daemon 完成 turn 后：
   - `turn_103.status = completed`
   - room 消息数没有新增 agent 回复
   - 房间最后两条消息仍是：
     - `msg_105 Sarah: 我刚把文档同步好了。`
     - `msg_106 Sarah: @agent_shell FYI，我刚把文档同步好了。`

这说明 `no_response` 不再被强塞默认 ack，而是能真实完成 turn 且不发 room 消息。

### 2.3 判定

`#18` 这轮要求的两件核心事已经成立：

1. prompt 输出结果已回到 `chat-first`
2. `no_response` 执行语义已经真实闭合

---

## 3. `#17` 对象层 / 分发层边界

### 3.1 结论

`未完全通过`

### 3.2 已通过部分

#### A. 旧解释已退出主链路

本轮 API 可见 agent turn 全部都是：

1. `turn_101.intentType = visible_message_response`
2. `turn_102.intentType = visible_message_response`
3. `turn_103.intentType = visible_message_response`

主链路里没有再看到 `default_monitor_response`。

#### B. `agent_guardian` 不再依赖 `status=monitoring`

`bootstrap` 返回：

- `agent_guardian.status = active`

说明旧的 `monitoring agent` 身份已经不再作为当前对象真相暴露。

#### C. 显式 `@mention` 不再切出另一种 turn 类型

对 `@agent_shell 这里你先回应一下。`

系统仍创建的是：

- `visible_message_response`

不是另一类专用 turn 语义。

### 3.3 未通过部分

#### A. 系统仍在 agent 自决前做了内容预筛

对未 `@mention` 的纯状态播报：

- `我刚把文档同步好了。`

系统行为是：

1. room 新增人类消息 `msg_105`
2. **没有新增 agent turn**
3. daemon 无从消费，也不存在 agent 自己做 `no_response` 判断的机会

这说明当前实现仍然不是“普通可见消息统一先进入同一种 agent 判断流程”，而是：

1. 系统先按文本内容判断这条消息值不值得进入 `agent_turn`
2. 只有通过预筛的消息才会进入 agent 判断

#### B. `@mention` 对状态播报仍然不是“只增强信号”

和上一个场景对照：

1. 未 `@mention` 的 `我刚把文档同步好了。`
   - 不创建 turn
2. 显式 `@mention` 的 `@agent_shell FYI，我刚把文档同步好了。`
   - 创建 `turn_103`
   - 再由 daemon 执行 `no_response`

也就是说，对状态播报类消息，`@mention` 当前仍然在决定“是否进入 turn 流程”，不只是增强信号。

### 3.4 判定

`#17` 只通过了一半：

1. 命名和主解释面已经切正
2. 但对象层真正的“visibility broadcast + agent 自决是否回应”还没有完全落地

当前更准确的描述应是：

- `visible_message_response` 已取代旧解释
- 但系统仍保留了进入 `agent_turn` 之前的文本预筛逻辑

---

## 4. 整组默认响应新语义是否闭合

### 4.1 结论

`未闭合`

### 4.2 分项判定

#### A. 首条回复是否 `chat-first`

`通过`

证据：

1. 未 `@mention` 呼叫消息首响是：
   - `在，我在。你想让我先看哪一块？`
2. 显式 `@mention` 呼叫消息首响是：
   - `在，我先接一下。你希望我直接给判断，还是先帮你梳理选项？`

两条都符合自然交流口吻。

#### B. `@mention` 是否只作增强信号

`不通过`

证据：

1. 未 `@mention` 的状态播报没有创建 turn
2. 加上 `@agent_shell` 后，同类状态播报就会创建 turn，再由 agent 返回 `no_response`

因此当前 `@mention` 仍在影响“是否进入处理流程”，而不只是增强指向性。

#### C. task 是否不是默认响应入口

`通过`

本轮浏览器/API 证据中没有出现：

1. 首条回复直接创建 task
2. 首条回复直接要求某 agent 跟进
3. 首条回复直接切成任务编排口吻

### 4.3 总判定

整组默认响应新语义现在可以写成：

1. `chat-first` 已成立
2. `task 非默认入口` 已成立
3. 但 `@mention 仅作增强信号` 还没有收干净

所以本轮不能给“整组语义已经闭合”的结论。

---

## 5. 建议分流

当前更像是 `#17` 的落地缺口，而不是 `#18` prompt 问题。

建议下一步只收一件事：

1. 明确系统是否允许“所有可见普通消息都先进入统一 turn 判断，再由 agent 返回 `message` 或 `no_response`”

如果答案是允许，那么当前前置文本预筛应继续后退；否则就需要把“哪些消息根本不进入 turn”重新写回设计，不要再把它描述成“按可见性广播 + agent 自决”。

---

## 6. 最终结论

本轮 QA 统一结论：

1. `#18`：`通过`
2. `#17`：`未完全通过`
3. `#19`：`未闭合`

阻塞闭合的唯一核心点是：

- 当前未 `@mention` 的状态播报不会进入 `agent_turn`，因此 `@mention` 仍然不只是增强信号。
