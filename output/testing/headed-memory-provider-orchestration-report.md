# Test Report 2026-04-11 Windows Chrome Memory Provider Orchestration

- Command: `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-memory-provider-orchestration -- --report output/testing/headed-memory-provider-orchestration-report.md`
- Artifacts Dir: `/tmp/openshock-tkt96-memory-provider-0xnNSA`
- Scope: `TKT-96 / CHK-10 / CHK-22 / TC-085`
- Result: `PASS`

## Results

### Provider Binding Truth

- `/memory` 现在会直接暴露 `workspace-file / search-sidecar / external-persistent` 三类 provider binding，并允许在同页保存 durable binding truth -> PASS
- Search Sidecar 与 External Persistent 启用后都会先显式进入 `degraded`，分别提示本地索引缺失和 adapter 未配置，而不是假装健康 -> PASS

### Next-Run Preview

- `session-memory` preview 现在不只显示 mounted files / tools，还会显式列出 active providers、scope、retention 和 degraded provider note -> PASS
- prompt summary 会同步写入 provider orchestration truth，并保留 external durable adapter 的 failure note -> PASS

### Persistence

- 页面 reload 后 provider enabled/status 状态保持不变，证明 binding 已写回 durable memory-center state -> PASS

### Screenshots

- initial-provider-bindings: /tmp/openshock-tkt96-memory-provider-0xnNSA/run/screenshots/01-initial-provider-bindings.png
- provider-bindings-saved: /tmp/openshock-tkt96-memory-provider-0xnNSA/run/screenshots/02-provider-bindings-saved.png
- preview-provider-orchestration: /tmp/openshock-tkt96-memory-provider-0xnNSA/run/screenshots/03-preview-provider-orchestration.png
- provider-bindings-reload-persisted: /tmp/openshock-tkt96-memory-provider-0xnNSA/run/screenshots/04-provider-bindings-reload-persisted.png
