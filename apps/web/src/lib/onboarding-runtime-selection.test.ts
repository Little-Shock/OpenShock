import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOnboardingRuntimeOptions,
  resolveOnboardingDaemonUrl,
  resolveOnboardingRuntimeChoice,
} from "./onboarding-runtime-selection";
import type { RuntimeRegistryRecord } from "./phase-zero-types";

const placeholderRuntime: RuntimeRegistryRecord = {
  id: "当前运行环境还没同步。",
  machine: "当前运行环境还没同步。",
  daemonUrl: "http://127.0.0.1:8090",
  detectedCli: [],
  providers: [],
  shell: "",
  state: "offline",
  pairingState: "paired",
  workspaceRoot: "",
  reportedAt: "2026-04-28T09:13:26Z",
  lastHeartbeatAt: "2026-04-28T09:13:26Z",
  heartbeatIntervalSeconds: 10,
  heartbeatTimeoutSeconds: 45,
};

const realRuntime: RuntimeRegistryRecord = {
  id: "shock-main",
  machine: "shock-main",
  daemonUrl: "http://127.0.0.1:58010",
  detectedCli: ["codex"],
  providers: [
    {
      id: "codex",
      label: "Codex CLI",
      mode: "direct-cli",
      capabilities: ["conversation"],
      models: ["gpt-5.3-codex"],
      transport: "http bridge",
      ready: true,
      status: "ready",
      statusMessage: "Codex CLI 已登录，可直接发送。",
      checkedAt: "2026-04-28T09:36:36Z",
    },
  ],
  shell: "zsh",
  state: "online",
  pairingState: "available",
  workspaceRoot: "/Users/lark/Lark_Project/9_OpenShock",
  reportedAt: "2026-04-28T09:36:36Z",
  lastHeartbeatAt: "2026-04-28T09:36:36Z",
  heartbeatIntervalSeconds: 10,
  heartbeatTimeoutSeconds: 45,
};

test("首启运行环境会优先选择真实在线机器，而不是中文占位配对记录", () => {
  const options = buildOnboardingRuntimeOptions([placeholderRuntime, realRuntime]);

  assert.equal(options[0]?.id, "shock-main");
  assert.equal(options.some((runtime) => runtime.id === "当前运行环境还没同步。"), false);
});

test("当前选择无效时回落到第一台真实运行环境", () => {
  const options = buildOnboardingRuntimeOptions([placeholderRuntime, realRuntime]);
  const choice = resolveOnboardingRuntimeChoice({
    currentChoice: "当前运行环境还没同步。",
    selectedRuntimeName: "当前运行环境还没同步。",
    runtimeOptions: options,
  });

  assert.equal(choice, "shock-main");
});

test("连接地址跟随真实运行环境，而不是旧占位 daemon", () => {
  const daemonUrl = resolveOnboardingDaemonUrl({
    chosenRuntime: realRuntime,
    pairingDaemonUrl: "http://127.0.0.1:8090",
    selectedRuntimeName: "当前运行环境还没同步。",
  });

  assert.equal(daemonUrl, "http://127.0.0.1:58010");
});

test("没有真实运行环境时保留占位记录，方便显示诊断状态", () => {
  const options = buildOnboardingRuntimeOptions([placeholderRuntime]);

  assert.equal(options.length, 1);
  assert.equal(options[0]?.id, "当前运行环境还没同步。");
});
