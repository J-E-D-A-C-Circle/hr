import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "DVLA NSS Portal - Driver & Vehicle Licensing Authority",
  description: "National Service Scheme Personnel Application & Posting Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#f8fafc] text-slate-900 min-h-screen font-sans">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#fff',
              borderRadius: '0.75rem',
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: '0.9rem',
              padding: '12px 16px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}

