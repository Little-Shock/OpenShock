"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  buildSessionTokenCookieValue,
  clearSessionTokenCookieValue,
  buildOperatorCookieValue,
  clearOperatorCookieValue,
  normalizeOperatorName,
  OPERATOR_NAME_STORAGE_KEY,
  SESSION_TOKEN_STORAGE_KEY,
} from "@/lib/operator";
import { logoutMember, updateAuthProfile } from "@/lib/api";
import type { Member } from "@/lib/types";

type OperatorContextValue = {
  operatorName: string;
  member: Member | null;
  sessionToken: string;
  isAuthenticated: boolean;
  setOperatorName: (value: string) => Promise<void>;
  setAuthSession: (input: { sessionToken: string; member: Member }) => void;
  clearAuthSession: () => Promise<void>;
};

const OperatorContext = createContext<OperatorContextValue | null>(null);

function persistOperatorName(value: string) {
  if (typeof window !== "undefined") {
    if (value.trim()) {
      window.localStorage.setItem(OPERATOR_NAME_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(OPERATOR_NAME_STORAGE_KEY);
    }
  }

  if (typeof document !== "undefined") {
    document.cookie = value.trim()
      ? buildOperatorCookieValue(value)
      : clearOperatorCookieValue();
  }
}

function persistSessionToken(value: string) {
  const sessionToken = value.trim();
  if (typeof window !== "undefined") {
    if (sessionToken) {
      window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, sessionToken);
    } else {
      window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    }
  }

  if (typeof document !== "undefined") {
    document.cookie = sessionToken
      ? buildSessionTokenCookieValue(sessionToken)
      : clearSessionTokenCookieValue();
  }
}

export function OperatorProvider({
  initialMember,
  initialSessionToken,
  children,
}: {
  initialMember: Member | null;
  initialSessionToken: string;
  children: ReactNode;
}) {
  const [member, setMember] = useState<Member | null>(initialMember);
  const [sessionToken, setSessionToken] = useState(initialSessionToken.trim());
  const operatorName = normalizeOperatorName(member?.displayName);

  useEffect(() => {
    persistOperatorName(operatorName);
  }, [operatorName]);

  useEffect(() => {
    persistSessionToken(sessionToken);
  }, [sessionToken]);

  const value: OperatorContextValue = {
    operatorName,
    member,
    sessionToken,
    isAuthenticated: Boolean(member && sessionToken),
    async setOperatorName(value) {
      const nextDisplayName = normalizeOperatorName(value);
      if (!sessionToken) {
        throw new Error("Login required.");
      }
      const response = await updateAuthProfile(
        { displayName: nextDisplayName },
        { sessionToken },
      );
      setMember(response.member);
      persistOperatorName(response.member.displayName);
    },
    setAuthSession(input) {
      const resolvedToken = input.sessionToken.trim();
      setSessionToken(resolvedToken);
      setMember(input.member);
      persistSessionToken(resolvedToken);
      persistOperatorName(input.member.displayName);
    },
    async clearAuthSession() {
      const previousToken = sessionToken;
      if (previousToken) {
        startTransition(() => {
          void logoutMember({ sessionToken: previousToken }).catch(() => undefined);
        });
      }
      setSessionToken("");
      setMember(null);
      persistSessionToken("");
      persistOperatorName("");
    },
  };

  return (
    <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>
  );
}

export function useCurrentOperator() {
  const context = useContext(OperatorContext);

  if (!context) {
    throw new Error("useCurrentOperator must be used within OperatorProvider");
  }

  return context;
}
