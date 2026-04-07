"use client";

import Link from "next/link";

import type { AgentStatus, Channel, MachineStatus, Room } from "@/lib/mock-data";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function roomStatusTone(status: Room["topic"]["status"]) {
  switch (status) {
    case "running":
      return "bg-[var(--shock-lime)]";
    case "review":
      return "bg-[var(--shock-cyan)]";
    case "blocked":
      return "bg-[var(--shock-pink)] text-white";
    case "paused":
      return "bg-[#f2e1ad]";
    default:
      return "bg-white";
  }
}

function machineStateTone(state: MachineStatus["state"]) {
  switch (state) {
    case "busy":
      return "bg-[var(--shock-yellow)]";
    case "online":
      return "bg-[var(--shock-lime)]";
    default:
      return "bg-white";
  }
}

function agentStateTone(state: AgentStatus["state"]) {
  switch (state) {
    case "running":
      return "bg-[var(--shock-lime)]";
    case "blocked":
      return "bg-[var(--shock-pink)]";
    default:
      return "bg-white";
  }
}

function agentStateLabel(state: AgentStatus["state"]) {
  switch (state) {
    case "running":
      return "working";
    case "blocked":
      return "blocked";
    default:
      return "ready";
  }
}

type StitchSidebarProps = {
  active: "channels" | "rooms" | "board" | "inbox";
  channels?: Channel[];
  rooms?: Room[];
  machines?: MachineStatus[];
  agents?: AgentStatus[];
  workspaceName?: string;
  workspaceSubtitle?: string;
  selectedChannelId?: string;
  selectedRoomId?: string;
  inboxCount?: number;
};

export function StitchSidebar({
  active,
  channels,
  rooms,
  machines,
  agents,
  workspaceName,
  workspaceSubtitle,
  selectedChannelId,
  selectedRoomId,
  inboxCount,
}: StitchSidebarProps) {
  const navChannels = channels ?? [];
  const roomList = rooms ?? [];
  const machineList = machines ?? [];
  const agentList = agents ?? [];
  const runningAgents = agentList.filter((agent) => agent.state === "running").length;
  const blockedAgents = agentList.filter((agent) => agent.state === "blocked").length;
  const openInboxCount = inboxCount ?? 0;
  const utilityLinks = [
    { href: "/issues", label: "Issues" },
    { href: "/runs", label: "Runs" },
    { href: "/setup", label: "Setup" },
    { href: "/settings", label: "Settings" },
  ] as const;

  return (
    <aside className="hidden h-screen w-[298px] flex-col border-r-3 border-[var(--shock-ink)] bg-[#f3f1ea] md:flex">
      <div className="border-b-3 border-[var(--shock-ink)] bg-white px-4 py-4">
        <div className="rounded-[16px] border-3 border-[var(--shock-ink)] bg-white px-4 py-4 shadow-[3px_3px_0_0_var(--shock-ink)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:rgba(17,17,17,0.62)]">
                Workspace
              </p>
              <p className="mt-2 truncate font-display text-2xl font-bold leading-none">
                {workspaceName || "OpenShock"}
              </p>
              <p className="mt-2 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(17,17,17,0.58)]">
                {workspaceSubtitle || "local-first command room"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[12px] border-3 border-[var(--shock-ink)] bg-[var(--shock-yellow)] font-display text-sm font-bold shadow-[2px_2px_0_0_var(--shock-ink)]">
              OS
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[10px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:rgba(17,17,17,0.52)]">Channels</p>
              <p className="mt-1 font-display text-xl font-bold">{navChannels.length}</p>
            </div>
            <div className="rounded-[10px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:rgba(17,17,17,0.52)]">Rooms</p>
              <p className="mt-1 font-display text-xl font-bold">{roomList.length}</p>
            </div>
            <div className="rounded-[10px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:rgba(17,17,17,0.52)]">Inbox</p>
              <p className="mt-1 font-display text-xl font-bold">{openInboxCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="rounded-[16px] border-3 border-[var(--shock-ink)] bg-white p-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
          <p className="px-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:rgba(17,17,17,0.52)]">
            Main Flow
          </p>
          <div className="mt-3 space-y-2">
            {[
              { id: "channels", label: "Channels", hint: "聊天主壳", href: "/chat/all" },
              { id: "rooms", label: "Issue Rooms", hint: "认真干活", href: "/rooms" },
              { id: "inbox", label: "Inbox", hint: "人类决策", href: "/inbox", badge: openInboxCount > 0 ? String(openInboxCount) : null },
            ].map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] border-3 border-[var(--shock-ink)] px-3 py-3 transition-transform hover:-translate-y-[1px]",
                  active === item.id ? "bg-[var(--shock-yellow)] shadow-[3px_3px_0_0_var(--shock-ink)]" : "bg-white"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-[var(--shock-ink)] bg-white font-display text-xs font-bold">
                  {item.label.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold leading-none">{item.label}</p>
                  <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(17,17,17,0.56)]">
                    {item.hint}
                  </p>
                </div>
                {item.badge ? (
                  <span className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-pink)] px-2 py-1 font-mono text-[10px] text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>

        <section className="mt-4 rounded-[16px] border-3 border-[var(--shock-ink)] bg-white p-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
          <div className="flex items-center justify-between gap-2 px-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:rgba(17,17,17,0.52)]">Channels</p>
            <Link href="/chat/all" className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(17,17,17,0.6)]">
              open
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {navChannels.map((channel) => (
              <Link
                key={channel.id}
                href={`/chat/${channel.id}`}
                className={cn(
                  "block rounded-[12px] border-2 border-[var(--shock-ink)] px-3 py-3 transition-transform hover:-translate-y-[1px]",
                  selectedChannelId === channel.id ? "bg-[var(--shock-yellow)] shadow-[3px_3px_0_0_var(--shock-ink)]" : "bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold">#</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold leading-none">{channel.name}</p>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[color:rgba(17,17,17,0.56)]">
                      {channel.summary}
                    </p>
                  </div>
                  {channel.unread > 0 ? (
                    <span className="rounded-full border-2 border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px]">
                      {channel.unread}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[16px] border-3 border-[var(--shock-ink)] bg-white p-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
          <div className="flex items-center justify-between gap-2 px-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:rgba(17,17,17,0.52)]">Issue Rooms</p>
            <Link href="/rooms" className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(17,17,17,0.6)]">
              all
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {roomList.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className={cn(
                  "block rounded-[12px] border-2 border-[var(--shock-ink)] px-3 py-3 transition-transform hover:-translate-y-[1px]",
                  selectedRoomId === room.id || (active === "rooms" && roomList.length === 1)
                    ? "bg-[var(--shock-yellow)] shadow-[3px_3px_0_0_var(--shock-ink)]"
                    : "bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-[8px] border-2 border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                    {room.issueKey}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-lg font-bold leading-none">{room.title}</p>
                      <span className={cn("rounded-full border border-[var(--shock-ink)] px-2 py-0.5 font-mono text-[9px] uppercase", roomStatusTone(room.topic.status))}>
                        {room.topic.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[color:rgba(17,17,17,0.56)]">
                      {room.topic.title}
                    </p>
                  </div>
                  {room.unread > 0 ? (
                    <span className="rounded-full border-2 border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px]">
                      {room.unread}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[16px] border-3 border-[var(--shock-ink)] bg-white p-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
          <div className="flex items-center justify-between gap-2 px-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:rgba(17,17,17,0.52)]">Active Citizens</p>
            <Link href="/agents" className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(17,17,17,0.6)]">
              profile
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {agentList.slice(0, 4).map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="block rounded-[12px] border-2 border-[var(--shock-ink)] bg-white px-3 py-3 transition-transform hover:-translate-y-[1px]"
              >
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1 h-3.5 w-3.5 rounded-full border border-[var(--shock-ink)]", agentStateTone(agent.state))} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-bold leading-none">{agent.name}</p>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[color:rgba(17,17,17,0.56)]">
                      {agentStateLabel(agent.state)} · {agent.runtimePreference}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="border-t-3 border-[var(--shock-ink)] bg-white px-3 py-3">
        <div className="rounded-[16px] border-3 border-[var(--shock-ink)] bg-white p-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
          <p className="px-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:rgba(17,17,17,0.52)]">
            Planning Surface
          </p>
          <Link
            href="/board"
            className={cn(
              "mt-3 flex items-center justify-between rounded-[12px] border-2 border-[var(--shock-ink)] px-3 py-3",
              active === "board" ? "bg-[var(--shock-yellow)] shadow-[3px_3px_0_0_var(--shock-ink)]" : "bg-[var(--shock-paper)]"
            )}
          >
            <div>
              <p className="font-display text-lg font-bold leading-none">Board</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:rgba(17,17,17,0.56)]">
                planning only
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">later</span>
          </Link>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {utilityLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[10px] border-2 border-[var(--shock-ink)] bg-white px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 rounded-[12px] border-2 border-[var(--shock-ink)] bg-white px-3 py-3">
            <div className="flex items-center justify-between text-sm">
              <span>Running Agents</span>
              <span className="font-mono text-[11px]">{runningAgents}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Blocked Agents</span>
              <span className="font-mono text-[11px]">{blockedAgents}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Machines</span>
              <span className="font-mono text-[11px]">{machineList.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {machineList.slice(0, 3).map((machine) => (
                <div key={machine.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{machine.name}</span>
                  <span className={cn("rounded-full border border-[var(--shock-ink)] px-2 py-0.5 font-mono text-[9px] uppercase", machineStateTone(machine.state))}>
                    {machine.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

type StitchTopBarProps = {
  title: string;
  searchPlaceholder: string;
  eyebrow?: string;
  description?: string;
  tabs?: string[];
  activeTab?: string;
};

export function StitchTopBar({
  title,
  searchPlaceholder,
  eyebrow,
  description,
  tabs,
  activeTab,
}: StitchTopBarProps) {
  const utilityLinks = [
    { href: "/issues", label: "Issues" },
    { href: "/runs", label: "Runs" },
    { href: "/setup", label: "Setup" },
    { href: "/memory", label: "Memory" },
  ] as const;

  return (
    <header className="border-b-3 border-[var(--shock-ink)] bg-white">
      <div className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)_auto]">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:rgba(17,17,17,0.52)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 truncate font-display text-[34px] font-bold leading-none">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:rgba(17,17,17,0.66)]">{description}</p>
          ) : null}
        </div>

        <div className="flex min-h-[64px] items-center">
          <div className="flex w-full items-center gap-3 rounded-[16px] border-3 border-[var(--shock-ink)] bg-white px-4 py-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-[12px] border-2 border-[var(--shock-ink)] bg-white font-mono text-[11px] font-bold">
              K
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(17,17,17,0.52)]">
                Quick Search
              </p>
              <p className="truncate font-display text-lg font-bold leading-none">{searchPlaceholder}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-end gap-2">
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[12px] border-3 border-[var(--shock-ink)] bg-white px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] shadow-[2px_2px_0_0_var(--shock-ink)] transition-transform hover:-translate-y-[1px]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {tabs && tabs.length > 0 ? (
        <div className="border-t-3 border-[var(--shock-ink)] bg-white px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <span
                key={tab}
                className={cn(
                  "rounded-full border-2 border-[var(--shock-ink)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em]",
                  tab === activeTab ? "bg-[var(--shock-yellow)] shadow-[3px_3px_0_0_var(--shock-ink)]" : "bg-white"
                )}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
