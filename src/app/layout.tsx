import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astra Ledger",
  description:
    "A cinematic personal finance dashboard with Plaid sandbox integration, transaction categorization, and spending insights.",
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

