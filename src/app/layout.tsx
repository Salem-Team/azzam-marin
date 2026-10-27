import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";

import { DevAutoReload } from "@/components/dev/dev-auto-reload";
import { PreferencesHydrator } from "@/providers/preferences-hydrator";
import { getPreferencesBootScript } from "@/lib/preferences";
import { getRequestDocumentPreferences } from "@/lib/request-preferences";

import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-app",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AZZAM MARINE ERP",
    template: "%s · AZZAM MARINE ERP",
  },
  description:
    "Enterprise ERP for AZZAM MARINE — marine engines, spare parts, inventory, purchasing, sales, pricing, and finance.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/brand/azzam-marine-logo.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/brand/azzam-marine-logo.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07182F",
  width: "device-width",
  initialScale: 1,
};

/** Cookie-backed preferences — allow request-time document attributes. */
export const instant = false;

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const doc = await getRequestDocumentPreferences();
  const bootScript = getPreferencesBootScript();

  return (
    <html
      lang={doc.lang}
      dir={doc.dir}
      data-theme={doc.resolvedTheme}
      data-sidebar-collapsed={doc.preferences.sidebarCollapsed ? "1" : "0"}
      className={`${plexSans.variable} ${plexArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-full am-transition-colors">
        <PreferencesHydrator initial={doc.preferences}>
          {children}
          <DevAutoReload />
        </PreferencesHydrator>
      </body>
    </html>
  );
}
