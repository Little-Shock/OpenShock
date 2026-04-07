# OpenShock To Do List

**版本:** 0.4
**更新日期:** 2026 年 4 月 7 日
**关联文档:** [PRD](./PRD.md) · [Product Checklist](./Checklist.md) · [Test Cases](../testing/Test-Cases.md)

---

## 一、这份文档现在只做什么

- 不再把“完整产品范围”和“当前已完成实现”混在一起
- 不再把“contract 已落地”和“浏览器级 / 线上级闭环已验证”混写
- 只维护当前最需要推进的 GAP、优先级和推荐顺序

如果 live board 和文档冲突：

- 实时状态以 live board 为准
- 需求边界以 `PRD + Checklist` 为准
- 测试结论以 `Test Report` 为准

---

## 二、当前已经站住的基线

- Setup 主链、runtime pairing 冷启动一致性、release smoke gate 已站住
- 真实远端 PR browser loop、signed webhook replay 已站住
- login / session / invite / member role / action-level authz matrix 已站住
- approval center、notification delivery、memory governance、stop/resume/follow-thread 已站住
- multi-runtime scheduler / active lease / offline failover 已站住

这些能力的详细验收见 [Product Checklist](./Checklist.md) 中的 `CHK-04/07/08/09/10/11/12/13/14/15`。

---

## 三、当前必须先收的 GAP

### GAP-07 app.slock.ai 壳层对齐

- 现状:
  - 当前已有 chat-first 路由和全屏壳层原语，但整体还是“多页面控制台”
  - `app.slock.ai` 式 workspace shell、sidebar order、search、threads/saved 入口还没形成
- 影响:
  - 前端气质仍偏后台，不够像真正的协作壳
  - 用户仍需要在多个 utility page 之间跳转
- 相关合同:
  - `CHK-01`
  - `CHK-16`
- 优先级: P0

### GAP-08 DM / Thread / Profile / Presence 工作面

- 现状:
  - room / run / topic / machine / agent truth 已有数据基础
  - 但 `DM / followed thread / saved / agent-machine-human profile / room workbench tabs` 还未形成统一前台工作流
- 影响:
  - OpenShock 还不像 `app.slock.ai` 那样以“会话 + 人物/机器资料面”驱动工作
  - 线程、人物、机器、run truth 仍过度依赖分散页面
- 相关合同:
  - `CHK-02`
  - `CHK-06`
  - `CHK-17`
- 优先级: P0/P1

### GAP-09 Board 次级化

- 现状:
  - `/board` 已接 live issue truth，并能创建 issue 后进入 room
  - 但 Board 目前仍是主导航中的高优先级入口
- 影响:
  - 产品心智仍会被“任务板”拉偏，不够像 Slock 式协作壳
  - Room / Topic / Run 的工作台主线不够突出
- 相关合同:
  - `CHK-05`
  - `CHK-18`
- 优先级: P2

### GAP-10 GitHub App installation-complete live callback

- 现状:
  - onboarding、webhook replay、远端 PR merge 已经站住
  - installation-complete 后的 live callback / repo 持续同步仍缺实机闭环
- 相关合同:
  - `CHK-07`
- 优先级: P1

### GAP-11 设备授权 / 完整邮箱验证

- 现状:
  - login / invite / role / authz matrix 已站住
  - 设备授权、verify / reset 邮件链、完整外部身份绑定仍未产品化
- 相关合同:
  - `CHK-12`
  - `CHK-13`
- 优先级: P1

### GAP-12 Destructive Guard / Secret Boundary

- 现状:
  - 权限矩阵与 run control 已站住
  - destructive action approval、secret boundary、越界写保护仍未产品化
- 相关合同:
  - `CHK-12`
- 优先级: P1

---

## 四、推荐推进顺序

1. 先做 `TKT-16`，把 `GAP-07` 的 shell / sidebar / search / workspace context 立住。
2. 再做 `TKT-17`，把 `DM / thread / saved / search` 接进同一条前台消息工作流。
3. 然后做 `TKT-18` 和 `TKT-19`，把 `Agent / Machine / Human profile` 与 `Room workbench tabs` 做成完整协作面。
4. 最后再做 `TKT-20`，把 Board 明确降到次级 planning surface。
5. `GAP-10/11/12` 继续保留并行 backlog，但不抢当前前端主线优先级。

---

## 五、每张执行票最少要写清什么

- `Goal`
- `Scope`
- `Dependencies`
- `Self-Check`
- `Review Gate`
- `Merge Gate`
- `Related Checklist IDs`
- `Related Test Case IDs`

没有这 7 项，不进入 active execution。

---

## 八、每一轮固定 Loop

每一轮开发固定按这个顺序：

1. PI / 架构锁 active batch
2. owner claim 并实现
3. owner 自测并贴证据
4. reviewer 只报 blocker / no-blocker
5. blocker 按最小范围回补
6. reviewer 重核
7. `in_review -> done`
8. round-end verify / push / board 清绿
9. 立刻起下一轮 planning 票

不允许停在：

- 只有口头同步，没有仓库文档
- 只有实现，没有 reviewer 证据
- 只有 reviewer PASS，没有板面收口
- 当前 batch 刚结束，下一轮却没人开票

---

## 九、维护规则

- 每一轮收口后，先更新这份文档，再开下一轮 planning 票
- 如果 live board 已经收掉某条 face，对应条目要同步从“下一步”挪到“已完成”
- 如果 backlog 方向变了，必须先更新这里，再去频道口头宣布

这份文档的目标不是写愿景，而是让大家下一次开票时不需要重新争论：

- 现在已经做完了什么
- 还剩哪些 face
- 下一张票该怎么开
