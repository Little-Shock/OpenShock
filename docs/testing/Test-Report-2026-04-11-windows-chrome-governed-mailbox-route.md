# Test Report 2026-04-11 Windows Chrome Governed Mailbox Route

- Ticket: `TKT-64`
- Checklist: `CHK-21`
- Test Case: `TC-053`
- Scope: governed next-handoff default route、active handoff focus、missing-target blocked fallback
- Artifacts Dir: `/tmp/openshock-tkt64-governed-route-kgjFVV`

## Verification

### Check: Go governance contract and regression
**Command run:**
`bash -lc 'cd apps/server && ../../scripts/go.sh test ./internal/store ./internal/api'`

**Output observed:**
```text
ok  	github.com/Larkspur-Wang/OpenShock/apps/server/internal/store	0.867s
ok  	github.com/Larkspur-Wang/OpenShock/apps/server/internal/api	6.358s
```

**Result: PASS**

### Check: Web contract / type / build gate
**Command run:**
`pnpm verify:web`

**Output observed:**
```text
live truth hygiene ok: checked 70 web source files and current state file; no disallowed mock-data imports, banned placeholder wording, or tracked live-truth residue found.
✖ 4 problems (0 errors, 4 warnings)
✓ Compiled successfully in 2.6s
✓ Generating static pages using 15 workers (19/19)
```

**Result: PASS**

### Check: Windows Chrome headed mailbox walkthrough
**Command run:**
`OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-governed-mailbox-route -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-route.md`

**Output observed:**
```text
node ./scripts/headed-governed-mailbox-route.mjs -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-governed-mailbox-route.md
process exited with code 0
```

**Result: PASS**

## Browser Findings

- `/mailbox` create form 现在会读取 `workspace.governance.routingPolicy.suggestedHandoff`，默认按当前 room owner 所在 lane 给出下一棒 governed route，不再随机挑一个非 owner agent。
- 创建推荐 handoff 后，governed route 会切到 `active` 并提供聚焦当前 handoff 的回链，避免同一路由被重复创建。
- 完成当前 reviewer handoff 后，governed route 会继续前滚到下一条 lane；当 QA lane 缺少可映射 agent 时，状态会显式转成 `blocked`，不会静默回退到随机接收方。

## Adversarial Probes

- 已验证 non-happy path: 当前 room 已有未完成 handoff 时，surface 强制转成 `active` 并聚焦现有 ledger，而不是再次创建重复 handoff。
- 已验证 fail-closed path: `Reviewer -> QA` 下一棒缺少合法 target agent 时，surface 显式 `blocked`，不再把 `Codex Dockmaster` 误判成 QA。

## Screenshots

- `governed-route-ready`: `/tmp/openshock-tkt64-governed-route-kgjFVV/screenshots/01-governed-route-ready.png`
- `governed-route-active`: `/tmp/openshock-tkt64-governed-route-kgjFVV/screenshots/02-governed-route-active.png`
- `governed-route-focus-inbox`: `/tmp/openshock-tkt64-governed-route-kgjFVV/screenshots/03-governed-route-focus-inbox.png`
- `governed-route-next-blocked`: `/tmp/openshock-tkt64-governed-route-kgjFVV/screenshots/04-governed-route-next-blocked.png`

VERDICT: PASS
