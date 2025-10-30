import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DVLA NSS Portal",
  description: "National Service Scheme Personnel Registration Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
