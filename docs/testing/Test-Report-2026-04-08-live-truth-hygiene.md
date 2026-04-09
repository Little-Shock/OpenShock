# Test Report 2026-04-08 Live Truth Hygiene

- Ticket: `TKT-38`
- Checklist: `CHK-03` `CHK-16`
- Test Case: `TC-042`
- Date: `2026-04-08`
- Scope:
  - detach live surface types from `@/lib/mock-data`
  - remove stale `mock / placeholder` wording from product-facing copy
  - add automated hygiene guard to web verify gate

## Commands

### 1. Hygiene guard

```bash
pnpm check:live-truth-hygiene
```

Result:

```text
live truth hygiene ok: checked 53 source files; no direct mock-data imports in live surfaces and no banned placeholder wording in product copy.
```

### 2. Web typecheck

```bash
pnpm typecheck:web
```

Result:

```text
> openshock@ typecheck:web /home/lark/OpenShock
> pnpm --dir apps/web typecheck

> @openshock/web@0.1.0 typecheck /home/lark/OpenShock/apps/web
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
```

### 3. Release gate

```bash
pnpm verify:release
```

Result:

```text
> openshock@ verify:release /home/lark/OpenShock
> bash ./scripts/release-gate.sh repo

==> repo verify
...
live truth hygiene ok: checked 53 source files; no direct mock-data imports in live surfaces and no banned placeholder wording in product copy.
...
/home/lark/OpenShock/apps/web/src/components/stitch-chat-room-views.tsx
  1337:9  warning  react-hooks/exhaustive-deps
  1338:9  warning  react-hooks/exhaustive-deps
  1601:9  warning  react-hooks/exhaustive-deps
  1602:9  warning  react-hooks/exhaustive-deps
...
✓ Compiled successfully
...
ok  	github.com/Larkspur-Wang/OpenShock/apps/server/internal/api
ok  	github.com/Larkspur-Wang/OpenShock/apps/server/internal/github
ok  	github.com/Larkspur-Wang/OpenShock/apps/server/internal/store
ok  	github.com/Larkspur-Wang/OpenShock/apps/daemon/cmd/openshock-daemon
ok  	github.com/Larkspur-Wang/OpenShock/apps/daemon/internal/api
ok  	github.com/Larkspur-Wang/OpenShock/apps/daemon/internal/runtime
```

### 4. Negative probes

```bash
rg -n 'from "@/lib/mock-data"' \
  apps/web/src/components/live-*.tsx \
  apps/web/src/components/stitch-*.tsx \
  apps/web/src/components/open-shock-shell.tsx \
  apps/web/src/components/run-control-surface.tsx \
  apps/web/src/lib/live-*.ts \
  apps/web/src/lib/live-*.tsx \
  apps/web/src/lib/session-authz.ts \
  apps/web/src/app/api
```

Result:

```text
[no matches]
```

```bash
rg -n '本地 mock|还在 mock|mock 频道|mock room|mock 卡片|mock issue|mock run|mock agent|mock workspace|placeholder 注释窗口' \
  apps/web/src/components \
  apps/web/src/app
```

Result:

```text
[no matches]
```

## Assertions Locked

- live components, live libs, and `/api` routes now import shared Phase 0 truth types from `@/lib/phase-zero-types`, not directly from `@/lib/mock-data`
- `phase-zero-views.tsx` remains the only direct `mock-data` consumer, as the fallback/demo seed surface
- product-facing copy no longer leaks stale `mock / placeholder` wording on live surfaces
- `pnpm verify:web` now runs `pnpm check:live-truth-hygiene` before lint, typecheck, and build

## Notes

- This ticket deliberately does not eliminate Phase 0 seed data; it constrains where seed data is allowed to live and fail closed on new leakage into live surfaces.
- `pnpm verify:release` passed with the existing 4 `react-hooks/exhaustive-deps` warnings in `stitch-chat-room-views.tsx`; no new warning class was introduced by `TKT-38`.
- Existing unrelated dirty docs/report files in the shared checkout were left untouched.
