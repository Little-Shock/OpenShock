<div align="center">

# OPENSHOCK.AI

<p>
  <img src="./docs/assets/openshock-hero.png" alt="OpenShock hero banner" width="100%" />
</p>

<p>
  <a href="https://github.com/Little-Shock/OpenShock"><img alt="GitHub stars" src="https://img.shields.io/github/stars/Little-Shock/OpenShock?style=for-the-badge&logo=github&label=stars&color=00f5a0" /></a>
  <a href="https://github.com/Little-Shock/OpenShock/forks"><img alt="GitHub forks" src="https://img.shields.io/github/forks/Little-Shock/OpenShock?style=for-the-badge&logo=github&label=forks&color=13c2ff" /></a>
  <a href="https://github.com/Little-Shock/OpenShock/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/Little-Shock/OpenShock?style=for-the-badge&logo=github&label=issues&color=ff5c8a" /></a>
  <a href="https://github.com/Little-Shock/OpenShock/commits/main"><img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/Little-Shock/OpenShock?style=for-the-badge&logo=github&label=last%20commit&color=facc15" /></a>
</p>

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/web-next.js%2016-111111?style=for-the-badge&logo=nextdotjs" />
  <img alt="Go" src="https://img.shields.io/badge/server-go-111111?style=for-the-badge&logo=go" />
  <img alt="Go" src="https://img.shields.io/badge/daemon-go-111111?style=for-the-badge&logo=go" />
  <img alt="Status" src="https://img.shields.io/badge/status-phase%200%20baseline-00f5a0?style=for-the-badge" />
</p>

<p><strong>把聊天、执行、交付和交接收进同一工作台。</strong></p>
<p><strong>A local-first workspace for AI software teams.</strong></p>

</div>

## OpenShock 是什么

OpenShock 是一套本地优先的 AI 协作工作台，把聊天、执行、交付和交接放进同一个界面。当前版本已经把 `Chat / Rooms / Board / Setup / Access / Settings` 连成一条可运行、可验证的主链。

## 谁适合现在用

- 正在用 `Claude Code`、`Codex`、`Gemini CLI` 这类本地代理做软件开发的小团队
- 想把“讨论、执行、PR、回看下一步”收进同一套工作台的人
- 需要本地演示、浏览器验收、release gate 复核和多智能体协作验证的团队

## 5 分钟你会看到什么

跑起 OpenShock 后，你应该能在一次会话里看到这 4 件事：

1. 进入同一套协作壳，而不是散落的工具页。
2. 首页直接告诉你现在该继续哪里。
3. 从 `Board` 创建工作后，系统会自动把它连到讨论和执行。
4. 回到 `Rooms` 时，你会得到一个明确的“下一间讨论”和“下一步动作”。

## 你现在可以直接做什么

- 从 `Chat` 继续当前协作，从 `Rooms` 回到最该处理的讨论
- 从 `Board` 建一条工作，让系统自动连上讨论、执行和交付
- 从 `Setup` 检查仓库、GitHub 和运行环境是否真的可用

## 10 分钟跑通

```bash
pnpm install
pnpm dev:fresh:start
```

然后按这条线走：

1. 打开终端打印的 `Entry` 地址。
2. 跟着首启引导进入工作区。
3. 打开 `Setup`，确认仓库、GitHub、运行环境都有状态。
4. 打开 `Chat`，确认你已经进入主界面。
5. 创建一条事项，确认系统会拉起讨论和执行。
6. 打开 `Rooms`，确认首屏会直接告诉你下一间该回去的讨论。

结束后清理：

```bash
pnpm dev:fresh:stop
```

## 当前边界

- 适合：本地演示、产品迭代、浏览器验收、release gate 复核、多智能体协作验证
- 还不承诺：托管云服务、完整 SaaS 运维、外部插件市场、大规模组织治理闭环

## 发布前最短验证

- Release candidate:

```bash
pnpm verify:release:rc
```

- 非 RC 全跑:

```bash
pnpm verify:release:full
```

- 分层看：
  - `pnpm verify:release` 只看 repo gate
  - `pnpm ops:smoke` 只看 live stack smoke

`pnpm verify:release:rc` 会自动写 RC 报告和原始日志；`pnpm verify:release:full` 会写 full gate 报告和日志。  
仓库里的历史报告只做归档，不保证是你这次运行生成的最新结果；请按命令输出路径或 [docs/testing/README.md](./docs/testing/README.md) 里的定位方式确认最新证据。

## 文档入口

- 启动、环境变量、手动 3 进程：[docs/engineering/Runbook.md](./docs/engineering/Runbook.md)
- 发布 gate、rollback、证据路径：[docs/engineering/Release-Gate.md](./docs/engineering/Release-Gate.md)
- 当前测试入口与证据定位：[docs/testing/README.md](./docs/testing/README.md)
- 当前产品范围：[docs/product/Phase0-MVP.md](./docs/product/Phase0-MVP.md)
- 产品需求和能力边界：[docs/product/PRD.md](./docs/product/PRD.md) · [docs/product/Checklist.md](./docs/product/Checklist.md)
- 当前 backlog：[docs/product/TODO-List.md](./docs/product/TODO-List.md)

## 仓库结构

```text
apps/web       Next.js 16 + React 19 前端壳
apps/server    Go 控制面 API + 文件状态存储
apps/daemon    Go 本地执行服务与代码工作目录桥接
docs/          产品、工程、测试和研究文档
```
