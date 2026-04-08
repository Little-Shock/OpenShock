import { CoordinatorError } from "./errors.js";

export const DEFAULT_SAMPLE_FIXTURE = Object.freeze({
  topicId: "topic_0a_sample",
  goal: "0A integrated runtime sample topic",
  constraints: ["single-machine", "deterministic-loop"],
  leadAgentId: "lead_sample_01",
  workerAgentIds: ["worker_sample_01", "worker_sample_02"]
});

function normalizeFixture(input = {}) {
  const workerAgentIds = Array.isArray(input.workerAgentIds) && input.workerAgentIds.length >= 2
    ? input.workerAgentIds.slice(0, 2)
    : DEFAULT_SAMPLE_FIXTURE.workerAgentIds;
  return {
    topicId: input.topicId ?? DEFAULT_SAMPLE_FIXTURE.topicId,
    goal: input.goal ?? DEFAULT_SAMPLE_FIXTURE.goal,
    constraints: Array.isArray(input.constraints) ? input.constraints : DEFAULT_SAMPLE_FIXTURE.constraints,
    leadAgentId: input.leadAgentId ?? DEFAULT_SAMPLE_FIXTURE.leadAgentId,
    workerAgentIds
  };
}

export function seedSampleFixture(coordinator, input = {}) {
  const fixture = normalizeFixture(input);
  let topicCreated = false;

  try {
    coordinator.createTopic({
      topicId: fixture.topicId,
      goal: fixture.goal,
      constraints: fixture.constraints
    });
    topicCreated = true;
  } catch (error) {
    if (!(error instanceof CoordinatorError) || error.code !== "topic_exists") {
      throw error;
    }
  }

  coordinator.registerAgent(fixture.topicId, {
    agentId: fixture.leadAgentId,
    role: "lead",
    status: "active"
  });

  coordinator.registerAgent(fixture.topicId, {
    agentId: fixture.workerAgentIds[0],
    role: "worker",
    laneId: "lane_sample_01",
    status: "active"
  });

  coordinator.registerAgent(fixture.topicId, {
    agentId: fixture.workerAgentIds[1],
    role: "worker",
    laneId: "lane_sample_02",
    status: "active"
  });

  const overview = coordinator.getTopicOverview(fixture.topicId);
  return {
    fixture,
    topicCreated,
    topicRevision: overview.revision,
    agentCount: overview.agents.length
  };
}

export function buildRuntimeConfig(input = {}) {
  const fixture = normalizeFixture(input.fixture ?? {});
  const serverPort = input.serverPort ?? null;
  return {
    runtimeName: input.runtimeName ?? "openshock-0a-single-machine",
    serverPort,
    shellUrl: input.shellUrl ?? null,
    daemonName: input.daemonName ?? "openshock-daemon",
    endpoints: {
      health: "/health",
      runtimeConfig: "/runtime/config",
      seedFixture: "/runtime/fixtures/seed",
      daemonEvents: "/runtime/daemon/events",
      runtimeSmoke: "/runtime/smoke",
      topicOverview: `/topics/${fixture.topicId}/overview`
    },
    sampleFixture: fixture
  };
}

