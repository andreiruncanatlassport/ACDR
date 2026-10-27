import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Sistemul de notificari.
 *
 * Notificarea IN APLICATIE se creeaza intotdeauna (clopotelul din header).
 * Emailul se trimite doar daca e configurat RESEND_API_KEY — fara el,
 * aplicatia functioneaza normal, doar ca oamenii afla de noutati cand intra
 * pe site. Asa nu blocam lansarea pe configurarea unui furnizor de email.
 */

export type TipNotificare =
  | "rfq_primit"
  | "rfq_raspuns"
  | "deal_propunere"
  | "deal_acceptat"
  | "deal_finalizat"
  | "deal_mesaj"
  | "conexiune_cerere"
  | "conexiune_acceptata"
  | "recenzie_primita"
  | "firma_aprobata"
  | "mesaj_nou"
  | "oportunitate_raspuns"
  | "eveniment_reminder"
  | "cerc_cerere"
  | "cerc_acceptat"
  | "cerc_intalnire";

interface CreeazaNotificareInput {
  profileId: string;
  tip: TipNotificare;
  titlu: string;
  mesaj?: string;
  link?: string;
}

const NUME_EXPEDITOR = "ACDR";

function urlSite(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
}

/** Textul scris de utilizatori ajunge in email: il scapam ca sa nu poata injecta HTML sau linkuri. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Sablon de email simplu, in tonul platformei. */
function sablonEmail(titluBrut: string, mesajBrut: string | undefined, link: string | undefined): string {
  const titlu = escapeHtml(titluBrut);
  const mesaj = mesajBrut ? escapeHtml(mesajBrut) : undefined;
  const linkComplet = escapeHtml(link ? `${urlSite()}${link}` : urlSite());
  return `<!doctype html>
<html lang="ro">
  <body style="margin:0;padding:24px;background:#f6f6f4;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e5e0;border-radius:16px;overflow:hidden;">
      <tr><td style="height:4px;background:linear-gradient(90deg,#f0722a,#d85f1b);"></td></tr>
      <tr><td style="padding:28px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#f0722a;font-weight:600;">ACDR</p>
        <h1 style="margin:0 0 12px;font-size:20px;color:#101828;">${titlu}</h1>
        ${mesaj ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475467;">${mesaj}</p>` : ""}
        <a href="${linkComplet}" style="display:inline-block;background:#0a2540;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:10px;font-size:14px;font-weight:600;">Vezi în platformă</a>
      </td></tr>
      <tr><td style="padding:16px 28px;background:#faf9f7;border-top:1px solid #e6e5e0;">
        <p style="margin:0;font-size:12px;color:#98a2b3;">
          Primești acest email pentru că ai un cont pe ACDR.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Trimite emailul prin Resend. Esecul nu trebuie sa opreasca fluxul. */
async function trimiteEmail(catre: string, titlu: string, mesaj?: string, link?: string): Promise<boolean> {
  const cheie = process.env.RESEND_API_KEY;
  const expeditor = process.env.EMAIL_FROM;
  if (!cheie || !expeditor) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cheie}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${NUME_EXPEDITOR} <${expeditor}>`,
        to: [catre],
        subject: titlu,
        html: sablonEmail(titlu, mesaj, link),
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Eroare trimitere email:", err);
    return false;
  }
}

/**
 * Creeaza o notificare pentru un utilizator si, daca e configurat, trimite si
 * un email. Folosim service_role pentru ca notificam ALT utilizator decat cel
 * care a declansat actiunea — politicile RLS permit fiecaruia doar propriile
 * notificari.
 */
export async function creeazaNotificare({
  profileId,
  tip,
  titlu,
  mesaj,
  link,
}: CreeazaNotificareInput): Promise<void> {
  const admin = createServiceRoleClient();

  const { data: profil } = await admin
    .from("profiles")
    .select("email_personal")
    .eq("id", profileId)
    .maybeSingle();

  const email = (profil as { email_personal: string | null } | null)?.email_personal;
  const emailTrimis = email ? await trimiteEmail(email, titlu, mesaj, link) : false;

  await admin.from("notifications").insert({
    profile_id: profileId,
    tip,
    titlu,
    mesaj: mesaj ?? null,
    link: link ?? null,
    email_trimis: emailTrimis,
  } as never);
}

/** Gaseste proprietarul unei firme — cui trebuie sa-i trimitem notificarea. */
export async function proprietarulFirmei(companyId: string): Promise<string | null> {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("companies")
    .select("owner_id")
    .eq("id", companyId)
    .maybeSingle();
  return (data as { owner_id: string } | null)?.owner_id ?? null;
}

/** Scurtatura: notifica proprietarul unei firme. */
export async function notificaFirma(
  companyId: string,
  input: Omit<CreeazaNotificareInput, "profileId">
): Promise<void> {
  const ownerId = await proprietarulFirmei(companyId);
  if (!ownerId) return;
  await creeazaNotificare({ ...input, profileId: ownerId });
}
