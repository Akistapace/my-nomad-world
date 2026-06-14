import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Nomad World",
  description: "Gamify your travels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
