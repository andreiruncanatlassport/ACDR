import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Cai excluse de la verificarea de mentenanta — trebuie sa ramana accesibile
// INDIFERENT de stare, altfel nimeni (nici adminul) n-ar mai putea repara
// nimic: pagina de mentenanta insasi, autentificarea, si fisierele statice
// (astea din urma sunt oricum excluse si de matcher-ul din middleware.ts,
// dar le mai verificam si aici, ca o a doua plasa de siguranta).
const CAI_EXCLUSE = [
  "/mentenanta", "/login", "/api", "/_next", "/favicon.ico", "/manifest.webmanifest",
  // Paginile legale raman accesibile oricand (Legea 365/2002, GDPR)
  "/termeni", "/confidentialitate", "/cookies", "/regulament",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: nu sterge acest apel — reimprospateaza tokenul de sesiune
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const eCaleExclusa = CAI_EXCLUSE.some((cale) => pathname === cale || pathname.startsWith(cale + "/"));

  if (!eCaleExclusa) {
    const { data: setari } = await supabase
      .from("platform_settings")
      .select("mentenanta_activa")
      .eq("id", true)
      .maybeSingle();

    if ((setari as { mentenanta_activa: boolean } | null)?.mentenanta_activa) {
      let rol: string | null = null;
      if (user) {
        const { data: profil } = await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle();
        rol = (profil as { rol: string } | null)?.rol ?? null;
      }

      if (rol !== "admin" && rol !== "moderator") {
        const url = request.nextUrl.clone();
        url.pathname = "/mentenanta";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
