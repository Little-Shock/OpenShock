# OpenShock True P0 Full Acceptance Plan

**Date:** 2026-04-10  
**Source PRD:** [OpenShockTrueP0MVP.md](./OpenShockTrueP0MVP.md), [OpenShockPRD.md](./OpenShockPRD.md)  
**Scope:** Validate every user-facing and workflow-critical MVP function described by True P0, then record three rounds of execution, bugs, fixes, and retest status.

## Result Legend

- `PASS`: expected behavior verified
- `FAIL`: behavior missing, broken, or materially inconsistent with PRD
- `PARTIAL`: some visible path works but PRD requirement is incomplete
- `BLOCKED`: cannot validate because prerequisite behavior is missing or another bug prevents execution
- `N/A`: not applicable for this round because the feature is explicitly out of current delivered scope

## Test Matrix

| ID | PRD Area | Feature Point | Entry / Preconditions | Core Steps | Expected Result | Visibility | Round 1 | Round 2 | Round 3 | Bug / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A01 | Workspace entry | Public landing is available before login | Fresh browser, no session | Open `/` | Public landing renders and offers login/register CTA instead of crashing or redirecting to a seeded room | UI | TODO | TODO | TODO |  |
| A02 | Workspace entry | Register account | No session | Open `/register`, submit valid username, display name, password | Account created, session established, redirected into authenticated flow | UI + auth API | TODO | TODO | TODO |  |
| A03 | Workspace entry | Login account | Existing registered account, signed out | Open `/login`, submit valid credentials | Session established and redirected into authenticated flow | UI + auth API | TODO | TODO | TODO |  |
| A04 | Workspace entry | Protected routes require login | No session | Open `/board`, `/inbox`, `/profile`, `/settings`, `/rooms/...` | Route redirects to `/login` with next path preserved | UI | TODO | TODO | TODO |  |
| A05 | Workspace entry | Profile update persists | Logged in | Open `/profile`, change display name, refresh page | Updated display name persists across refresh and is used for future member actions | UI + auth API | TODO | TODO | TODO |  |
| A06 | Workspace entry | Sign out clears member session | Logged in | Use sign-out from `/profile`, then reopen protected page | Session cleared and protected page redirects to login | UI + auth API | TODO | TODO | TODO |  |
| W01 | Workspace / repo / runtime | Empty first-run state is usable | Logged in, no rooms, no repo binding | Open `/` after first login | First-run page renders, explains empty state, exposes room creation and repo binding actions | UI | TODO | TODO | TODO |  |
| W02 | Workspace / repo / runtime | Workspace repo binding from settings | Logged in, no binding | Open `/settings`, bind local repo path | Repo binding saved, visible in settings, becomes default binding | UI + action API | TODO | TODO | TODO |  |
| W03 | Workspace / repo / runtime | Workspace repo binding visible in room context | Logged in, room exists, repo already bound | Open issue room | Right rail shows default workspace repo binding | UI | TODO | TODO | TODO |  |
| W04 | Workspace / repo / runtime | Runtime auto-registration visible | Backend + daemon running | Open `/settings` | Runtime appears online in settings and bootstrap-driven pages | UI + daemon | TODO | TODO | TODO |  |
| W05 | Workspace / repo / runtime | CLI/provider detection surfaced to user | Runtime online | Inspect settings/runtime area | User can see provider identity and runtime online/busy state | UI + daemon | TODO | TODO | TODO |  |
| R01 | Collaboration shell | Sidebar room list works | Logged in | Create at least one discussion room and one issue room | Sidebar groups discussion rooms and issue rooms, active room highlights correctly | UI | TODO | TODO | TODO |  |
| R02 | Collaboration shell | Create discussion room | Logged in | Use new room dialog, choose discussion | Discussion room created and navigated to | UI + action API | TODO | TODO | TODO |  |
| R03 | Collaboration shell | Create issue room | Logged in | Use new room dialog, choose issue | Issue created, room created, room opens automatically | UI + action API | TODO | TODO | TODO |  |
| R04 | Collaboration shell | Room timeline supports member messages | Existing room | Post a plain member message | Message appears in main timeline with member identity and timestamp | UI + action API | TODO | TODO | TODO |  |
| R05 | Collaboration shell | Room timeline distinguishes system / member / agent messages | Existing room with daemon activity | Trigger member action and agent action | Timeline shows system, member, and agent entries with differentiated styling | UI | TODO | TODO | TODO |  |
| R06 | Collaboration shell | Room context panel exposes issue summary and counts | Existing issue room | Open issue room | Right rail shows issue status, task counts, integration progress, runtime/system context | UI | TODO | TODO | TODO |  |
| R07 | Collaboration shell | Default room channel is the working surface | Existing issue room | Navigate from list and interact only in main room view | Main room acts as canonical collaboration surface; no missing default-channel breakage | UI | TODO | TODO | TODO |  |
| C01 | Room collaboration | Mentioning an agent creates queued work and daemon reply path | Issue/discussion room, daemon online | Post `@agent_*` instruction in room | Queued turn/session becomes visible; daemon eventually consumes and writes back agent message or progress | UI + daemon | TODO | TODO | TODO |  |
| C02 | Room collaboration | Plain member message can still create visible response turn | Existing room, daemon online | Post neutral human message | Guardian/default response path is reflected in room state if designed so | UI + daemon | TODO | TODO | TODO |  |
| C03 | Room collaboration | Agent-to-agent / handoff visibility | Existing issue room with multiple agent actions | Trigger conditions that create handoff/agent turn transitions | Room system/context panel surfaces handoff and session flow instead of hiding it completely | UI + daemon | TODO | TODO | TODO |  |
| T01 | Tasking | Create task inside issue room | Existing issue room | Use task creation dialog in room context | Task is created, assigned to selected agent, appears in room task list and board | UI + action API | TODO | TODO | TODO |  |
| T02 | Tasking | Create task from board across issues | Existing issue(s), board page | Open board, create task from cross-issue dialog | Task lands under chosen issue and appears in board + issue room | UI + action API | TODO | TODO | TODO |  |
| T03 | Tasking | Task status update | Existing task | Change task status control | Status updates in UI and persists after refresh | UI + action API | TODO | TODO | TODO |  |
| T04 | Tasking | Mark ready for integration | Existing task | Use task action menu `Ready for Integration` | Task reflects ready-for-integration state in room/board | UI + action API | TODO | TODO | TODO |  |
| T05 | Tasking | Assign agent per task | Existing task(s), multiple agents visible | Create multiple tasks with different assignees | Distinct assignee agents shown consistently in board and room | UI + action API | TODO | TODO | TODO |  |
| B01 | Board view | Task board groups by status lane | Existing tasks across statuses | Open `/board` | Tasks grouped under correct status sections, counts match room/task truth | UI | TODO | TODO | TODO |  |
| B02 | Board view | Board realtime refresh | Board page open, daemon or member action changes task state | Change task/run in another page or via action | Board updates after event stream without stale seeded assumptions | UI + realtime | TODO | TODO | TODO |  |
| U01 | Run lifecycle | Queue run from task | Existing task | Use task action `Queue Run` | Run created and visible in room context / system panel | UI + action API | TODO | TODO | TODO |  |
| U02 | Run lifecycle | Run details visible enough for MVP | Existing run | Inspect room right rail / observability drawer | User can see run status, task, agent, runtime, branch/worktree hints, stdout/stderr or output preview, tool calls | UI + daemon | TODO | TODO | TODO |  |
| U03 | Run lifecycle | Approval-required / blocked path surfaces to human | Existing run that enters blocked or approval_required | Trigger run requiring approval | State appears in room or inbox and is intelligible to user | UI + daemon | TODO | TODO | TODO |  |
| U04 | Run lifecycle | Approve run from run controls | Run in approval_required or blocked | Use run action `Approve + Requeue` | Run leaves waiting state and continues/requeues | UI + action API + daemon | TODO | TODO | TODO |  |
| U05 | Run lifecycle | Stop run from run controls | Run queued/running | Use run action `Stop Run` | Run enters cancelled/stopped state and UI reflects it | UI + action API | TODO | TODO | TODO |  |
| G01 | Integration | Request merge from task | Existing task at mergeable state | Use `Request Merge` on task | Merge attempt is created and reflected in issue context | UI + action API | TODO | TODO | TODO |  |
| G02 | Integration | Merge approval via inbox or direct action | Merge approval item or mergeable task exists | Approve merge from inbox or dedicated action | Integration branch state advances and relevant task becomes integrated | UI + action API + daemon | TODO | TODO | TODO |  |
| G03 | Integration | Integration branch progress visible | Existing issue with multiple tasks | Open issue room | Right rail shows merged count / progress / integration status | UI | TODO | TODO | TODO |  |
| G04 | Integration | Conflict / blocked integration routes to inbox | Existing issue with problematic merge | Trigger failing/conflicting merge path | Inbox item and room signal appear for human intervention | UI + daemon | TODO | TODO | TODO |  |
| D01 | Delivery | Delivery PR cannot be created too early | Issue not ready for delivery | Open issue room | Delivery PR action is disabled or clearly blocked until integration is ready | UI | TODO | TODO | TODO |  |
| D02 | Delivery | Delivery PR create path | Integration branch ready for delivery | Use `Create Delivery PR` | Delivery PR object appears in issue context with status and external link fields when available | UI + action API | TODO | TODO | TODO |  |
| I01 | Inbox / correction | Inbox lists human decisions | Runs/merges produce human-required events | Open `/inbox` | Actionable and informational items are separated and counts match items | UI | TODO | TODO | TODO |  |
| I02 | Inbox / correction | Approve run from inbox | Approval inbox item exists | Click inbox action | Decision applied and UI refreshes across inbox/room | UI + action API | TODO | TODO | TODO |  |
| I03 | Inbox / correction | Approve merge from inbox | Merge approval inbox item exists | Click inbox action | Merge approval applied and item/state updates | UI + action API | TODO | TODO | TODO |  |
| I04 | Inbox / correction | Empty inbox state | No pending items | Open `/inbox` | Empty state renders cleanly with no crash | UI | TODO | TODO | TODO |  |
| X01 | Realtime / consistency | SSE-driven refresh keeps shell coherent | Logged in, multiple pages open | Trigger action affecting active page | Room/board/inbox/settings reflect updated truth after refresh events | UI + realtime | TODO | TODO | TODO |  |
| X02 | Realtime / consistency | Home route routing logic works for all states | Use no session / session no rooms / session with room | Open `/` in each state | Public landing, first-run page, and room redirect each work correctly | UI | TODO | TODO | TODO |  |
| X03 | Data integrity | No seeded demo data on startup | Fresh stack start | Query UI and bootstrap | No demo rooms/issues/tasks/messages appear at boot | UI + API | TODO | TODO | TODO |  |
| X04 | Data integrity | Member actions use authenticated identity, not spoofed actor name | Logged in | Trigger member action after changing display name | Message/action attribution uses authenticated display name consistently | UI + auth/action API | TODO | TODO | TODO |  |
| X05 | PRD coverage gap | Run detail page exists as dedicated page | Existing run | Try to navigate from UI to run detail page | Dedicated run detail page and timeline exist per PRD | UI | TODO | TODO | TODO |  |
| X06 | PRD coverage gap | Integration / delivery has standalone view | Existing issue | Try to find dedicated integration/delivery view | Dedicated view exists beyond room side panel | UI | TODO | TODO | TODO |  |
| X07 | PRD coverage gap | Workspace enter page shows repo, agent, runtime overview post-login | Logged in | Enter authenticated shell from `/` | Post-login entry surface exposes repo/agent/runtime overview coherently | UI | TODO | TODO | TODO |  |

## Bug Tracking

| Bug ID | Round Found | Severity | Related Cases | Summary | Repro Notes | Fix Status |
| --- | --- | --- | --- | --- | --- | --- |
| BUG-R1-001 |  |  |  |  |  |  |
| BUG-R1-002 |  |  |  |  |  |  |
| BUG-R2-001 |  |  |  |  |  |  |
| BUG-R2-002 |  |  |  |  |  |  |
| BUG-R3-001 |  |  |  |  |  |  |

## Round Summary

| Round | Date | Passed | Failed | Partial | Blocked | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-04-10 | 0 | 0 | 0 | 0 | Pending execution |
| 2 | 2026-04-10 | 0 | 0 | 0 | 0 | Pending execution |
| 3 | 2026-04-10 | 0 | 0 | 0 | 0 | Pending execution |
