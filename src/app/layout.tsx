import type { ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timesheet inteligente — demonstração sintética",
  description:
    "MVP de revisão humana de evidências sintéticas para rascunho de timesheet. Sem contas reais, sem LLM e sem publicação.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full" style={{ fontFamily: "var(--font-sans), ui-sans-serif, system-ui" }}>{children}</body>
    </html>
  );
}
