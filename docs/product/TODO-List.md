# OpenShock TODO

**更新日期:** 2026-04-26  
**关联文档:** [PRD](./PRD.md) · [Checklist](./Checklist.md) · [Testing Index](../testing/README.md)

## 这份文档现在只做什么

- 只保留当前还没收完的产品 GAP
- 只回答“今天先做什么”
- 不再承担长历史归档

如果你只看今天这轮，优先记住这 4 个产品缺口：

- 认证仍需要从“邮箱即可进入”继续收紧到真正 challenge-based 的进入方式
- request-scoped auth 已落下第一批 token-bound 入口，但 detail/read surface 和剩余 mutation 还没全站收平
- 首启入口虽然已经减法，但产品前门和文档前门还要继续统一成同一条首次成功路径
- 发布证据已经有正式入口，但 reviewer 的判断路径还要继续减少跳转和重复阅读

如果实时状态面板、测试报告和这里冲突：

- 实时状态以实时状态面板为准
- 产品边界以 `PRD + Checklist` 为准
- 验证结论以 `Test Report` 为准

## 当前已经站住的基线

- 统一 workspace shell 已站住：`Chat / Rooms / Board / Setup / Access / Settings`
- `Board -> 讨论 -> 执行` 主链已站住
- `/rooms` 已有 continue entry，不再只是列表页
- `Setup`、runtime pairing、repo truth、GitHub readiness 已接入同一条验证线
- `verify:release:rc`、`verify:release:full`、`ops:smoke` 已收成正式发布入口
- auth/session 已从默认 owner 放行改成默认 signed-out
- 关键 mutation 已统一走 session + permission guard，401/403 不再泄露完整 state
- internal notification worker 已切到 shared secret 鉴权

## 当前优先级

### P0 Auth challenge hardening

目标：把“知道邮箱就能登录 / claim owner / reset recovery”收成真正的 challenge-based auth。

当前真值：

- `request_password_reset` 现仅允许 active scoped session 发起
- signed-out 只允许在持有有效 challenge 时执行 `complete_password_reset`
- email-only login 与 fresh bootstrap owner claim 仍未移除，所以本项继续保留 P0

Done when:

- 裸邮箱登录和 fresh bootstrap claim owner 被移除，所有进入工作区的路径都必须消费可验证 challenge
- `verify_email / authorize_device / request_password_reset / complete_password_reset` 都有一次性 challenge contract
- 同一份 auth contract 同时覆盖 signed-out、cross-account、replay、expired challenge

Evidence:

- `apps/server/internal/api/auth_contract_test.go`
- `apps/server/internal/store/auth_test.go`
- 对应 browser recovery 报告写入 `docs/testing/`

本轮验收结果应满足：

- `POST /v1/auth/session` 不再接受 email-only login，并有对应 contract 覆盖
- fresh bootstrap 下首个未知邮箱不能直接 claim owner，并有 store contract 覆盖
- `verify_email / authorize_device / request_password_reset / complete_password_reset` 全部改成一次性 challenge 消费，并覆盖 replay / expired / cross-account
- auth contract、store contract、browser recovery 报告都能给出可追溯证据

### P0 Request-scoped auth session

目标：把当前全局单例 `Auth.Session` 收成真正的 request-scoped auth，避免多用户登录和跨请求操作互相踩状态。

当前切口：

- `auth/session`、`workspace members`、`member preferences`、`auth recovery` 已支持 token-bound request actor
- `credential / control-plane / agent profile / topic / memory / direct message` 已开始统一吃 request actor，而不是继续只吃最后一次登录者
- `state stream`、`mailbox`、`pull-request`、`room detail`、`run detail` 这批高风险读链已经接上 request-aware snapshot / visibility gate
- 仍保留“无 token 时回退全局 `Auth.Session`”的兼容路径，所以当前是 token-aware，还不是 token-enforced request scope

建议拆分顺序：

1. 增加 request actor resolver：先支持每个请求稳定解析 caller，而不是继续默认吃最后一次登录者
2. 给 store mutation 增加显式 actor 输入，逐步替代内部对 `s.state.Auth.Session` 的直接读取
3. 去掉“无 token 回退全局 session”的兼容逻辑，默认改成 signed-out，再把 browser / integration / contract 正向读链全部切到显式 token 或 cookie
4. 保留 `state.Auth.Session` 作为当前前台兼容真相，直到 `/access` 和 live shell 完成新凭据接线
5. 增加双用户并发 contract：A/B 两条会话并行时，permission、recovery、member mutation 不能互相污染

Done when:

- API 不再把 `state.Auth.Session` 当成唯一当前操作者真相
- 登录返回的身份凭据能在并发请求下稳定区分不同用户和设备
- 无 token 的 detail/read surface 默认 fail closed，不再隐式吃最后一次登录者
- 权限、恢复、device approval、workspace member 更新都按 request actor 判定，而不是按最后一次登录者判定
- auth / action guard / integration contract 同时覆盖 cross-user overlap、并发登录、signed-out replay 和跨账号恢复

Evidence:

- `apps/server/internal/store/auth.go`
- `apps/server/internal/api/auth_routes.go`
- `apps/server/internal/api/auth_action_guard_test.go`
- `apps/server/internal/integration/integration_test.go`

本轮验收结果应满足：

- `Snapshot().Auth.Session` 不再作为 auth/workspace/member preference/recovery 这批关键 mutation 的直接 actor 来源
- 已有一组双用户并发 contract 证明 A/B token 不会互相覆盖 `/v1/auth/session` 和 member preference actor
- device approval、password reset、workspace member mutation 都已有 request-scoped actor 证据
- `state stream`、`mailbox`、`pull-request`、`room detail`、`run detail` 已补齐 request-aware 读链 redaction
- 下一轮去掉无 token 全局 session fallback，并补 browser/integration 双会话证据

### P0 Setup / Onboarding 收口

目标：用户只面对一个首启入口，不再在 `/setup` 和 `/onboarding` 之间分裂。

Done when:

- `/setup` 是唯一主入口，`/onboarding` 只做兼容跳转
- 首页 continue、`/access`、`/setup` 指向同一条首启主路径
- 首屏只告诉用户“现在做什么”和“做完去哪里”，不再并列多个一级任务

Evidence:

- `apps/web/src/lib/home-first-screen.test.ts`
- `apps/web/src/lib/access-first-screen.test.ts`
- `apps/web/src/lib/setup-first-screen.test.ts`
- `apps/web/src/lib/critical-loop-contract.test.ts`

本轮验收结果应满足：

- `/setup` 是唯一首启主入口，`/onboarding` 只保留兼容跳转
- 首页 continue 与首启路由指向同一条路径
- `headed-critical-loop` 与 `critical-loop-contract` 都验证同一条主路径
- `Setup` 首屏只保留“现在做什么”和“下一步去哪”

### P0 Release evidence 单源化

目标：发布 reviewer 不再翻三份文档和终端日志拼结论。

Done when:

- `verify:release:rc` 和 `verify:release:full` 都产出同级 summary report + durable logs
- `docs/testing/README.md` 只指向固定生成入口，不手写“最新日期 / commit”
- RC 报告明确写出内部 worker secret 与 runtime heartbeat secret 是否已配置

Evidence:

- `scripts/release-gate.sh`
- `scripts/release-gate-contract.test.mjs`
- `docs/testing/README.md`
- 对应 `docs/testing/Test-Report-*release*`

本轮验收结果应满足：

- `pnpm verify:release:rc` 每次运行都生成 RC summary report 与原始日志
- `pnpm verify:release:full` 每次运行都生成 full summary report 与原始日志
- Testing Index、Release Gate、Runbook 都只给“如何定位最新证据”的方法，不手写“最新日期 / commit”

### P1 Headed suite 清单化

目标：让 release reviewer 不需要在 80+ 条 headed 命令里人工猜哪几条是 release-critical。

状态：已完成。release-critical manifest 已落到 `scripts/release-browser-suite.sh`，并由 release gate、contract test、Testing Index 共用。

Done when:

- release-critical headed suite 有单一 manifest，`package.json`、release gate 和 Testing Index 都从同一份清单读取
- release-critical 脚本和 supporting exploratory 脚本有明确分层
- 新增 headed 场景时，必须同步落到 manifest 或明确标注为非 release gate
- 至少一层脚本 contract 能覆盖命令入口、报告路径和关键参数，不再只靠人工扫脚本文件名

Evidence:

- `scripts/release-gate.sh`
- `scripts/release-gate-contract.test.mjs`
- `docs/testing/README.md`
- `package.json`

本轮验收结果应满足：

- reviewer 只看一个 manifest 就能知道 release gate 当前到底包含哪些 browser 主链
- `verify:release:*` 和 Testing Index 不会出现命令名漂移
- headed suite 的 release-critical / exploratory 边界可读、可测试、可审计

### P1 Frontend subtractive sweep

目标：继续给前台做减法，只保留当前对象、状态和下一步。

Done when:

- `/`、`Setup`、`Access` 首屏各自只剩一个主动作，其他模块默认收进次级层
- `Board / Rooms / Settings` 不再重复同一份 next-step 摘要，supporting flow 只保留必要入口
- 帮助文案、空态、解释语气都能直接回答“你现在能做什么”

Evidence:

- `apps/web/src/lib/home-first-screen.test.ts`
- `apps/web/src/lib/setup-first-screen.test.ts`
- `apps/web/src/lib/access-first-screen.test.ts`
- `apps/web/src/lib/rooms-first-screen.test.ts`
- `apps/web/src/lib/settings-first-screen.test.ts`

本轮验收结果应满足：

- `/`、`Setup`、`Access` 首屏默认只保留一个主动作，其他模块进次级层
- `DM / Machine / Topic / Thread` 都有可直接进入的入口
- `Board` 规划文案与 issue / room 的继续入口文案统一
- `Board / Rooms / Settings` 的 supporting flow 打开后可直接给出下一步
- 空态、帮助文案、解释语气都落成一句话可执行提示

### P1 Durable memory / provider / recovery

目标：把“可见”继续推进到“可恢复、可压缩、可交接”。

Done when:

- 至少有一组多 session / 多 agent recovery contract 可以稳定重放
- provider degraded fallback、compaction、retention 都有明确 fail-closed 或恢复路径
- 交接后能从同一份 memory truth 恢复当前工作，而不是只看到静态历史

Evidence:

- memory provider / recovery contract tests
- 对应 headed / release 验证报告
- `Checklist` 里相关 memory 项从部分完成推进到已验证

本轮验收结果应满足：

- 交付一组可重放的多 session / 多 agent recovery 验证矩阵
- external provider degraded fallback 有明确触发条件与恢复路径
- memory compaction、retention、后台整理都有可执行验证项

## 本轮刚收口

- 默认 auth baseline 改成 signed-out
- mutation authz 响应改成 fail-closed，不再把完整 state 当 side-channel 返回
- `/v1/notifications/fanout` 改成内部 worker secret 鉴权
- `verify:release:rc` 现在强制 `OPENSHOCK_INTERNAL_WORKER_SECRET`
- `request_password_reset` 现仅允许 active session 发起；signed-out 只允许持 challenge 完成恢复
- release-critical headed suite 已单源化到 `scripts/release-browser-suite.sh`
- `verify:release:rc` 现在也强制 `OPENSHOCK_RUNTIME_HEARTBEAT_SECRET`
- `verify:release:full` 新增 summary report 和 durable logs
- 首页 continue target 已覆盖 inbox / DM / channel / room / journey
- `setup/access` 入口壳已减成更轻的单列首屏

## 每张执行票最少要写清什么

- `Goal`
- `Scope`
- `Dependencies`
- `Self-Check`
- `Review Gate`
- `Merge Gate`
- `Related Checklist IDs`
- `Related Test Case IDs`

没有这 8 项，不进入 active execution。

## 固定执行顺序

1. 锁定 active batch
2. 实现最小闭环
3. 自测并贴证据
4. reviewer 只报 blocker / no-blocker
5. 回补 blocker
6. 重核
7. `in_review -> done`
8. round-end verify

## 归档说明

- 更早的收口历史、长说明和专题追溯，不再继续堆在这份文档里
- 需要追溯时，回看 `git log`、`Test-Report-*` 和 `Checklist`
