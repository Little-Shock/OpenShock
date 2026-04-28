# OpenShock Agent OS Roadmap PRD

## Goal

Turn OpenShock from a local-first AI workbench into a local-first Agent OS: a workspace where tickets continuously attract the right agent, agents work in durable per-ticket workspaces, Rooms make human/agent collaboration visible, and every claim of completion lands in evidence, headed replay, and release gate truth.

## Calibrated Baseline

OpenShock is not starting from zero. The repo already has agent profiles, mailbox/handoff, governance, runtime registry, memory center, release gate, headed evidence, and a fresh workspace flow that creates Codex Dockmaster, Build Pilot, Claude Review Runner, and Memory Clerk.

The current gap is not missing primitives. The gap is that these primitives are not yet connected by a continuous scheduling kernel. Existing agents have identities and handoff objects, but they are not always-on, wakeable, long-running teammates that can autonomously claim, retry, reconcile, and close tasks with proof.

## Product Thesis

Slock-like collaboration is valuable, but it should not be the first dependency. The first dependency is a Symphony-like scheduling core: ticket state machine, per-ticket workspace, polling, reconciliation, retry, stall detection, and safe continuation. Once that core exists, Rooms can become the visible collaboration surface for work that is already alive underneath.

OpenShock should win on a different axis than both Slock and Symphony: local-first execution plus verifiable delivery. Agent Done must mean evidence exists, a headed replay or comparable proof-of-work was captured, and release gate policy accepted the result.

## Milestones

### M1: Scheduling Kernel MVP

Build the invisible kernel under Board:

- Ticket internal lifecycle: Unclaimed, Claimed, Running, RetryQueued, Released, plus terminal business states.
- Per-ticket workspace under a constrained workspace root, with sanitized directory names and strict cwd/path invariants.
- Poll/reconcile loop that refreshes running work before dispatching new work.
- Retry and stall detection with bounded exponential backoff.
- Runtime snapshot that exposes running, retrying, stalled, and recently reconciled work.

### M2: Agent Runner And Long Sessions

Upgrade execution from one-shot commands to resumable agent threads:

- AgentRunner interface with Codex, Claude Code, and Gemini CLI adapters.
- First-turn versus continuation-turn prompts.
- Thread lifecycle with stop, hibernate, wake, and max-turn controls.
- Event streaming from agent turns into store state and Rooms.
- Runtime readiness reasons used during assignment.

### M3: Collaboration Surface Upgrade

Make existing Rooms, mailbox, and handoff feel like human-agent teamwork rather than tool output:

- Rooms and DMs share one timeline model for human messages, agent messages, system events, and tool cards.
- Agent presence reflects Online, Thinking, Working, and Hibernating.
- `@mention` wakes a hibernating agent and binds the next turn to the right room or ticket.
- Handoff visualization shows who owns the next step and why.
- The frontend stays simplified: one primary action per surface, no duplicated summaries, restrained panels, and clear evidence links.

### M4: Governance And Evidence Closure

Make policy runtime-readable and completion auditable:

- `WORKFLOW.md` is loaded from the project repo at runtime, with hot-reload for polling, concurrency, DoD, hooks, and agent prompt policy.
- Hook runner supports after_create, before_run, after_run, and before_remove.
- Release gate becomes the scheduler-recognized Definition of Done.
- Proof-of-work headed replay or screenshot evidence is attached to completed tickets and Rooms.
- Orchestrator snapshot view shows agents, tickets, runtime readiness, retry state, last event, and gate evidence.

## Non-Goals

- Do not rebuild existing agent profile, mailbox, governance, memory, or release evidence primitives from scratch.
- Do not make channel polish the first milestone if agents still cannot run autonomously.
- Do not let agents hold raw external tokens; server-side capability proxies should mediate privileged operations.
- Do not mark tasks Done based only on model text.
- Do not force every ambiguous exploratory task into Board; Chat should remain the place for human-led interactive work.

## Success Criteria

- A fresh local workspace can accept multiple Board tickets and keep work moving without manual re-triggering.
- Each active ticket has exactly one safe execution workspace and an observable scheduler state.
- Agent turns can continue in the same thread until the ticket is terminal or a configured limit is reached.
- Completion evidence is attached to the ticket/Room and release gate policy is visible.
- The primary UI reads simpler than the current shell: fewer repeated summaries, clearer next action, and calmer visual hierarchy.
