"use client";

import { useEffect, useState } from "react";

import { Panel } from "@/components/phase-zero-views";
import { usePhaseZeroState } from "@/lib/live-phase0";
import {
  sandboxActionKindLabel,
  sandboxDecisionHeadline,
  sandboxDecisionLabel,
  sandboxDecisionTone,
  sandboxPolicyDraft,
  sandboxProfileLabel,
} from "@/lib/sandbox-policy";
import { hasSessionPermission, permissionBoundaryCopy, permissionStatus } from "@/lib/session-authz";
import type { Run, SandboxActionKind, SandboxProfile } from "@/lib/phase-zero-types";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function FactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border-2 border-[var(--shock-ink)] bg-white px-3 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.6)]">{label}</p>
      <p className="mt-1.5 font-display text-[17px] font-semibold leading-5">{value}</p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: string;
  tone?: "white" | "yellow" | "lime" | "pink";
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border-2 border-[var(--shock-ink)] px-3 py-3",
        tone === "yellow" && "bg-[var(--shock-yellow)]",
        tone === "lime" && "bg-[var(--shock-lime)]",
        tone === "pink" && "bg-[var(--shock-pink)] text-white",
        tone === "white" && "bg-white"
      )}
    >
      <p className={cn("font-mono text-[10px] uppercase tracking-[0.18em]", tone === "pink" ? "text-white/78" : "text-[color:rgba(24,20,14,0.62)]")}>
        {label}
      </p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  );
}

function valueOrPlaceholder(value: string | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function listToText(values?: string[]) {
  return valueOrPlaceholder((values ?? []).join(", "), "未声明");
}

const ACTION_KIND_OPTIONS: Array<{ value: SandboxActionKind; label: string }> = [
  { value: "command", label: "Command" },
  { value: "network", label: "Network" },
  { value: "tool", label: "Tool" },
];

export function RunSandboxSurface({ run }: { run: Run }) {
  const { state, updateRunSandbox, checkRunSandbox } = usePhaseZeroState();
  const authSession = state.auth.session;
  const canExecute = hasSessionPermission(authSession, "run.execute");
  const canOverride = hasSessionPermission(authSession, "workspace.manage");
  const executeStatus = permissionStatus(authSession, "run.execute");
  const overrideStatus = permissionStatus(authSession, "workspace.manage");

  const [sandboxProfile, setSandboxProfile] = useState<SandboxProfile>((run.sandbox.profile || "trusted") as SandboxProfile);
  const [allowedHosts, setAllowedHosts] = useState((run.sandbox.allowedHosts ?? []).join(", "));
  const [allowedCommands, setAllowedCommands] = useState((run.sandbox.allowedCommands ?? []).join(", "));
  const [allowedTools, setAllowedTools] = useState((run.sandbox.allowedTools ?? []).join(", "));
  const [actionKind, setActionKind] = useState<SandboxActionKind>("command");
  const [actionTarget, setActionTarget] = useState("");
  const overrideReady =
    run.sandboxDecision.status === "approval_required" &&
    run.sandboxDecision.kind === actionKind &&
    run.sandboxDecision.target?.trim().toLowerCase() === actionTarget.trim().toLowerCase();
  const [pendingSave, setPendingSave] = useState(false);
  const [pendingCheck, setPendingCheck] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    setSandboxProfile((run.sandbox.profile || "trusted") as SandboxProfile);
    setAllowedHosts((run.sandbox.allowedHosts ?? []).join(", "));
    setAllowedCommands((run.sandbox.allowedCommands ?? []).join(", "));
    setAllowedTools((run.sandbox.allowedTools ?? []).join(", "));
  }, [run.id, run.sandbox.allowedCommands, run.sandbox.allowedHosts, run.sandbox.allowedTools, run.sandbox.profile]);

  async function handleSave() {
    setPendingSave(true);
    setSaveError(null);
    setSaveStatus(null);
    try {
      await updateRunSandbox(
        run.id,
        sandboxPolicyDraft(sandboxProfile, {
          allowedHosts,
          allowedCommands,
          allowedTools,
        })
      );
      setSaveStatus("run sandbox policy 已写回 live truth；后续 check/override 会直接围这份 allowlist 判断。");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "run sandbox update failed");
    } finally {
      setPendingSave(false);
    }
  }

  async function handleCheck(override: boolean) {
    setPendingCheck(true);
    setCheckError(null);
    setCheckStatus(null);
    try {
      const payload = await checkRunSandbox(run.id, {
        kind: actionKind,
        target: actionTarget.trim(),
        override,
      });
      setCheckStatus(sandboxDecisionHeadline(payload.decision ?? run.sandboxDecision));
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : "run sandbox check failed");
    } finally {
      setPendingCheck(false);
    }
  }

  return (
    <Panel tone={run.sandbox.profile === "restricted" ? "yellow" : "paper"} className="!p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.48)]">Run Sandbox</p>
          <h3 className="mt-2 font-display text-[24px] font-bold leading-7">把 network / command / tool gate 收成可检查、可 override 的 run 级合同</h3>
        </div>
        <span className="rounded-full border-2 border-[var(--shock-ink)] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
          {sandboxProfileLabel(run.sandbox.profile)}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:rgba(24,20,14,0.74)]">
        这块不接管 OS 级沙盒；它只把当前 run 的 restricted policy、allowlist 判断和 human override retry 收成同一条 live truth，避免执行边界只停在 CLI 口头约定里。
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <FactTile label="Profile" value={sandboxProfileLabel(run.sandbox.profile)} />
        <FactTile label="Hosts" value={String(run.sandbox.allowedHosts?.length ?? 0)} />
        <FactTile label="Commands" value={String(run.sandbox.allowedCommands?.length ?? 0)} />
        <FactTile label="Tools" value={String(run.sandbox.allowedTools?.length ?? 0)} />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_0.92fr]">
        <div className="rounded-[20px] border-2 border-[var(--shock-ink)] bg-white px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.48)]">Policy Editor</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.58)]">
              {canExecute ? "run.execute" : executeStatus}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">profile</span>
              <select
                data-testid="run-detail-sandbox-profile"
                value={sandboxProfile}
                onChange={(event) => setSandboxProfile(event.target.value as SandboxProfile)}
                disabled={!canExecute || pendingSave}
                className="rounded-[16px] border-2 border-[var(--shock-ink)] px-3 py-3"
              >
                <option value="trusted">trusted</option>
                <option value="restricted">restricted</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">allowed hosts</span>
              <input
                data-testid="run-detail-sandbox-allowed-hosts"
                value={allowedHosts}
                onChange={(event) => setAllowedHosts(event.target.value)}
                disabled={!canExecute || pendingSave}
                className="rounded-[16px] border-2 border-[var(--shock-ink)] px-3 py-3"
                placeholder="github.com, api.openai.com"
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">allowed commands</span>
              <input
                data-testid="run-detail-sandbox-allowed-commands"
                value={allowedCommands}
                onChange={(event) => setAllowedCommands(event.target.value)}
                disabled={!canExecute || pendingSave}
                className="rounded-[16px] border-2 border-[var(--shock-ink)] px-3 py-3"
                placeholder="git status, pnpm test"
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">allowed tools</span>
              <input
                data-testid="run-detail-sandbox-allowed-tools"
                value={allowedTools}
                onChange={(event) => setAllowedTools(event.target.value)}
                disabled={!canExecute || pendingSave}
                className="rounded-[16px] border-2 border-[var(--shock-ink)] px-3 py-3"
                placeholder="read_file, rg"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="run-detail-sandbox-save"
              onClick={() => void handleSave()}
              disabled={!canExecute || pendingSave}
              className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:bg-[var(--shock-paper)]"
            >
              {pendingSave ? "写回中..." : "Save Run Policy"}
            </button>
            {saveStatus ? <span data-testid="run-detail-sandbox-save-status" className="text-sm leading-6">{saveStatus}</span> : null}
            {saveError ? <span className="text-sm leading-6 text-[color:rgba(163,37,28,0.9)]">{saveError}</span> : null}
          </div>
          {!canExecute ? (
            <p className="mt-3 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{permissionBoundaryCopy(authSession, "run.execute")}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-[20px] border-2 border-[var(--shock-ink)] bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.48)]">Current Decision</p>
              <span
                data-testid="run-detail-sandbox-decision-status"
                className={cn(
                  "rounded-full border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                  sandboxDecisionTone(run.sandboxDecision.status) === "lime" && "bg-[var(--shock-lime)]",
                  sandboxDecisionTone(run.sandboxDecision.status) === "yellow" && "bg-[var(--shock-yellow)]",
                  sandboxDecisionTone(run.sandboxDecision.status) === "pink" && "bg-[var(--shock-pink)] text-white",
                  sandboxDecisionTone(run.sandboxDecision.status) === "white" && "bg-white"
                )}
              >
                {sandboxDecisionLabel(run.sandboxDecision.status)}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <StatusRow label="Decision" value={sandboxDecisionHeadline(run.sandboxDecision)} tone={sandboxDecisionTone(run.sandboxDecision.status)} />
              <StatusRow label="Reason" value={valueOrPlaceholder(run.sandboxDecision.reason, "当前还没有触发 restricted action check。")} />
              <StatusRow label="Retry Hint" value={valueOrPlaceholder(run.sandboxDecision.retryHint, "没有额外 retry hint。")} />
              <StatusRow
                label="Actor"
                value={valueOrPlaceholder(run.sandboxDecision.overrideBy || run.sandboxDecision.requestedBy, "未记录")}
              />
            </div>
          </div>

          <div className="rounded-[20px] border-2 border-[var(--shock-ink)] bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.48)]">Action Probe</p>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.58)]">
                override = {canOverride ? "workspace.manage" : overrideStatus}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
              先用 exact `kind + target` 检查 allowlist；只有 current decision 已进入 `approval_required`，且人类具备 `workspace.manage` 时，才允许按同一 target 执行 override retry。
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em]">action kind</span>
                <select
                  data-testid="run-detail-sandbox-kind"
                  value={actionKind}
                  onChange={(event) => setActionKind(event.target.value as SandboxActionKind)}
                  disabled={!canExecute || pendingCheck}
                  className="rounded-[16px] border-2 border-[var(--shock-ink)] px-3 py-3"
                >
                  {ACTION_KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em]">target</span>
                <input
                  data-testid="run-detail-sandbox-target"
                  value={actionTarget}
                  onChange={(event) => setActionTarget(event.target.value)}
                  disabled={!canExecute || pendingCheck}
                  className="rounded-[16px] border-2 border-[var(--shock-ink)] px-3 py-3"
                  placeholder={sandboxActionKindLabel(actionKind) === "Network" ? "api.openai.com" : "git push --force"}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="run-detail-sandbox-check"
                onClick={() => void handleCheck(false)}
                disabled={!canExecute || pendingCheck || actionTarget.trim() === ""}
                className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-lime)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:bg-[var(--shock-paper)]"
              >
                {pendingCheck ? "检查中..." : "Check Gate"}
              </button>
              <button
                type="button"
                data-testid="run-detail-sandbox-override"
                onClick={() => void handleCheck(true)}
                disabled={!canExecute || !canOverride || !overrideReady || pendingCheck || actionTarget.trim() === ""}
                className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:bg-[var(--shock-paper)]"
              >
                {pendingCheck ? "批准中..." : "Approve Retry"}
              </button>
            </div>
            {checkStatus ? <p data-testid="run-detail-sandbox-check-status" className="mt-3 text-sm leading-6">{checkStatus}</p> : null}
            {checkError ? <p className="mt-3 text-sm leading-6 text-[color:rgba(163,37,28,0.9)]">{checkError}</p> : null}
            {!overrideReady ? (
              <p className="mt-3 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
                只有当前 decision 已对同一条 {sandboxActionKindLabel(actionKind)} / {actionTarget.trim() || "target"} 进入
                {" "}approval_required，才会放开 override retry。
              </p>
            ) : null}
            {!canOverride ? (
              <p className="mt-3 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{permissionBoundaryCopy(authSession, "workspace.manage")}</p>
            ) : null}
          </div>

          <div className="rounded-[20px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-4 py-4 text-sm leading-6">
            <p><span className="font-semibold">Hosts:</span> {listToText(run.sandbox.allowedHosts)}</p>
            <p><span className="font-semibold">Commands:</span> {listToText(run.sandbox.allowedCommands)}</p>
            <p><span className="font-semibold">Tools:</span> {listToText(run.sandbox.allowedTools)}</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
