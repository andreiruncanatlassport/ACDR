import type { Metadata, Viewport } from "next";
import { Spectral, Rethink_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Directia „Oameni” (octombrie 2026): Spectral (serif editorial) la titlurile
// mari, Rethink Sans la text si interfata. Ambele au diacriticele romanesti
// (ș, ț cu virgula) in latin-ext. Spectral nu e variabil: incarcam doar
// greutatile folosite, ca pagina sa ramana usoara pe telefon.
const spectral = Spectral({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
});
const rethink = Rethink_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-rethink" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", weight: ["500", "600"] });
import { SettingsProvider, settingsInitScript } from "@/lib/settings/context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const metadata: Metadata = {
  title: "ACDR — Antreprenori Creștini din România",
  description:
    "Comunitatea Antreprenorilor Creștini — firme verificate prin ANAF, membri, oportunități, mesaje directe și evenimente, toate într-un singur loc.",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Antreprenori Creștini",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F3A2E",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rol: "user" | "moderator" | "admin" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    rol = (profile as Pick<Profile, "rol"> | null)?.rol ?? "user";
  }

  return (
    <html lang="ro" className={`h-full antialiased ${spectral.variable} ${rethink.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper text-ink pb-16 md:pb-0">
        <SettingsProvider>
          <Header userEmail={user?.email ?? null} rol={rol} />
          <InstallAppBanner />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileTabBar autentificat={Boolean(user)} />
        </SettingsProvider>
      </body>
    </html>
  );
}
