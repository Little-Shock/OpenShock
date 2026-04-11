# OpenShock True P0 全功能流程测试验收方案

**版本:** 0.1  
**日期:** 2026-04-10  
**依据文档:** [OpenShockTrueP0MVP.md](./OpenShockTrueP0MVP.md), [OpenShockPRD.md](./OpenShockPRD.md), [OpenShockTrueP0TechnicalDesign.md](./OpenShockTrueP0TechnicalDesign.md)

---

## 一、目标

本方案用于根据 True P0 MVP PRD 对 OpenShockSwarm 当前实现做全功能流程验收。

验收方式：

- 以浏览器端用户视角为主
- 结合 daemon 自动行为与后端实时状态回流
- 按三轮执行：
  - 第 1 轮：全量验收并记录 bug
  - 第 2 轮：修复后复测并补充 bug
  - 第 3 轮：再次修复与回归复测

状态定义：

- `PASS`: 与 PRD 预期一致
- `FAIL`: 可复现偏差，需记录 bug
- `PARTIAL`: 主链可走通，但存在明显缺口或体验/状态错误
- `BLOCKED`: 受前置缺陷阻塞，未完成有效验证
- `N/A`: 当前版本明确未实现，且不影响本轮其他用例执行

---

## 二、测试环境

| 项目 | 值 |
| :--- | :--- |
| 仓库 | `OpenShockSwarm` |
| 前端 | `http://localhost:3000` |
| 后端 | `http://localhost:8080` |
| daemon | 本地 `go run ./cmd/daemon` |
| 启动方式 | `./dev.sh` |
| 数据策略 | 空启动，无 demo 数据 |
| 浏览器验收方式 | 终端 Playwright（浏览器 MCP `Transport closed`，本次降级执行） |
| 隔离测试仓 | `/tmp/openshock-acceptance-repo` |
| Round 3 fake codex | `/tmp/openshock-fake-codex` |

---

## 三、范围说明

覆盖的 PRD 功能面：

- 登录 / 注册 / 进入 Workspace
- Repo / Runtime 接入
- Workspace 协作壳首页
- Issue / Room 创建与详情流
- Room 内成员与 Agent 协作消息
- Task 拆解、分配、状态流转
- Run 创建、审批、取消、可观测性
- Integration / Merge / Delivery PR
- Inbox / 阻塞 / 审批回流
- Profile / 基础配置
- Realtime 刷新与 daemon 消费闭环

当前已知与 PRD 的潜在差距，仍纳入验收：

- 当前是单 Workspace 壳，不是完整多 Workspace 产品
- 暂无独立 Run 详情页
- 暂无独立 Integration Branch / Delivery PR 专属页面
- Runtime 配对与 CLI provider 检测更接近“daemon 注册后可见”，不是完整设备授权 UI

这些差距若影响 PRD“必须支持”的链路，应记为 bug 或 `PARTIAL`。

---

## 四、测试数据约定

| 数据项 | 值 |
| :--- | :--- |
| 测试账号前缀 | `acceptance_r{round}_user_*` |
| Discussion Room 标题 | `Round {n} Discussion` |
| Issue 标题 | `Round {n} Issue` |
| Task 标题 A | `Round {n} Task A` |
| Task 标题 B | `Round {n} Task B` |
| Repo 路径 | 使用本地测试 repo 绝对路径 |

---

## 五、测试用例矩阵

| ID | PRD 模块 | 测试场景 | 前置条件 | 步骤摘要 | 预期结果 | 第1轮 | Bug/备注 | 第2轮 | Bug/备注 | 第3轮 | Bug/备注 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-001 | Workspace 进入页 | 未登录访问首页 | 空启动 | 打开 `/` | 展示 landing，不报错，不跳到空 room | PASS |  | PASS |  | PASS |  |
| TC-002 | Workspace 进入页 | 登录页可访问 | 空启动 | 打开 `/login` | 展示登录表单 | PASS |  | PASS |  | PASS |  |
| TC-003 | Workspace 进入页 | 注册页可访问 | 空启动 | 打开 `/register` | 展示注册表单 | PASS |  | PASS |  | PASS |  |
| TC-004 | 登录注册 | 注册新成员 | 无 | 填写 username/display name/password 注册 | 注册成功，进入已登录态 | PASS |  | PASS |  | PASS |  |
| TC-005 | 登录注册 | 登录已有成员 | 已有成员 | 退出后重新登录 | 登录成功，进入已登录态 | BLOCKED | 受 BUG-R1-001 阻塞 | BLOCKED | Round2 在 delivery fatal 后未继续 | PASS |  |
| TC-006 | 协作壳首页 | 已登录且无房间时首页空态 | 已注册登录 | 访问 `/` | 展示 first-run 页面，而非报错或空白 | PASS |  | PASS |  | PASS |  |
| TC-007 | Repo 接入页 | Settings 页可见 runtime/repo 基础状态 | 已登录 | 访问 `/settings` | 页面可见 repo 绑定区与 runtime 区 | PASS |  | PASS |  | PASS |  |
| TC-008 | Runtime 接入 | daemon 在线状态可见 | daemon 已注册 | 打开 `/settings` | 能看到至少一个 online runtime | PASS |  | PASS |  | PASS |  |
| TC-009 | Repo 接入 | 绑定 workspace repo | 已登录，存在测试 repo 路径 | 在 settings 或 first-run 绑定 repo | 绑定成功并显示 default repo | PASS |  | PASS |  | PASS |  |
| TC-010 | 协作壳首页 | 左侧 room 列表从空到有 | 已登录 | 创建第一个 discussion room | 左侧列表出现新 room，首页可跳转 | PASS |  | PASS |  | PASS |  |
| TC-011 | Room 详情页 | 创建 discussion room | 已登录 | New Room -> Discussion -> 提交 | 创建成功并进入新 room | PASS |  | PASS |  | PASS |  |
| TC-012 | Issue Room | 创建 issue room | 已登录 | New Room -> Issue -> 提交 | 自动创建 issue 对应 room，并进入房间 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-013 | Issue Room | Issue room 右侧上下文完整 | 已有 issue room | 查看右侧 issue/system/tasks 面板 | 能看到 issue、repo、integration、task actions 等区域 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-014 | Room 协作消息 | 成员发送普通消息 | 已在 room | 输入普通消息发送 | 时间线追加成员消息 | PASS |  | PASS |  | PASS |  |
| TC-015 | Room 协作消息 | 成员 @agent 触发 queued turn | 已在 room，daemon 在线 | 发送 `@agent_shell ...` | Room 右侧 session/turn 指标变化，daemon 能消费 | BLOCKED | BUG-R1-001：发送态卡死，第二条消息发不出去 | PASS |  | PASS |  |
| TC-016 | Room 协作消息 | 普通 human 消息触发默认响应 agent | 已在 room，daemon 在线 | 发送普通人类消息 | 系统按默认策略产生可观测 agent turn 或响应 | PASS |  | PASS |  | PASS |  |
| TC-017 | Task 拆解 | 在 issue room 创建 task | 已有 issue room | 通过 Task create 创建 Task A | task 出现在 issue room / board | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-018 | Task 拆解 | 可分配不同 agent | 已有 issue room | 创建 Task B 分配给另一 agent | assignee 正确显示 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-019 | Task 状态机 | task 状态可编辑 | 已有 task | 将 task 在 todo / in_progress / blocked / ready_for_integration 间切换 | 状态变更成功并刷新显示 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-020 | Task Board | Board 页面展示 task 分组 | 已有多个 task | 打开 `/board` | 按状态分组展示 task | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-021 | Run 工作流 | 从 task 创建 run | 已有 task、repo、runtime | 点击 Queue Run | run 被创建并在 room 右侧/系统区可见 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-022 | Run 工作流 | daemon 消费 queued run | 已有 queued run，daemon 在线 | 等待 daemon 消费 | run 进入 running/completed/approval_required 等后续状态之一 | BLOCKED | 受 BUG-R1-001 阻塞 | FAIL | BUG-R2-006：run 未稳定被消费 | PASS |  |
| TC-023 | Run 控制 | blocked/approval_required 的 run 可 approve | 存在可 approve run 或 inbox item | 在 room 或 inbox 执行 approve | run 状态推进，反馈回写 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-024 | Run 控制 | running/blocked run 可 cancel | 存在可 cancel run | 执行 Stop Run | run 状态变为 cancelled 或停止推进 | BLOCKED | 受 BUG-R1-001 阻塞 | FAIL | Round2 观察到取消后状态未回写 | PASS |  |
| TC-025 | 可观测性 | room 内能看到 run/session/tool/系统摘要 | 已有 run / turn | 查看 room system / observability | 至少能看到运行与会话级可观测信息 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-026 | Merge / Integration | task 可 mark ready for integration | 已有 task | 点击 Ready for Integration | task 状态推进并回写 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-027 | Merge / Integration | task 可 request merge | 已有 ready task | 点击 Request Merge | 产生 merge attempt 或相关状态变化 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-028 | Merge / Integration | 人类可 approve merge | 存在 merge approval item | 在 inbox 或相关入口 approve merge | merge 状态推进，room/inbox 同步 | BLOCKED | 受 BUG-R1-001 阻塞 | FAIL | BUG-R2-006：integration 未到 ready_for_delivery | PASS | BUG-R3-001 已修复后通过 |
| TC-029 | Delivery PR | ready_for_delivery 时可创建 delivery PR | issue integration 满足条件 | 执行 Create Delivery PR | 生成 delivery PR 状态 | BLOCKED | 受 BUG-R1-001 阻塞 | FAIL | Round2 按钮出现但 disabled，后续 fatal | PASS |  |
| TC-030 | Inbox | run/merge 阻塞信息进入 inbox | 制造 run/merge 事件 | 打开 `/inbox` | 有相应 inbox item 展示 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-031 | Inbox | inbox 可执行主动作 | 存在 actionable inbox item | 在 inbox 点击按钮 | 动作成功，状态刷新 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS |  | PASS |  |
| TC-032 | Profile | profile 展示真实 member 身份 | 已登录 | 打开 `/profile` | 显示 display name、username、member scope | BLOCKED | 受 BUG-R1-001 阻塞 | BLOCKED | Round2 在 delivery fatal 后未继续 | PASS |  |
| TC-033 | Profile | 修改 display name | 已登录 | 在 profile 修改并保存 | display name 更新，后续 member action 使用新名字 | BLOCKED | 受 BUG-R1-001 阻塞 | BLOCKED | Round2 在 delivery fatal 后未继续 | PASS |  |
| TC-034 | Profile | sign out | 已登录 | 在 profile 点 sign out | 返回未登录态，受保护页跳回 `/login` | BLOCKED | 受 BUG-R1-001 阻塞 | BLOCKED | Round2 在 delivery fatal 后未继续 | PASS |  |
| TC-035 | 路由保护 | 未登录访问 board/inbox/profile/settings/rooms | 未登录 | 直接访问各受保护路由 | 服务端跳转 `/login` | PASS |  | PASS |  | PASS |  |
| TC-036 | Realtime | 页面刷新与状态回流一致 | 已登录，有后台状态变更 | 一个窗口触发动作，观察页面变化 | 页面自动或刷新后能看到最新状态 | BLOCKED | 受 BUG-R1-001 阻塞 | PASS | Round2 仅验证到页面状态回流 | PASS | Round3 进一步验证跨页实时消息 |
| TC-037 | 空启动 | 重启后默认无 seed 数据 | 清空后重启 | 访问首页与 bootstrap 相关页 | 不出现 demo rooms/issues/tasks/messages | PASS |  | PASS |  | PASS |  |
| TC-038 | 一致性 | 其他页面 UI 风格与 room 页一致 | 已登录 | 检查 board/inbox/settings/profile | header、宽度、卡片语言、视觉节奏一致 | BLOCKED | 受 BUG-R1-001 阻塞 | BLOCKED | Round2 在 delivery fatal 后未继续 | PASS |  |

---

## 六、Bug 跟踪表

| Bug ID | 轮次 | 关联用例 | 标题 | 严重度 | 复现步骤 | 预期 | 实际 | 状态 | 备注 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| BUG-R1-001 | 1 | TC-015 | Room composer 发送后卡在 `Sending...` | High | 在 discussion room 连续发送普通消息后再发送 `@agent` 消息 | 发送完成后按钮恢复可用，后续消息可继续发送 | 按钮持续 disabled，后续房间/issue/task/run 验收全部被阻塞 | Closed | 已在 `room-action-composer.tsx` 修复发送态恢复逻辑 |
| BUG-R2-006 | 2 | TC-022 / TC-028 / TC-029 | run/merge 链路受状态污染影响，后续 delivery 无法推进 | High | 先经过失败/取消/重试 run，再继续 merge / delivery 流程 | 后续 queued run 被 daemon 消费，merge 到 `ready_for_delivery`，delivery PR 可创建 | Round2 出现 run 未被稳定消费、integration 未推进、delivery 按钮 disabled | Closed | 已在 `apps/daemon/internal/gitops/service.go` 为 `EnsureBranch` 与 `MergeBranch` 增加 `RestoreWorktree()` |
| BUG-R3-001 | 3 | TC-028 | merge source run 选择错误，且缺失 source branch 时 merge 失败 | High | task 同时存在 completed 与 blocked/cancelled run，再 request/approve merge | merge 应优先关联最近 completed run；若 source branch 尚未建立，也应可从 target 派生空分支完成无改动 merge | merge 可能选到非 completed run，或因 source branch 不存在而失败 | Closed | 已在 `apps/backend/internal/store/memory.go` 优先选择最近 completed run；已在 `apps/daemon/internal/gitops/service.go` 为 merge 前补 source/target branch 保障 |
| BUG-R3-002 | 3 | TC-028 | fake codex 测试桩给多 task 写同文件，制造伪 merge conflict | Medium | 两个 task 都被真实执行后顺序 merge | 测试桩应产出可并行合并的独立改动 | 测试桩把 A/B 两个任务都写到同一批文件，导致非产品级冲突 | Closed | 已调整 `/tmp/openshock-fake-codex` 为 task 独立文件输出 |

---

## 七、轮次执行记录

### 第 1 轮

- 目标：基于空启动环境完成全量基线验收。
- 结果：执行到 TC-016，全链路前半段通过；在 TC-015 前后暴露 `BUG-R1-001`，导致后续用例整体阻塞。
- 统计：`PASS 14`，`fatal 1`。
- 产物：`output/playwright/round1/round1-results.json`

### 第 2 轮

- 目标：验证修复后的主链，并继续推进到 run / merge / delivery。
- 结果：前半段基本走通，但在 run 消费、merge 推进、delivery 创建上出现链式问题；记录 `BUG-R2-006`。
- 统计：`PASS 29`，`FAIL 3`，`fatal 1`。
- 产物：`output/playwright/round2/round2-results.json`

### 第 3 轮

- 目标：做最终收口回归，确认所有 MVP 主链闭环。
- 结果：在修复 `BUG-R3-001` 并调整 fake codex 测试桩后，38 个用例全部通过。
- 统计：`PASS 38`，`FAIL 0`，`fatal 0`。
- 产物：`output/playwright/round3/round3-results.json`

---

## 八、最终结论

- True P0 MVP 主链在第 3 轮已完成全量通过。
- 用户视角关键链路已经闭环：注册/登录、空启动、repo/runtime 接入、discussion/issue room、任务拆解、run 审批/取消、merge/integration、delivery PR、profile、sign out/relogin、realtime 回流。
- 本次验收过程中既修了真实产品问题，也修了验收桩问题；最终结论以第 3 轮结果为准。
