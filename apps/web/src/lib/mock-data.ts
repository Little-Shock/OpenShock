export type AppTab = "chat" | "rooms" | "inbox" | "board";

export type Priority = "critical" | "high" | "medium";
export type RunStatus = "queued" | "running" | "blocked" | "review" | "done";
export type PresenceState = "running" | "idle" | "blocked";
export type MachineState = "online" | "busy" | "offline";
export type InboxKind = "blocked" | "approval" | "review" | "status";

export type WorkspaceSnapshot = {
  name: string;
  repo: string;
  repoUrl: string;
  branch: string;
  plan: string;
  pairedRuntime: string;
  browserPush: string;
  memoryMode: string;
};

export type Channel = {
  id: string;
  name: string;
  summary: string;
  unread: number;
  purpose: string;
};

export type Message = {
  id: string;
  speaker: string;
  role: "human" | "agent" | "system";
  tone: "human" | "agent" | "blocked" | "system";
  message: string;
  time: string;
};

export type Issue = {
  id: string;
  key: string;
  title: string;
  summary: string;
  state: RunStatus;
  priority: Priority;
  owner: string;
  roomId: string;
  runId: string;
  pullRequest: string;
  checklist: string[];
};

export type Topic = {
  id: string;
  title: string;
  status: RunStatus;
  owner: string;
  summary: string;
};

export type Room = {
  id: string;
  issueKey: string;
  title: string;
  unread: number;
  summary: string;
  boardCount: number;
  topic: Topic;
  runId: string;
  messageIds: string[];
};

export type RunEvent = {
  id: string;
  label: string;
  at: string;
  tone: "paper" | "yellow" | "lime" | "pink";
};

export type ToolCall = {
  id: string;
  tool: string;
  summary: string;
  result: string;
};

export type Run = {
  id: string;
  issueKey: string;
  roomId: string;
  topicId: string;
  status: RunStatus;
  runtime: string;
  machine: string;
  provider: string;
  branch: string;
  worktree: string;
  owner: string;
  startedAt: string;
  duration: string;
  summary: string;
  approvalRequired: boolean;
  stdout: string[];
  stderr: string[];
  toolCalls: ToolCall[];
  timeline: RunEvent[];
  nextAction: string;
  pullRequest: string;
};

export type AgentStatus = {
  id: string;
  name: string;
  description: string;
  mood: string;
  state: PresenceState;
  lane: string;
  provider: string;
  runtimePreference: string;
  memorySpaces: string[];
  recentRunIds: string[];
};

export type MachineStatus = {
  id: string;
  name: string;
  state: MachineState;
  cli: string;
  os: string;
  lastHeartbeat: string;
};

export type InboxItem = {
  id: string;
  title: string;
  kind: InboxKind;
  room: string;
  time: string;
  summary: string;
  action: string;
  href: string;
};

export type SetupStep = {
  id: string;
  title: string;
  status: "done" | "active" | "pending";
  summary: string;
  detail: string;
  href: string;
};

export type SettingsSection = {
  id: string;
  title: string;
  summary: string;
  value: string;
};

export const workspace: WorkspaceSnapshot = {
  name: "Electric Architect",
  repo: "Larkspur-Wang/OpenShock",
  repoUrl: "https://github.com/Larkspur-Wang/OpenShock",
  branch: "main",
  plan: "Builder P0",
  pairedRuntime: "shock-main",
  browserPush: "High-signal only",
  memoryMode: "MEMORY.md + notes/ + decisions/",
};

export const tabs: Array<{ id: AppTab; label: string; href: string }> = [
  { id: "chat", label: "Chat", href: "/chat/all" },
  { id: "rooms", label: "Rooms", href: "/rooms/room-runtime" },
  { id: "inbox", label: "Inbox", href: "/inbox" },
  { id: "board", label: "Board", href: "/board" },
];

export const utilityLinks = [
  { id: "setup", label: "Setup", href: "/setup" },
  { id: "issues", label: "Issues", href: "/issues" },
  { id: "agents", label: "Agents", href: "/agents" },
  { id: "settings", label: "Settings", href: "/settings" },
];

export const channels: Channel[] = [
  {
    id: "all",
    name: "#all",
    summary: "Lounge for fast coordination, handoffs, and offhand product arguments.",
    unread: 5,
    purpose: "Informal chat, quick context, and lightweight coordination land here first.",
  },
  {
    id: "roadmap",
    name: "#roadmap",
    summary: "Direction setting, sequencing, and product disagreements with receipts.",
    unread: 2,
    purpose: "Roadmap lives here until a decision graduates into an Issue Room.",
  },
  {
    id: "announcements",
    name: "#announcements",
    summary: "Low-noise broadcast lane for runtime changes, launches, and policy updates.",
    unread: 0,
    purpose: "Broadcast only. No drifting discussions, no surprise context sinks.",
  },
];

export const channelMessages: Record<string, Message[]> = {
  all: [
    {
      id: "msg-all-1",
      speaker: "Mina",
      role: "human",
      tone: "human",
      message: "Keep the shell light. Chat stays chat. Serious work graduates into an Issue Room.",
      time: "09:12",
    },
    {
      id: "msg-all-2",
      speaker: "Codex Dockmaster",
      role: "agent",
      tone: "agent",
      message: "Runtime presence is synced. Next pass is real run detail and approval routing.",
      time: "09:16",
    },
    {
      id: "msg-all-3",
      speaker: "System",
      role: "system",
      tone: "system",
      message: "OPS-12 was promoted into an Issue Room because it now touches runtime state, branch metadata, and PR closure.",
      time: "09:17",
    },
  ],
  roadmap: [
    {
      id: "msg-roadmap-1",
      speaker: "Longwen",
      role: "human",
      tone: "human",
      message: "Default navigation stays chat-first. Board remains secondary and local to work.",
      time: "10:04",
    },
    {
      id: "msg-roadmap-2",
      speaker: "Claude Review Runner",
      role: "agent",
      tone: "agent",
      message: "Inbox language is cleaner now. It reads like a cockpit, not a firewall dashboard.",
      time: "10:07",
    },
  ],
  announcements: [
    {
      id: "msg-ann-1",
      speaker: "System",
      role: "system",
      tone: "system",
      message: "Phase 0 shell is live. Run detail, Issue Room, Agent registry, and Setup flow now have dedicated routes.",
      time: "11:02",
    },
  ],
};

export const issues: Issue[] = [
  {
    id: "issue-runtime",
    key: "OPS-12",
    title: "Open runtime heartbeat and machine presence",
    summary: "Surface runtime state, last heartbeat, and active CLI lanes inside the shell and Room context.",
    state: "running",
    priority: "critical",
    owner: "Codex Dockmaster",
    roomId: "room-runtime",
    runId: "run_runtime_01",
    pullRequest: "PR #18",
    checklist: [
      "Show runtime online/offline/busy state in left rail",
      "Expose worktree and branch in run detail",
      "Keep approval_required visible to humans",
    ],
  },
  {
    id: "issue-inbox",
    key: "OPS-19",
    title: "Build the inbox decision center",
    summary: "Unify blocked, approval, and review events so humans have one clear intervention surface.",
    state: "review",
    priority: "high",
    owner: "Claude Review Runner",
    roomId: "room-inbox",
    runId: "run_inbox_01",
    pullRequest: "PR #22",
    checklist: [
      "Map event kind to tone and action language",
      "Route cards back to room or run detail",
      "Keep browser push reserved for high-urgency items",
    ],
  },
  {
    id: "issue-memory",
    key: "OPS-27",
    title: "Ship workspace file memory writeback",
    summary: "Write structured run summaries into MEMORY.md, notes/, and decisions/ without adding a heavy memory stack.",
    state: "blocked",
    priority: "high",
    owner: "Memory Clerk",
    roomId: "room-memory",
    runId: "run_memory_01",
    pullRequest: "PR draft",
    checklist: [
      "Write run summary into MEMORY.md",
      "Escalate policy conflicts via inbox instead of silent overwrite",
      "Keep room notes inspectable by humans",
    ],
  },
];

export const rooms: Room[] = [
  {
    id: "room-runtime",
    issueKey: "OPS-12",
    title: "Open runtime heartbeat",
    unread: 3,
    summary: "Bring runtime status, active runs, and unread intervention count into one room.",
    boardCount: 4,
    runId: "run_runtime_01",
    messageIds: ["msg-room-1", "msg-room-2", "msg-room-3"],
    topic: {
      id: "topic-runtime",
      title: "Ship runtime state widgets and run metadata",
      status: "running",
      owner: "Codex Dockmaster",
      summary: "UI shell is moving. Agent is wiring machine presence, branch state, and run detail.",
    },
  },
  {
    id: "room-inbox",
    issueKey: "OPS-19",
    title: "Inbox decision center",
    unread: 1,
    summary: "Turn blocked, approval, and review prompts into one human intervention lane.",
    boardCount: 3,
    runId: "run_inbox_01",
    messageIds: ["msg-room-4", "msg-room-5"],
    topic: {
      id: "topic-inbox",
      title: "Tighten approval cards and escalation copy",
      status: "review",
      owner: "Claude Review Runner",
      summary: "Copy is ready. Waiting on product pass before merge.",
    },
  },
  {
    id: "room-memory",
    issueKey: "OPS-27",
    title: "Memory file writer",
    unread: 4,
    summary: "Make MEMORY.md and decisions/ usable without pretending we already shipped a full memory OS.",
    boardCount: 2,
    runId: "run_memory_01",
    messageIds: ["msg-room-6", "msg-room-7"],
    topic: {
      id: "topic-memory",
      title: "Resolve writeback policy edge cases",
      status: "blocked",
      owner: "Memory Clerk",
      summary: "The agent needs a formal precedence rule before it writes over room notes.",
    },
  },
];

export const roomMessages: Record<string, Message[]> = {
  "room-runtime": [
    {
      id: "msg-room-1",
      speaker: "Codex Dockmaster",
      role: "agent",
      tone: "agent",
      message: "Left rail presence is done. I am wiring run detail and machine heartbeat next.",
      time: "09:20",
    },
    {
      id: "msg-room-2",
      speaker: "Longwen",
      role: "human",
      tone: "human",
      message: "Keep Machine and Agent status visible in the shell. They are not settings, they are actors.",
      time: "09:23",
    },
    {
      id: "msg-room-3",
      speaker: "System",
      role: "system",
      tone: "system",
      message: "Run run_runtime_01 entered live execution on shock-main.",
      time: "09:26",
    },
  ],
  "room-inbox": [
    {
      id: "msg-room-4",
      speaker: "Claude Review Runner",
      role: "agent",
      tone: "agent",
      message: "Approval cards now point back to room and run, not to an orphan modal.",
      time: "10:01",
    },
    {
      id: "msg-room-5",
      speaker: "Mina",
      role: "human",
      tone: "human",
      message: "Keep the action language calm. High signal, not bureaucratic panic.",
      time: "10:08",
    },
  ],
  "room-memory": [
    {
      id: "msg-room-6",
      speaker: "Memory Clerk",
      role: "agent",
      tone: "blocked",
      message: "Blocked: room notes and user preferences disagree. I need the precedence rule to write back safely.",
      time: "10:31",
    },
    {
      id: "msg-room-7",
      speaker: "System",
      role: "system",
      tone: "system",
      message: "Inbox item created: resolve writeback scope priority.",
      time: "10:33",
    },
  ],
};

export const runs: Run[] = [
  {
    id: "run_runtime_01",
    issueKey: "OPS-12",
    roomId: "room-runtime",
    topicId: "topic-runtime",
    status: "running",
    runtime: "shock-main",
    machine: "shock-main",
    provider: "Codex CLI",
    branch: "feat/runtime-state-shell",
    worktree: "wt-runtime-shell",
    owner: "Codex Dockmaster",
    startedAt: "09:26",
    duration: "24m",
    summary: "Sync runtime heartbeat, issue room context, and branch metadata in the shell.",
    approvalRequired: false,
    stdout: [
      "[09:26:11] cloning worktree wt-runtime-shell",
      "[09:27:08] discovered codex and claude code on shock-main",
      "[09:31:42] rendered runtime cards into shell left rail",
      "[09:36:03] linked run metadata to issue room context panel",
      "[09:44:55] preparing PR summary and review checklist",
    ],
    stderr: [],
    toolCalls: [
      { id: "tool-1", tool: "git worktree add", summary: "Created isolated lane for OPS-12", result: "success" },
      { id: "tool-2", tool: "codex", summary: "Updated shell layout and route wiring", result: "success" },
    ],
    timeline: [
      { id: "ev-1", label: "Issue assigned to agent", at: "09:24", tone: "paper" },
      { id: "ev-2", label: "Worktree created", at: "09:26", tone: "yellow" },
      { id: "ev-3", label: "Runtime heartbeat visible", at: "09:33", tone: "lime" },
      { id: "ev-4", label: "PR summary in progress", at: "09:46", tone: "paper" },
    ],
    nextAction: "Open PR when run passes visual review.",
    pullRequest: "PR #18",
  },
  {
    id: "run_inbox_01",
    issueKey: "OPS-19",
    roomId: "room-inbox",
    topicId: "topic-inbox",
    status: "review",
    runtime: "shock-sidecar",
    machine: "shock-sidecar",
    provider: "Claude Code CLI",
    branch: "feat/inbox-decision-cards",
    worktree: "wt-inbox-cards",
    owner: "Claude Review Runner",
    startedAt: "09:58",
    duration: "18m",
    summary: "Refine approval, blocked, and review cards into one inbox cockpit.",
    approvalRequired: false,
    stdout: [
      "[09:58:03] opened issue room context",
      "[10:01:14] rewrote approval card tone",
      "[10:06:48] linked inbox cards to run detail and room view",
      "[10:12:30] waiting on product copy review",
    ],
    stderr: [],
    toolCalls: [
      { id: "tool-3", tool: "claude-code", summary: "Rewrote inbox card copy hierarchy", result: "success" },
    ],
    timeline: [
      { id: "ev-5", label: "Run started", at: "09:58", tone: "yellow" },
      { id: "ev-6", label: "Room links added", at: "10:06", tone: "lime" },
      { id: "ev-7", label: "Review requested", at: "10:12", tone: "paper" },
    ],
    nextAction: "Human review on tone and notification defaults.",
    pullRequest: "PR #22",
  },
  {
    id: "run_memory_01",
    issueKey: "OPS-27",
    roomId: "room-memory",
    topicId: "topic-memory",
    status: "blocked",
    runtime: "shock-main",
    machine: "shock-main",
    provider: "Codex CLI",
    branch: "feat/memory-writeback",
    worktree: "wt-memory-writeback",
    owner: "Memory Clerk",
    startedAt: "10:27",
    duration: "11m",
    summary: "Write run summaries into MEMORY.md while preserving inspectable room context.",
    approvalRequired: true,
    stdout: [
      "[10:27:02] opened MEMORY.md",
      "[10:30:44] collected room notes and user memory scope",
      "[10:31:10] precedence conflict found between room and user notes",
    ],
    stderr: ["[10:31:11] writeback paused: policy missing for room vs user precedence"],
    toolCalls: [
      { id: "tool-4", tool: "codex", summary: "Attempted writeback planning for MEMORY.md", result: "blocked" },
    ],
    timeline: [
      { id: "ev-8", label: "Run started", at: "10:27", tone: "yellow" },
      { id: "ev-9", label: "Conflict detected", at: "10:31", tone: "pink" },
      { id: "ev-10", label: "Inbox escalation created", at: "10:33", tone: "paper" },
    ],
    nextAction: "Resolve precedence rule, then resume writeback.",
    pullRequest: "Draft PR",
  },
];

export const agents: AgentStatus[] = [
  {
    id: "agent-codex-dockmaster",
    name: "Codex Dockmaster",
    description: "Owns shell infrastructure, runtime state, and the visible truth of execution.",
    mood: "Wiring runtime cards",
    state: "running",
    lane: "OPS-12",
    provider: "Codex CLI",
    runtimePreference: "shock-main",
    memorySpaces: ["workspace", "issue-room", "topic"],
    recentRunIds: ["run_runtime_01"],
  },
  {
    id: "agent-claude-review-runner",
    name: "Claude Review Runner",
    description: "Handles tone, review clarity, and inbox ergonomics.",
    mood: "Waiting on product pass",
    state: "idle",
    lane: "OPS-19",
    provider: "Claude Code CLI",
    runtimePreference: "shock-sidecar",
    memorySpaces: ["workspace", "issue-room"],
    recentRunIds: ["run_inbox_01"],
  },
  {
    id: "agent-memory-clerk",
    name: "Memory Clerk",
    description: "Keeps file-based memory honest, inspectable, and recoverable.",
    mood: "Needs policy input",
    state: "blocked",
    lane: "OPS-27",
    provider: "Codex CLI",
    runtimePreference: "shock-main",
    memorySpaces: ["workspace", "user", "room-notes"],
    recentRunIds: ["run_memory_01"],
  },
];

export const machines: MachineStatus[] = [
  { id: "machine-main", name: "shock-main", state: "busy", cli: "Codex + Claude Code", os: "Windows 11", lastHeartbeat: "8s ago" },
  { id: "machine-sidecar", name: "shock-sidecar", state: "online", cli: "Codex", os: "macOS", lastHeartbeat: "21s ago" },
];

export const inboxItems: InboxItem[] = [
  {
    id: "inbox-approval-runtime",
    title: "Approval required for destructive git cleanup",
    kind: "approval",
    room: "Open runtime heartbeat",
    time: "2m ago",
    summary: "Run asked to prune an obsolete branch after visual review passes.",
    action: "Review approval",
    href: "/rooms/room-runtime/runs/run_runtime_01",
  },
  {
    id: "inbox-blocked-memory",
    title: "Memory Clerk is blocked on scope priority",
    kind: "blocked",
    room: "Memory file writer",
    time: "7m ago",
    summary: "Need a rule for session, room, workspace, user, and agent precedence before writeback.",
    action: "Resolve blocker",
    href: "/rooms/room-memory/runs/run_memory_01",
  },
  {
    id: "inbox-review-copy",
    title: "Inbox decision center is ready for review",
    kind: "review",
    room: "Inbox decision center",
    time: "12m ago",
    summary: "Agent prepared the final card copy and route links.",
    action: "Open review",
    href: "/rooms/room-inbox/runs/run_inbox_01",
  },
  {
    id: "inbox-status-shell",
    title: "Runtime lane finished shell pass one",
    kind: "status",
    room: "Open runtime heartbeat",
    time: "18m ago",
    summary: "Presence and run metadata are now visible in the shell.",
    action: "Open room",
    href: "/rooms/room-runtime",
  },
];

export const setupSteps: SetupStep[] = [
  {
    id: "setup-identity",
    title: "Identity and workspace",
    status: "done",
    summary: "Email-first identity with workspace shell ready.",
    detail: "Workspace is provisioned. Browser session is active and GitHub can be linked as a code identity.",
    href: "/settings",
  },
  {
    id: "setup-repo",
    title: "GitHub repo binding",
    status: "done",
    summary: "Repository is connected to the workspace.",
    detail: "OpenShock is bound to Larkspur-Wang/OpenShock with GitHub App first and PAT/SSH fallback reserved.",
    href: "/issues",
  },
  {
    id: "setup-runtime",
    title: "Daemon and runtime pairing",
    status: "active",
    summary: "Local machine is paired and reporting heartbeat.",
    detail: "shock-main is online, Codex and Claude Code are discovered, and the shell reads live runtime state.",
    href: "/rooms/room-runtime",
  },
  {
    id: "setup-pr",
    title: "PR closure loop",
    status: "pending",
    summary: "Mocked in UI, waiting for real API plumbing.",
    detail: "PR state is modeled end-to-end, but GitHub writeback is still mocked in Phase 0.",
    href: "/board",
  },
];

export const settingsSections: SettingsSection[] = [
  { id: "settings-auth", title: "Account identity", summary: "Email stays primary. GitHub is a connected coding identity.", value: "email-first / github-linked" },
  { id: "settings-sandbox", title: "Local trusted sandbox", summary: "High-risk actions escalate; normal coding inherits local CLI policy.", value: "destructive git + force delete => approval_required" },
  { id: "settings-memory", title: "Memory plugin mode", summary: "Phase 0 sticks to file memory before external providers.", value: "MEMORY.md / notes/ / decisions/" },
  { id: "settings-notify", title: "Notification defaults", summary: "Inbox gets everything. Browser push stays high-signal.", value: "browser push => urgent only" },
];

export function getChannelById(channelId: string) {
  return channels.find((channel) => channel.id === channelId);
}

export function getRoomById(roomId: string) {
  return rooms.find((room) => room.id === roomId);
}

export function getIssueByKey(issueKey: string) {
  return issues.find((issue) => issue.key.toLowerCase() === issueKey.toLowerCase());
}

export function getIssueByRoomId(roomId: string) {
  return issues.find((issue) => issue.roomId === roomId);
}

export function getRunById(runId: string) {
  return runs.find((run) => run.id === runId);
}

export function getAgentById(agentId: string) {
  return agents.find((agent) => agent.id === agentId);
}

export function getMessagesForChannel(channelId: string) {
  return channelMessages[channelId] ?? [];
}

export function getMessagesForRoom(roomId: string) {
  return roomMessages[roomId] ?? [];
}

export function getRunsForAgent(agentId: string) {
  const agent = getAgentById(agentId);
  return runs.filter((run) => agent?.recentRunIds.includes(run.id));
}

export function getBoardColumns() {
  return [
    { title: "Queued", accent: "var(--shock-paper)", cards: issues.filter((issue) => issue.state === "queued") },
    { title: "Running", accent: "var(--shock-yellow)", cards: issues.filter((issue) => issue.state === "running") },
    { title: "Blocked", accent: "var(--shock-pink)", cards: issues.filter((issue) => issue.state === "blocked") },
    { title: "Review", accent: "var(--shock-lime)", cards: issues.filter((issue) => issue.state === "review") },
  ];
}

export function getGlobalStats() {
  const activeRuns = runs.filter((run) => run.status === "running" || run.status === "review").length;
  const blockedCount = runs.filter((run) => run.status === "blocked").length;
  return [
    { label: "Runs", value: String(activeRuns).padStart(2, "0"), tone: "yellow" as const },
    { label: "Blocked", value: String(blockedCount).padStart(2, "0"), tone: "pink" as const },
    { label: "Inbox", value: String(inboxItems.length).padStart(2, "0"), tone: "lime" as const },
  ];
}
