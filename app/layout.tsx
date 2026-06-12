import type { Metadata } from "next";
import "./globals.css";
import StoreSync from "@/components/StoreSync";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "VentureIQ — AI Venture Intelligence & Validation",
  description: "Evaluate, validate, and score your business concepts with 15 specialized AI agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <StoreSync />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
