import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { ImmersiveChrome } from "@/components/immersive-chrome";
import { ThemeProvider } from "@/components/theme-provider";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-astra-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-astra-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Astra Ledger",
  description:
    "A cinematic personal finance dashboard with Plaid sandbox integration, transaction categorization, and spending insights.",
};

const themeInitScript = `
(function(){
  try {
    var k = 'astra-theme';
    var s = localStorage.getItem(k);
    var d = document.documentElement;
    d.classList.remove('light','dark');
    if (s === 'light' || s === 'dark') { d.classList.add(s); }
    else { d.classList.add(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased dark`} suppressHydrationWarning>
      <head>
        <script
          id="astra-theme-init"
          // Server-rendered script: sets `html.light`/`html.dark` before React hydrates.
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <ImmersiveChrome>{children}</ImmersiveChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
