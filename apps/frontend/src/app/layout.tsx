import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenShock.ai",
  description: "Human and agent collaboration shell for issue-driven execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
