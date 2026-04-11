import type { Metadata } from "next";
import { OperatorProvider } from "@/components/operator-provider";
import { getServerAuthState } from "@/lib/auth-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenShock.ai",
  description: "Human and agent collaboration shell for issue-driven execution.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authState = await getServerAuthState();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <OperatorProvider
          initialMember={authState.member}
          initialSessionToken={authState.sessionToken}
        >
          {children}
        </OperatorProvider>
      </body>
    </html>
  );
}
