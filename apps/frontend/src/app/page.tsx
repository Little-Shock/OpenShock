import { redirect } from "next/navigation";
import { FirstRunPage } from "@/components/first-run-page";
import { PublicLandingPage } from "@/components/public-landing-page";
import { getBootstrap } from "@/lib/api";
import { getServerAuthState } from "@/lib/auth-server";
import type { BootstrapResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

function shouldShowFirstRunGuide(bootstrap: BootstrapResponse) {
  const hasRepoBinding = bootstrap.workspace.repoBindings.length > 0;
  const hasWorkingRoom = bootstrap.rooms.some(
    (room) =>
      room.id !== "room_001" &&
      room.id !== "room_002" &&
      room.title !== "all" &&
      room.title !== "annoucement",
  );

  return !hasRepoBinding || !hasWorkingRoom;
}

export default async function HomePage() {
  const auth = await getServerAuthState();
  if (!auth.authenticated || !auth.member) {
    return <PublicLandingPage />;
  }

  const bootstrap = await getBootstrap({ sessionToken: auth.sessionToken });
  if (shouldShowFirstRunGuide(bootstrap)) {
    return <FirstRunPage bootstrap={bootstrap} member={auth.member} />;
  }

  const targetRoomId = bootstrap.defaultRoomId || bootstrap.rooms[0]?.id;
  if (!targetRoomId) {
    return <FirstRunPage bootstrap={bootstrap} member={auth.member} />;
  }

  redirect(`/rooms/${targetRoomId}`);
}
