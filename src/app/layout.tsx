import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";

import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VentureIQ | Investor & Founder Discovery Portal",
  description:
    "Next.js 16 dynamic investor discovery platform with GSAP animations, pitch deck feed, deal negotiation rooms, and founder profiles.",
  verification: {
    google: "vxmZuENBDpeVO_B9-708DjRLuljc-sfM-kBQAYfDnqI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <body className={`${geist.className} h-full bg-[#f6f6f6] dark:bg-[#0e0e0e] text-[#18181b] dark:text-[#e2e2e2] flex relative antialiased selection:bg-[#b0d449] selection:text-black`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <MainLayout>{children}</MainLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
