import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/doodle-toast";

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
    "A hand-drawn, sketch-inspired personal finance notebook powered by TypeUI Doodle design system.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
