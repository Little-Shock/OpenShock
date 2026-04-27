# Test Report 2026-04-24 Release Gate Config Persistence Recovery

- Command: `pnpm test:headed-config-persistence-recovery -- --report docs/testing/Test-Report-2026-04-24-config-persistence-recovery.md`
- Generated At: 2026-04-24T16:52:55.068Z

## Result

- `/settings` 写入后的引导信息和安全设置可以在刷新后保持一致。
- `/access` 会显示和 `/settings` 一致的成员偏好与 GitHub 身份。
- `/setup` 会读取同一份引导模板、状态和继续地址。
- 服务端重启后，工作区和成员设置都能继续保留。
- 第二个浏览器上下文也能读取同一份工作区和成员设置。

## Evidence

- settings-before-write: `../../../tmp/openshock-tkt37-config-persistence-cdVWye/run/screenshots/01-settings-before-write.png`
- settings-after-write: `../../../tmp/openshock-tkt37-config-persistence-cdVWye/run/screenshots/02-settings-after-write.png`
- access-projection: `../../../tmp/openshock-tkt37-config-persistence-cdVWye/run/screenshots/03-access-projection.png`
- setup-projection: `../../../tmp/openshock-tkt37-config-persistence-cdVWye/run/screenshots/04-setup-projection.png`
- settings-after-server-restart: `../../../tmp/openshock-tkt37-config-persistence-cdVWye/run/screenshots/05-settings-after-server-restart.png`
- second-device-recovery: `../../../tmp/openshock-tkt37-config-persistence-cdVWye/run/screenshots/06-second-device-recovery.png`

## Scope

- 已从 `/settings` 修改工作区引导、模板、浏览器提醒、记忆模式和安全基线。
- 已从 `/settings` 修改成员常用智能体、默认入口和 GitHub 身份。
- 已验证刷新、服务端重启和第二浏览器上下文后，`/access` 与 `/setup` 仍读取同一份配置。
