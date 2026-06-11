import type { Metadata } from "next";
import "./globals.css";
import StoreSync from "@/components/StoreSync";

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
      <body className="antialiased">
        <StoreSync />
        {children}
      </body>
    </html>
  );
}
