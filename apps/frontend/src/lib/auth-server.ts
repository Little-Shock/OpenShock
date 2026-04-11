import "server-only";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/api";
import type { Member } from "@/lib/types";
import { getCurrentSessionToken } from "@/lib/operator-server";

export type ServerAuthState = {
  authenticated: boolean;
  sessionToken: string;
  member: Member | null;
};

export async function getServerAuthState(): Promise<ServerAuthState> {
  const sessionToken = await getCurrentSessionToken();
  if (!sessionToken) {
    return {
      authenticated: false,
      sessionToken: "",
      member: null,
    };
  }

  try {
    const state = await getAuthSession({ sessionToken });
    if (!state.authenticated || !state.member) {
      return {
        authenticated: false,
        sessionToken: "",
        member: null,
      };
    }
    return {
      authenticated: true,
      sessionToken,
      member: state.member,
    };
  } catch {
    return {
      authenticated: false,
      sessionToken: "",
      member: null,
    };
  }
}

export async function requireAuthenticatedMember(nextPath: string) {
  const auth = await getServerAuthState();
  if (!auth.authenticated || !auth.member || !auth.sessionToken) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return auth;
}
