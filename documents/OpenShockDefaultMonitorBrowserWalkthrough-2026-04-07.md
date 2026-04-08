# 默认监控/响应 浏览器级真实走查

- 日期：2026-04-07
- 目标：补齐默认监控/响应第一版的浏览器级真实走查证据
- 关联任务：
  - `#11` 默认监控/响应设计
  - `#12` 默认监控/响应实现
  - `#13` 默认监控/响应 QA

## 1. 测试环境

- backend：`http://127.0.0.1:18082`
- frontend：`http://127.0.0.1:13002`
- daemon：`go run ./cmd/daemon --once --api-base-url http://127.0.0.1:18082 --name BrowserWalkthroughDaemon1`
- 浏览器：Playwright
- 测试房间：`/rooms/room_001`

说明：

- 使用隔离 backend/frontend，避免共享内存态对队列结果造成干扰。
- 本次重点是“浏览器级别是否看到正确行为”，不是只看接口返回或单元测试。

## 2. 冻结规则

按当前冻结到技术设计文档的第一版语义验证：

1. 优先级：`@mention` > waiting/clarification follow-up > handoff > 默认监控 fallback
2. 默认监控只处理：
   - 人类 `message / instruction`
   - 无显式 `@mention`
   - 未命中 waiting/handoff
   - 且为问询/请求型普通消息
3. 默认协作 Agent 当前落到 `status=monitoring`
4. fallback turn 的 `intentType = default_monitor_response`

## 3. 浏览器走查步骤与结果

### 3.1 未 `@mention` 的问询型消息

页面操作：

1. 打开 `http://127.0.0.1:13002/rooms/room_001`
2. 在输入框发送：`有人吗？`

页面结果：

1. 页面出现 `AGENT QUEUE`
2. 队列内显示：
   - `Guardian_Bot`
   - `default monitor response`
   - `QUEUED`

结论：通过

### 3.2 纯状态播报消息

页面操作：

1. 在同一页面继续发送：`我刚把文档同步好了。`

页面结果：

1. 新消息正常出现在 timeline
2. `AGENT QUEUE` 仍保持 1 条
3. 没有因为这条纯状态播报再新增默认响应 turn

结论：通过

### 3.3 显式 `@mention`

页面操作：

1. 在同一页面继续发送：`@agent_shell 请看一下这个房间。`

页面结果：

1. `AGENT QUEUE` 变为 2 条
2. 新增队列项显示：
   - `Shell_Runner`
   - `instruction response`
   - `QUEUED`
3. 原有 `Guardian_Bot / default monitor response` 队列项仍保留

结论：

- 显式 `@mention` 路径继续成立，没有被默认监控 fallback 吞掉

### 3.4 daemon 真实消费与页面回写

执行操作：

1. 保持页面打开，不手工刷新
2. 执行一次 daemon：`BrowserWalkthroughDaemon1`

页面结果：

1. 原先的 `Guardian_Bot / default monitor response` 队列项状态从 `QUEUED` 变为 `COMPLETED`
2. timeline 中新增了 agent 回写消息：
   - `AGENT_GUARDIAN`
   - `@agent_shell，Sarah 刚说文档已经同步好了，并请你看一下这个房间。`

说明：

- 这证明浏览器层不仅能观察到默认监控 turn 的排队，还能观察到 daemon 消费后的真实回写。

## 4. 结论

本次浏览器级真实走查通过，且和当前冻结语义一致：

1. 问询型未 `@mention` 普通消息会触发默认监控 fallback
2. 纯状态播报不会误触发默认 fallback
3. 显式 `@mention` 仍保留更高优先级
4. daemon 消费后，页面能看到队列状态变化和 agent 回写

## 5. 备注

由于三条消息是在同一房间连续发送，daemon 消费 fallback turn 时读到了后续上下文，所以 Guardian 的回写内容把后续 `@agent_shell` 消息也纳入了总结。这不影响本次验证目标；本次验证关注的是：

1. 默认监控是否生成
2. 是否没有误触发纯状态播报
3. 显式 `@mention` 是否仍保留独立高优先级路径
