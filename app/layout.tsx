import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MHG POS",
  description: "Retail POS MVP for inventory, cash sales, and daily operations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
