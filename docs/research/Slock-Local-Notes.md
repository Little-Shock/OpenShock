# Local Slock Notes

## Sources

- `\\wsl.localhost\Ubuntu-24.04\home\lark\.codex\sessions\2026\04\04`
- `\\wsl.localhost\Ubuntu-24.04\home\lark\.slock\agents`

这份笔记只保留可用于产品设计和工程实现的结构化信号，不复制整份私有会话内容。

## Key Findings

### 1. Agent Has A Real Working Directory

本地 `slock` 不是只有一个聊天层。每个 agent 都对应一个目录，常见形态是：

- `MEMORY.md`
- `notes/`
- 有时还直接是独立 git worktree

这说明：

- Agent 记忆是文件级的
- Agent 规则是文件级的
- 恢复上下文并不只依赖聊天历史

### 2. MEMORY.md Is The First-Class Memory Surface

样例 `MEMORY.md` 会明确写：

- agent 角色
- 必读 note 文件
- active context
- 最近一次互动和当前项目锚点

这和我们现在对 `SOUL.md + MEMORY.md` 的方向一致。

### 3. notes/* Carries Operational Truth

在本地 `slock` 样例里，`notes` 常见有：

- `channels.md`
- `operating-rules.md`
- `skills.md`
- `work-log.md`
- `team-rules.md`

这些文件分别承担：

- 频道目的与成员上下文
- 执行规则
- 共用技能标准
- 历史工作痕迹
- 团队级约束

这说明我们后续不应该把一切都塞进一个大 `MEMORY.md`，而应该拆层。

### 4. Slock Has Strong MCP / Chat Workflow Discipline

样例规则里明确存在这些口径：

- 只通过 MCP chat tools 和队友沟通
- visible reply 必须用 `send_message`
- 先 claim task，再做非 trivial 工作
- 回复要在相同 target / thread
- 多步骤工作要发短进度更新
- 用本地记忆文件保存上下文

这类规则很适合转译为 OpenShock 的：

- Room 协作规范
- Agent onboarding policy
- Agent Mailbox / DM 边界

### 5. Shared Skills Are Treated As Team Policy

本地 `slock` 里还能看到团队级技能安装和标准使用说明，比如：

- 对抗性验证
- 并发编排
- 轻量探索
- 记忆防漂移
- 反自我合理化

也就是说，在 `slock` 的实践里：

- skill 不只是“工具”
- skill 也是团队执行标准的一部分

这和 OpenShock 里 `Skill / Policy / Memory` 分层非常契合。

## What OpenShock Should Adopt

### Agent File Layout

每个 Agent 后续默认应至少拥有：

- `SOUL.md`
- `MEMORY.md`
- `notes/channels.md`
- `notes/operating-rules.md`
- `notes/skills.md`
- `notes/work-log.md`

### Product Surfaces

OpenShock 后续应该让这些结构在产品里可见：

- Agent 详情页
- Memory Center
- Room 规则 / Channel 规则视图
- Skill / Policy 管理页

### MVP Guidance

Phase 0 和后续 MVP 都不应该只写“接一个向量库”。

更符合你手头真实参考的路线是：

1. 先把文件级记忆和规则页面做好
2. 再加检索侧车
3. 最后再谈外部长期记忆 provider
