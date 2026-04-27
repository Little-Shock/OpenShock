# Docs

这份索引按读者分流，只回答一件事：**你现在要解决的问题，应该先看哪份文档。**

## 如果你是第一次来看产品

- [README](../README.md)
  - 项目是什么、谁适合现在用、`pnpm dev:fresh:*` 启动方式、发布前最短验证入口
- [Phase 0 MVP](./product/Phase0-MVP.md)
  - 当前仓库已经成立的产品承诺、非目标、首个成功路径
- [Runbook](./engineering/Runbook.md)
  - 本地怎么跑、怎么 pair runtime、怎么走最小验收链路

## 如果你要判断今天能不能发

- [Testing Index](./testing/README.md)
  - 今天先跑哪条验证线、如何定位最新证据、release gate 入口
- [Release Gate](./engineering/Release-Gate.md)
  - 发布门、rollback、证据包与环境要求
- [Test Cases](./testing/Test-Cases.md)
  - 全量验证矩阵；按 `PRD -> Checklist -> Test Case` 对齐

## 如果你要继续做产品或架构

- [PRD](./product/PRD.md)
  - 完整产品定义、目标用户、核心体验和长期能力边界
- [Product Checklist](./product/Checklist.md)
  - 当前已完成项、部分完成项和剩余 GAP
- [To Do List](./product/TODO-List.md)
  - 今天优先收哪几条缺口、每张执行票最少要写什么
- [Execution Tickets](./product/Execution-Tickets.md)
  - canonical backlog 和落地顺序
- [Team Execution Directive](./product/Team-Execution-Directive.md)
  - 后续推进时的统一交付格式与 merge gate

## 如果你要查设计、研究和历史参考

- [DESIGN.md](../DESIGN.md)
- [Design Notes](./design/README.md)
- [Research Index](./research/README.md)
- [Reference Stack](./research/Reference-Stack.md)
- [Slock Local Notes](./research/Slock-Local-Notes.md)
- [Upstream Branch Harvest 2026-04-10](./research/Upstream-Branch-Harvest-2026-04-10.md)

## 当前仓库状态怎么读

| 你想确认什么 | 先看哪份文档 | 命令 / 证据入口 |
| --- | --- | --- |
| 产品现在能做什么 | [README](../README.md) | `pnpm dev:fresh:start` |
| 今天发布前怎么判绿 | [Testing Index](./testing/README.md) | `pnpm verify:release:rc`（RC） / `pnpm verify:release:full`（非 RC 全跑） |
| 当前仓库已经做到哪一层 | [Phase 0 MVP](./product/Phase0-MVP.md) | 对照首个成功路径和非目标 |
| 已完成和未完成边界 | [Product Checklist](./product/Checklist.md) | 对应 `CHK-*` 项 |
| 当前完整验证证据 | [Test Cases](./testing/Test-Cases.md) | 对应 `TC-*` + 测试报告 |

稳定规则：

- 想快速理解产品，先看 [README](../README.md)。
- 想知道当前仓库的真实边界，先看 [Phase 0 MVP](./product/Phase0-MVP.md) 和 [Product Checklist](./product/Checklist.md)。
- 想知道今天怎么判绿，先看 [Testing Index](./testing/README.md) 和 [Release Gate](./engineering/Release-Gate.md)。
- 测试报告会持续生成；仓库里保留的是归档结果，不保证总是最新一次运行。定位最新结果只按 [Testing Index](./testing/README.md) 的方法执行。

### 还不能在文档里写成“已完成”的能力

- `app.slock.ai` 式 profile-grade 入口和更细的主壳气质仍能继续抠细
- setup/access 的首次启动链路还在继续收平，`/onboarding` 仍有少量兼容痕迹
- memory provider health / recovery 已有正式产品面和 Windows Chrome 证据，但真实 remote external provider、cleanup orchestration、workspace plan / retention 仍在后续 backlog
- restricted sandbox profile / network / tool policy 还没全部完成
- delivery entry / release-ready contract / handoff note 已有正式产品面和浏览器级证据，但更重的 operator summary 与日常回归选择器仍在继续收口

如果某份文档把这些写成“已经做完”，那份文档就是漂了。

## 应用级 README

- [apps/web/README.md](../apps/web/README.md)
- [apps/server/README.md](../apps/server/README.md)
- [apps/daemon/README.md](../apps/daemon/README.md)

它们更适合回答某一个应用自己的实现边界，不替代产品范围文档。

## 文档维护规则

- 根 README 只写入口级现状，不堆未来路线图
- 发布前信任路径只保留一套 canonical 说法：`docs/testing/README.md` 顶部那条
- PRD 写完整产品合同；当前仓库实现边界由 Phase 0 MVP 和 Checklist 承接
- Phase 0 MVP 只写第一轮必须交付和验收门，不写超出当前 repo 的幻想
- Checklist 必须把“已完成 / 部分完成 / 未完成”分清楚
- Test Cases 必须能追溯回 Checklist，而不是零散 checklist
- Runbook 只能写当前仓库实际能跑的启动方式和验证步骤
- Research 文档允许更宽，但不能冒充“已落地功能说明”
