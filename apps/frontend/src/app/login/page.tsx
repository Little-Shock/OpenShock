import { redirect } from "next/navigation";
import { MemberAuthForm } from "@/components/member-auth-form";
import { getServerAuthState } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

function resolveNextPath(value?: string) {
  if (!value || !value.startsWith("/")) {
    return "/";
  }
  return value === "/rooms" || value === "/rooms/" ? "/" : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getServerAuthState();
  if (auth.authenticated) {
    redirect("/");
  }

  const params = await searchParams;
  const nextPath = resolveNextPath(params.next);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(173,216,255,0.22),transparent_34%),linear-gradient(180deg,#f4f7fb_0%,#edf1f6_100%)] px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-center gap-6 sm:min-h-[calc(100vh-4rem)] sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="display-font text-[2.5rem] font-black uppercase leading-[0.95] tracking-[0.05em] text-black sm:text-5xl">
            Sign in,
            <br />
            then open the first room.
          </div>
          <p className="mt-4 text-[14px] leading-6 text-black/68 sm:text-[15px] sm:leading-7">
            Authenticated member identity now drives human-triggered actions across
            the shell, so sign in before posting messages, binding repos, or approving work.
          </p>
        </div>
        <MemberAuthForm mode="login" nextPath={nextPath} />
      </div>
    </div>
  );
}
