import type { AgentHandoff, Room, Run, Session, WorkspaceGovernanceSnapshot } from "@/lib/phase-zero-types";

export type CollaborationProtocolStepId = "claim" | "execute" | "handoff" | "resume" | "closeout";
export type CollaborationProtocolStepState = "pending" | "ready" | "active" | "blocked" | "done";

export type CollaborationProtocolStep = {
  id: CollaborationProtocolStepId;
  label: string;
  state: CollaborationProtocolStepState;
  summary: string;
  meta: string;
};

export function pickPrimaryHandoff(handoffs: AgentHandoff[]): AgentHandoff | null {
  return (
    handoffs.find((handoff) => handoff.status === "blocked") ??
    handoffs.find((handoff) => handoff.status === "requested") ??
    handoffs.find((handoff) => handoff.status === "acknowledged") ??
    handoffs.find((handoff) => handoff.status !== "completed") ??
    handoffs[0] ??
    null
  );
}

export function buildCollaborationProtocolSteps({
  room,
  run,
  session,
  handoff,
  governance,
}: {
  room?: Room | null;
  run?: Run | null;
  session?: Session | null;
  handoff?: AgentHandoff | null;
  governance?: WorkspaceGovernanceSnapshot | null;
}): CollaborationProtocolStep[] {
  const owner = firstNonEmpty(run?.owner, room?.topic.owner, handoff?.toAgent);
  const currentRunStatus = session?.status ?? run?.status ?? room?.topic.status;
  const suggestion =
    room && governance?.routingPolicy?.suggestedHandoff?.roomId === room.id
      ? governance.routingPolicy.suggestedHandoff
      : null;
  const aggregation = governance?.responseAggregation;
  const aggregationState = governanceStatusToStepState(aggregation?.status);
  const handoffLine = handoff ? `${handoff.fromAgent} -> ${handoff.toAgent}` : "";
  const resumeEligible = Boolean(session?.pendingTurn?.resumeEligible || session?.followThread || run?.followThread);
  const aggregationSources = aggregation?.sources?.length ?? 0;

  const claimStep: CollaborationProtocolStep = (() => {
    if (handoff) {
      switch (handoff.status) {
        case "requested":
          return {
            id: "claim",
            label: "认领",
            state: "ready",
            summary: `等待 ${handoff.toAgent} 接手。`,
            meta: handoffLine || "交接已发出",
          };
        case "blocked":
          return {
            id: "claim",
            label: "认领",
            state: "blocked",
            summary: firstNonEmpty(handoff.lastAction, handoff.summary, `等待 ${handoff.toAgent} 重新接手。`),
            meta: handoffLine || "交接需要重新接住",
          };
        default:
          return {
            id: "claim",
            label: "认领",
            state: "done",
            summary: `${handoff.toAgent} 已接手当前讨论。`,
            meta: `当前处理人 ${handoff.toAgent}`,
          };
      }
    }

    if (owner) {
      return {
        id: "claim",
        label: "认领",
        state: "done",
        summary: `当前由 ${owner} 负责推进。`,
        meta: firstNonEmpty(room?.title, "当前讨论"),
      };
    }

    return {
      id: "claim",
      label: "认领",
      state: "pending",
      summary: "还没有明确当前处理人。",
      meta: "先指定接手人",
    };
  })();

  const executeStep: CollaborationProtocolStep = {
    id: "execute",
    label: "执行",
    state: runStatusToStepState(currentRunStatus),
    summary: firstNonEmpty(
      run?.nextAction,
      session?.summary,
      run?.summary,
      currentRunStatus === "done" ? "当前执行已收口。" : "当前执行信息还在同步。"
    ),
    meta: firstNonEmpty(
      currentRunStatus ? `状态 ${runStatusLabel(currentRunStatus)}` : "",
      firstNonEmpty(session?.branch, run?.branch) ? `工作区 ${firstNonEmpty(session?.branch, run?.branch)}` : "",
      run?.id ? `执行 ${run.id}` : "",
      "等待执行信息"
    ),
  };

  const handoffStep: CollaborationProtocolStep = (() => {
    if (handoff) {
      return {
        id: "handoff",
        label: "交接",
        state: handoffStatusToStepState(handoff.status),
        summary: firstNonEmpty(
          handoff.status === "requested" ? handoff.summary : "",
          handoff.lastAction,
          handoff.summary,
          "当前交接信息还在同步。"
        ),
        meta: firstNonEmpty(handoffLine, "当前没有交接对象"),
      };
    }

    if (suggestion && suggestion.status !== "idle") {
      const source = firstNonEmpty(suggestion.fromAgent, suggestion.fromLaneLabel);
      const target = firstNonEmpty(suggestion.toAgent, suggestion.toLaneLabel);
      return {
        id: "handoff",
        label: "交接",
        state: governanceStatusToStepState(suggestion.status),
        summary: firstNonEmpty(
          suggestion.draftSummary,
          suggestion.reason,
          target ? `建议下一棒交给 ${target}。` : "下一棒还在整理。"
        ),
        meta: firstNonEmpty(source && target ? `${source} -> ${target}` : "", target ? `下一棒 ${target}` : "", "等待下一棒"),
      };
    }

    return {
      id: "handoff",
      label: "交接",
      state: "pending",
      summary: "当前没有待处理交接。",
      meta: "继续在当前讨论推进",
    };
  })();

  const resumeStep: CollaborationProtocolStep = (() => {
    if (currentRunStatus === "done") {
      return {
        id: "resume",
        label: "继续",
        state: "done",
        summary: firstNonEmpty(aggregation?.finalResponse, aggregation?.summary, run?.summary, "这条执行已经收口。"),
        meta: firstNonEmpty(run?.pullRequest ? `交付 ${run.pullRequest}` : "", "可以直接看结果"),
      };
    }

    if (handoff?.status === "blocked" || currentRunStatus === "blocked") {
      return {
        id: "resume",
        label: "继续",
        state: "blocked",
        summary: firstNonEmpty(handoff?.lastAction, session?.controlNote, run?.controlNote, "先处理阻塞，再继续。"),
        meta: firstNonEmpty(handoffLine, "等待阻塞解除"),
      };
    }

    if (resumeEligible || currentRunStatus === "paused") {
      return {
        id: "resume",
        label: "继续",
        state: "ready",
        summary: firstNonEmpty(
          session?.pendingTurn?.preview,
          session?.controlNote,
          run?.controlNote,
          run?.nextAction,
          "可以沿当前讨论继续。"
        ),
        meta: session?.pendingTurn?.resumeEligible ? "当前上下文可直接续接" : "已保留续接信号",
      };
    }

    if (currentRunStatus === "running" || currentRunStatus === "review" || handoff?.status === "acknowledged") {
      return {
        id: "resume",
        label: "继续",
        state: "active",
        summary: firstNonEmpty(run?.nextAction, session?.summary, "当前正在推进，不需要重新开始。"),
        meta: firstNonEmpty(owner ? `当前处理人 ${owner}` : "", "沿当前讨论推进"),
      };
    }

    return {
      id: "resume",
      label: "继续",
      state: "pending",
      summary: "当前没有新的续接信号。",
      meta: "需要新的交接或下一步",
    };
  })();

  const closeoutStep: CollaborationProtocolStep = (() => {
    if (aggregationState === "done" || currentRunStatus === "done") {
      return {
        id: "closeout",
        label: "收口",
        state: "done",
        summary: firstNonEmpty(aggregation?.finalResponse, aggregation?.summary, run?.summary, "当前执行已收口。"),
        meta: firstNonEmpty(
          aggregation?.aggregator ? `收口人 ${aggregation.aggregator}` : "",
          aggregationSources > 0 ? `${aggregationSources} 份输入已汇总` : "",
          run?.pullRequest ? `交付 ${run.pullRequest}` : "",
          "可直接对外回复"
        ),
      };
    }

    if (aggregationState === "blocked") {
      return {
        id: "closeout",
        label: "收口",
        state: "blocked",
        summary: firstNonEmpty(aggregation?.summary, "最终结果还没法提交。"),
        meta: firstNonEmpty(aggregation?.aggregator ? `收口人 ${aggregation.aggregator}` : "", "先清掉阻塞"),
      };
    }

    if (handoff?.status === "completed" || aggregationSources > 0 || currentRunStatus === "review") {
      return {
        id: "closeout",
        label: "收口",
        state: "active",
        summary: firstNonEmpty(aggregation?.summary, run?.summary, "正在整理最终结果。"),
        meta: firstNonEmpty(
          aggregation?.aggregator ? `收口人 ${aggregation.aggregator}` : "",
          aggregationSources > 0 ? `${aggregationSources} 份输入已汇总` : "",
          "等待最终确认"
        ),
      };
    }

    return {
      id: "closeout",
      label: "收口",
      state: "pending",
      summary: "当前还没有最终收口信号。",
      meta: "继续推进当前执行",
    };
  })();

  return [claimStep, executeStep, handoffStep, resumeStep, closeoutStep];
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return "";
}

function runStatusToStepState(status?: Run["status"]): CollaborationProtocolStepState {
  switch (status) {
    case "queued":
      return "ready";
    case "running":
    case "review":
      return "active";
    case "paused":
      return "ready";
    case "blocked":
      return "blocked";
    case "done":
      return "done";
    default:
      return "pending";
  }
}

function handoffStatusToStepState(status?: AgentHandoff["status"]): CollaborationProtocolStepState {
  switch (status) {
    case "requested":
      return "ready";
    case "acknowledged":
      return "active";
    case "blocked":
      return "blocked";
    case "completed":
      return "done";
    default:
      return "pending";
  }
}

function governanceStatusToStepState(status?: string): CollaborationProtocolStepState {
  switch ((status || "").trim()) {
    case "ready":
      return "ready";
    case "active":
    case "running":
    case "in_progress":
    case "review":
      return "active";
    case "blocked":
      return "blocked";
    case "done":
    case "completed":
      return "done";
    default:
      return "pending";
  }
}

function runStatusLabel(status: Run["status"]) {
  switch (status) {
    case "running":
      return "进行中";
    case "paused":
      return "已暂停";
    case "blocked":
      return "阻塞";
    case "review":
      return "待评审";
    case "done":
      return "已完成";
    default:
      return "待开始";
  }
}
