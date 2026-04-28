import { buildFirstStartJourney } from "./first-start-journey";
import type { AuthSession, WorkspaceSnapshot } from "./phase-zero-types";

export function buildFreshFirstStartWorkspace(): WorkspaceSnapshot {
  return {
    onboarding: {
      status: "not_started",
      templateId: "dev-team",
      currentStep: "account",
      completedSteps: [],
      resumeUrl: "/setup",
    },
  } as unknown as WorkspaceSnapshot;
}

export function buildFreshSignedOutSession(): AuthSession {
  return {
    id: "signed-out",
    status: "signed_out",
    emailVerificationStatus: "pending",
    deviceAuthStatus: "pending",
    preferences: {
      startRoute: "/chat/all",
    },
    permissions: [],
  } as unknown as AuthSession;
}

export function buildFreshFirstStartJourney() {
  return buildFirstStartJourney(buildFreshFirstStartWorkspace(), buildFreshSignedOutSession());
}

export const FRESH_FIRST_START_NEXT_ROUTE = buildFreshFirstStartJourney().nextHref;
