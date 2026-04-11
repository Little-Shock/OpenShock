"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOperator } from "@/components/operator-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { loginMember, registerMember } from "@/lib/api";

type MemberAuthFormProps = {
  mode: "login" | "register";
  nextPath: string;
};

export function MemberAuthForm({
  mode,
  nextPath,
}: MemberAuthFormProps) {
  const router = useRouter();
  const { setAuthSession } = useCurrentOperator();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isRegister = mode === "register";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) {
      return;
    }

    setIsPending(true);
    const request = isRegister
      ? registerMember({ username, displayName, password })
      : loginMember({ username, password });

    void request
      .then((response) => {
        setAuthSession({
          sessionToken: response.sessionToken,
          member: response.member,
        });
        setFeedback(null);
        router.push(nextPath);
        router.refresh();
      })
      .catch((error) => {
        setFeedback(error instanceof Error ? error.message : "Authentication failed.");
      })
      .finally(() => {
        setIsPending(false);
      });
  }

  return (
    <Card className="w-full max-w-[440px] rounded-[24px] border border-white/80 bg-white/94 px-5 py-5 shadow-[0_24px_60px_rgba(31,35,41,0.08)] sm:rounded-[28px] sm:px-6 sm:py-6">
      <Eyebrow>{isRegister ? "Register" : "Login"}</Eyebrow>
      <div className="display-font mt-3 text-2xl font-black uppercase tracking-[0.05em] text-black sm:text-3xl">
        {isRegister ? "Create your member account" : "Sign back into OpenShock"}
      </div>
      <p className="mt-3 text-[14px] leading-6 text-black/68 sm:leading-7">
        {isRegister
          ? "This account becomes the authenticated identity used for room posts, approvals, and other member-triggered actions."
          : "Use the member account you registered for this workspace shell."}
      </p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/45">
            Username
          </label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="sarah"
            className="form-field"
            autoComplete="username"
          />
        </div>

        {isRegister ? (
          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/45">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Sarah Chen"
              className="form-field"
              autoComplete="name"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/45">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="form-field"
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="submit"
            variant="primary"
            className="action-pill w-full justify-center sm:w-auto"
            disabled={isPending || username.trim().length === 0 || password.trim().length === 0}
          >
            {isPending
              ? (isRegister ? "Creating..." : "Signing in...")
              : (isRegister ? "Create Account" : "Sign In")}
          </Button>
          <Link
            href={isRegister ? `/login?next=${encodeURIComponent(nextPath)}` : `/register?next=${encodeURIComponent(nextPath)}`}
            className="text-[13px] font-medium text-black/58 underline decoration-black/15 underline-offset-4"
          >
            {isRegister ? "Already have an account?" : "Need an account?"}
          </Link>
        </div>
      </form>

      {feedback ? <p className="mt-4 text-sm text-[#9b3c2b]">{feedback}</p> : null}
    </Card>
  );
}
