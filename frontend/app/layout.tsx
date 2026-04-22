import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Flow",
  description: "Frontend operacional para autenticação e gestão inicial do CRM Flow."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

