import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Constellate — Multi-Agent Orchestration",
  description: "Agent networks that ship work for you. Multi-agent orchestration platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
