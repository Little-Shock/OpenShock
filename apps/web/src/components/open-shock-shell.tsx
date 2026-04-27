"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { SidebarProfileEntry } from "@/components/stitch-shell-primitives";
import { buildGlobalStats } from "@/lib/phase-zero-helpers";
import { usePhaseZeroState } from "@/lib/live-phase0";
import type { AppTab, MachineState, PresenceState } from "@/lib/phase-zero-types";
import { buildProfileHref } from "@/lib/profile-surface";
import { useQuickSearchController } from "@/lib/quick-search";
import { buildWorkspaceRuleHighlights } from "@/lib/workspace-rule-highlights";
import {
  QuickSearchSurface,
  StitchSidebar,
  StitchTopBar,
  WorkspaceStatusStrip,
} from "@/components/stitch-shell-primitives";

type ShellView = AppTab | "setup" | "issues" | "runs" | "agents" | "settings" | "memory" | "access" | "profiles" | "mailbox" | "topic";

type OpenShockShellProps = {
  view: ShellView;
  title: string;
  eyebrow: string;
  description: string;
  selectedChannelId?: string;
  selectedRoomId?: string;
  contextTitle: string;
  contextDescription: string;
  contextBody?: ReactNode;
  children: ReactNode;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function activeFromView(view: ShellView): "channels" | "rooms" | "inbox" | "board" | null {
  if (
    view === "setup" ||
    view === "issues" ||
    view === "runs" ||
    view === "agents" ||
    view === "settings" ||
    view === "memory" ||
    view === "mailbox" ||
    view === "access" ||
    view === "profiles" ||
    view === "topic"
  ) {
    return null;
  }

  if (view === "chat") {
    return "channels";
  }

  return view;
}

function shellModeFromView(view: ShellView): "chat" | "work" {
  return activeFromView(view) === null ? "work" : "chat";
}

function topBarHrefFromView(view: ShellView) {
  switch (view) {
    case "issues":
      return "/issues";
    case "runs":
      return "/runs";
    case "agents":
      return "/agents";
    case "setup":
      return "/setup";
    case "memory":
      return "/memory";
    case "mailbox":
      return "/mailbox";
    default:
      return undefined;
  }
}

function machineTone(state: MachineState) {
  switch (state) {
    case "busy":
      return "bg-[var(--shock-yellow)] text-[var(--shock-ink)]";
    case "online":
      return "bg-[var(--shock-lime)] text-[var(--shock-ink)]";
    default:
      return "bg-white text-[var(--shock-ink)]";
  }
}

function agentTone(state: PresenceState) {
  switch (state) {
    case "running":
      return "bg-[var(--shock-yellow)] text-[var(--shock-ink)]";
    case "blocked":
      return "bg-[var(--shock-pink)] text-white";
    default:
      return "bg-white text-[var(--shock-ink)]";
  }
}

function machineStateLabel(state: MachineState) {
  switch (state) {
    case "busy":
      return "忙碌";
    case "online":
      return "在线";
    default:
      return "离线";
  }
}

function agentStateLabel(state: PresenceState) {
  switch (state) {
    case "running":
      return "执行中";
    case "blocked":
      return "阻塞";
    default:
      return "待命";
  }
}

function humanTone(active: boolean, status: string) {
  if (active) {
    return "bg-[var(--shock-lime)] text-[var(--shock-ink)]";
  }
  if (status === "suspended") {
    return "bg-[var(--shock-pink)] text-white";
  }
  if (status === "invited") {
    return "bg-[var(--shock-paper)] text-[var(--shock-ink)]";
  }
  return "bg-white text-[var(--shock-ink)]";
}

function humanStateLabel(active: boolean, status: string) {
  if (active) {
    return "在线";
  }
  switch (status) {
    case "suspended":
      return "停用";
    case "invited":
      return "待加入";
    default:
      return "可协作";
  }
}

function workspaceRoleLabel(role: string | undefined) {
  switch (role) {
    case "owner":
      return "所有者";
    case "member":
      return "成员";
    case "viewer":
      return "访客";
    default:
      return role || "成员";
  }
}

export function OpenShockShell({
  view,
  title,
  eyebrow,
  description,
  selectedChannelId,
  selectedRoomId,
  contextTitle,
  contextDescription,
  contextBody,
  children,
}: OpenShockShellProps) {
  const activeTab = activeFromView(view);
  const shellMode = shellModeFromView(view);
  const currentHref = topBarHrefFromView(view);
  const { state, loading, error } = usePhaseZeroState();
  const hasWorkspaceTruth = Boolean(state.workspace.name || state.workspace.repo || state.workspace.branch);
  const hasCollectionTruth =
    state.channels.length > 0 ||
    state.issues.length > 0 ||
    state.rooms.length > 0 ||
    state.runs.length > 0 ||
    state.agents.length > 0 ||
    state.machines.length > 0 ||
    state.inbox.length > 0 ||
    state.mailbox.length > 0 ||
    state.pullRequests.length > 0 ||
    state.sessions.length > 0 ||
    state.memory.length > 0 ||
    Object.keys(state.channelMessages).length > 0 ||
    Object.keys(state.roomMessages).length > 0;
  const resolvedState =
    loading || (!hasCollectionTruth && Boolean(error))
      ? {
          ...state,
          channels: [],
          channelMessages: {},
          issues: [],
          rooms: [],
          roomMessages: {},
          runs: [],
          agents: [],
          machines: [],
          inbox: [],
          mailbox: [],
          pullRequests: [],
          sessions: [],
          memory: [],
        }
      : state;
  const workspaceTitle = hasWorkspaceTruth
    ? resolvedState.workspace.name
    : loading
      ? "同步工作区"
      : error
        ? "工作区未同步"
        : "OpenShock";
  const workspaceSubtitle = hasWorkspaceTruth
    ? `${resolvedState.workspace.branch || "分支未返回"} · ${resolvedState.workspace.pairedRuntime || "运行环境未连接"}`
    : loading
      ? "正在连接工作区"
      : error
        ? "暂时无法连接工作区"
        : "本地优先协作台";
  const stats = buildGlobalStats(resolvedState);
  const disconnected = loading || Boolean(error) || resolvedState.machines.every((machine) => machine.state === "offline");
  const inboxCount = resolvedState.inbox.length;
  const activeMemberId = resolvedState.auth.session.memberId;
  const activeMember =
    resolvedState.auth.members.find((member) => member.id === activeMemberId) ?? resolvedState.auth.members[0];
  const pairedMachine =
    resolvedState.machines.find(
      (machine) =>
        machine.id === resolvedState.workspace.pairedRuntime || machine.name === resolvedState.workspace.pairedRuntime
    ) ??
    resolvedState.machines.find((machine) => machine.state === "busy") ??
    resolvedState.machines.find((machine) => machine.state === "online") ??
    resolvedState.machines[0];
  const preferredAgent =
    resolvedState.agents.find((agent) => agent.id === resolvedState.auth.session.preferences.preferredAgentId) ??
    resolvedState.agents.find((agent) => agent.state === "running") ??
    resolvedState.agents.find((agent) => agent.state === "blocked") ??
    resolvedState.agents[0];
  const shellProfileEntries: SidebarProfileEntry[] = [];

  if (activeMember) {
    const active = activeMember.id === activeMemberId && resolvedState.auth.session.status === "active";
    shellProfileEntries.push({
      id: "human",
      badge: "我",
      title: activeMember.name,
      meta: `${workspaceRoleLabel(activeMember.role)} · ${activeMember.email}`,
      href: buildProfileHref("human", activeMember.id),
      status: humanStateLabel(active, activeMember.status),
      tone: active ? "lime" : activeMember.status === "suspended" ? "pink" : "white",
    });
  }

  if (pairedMachine) {
    shellProfileEntries.push({
      id: "machine",
      badge: "机",
      title: pairedMachine.name,
      meta: `${pairedMachine.cli} · ${pairedMachine.shell}`,
      href: buildProfileHref("machine", pairedMachine.id),
      status: machineStateLabel(pairedMachine.state),
      tone: pairedMachine.state === "busy" ? "yellow" : pairedMachine.state === "online" ? "lime" : "white",
    });
  }

  if (preferredAgent) {
    shellProfileEntries.push({
      id: "agent",
      badge: "智",
      title: preferredAgent.name,
      meta: `${preferredAgent.role} · ${preferredAgent.lane}`,
      href: buildProfileHref("agent", preferredAgent.id),
      status: agentStateLabel(preferredAgent.state),
      tone: preferredAgent.state === "running" ? "yellow" : preferredAgent.state === "blocked" ? "pink" : "white",
    });
  }
  const quickSearch = useQuickSearchController(resolvedState);
  const statsSummary = stats.map((stat) => `${stat.label} ${stat.value}`).join(" · ");
  const isEntryView = view === "setup" || view === "access";
  const activeShellSession =
    (selectedRoomId ? resolvedState.sessions.find((session) => session.roomId === selectedRoomId) : undefined) ??
    resolvedState.sessions.find((session) =>
      session.status === "running" ||
      session.status === "blocked" ||
      session.status === "review" ||
      session.status === "paused"
    ) ??
    resolvedState.sessions.find((session) => session.status !== "done") ??
    resolvedState.sessions[0];
  const shellRuleHighlights = buildWorkspaceRuleHighlights(
    resolvedState.workspace.governance,
    activeShellSession?.memoryPaths ?? []
  );

  return (
    <main className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-[var(--shock-paper)] text-[var(--shock-ink)]">
      <QuickSearchSurface
        key={quickSearch.sessionKey}
        open={quickSearch.open}
        query={quickSearch.query}
        results={quickSearch.results}
        onClose={quickSearch.onCloseQuickSearch}
        onQueryChange={quickSearch.onQueryChange}
        onSelect={quickSearch.onSelectQuickSearch}
      />
      <div
        className={cn(
          "grid h-full min-h-0 w-full overflow-hidden border-y-2 border-[var(--shock-ink)] bg-[var(--shock-paper)]",
          isEntryView ? "md:grid-cols-[minmax(0,1fr)]" : "md:grid-cols-[258px_minmax(0,1fr)]"
        )}
      >
        {!isEntryView ? (
          <StitchSidebar
            active={activeTab}
            mode={shellMode}
            channels={resolvedState.channels}
            rooms={resolvedState.rooms}
            machines={resolvedState.machines}
            agents={resolvedState.agents}
            workspaceName={workspaceTitle}
            workspaceSubtitle={workspaceSubtitle}
            selectedChannelId={selectedChannelId}
            selectedRoomId={selectedRoomId}
            inboxCount={inboxCount}
            profileEntries={shellProfileEntries}
            onOpenQuickSearch={quickSearch.onOpenQuickSearch}
          />
        ) : null}

        <section className="flex min-h-0 flex-col bg-[var(--shock-paper)]">
          <WorkspaceStatusStrip workspaceName={workspaceTitle} disconnected={disconnected} />
          {!isEntryView ? (
            <StitchTopBar
              eyebrow={eyebrow}
              title={title}
              description={description}
              searchPlaceholder="搜索频道 / 讨论间 / 话题 / 事项 / 运行 / 智能体"
              currentHref={currentHref}
              onOpenQuickSearch={quickSearch.onOpenQuickSearch}
            />
          ) : (
            <div className="border-b-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-4 py-4 md:px-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(24,20,14,0.56)]">{eyebrow}</p>
              <h1 className="mt-2 font-display text-[1.8rem] font-bold leading-none">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(24,20,14,0.72)]">{description}</p>
            </div>
          )}

          <div className="border-b-2 border-[var(--shock-ink)] bg-[#f3ead3] px-3 py-2 md:px-4">
            <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div>
                <p className="font-display text-[17px] font-bold">{contextTitle}</p>
                <p className="mt-1 max-w-3xl text-[11px] leading-5 text-[color:rgba(24,20,14,0.66)]">
                  {contextDescription}
                </p>
              </div>
              {!isEntryView ? (
                <p className="rounded-[10px] border border-[color:rgba(24,20,14,0.26)] bg-white/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:rgba(24,20,14,0.64)]">
                  {statsSummary}
                </p>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "grid min-h-0 flex-1 overflow-hidden",
              isEntryView ? "xl:grid-cols-[minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1fr)_288px]"
            )}
          >
            <div className="min-h-0 overflow-y-auto bg-[var(--shock-paper)] px-2 py-2.5 md:px-3 xl:min-h-0">
              {children}
              {isEntryView ? (
                <div className="mt-3 space-y-3">
                  {contextBody}
                  <section
                    data-testid="shell-entry-next-panel"
                    className="rounded-[16px] border-2 border-[var(--shock-ink)] bg-white p-2.5 shadow-[var(--shock-shadow-sm)]"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em]">补完后会发生什么</p>
                    <ul className="mt-2.5 space-y-1.5 text-[12px] leading-5 text-[color:rgba(24,20,14,0.76)]">
                      <li>聊天会变回默认入口。</li>
                      <li>讨论、交接和机器状态会接着上次继续。</li>
                      <li>只有真的卡住时，才需要再回这里排查。</li>
                    </ul>
                  </section>
                </div>
              ) : null}
            </div>
            {!isEntryView ? (
              <aside className="hidden min-h-0 border-l-2 border-[var(--shock-ink)] bg-[#efe5ce] xl:flex xl:flex-col">
              <div className="flex-1 overflow-y-auto p-2.5">
                {contextBody ?? (
                  <section className="rounded-[16px] border-2 border-[var(--shock-ink)] bg-white p-2.5 shadow-[var(--shock-shadow-sm)]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em]">继续方式</p>
                    <ul className="mt-2.5 space-y-1.5 text-[12px] leading-5 text-[color:rgba(24,20,14,0.76)]">
                      <li>先在聊天里说清楚要做什么。</li>
                      <li>需要执行时进入讨论间。</li>
                      <li>任务板只排优先级，不替代讨论。</li>
                    </ul>
                  </section>
                )}
                <>
                    <section
                      data-testid="shell-rule-panel"
                      className="mt-2.5 rounded-[16px] border-2 border-[var(--shock-ink)] bg-white p-2.5 shadow-[var(--shock-shadow-sm)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em]">协作规则</p>
                          <p className="mt-1.5 text-sm font-semibold">继续前先按这组规则。</p>
                        </div>
                        <span className="rounded-full border border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-1 font-mono text-[10px] uppercase">
                          {activeShellSession ? activeShellSession.issueKey : "工作区"}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] leading-5 text-[color:rgba(24,20,14,0.68)]">
                        {activeShellSession
                          ? `当前会先对齐 ${activeShellSession.branch} 这条工作线的协作文件和路由规则。`
                          : "当前会先按工作区的协作规则继续。"}
                      </p>
                      {shellRuleHighlights.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {shellRuleHighlights.map((item) => (
                            <div
                              key={item.id}
                              data-testid={`shell-rule-${item.id}`}
                              className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-[var(--shock-ink)] bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]">
                                  {item.badge}
                                </span>
                                <p className="text-sm font-semibold">{item.label}</p>
                              </div>
                              <p className="mt-1.5 text-[12px] leading-5 text-[color:rgba(24,20,14,0.68)]">{item.summary}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-[12px] leading-5 text-[color:rgba(24,20,14,0.68)]">
                          当前工作区没有额外规则文件，直接继续协作。
                        </p>
                      )}
                    </section>

                    <section className="mt-2.5 rounded-[16px] border-2 border-[var(--shock-ink)] bg-white p-2.5 shadow-[var(--shock-shadow-sm)]">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em]">运行机器</p>
                        <span className="font-mono text-[10px] uppercase">{resolvedState.machines.length}</span>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        {resolvedState.machines.map((machine) => (
                          <Link
                            key={machine.id}
                            href={buildProfileHref("machine", machine.id)}
                            data-testid={`shell-machine-profile-${machine.id}`}
                            className="block rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2.5 py-2.5 transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shock-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe5ce]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold">{machine.name}</p>
                              <span className={cn("rounded-full border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase", machineTone(machine.state))}>
                                {machineStateLabel(machine.state)}
                              </span>
                            </div>
                            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:rgba(24,20,14,0.56)]">
                              {machine.cli}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </section>

                    <section className="mt-2.5 rounded-[16px] border-2 border-[var(--shock-ink)] bg-white p-2.5 shadow-[var(--shock-shadow-sm)]">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em]">智能体</p>
                        <span className="font-mono text-[10px] uppercase">{resolvedState.agents.length}</span>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        {resolvedState.agents.slice(0, 5).map((agent) => (
                          <Link
                            key={agent.id}
                            href={buildProfileHref("agent", agent.id)}
                            data-testid={`shell-agent-profile-${agent.id}`}
                            className="block rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2.5 py-2.5 transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shock-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe5ce]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="min-w-0 flex-1 truncate font-semibold">{agent.name}</p>
                              <span className={cn("rounded-full border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase", agentTone(agent.state))}>
                                {agentStateLabel(agent.state)}
                              </span>
                            </div>
                            <p className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[color:rgba(24,20,14,0.56)]">
                              {agent.lane}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </section>

                    <section className="mt-2.5 rounded-[16px] border-2 border-[var(--shock-ink)] bg-white p-2.5 shadow-[var(--shock-shadow-sm)]">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em]">成员</p>
                        <span className="font-mono text-[10px] uppercase">{resolvedState.auth.members.length}</span>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        {resolvedState.auth.members.slice(0, 5).map((member) => {
                          const active = activeMemberId === member.id && resolvedState.auth.session.status === "active";
                          return (
                            <Link
                              key={member.id}
                              href={buildProfileHref("human", member.id)}
                              data-testid={`shell-human-profile-${member.id}`}
                              className="block rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2.5 py-2.5 transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shock-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe5ce]"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="min-w-0 flex-1 truncate font-semibold">{member.name}</p>
                                <span className={cn("rounded-full border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase", humanTone(active, member.status))}>
                                  {humanStateLabel(active, member.status)}
                                </span>
                              </div>
                              <p className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[color:rgba(24,20,14,0.56)]">
                                {workspaceRoleLabel(member.role)} · {member.email}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                </>
              </div>
              </aside>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
