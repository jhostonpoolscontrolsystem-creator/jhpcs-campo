import type { Metadata, Viewport } from "next";
import { OutdoorDisplayProvider } from "@/context/OutdoorDisplayContext";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "JHPCS Tratador • App do Piscineiro",
  description: "Aplicativo Oficial de Campo para Tratadores e Técnicos JHoston Pools",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JHPCS Campo",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black antialiased">
        <OutdoorDisplayProvider>
          {children}
        </OutdoorDisplayProvider>
      </body>
    </html>
  );
}

