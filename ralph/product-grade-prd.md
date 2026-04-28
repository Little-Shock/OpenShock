# OpenShock Product-Grade Iteration PRD

## Goal

Move the current OpenShock Phase 0 local baseline toward a product-grade daily driver without pretending it is already a hosted SaaS.

The near-term product-grade bar is:

- A fresh local stack starts reliably on macOS with the current repo tools.
- The first successful path is single-source across home, access, setup, docs, and tests.
- Supporting flows reduce duplicate next-step copy and keep the main action obvious.
- Request-scoped auth and recovery return the correct caller truth after every recovery action.
- Memory/provider/recovery has verifiable cleanup, degraded fallback, and restart evidence.
- Release evidence is current, discoverable, and fails when stale or missing.

## Current Baseline

OpenShock already has the Phase 0 local control baseline:

- Next.js web shell.
- Go server control plane.
- Go daemon runtime bridge.
- Unified routes for Chat, Rooms, Board, Setup, Access, Settings, Inbox, Mailbox, Memory, Runs, Agents, and Profiles.
- Issue to room to run/session object chain.
- Request-scoped auth work in progress with token/cookie paths.
- Memory center provider orchestration and recovery truth.
- Repo gate, browser gate, release gate, and local walkthrough artifacts.

## Scope

This PRD covers the next product-grade iteration only. It does not cover hosted cloud deployment, full SaaS tenancy, external plugin registry, or a real remote durable memory service.

## Work Themes

1. Stabilize current local startup and verification evidence.
2. Align product docs with current implementation truth.
3. Tighten the first-start journey and supporting-flow UX.
4. Finish auth recovery request-scoped tail items.
5. Add memory/provider cleanup and degraded recovery contracts.
6. Add runtime readiness and release evidence freshness checks.

## Non-Goals

- Do not introduce a new deployment system.
- Do not replace file-state storage with a database in this iteration.
- Do not claim a real external memory adapter until it has a deterministic fake-provider contract and visible degraded fallback.
- Do not broaden the release browser suite without updating the single manifest.

## Next PRD

The next large product direction is captured in `ralph/agent-os-roadmap-prd.md` as **OpenShock Agent OS Roadmap**.

Important calibration:

- OpenShock already has agent profiles, mailbox/handoff, governance, runtime registry, memory center, release gate, headed evidence, and fresh workspace agents. The next problem is connecting these primitives with a continuous scheduler, not rebuilding them.
- Existing agents are identities and handoff participants today; the roadmap turns them into always-on, wakeable, long-running teammates.
- Priority order is scheduling kernel first, AgentRunner and long sessions second, collaboration surface third, governance and evidence closure fourth.
- `WORKFLOW.md` is runtime policy, not documentation: polling, concurrency, Definition of Done, hooks, and agent prompt policy should hot-reload from the project repo.
- OpenShock's durable advantage is local-first execution plus evidence: Agent Done should require headed/proof artifacts and release gate truth.
