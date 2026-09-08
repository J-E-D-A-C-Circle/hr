import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DVLA HR Portal — Letters & Document Management System",
  description: "Digitized HR letter generation, live previewing, approval workflows, digital signatures, and QR-verified archiving for DVLA Ghana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
