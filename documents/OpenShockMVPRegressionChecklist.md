# OpenShock MVP Regression Checklist

- 版本：0.1
- 日期：2026-04-06
- 用途：MVP 收尾阶段固定回归包
- 关联文档：
  - `documents/OpenShockMVPQALoop.md`
  - `documents/OpenShockMVPBugList.md`
  - `documents/OpenShockTrueP0BusinessTestCases.md`
  - `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md`

---

## 1. 使用规则

这份清单不按页面堆条目，而按收尾阶段最重要的三个维度组织：

1. 主链路 smoke
2. 受影响层回归
3. 闭环回归

每次修复完成后，至少执行：

1. 原问题复现路径
2. 本文中与受影响层对应的一组回归
3. 一条主链路 smoke

如果问题影响 `action / run / merge / delivery` 其中任一状态闭环，则必须额外执行完整闭环回归。

---

## 2. 执行前最小预检

### 环境预检

1. backend 可启动
2. frontend 可启动
3. daemon 可启动
4. 测试 repo 可读写且 git 状态可控

### 命令预检

1. `apps/backend`: `go test ./...`
2. `apps/daemon`: `go test ./...`
3. `apps/frontend`: `npm run build`
4. 如改动涉及前端代码风格或组件逻辑，再补 `npm run lint`

### 数据预检

1. 明确本轮测试 issue
2. 明确测试 repo 路径
3. 明确使用的 runtime / agent / provider
4. 明确当前测试是否会受 in-memory 重启影响

---

## 3. 主链路 Smoke

这部分是默认最小 smoke 包。每轮至少跑一条，重大改动建议全跑。

### SMOKE-001 协作壳可进入

1. 打开首页
2. 确认 Workspace、Room 列表、导航可见
3. 确认 Task Board、Inbox 可访问

通过标准：

1. 协作壳可用
2. 不是空白页、报错页或需要异常手刷才能进入

### SMOKE-002 Issue 容器成立

1. 创建一个新 Issue 或进入当前测试 Issue
2. 进入对应 Room
3. 确认默认消息流存在
4. 确认右侧能看到 Issue / Integration 相关信息

通过标准：

1. Issue、Room、Integration 关系清晰
2. Issue 不是孤立记录

### SMOKE-003 Task 容器与基础操作可用

1. 在 Issue Room 或 Task Board 创建 Task
2. 确认 Task 落到正确 issue
3. 如需要，分配 Agent
4. 在 Task Board 观察任务展示

通过标准：

1. Task 创建入口可用
2. 归属 issue 正确
3. 展示状态与实际对象一致

### SMOKE-004 Room / Inbox / Board 三处状态一致

1. 执行一个能产生状态变化的操作
2. 分别观察 Room、Task Board、Inbox
3. 视情况刷新或重进页面

通过标准：

1. 三处信息不打架
2. 不出现一处更新、一处旧态的明显漂移

---

## 4. 受影响层回归

按本次改动触及层选择对应分组。

### LAYER-FRONTEND 前端回归

适用场景：

1. 页面展示调整
2. 交互入口调整
3. 按钮 gating、表单、局部实时刷新调整

检查项：

1. 改动入口本身可操作
2. 文案、按钮状态、禁用逻辑符合预期
3. 相关页面刷新后状态不丢
4. Task Board、Room、Inbox 至少相邻一处联动正常

### LAYER-BACKEND 后端回归

适用场景：

1. action 接口
2. store 状态模型
3. issue/task/run/merge 状态流
4. webhook / realtime 数据范围

检查项：

1. 相关 action 能成功提交
2. 对象状态转移符合预期
3. 返回结构未把前端契约打散
4. 同一状态在 Room / Board / Inbox 可解释一致

### LAYER-DAEMON 执行面回归

适用场景：

1. runtime 注册
2. claim run / agent turn / merge
3. 执行结果回传
4. git 提交、merge、provider 交互

检查项：

1. daemon 能启动并注册 runtime
2. claim 行为正确，不出现异常噪音
3. 执行结果能回流系统
4. 业务仓库不留下错误的脏状态

### LAYER-CROSS 跨层契约回归

适用场景：

1. 前后端返回结构变化
2. realtime scope 变化
3. daemon 回传事件格式变化

检查项：

1. 前端收到的数据结构与渲染逻辑对齐
2. realtime 推送范围覆盖正确对象
3. 同一事件的 API 结果、页面结果、系统消息一致

---

## 5. 闭环回归

只要改动涉及 `action / run / merge / delivery` 任一主状态流，就必须跑这部分。

### LOOP-001 action 闭环

1. 触发一个 action
2. 确认对象被创建或状态被修改
3. 确认相关页面能看到结果

通过标准：

1. action 不只是接口成功，而是业务结果可见

### LOOP-002 run 闭环

1. 为 Task 创建 Run
2. 启动 daemon claim run
3. 观察 run 从 queued 到 running 到 completed / failed
4. 检查 Room 消息、Run 输出、必要时 Inbox 条目

通过标准：

1. run 生命周期完整
2. 执行结果可追溯
3. 阻塞和失败能回流给人

### LOOP-003 merge 闭环

1. 将 Task 标记为 `Ready for Integration`
2. 在 Inbox 执行审批
3. 启动 daemon claim merge
4. 验证 integration branch 状态与合并结果

通过标准：

1. merge 审批链通
2. merge 结果进入系统
3. 相关 Task / Issue 状态一致

### LOOP-004 delivery 闭环

1. 在 Integration Branch ready 后创建 Delivery PR
2. 模拟 webhook merged 回写
3. 观察 issue 状态、delivery 状态、Room 实时刷新

通过标准：

1. delivery 进入 `in_review`
2. webhook 后进入 merged / done
3. Room 页面无需手工刷新的状态联动正确

### LOOP-005 agent 协作闭环

1. 在 Room 中发起人类 -> agent 指令
2. 验证 agent turn 被消费
3. 验证 agent 回复、clarification 或 handoff 能回写频道

通过标准：

1. 频道是协作流，不只是系统日志
2. agent / human / system 三类消息能共存并可追踪

---

## 6. 高风险改动附加回归

如果改动触及下面任一位置，除上面基本项外，还要补一轮完整闭环：

1. `apps/backend/internal/store`
2. `apps/backend/internal/api`
3. `apps/daemon/internal/`
4. Room 右侧 issue 面板
5. Task Board quick create / status control / run action
6. Inbox 审批动作

附加要求：

1. 至少新建一个干净 issue 跑
2. 至少验证一次刷新或重进页面后的状态一致性
3. 至少确认一次测试 repo 的 git 结果符合预期

---

## 7. 结果记录格式

每次回归建议直接按下面格式记录：

```md
## 回归轮次
- 日期：
- 变更内容：
- 影响层：

## 执行项
- 主链路 smoke：
- 受影响层回归：
- 闭环回归：

## 结果
- 通过：
- 失败：
- 阻塞：
- 不适用：

## 新增问题
- 对应写入 `OpenShockMVPBugList.md` 的编号

## 结论
- 可关闭 / 继续修复 / 待澄清
```
