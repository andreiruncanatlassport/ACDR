import Link from "next/link";
import { LegalPage, TabelLegal, Val, type SectiuneLegala } from "@/components/legal/LegalPage";
import { OPERATOR } from "@/lib/legal";

export const metadata = { title: "Politica de cookie-uri — ACDR" };

const sectiuni: SectiuneLegala[] = [
  {
    id: "ce-sunt",
    titlu: "Ce sunt cookie-urile",
    continut: (
      <p>
        Cookie-urile sunt fișiere mici pe care un site le salvează în browserul tău. Unele site-uri folosesc și
        memoria browserului (localStorage, sessionStorage) în același scop. Mai jos le găsești pe toate cele folosite
        de ACDR.
      </p>
    ),
  },
  {
    id: "ce-folosim",
    titlu: "Ce folosim: doar ce e strict necesar",
    continut: (
      <>
        <p>
          ACDR folosește <strong>doar cookie-uri strict necesare</strong> ca platforma să funcționeze: să rămâi
          autentificat, să ții minte limba aleasă și să oprească conturile false. Nu folosim cookie-uri de analiză,
          de publicitate sau de urmărire și nu instalăm scripturi de la rețele de reclame.
        </p>
        <p>
          Pentru cookie-urile strict necesare legea nu cere acord prealabil (art. 4 alin. (5) din Legea nr. 506/2004 și
          art. 5 alin. (3) din Directiva 2002/58/CE). Te informăm însă despre ele, printr-un mesaj la prima vizită și
          prin această pagină.
        </p>
      </>
    ),
  },
  {
    id: "lista",
    titlu: "Lista completă",
    continut: (
      <TabelLegal
        cap={["Nume", "Furnizor", "Pentru ce", "Durată"]}
        randuri={[
          [<code key="a">sb-…-auth-token</code>, "ACDR (Supabase)", "te ține autentificat; poate fi împărțit în mai multe bucăți (.0, .1)", "până la deconectare, cel mult 400 de zile"],
          [<code key="b">sb-…-auth-token-code-verifier</code>, "ACDR (Supabase)", "securizează pasul de autentificare prin link sau cod", "câteva minute"],
          [<code key="c">rac-locale</code>, "ACDR", "limba aleasă (română / engleză), ca paginile să se încarce direct în limba ta", "1 an"],
          ["cookie-uri Cloudflare Turnstile", "Cloudflare", "verificare anti-spam, doar pe paginile de înregistrare și autentificare", "sesiunea curentă"],
        ]}
      />
    ),
  },
  {
    id: "memorie",
    titlu: "Memoria browserului (localStorage și sessionStorage)",
    continut: (
      <TabelLegal
        cap={["Element", "Pentru ce", "Durată"]}
        randuri={[
          ["setările aplicației", "tema (deschisă / întunecată), mărimea textului, fontul, limba", "până le ștergi din browser"],
          ["mesajul despre cookie-uri", "ține minte că l-ai văzut, ca să nu mai apară", "până le ștergi din browser"],
          ["bannerul „Instalează aplicația”", "ține minte că l-ai închis", "până le ștergi din browser"],
          ["ciorna formularului de firmă", "nu pierzi ce ai completat dacă reîncarci pagina", "până închizi fila"],
        ]}
      />
    ),
  },
  {
    id: "control",
    titlu: "Cum le controlezi",
    continut: (
      <>
        <p>
          Poți șterge sau bloca cookie-urile din setările browserului (de obicei la „Confidențialitate și securitate” →
          „Cookie-uri și date ale site-urilor”). Dacă blochezi cookie-urile strict necesare, nu te vei mai putea
          autentifica, iar unele funcții nu vor merge.
        </p>
        <p>Ghiduri oficiale: Chrome, Firefox, Safari, Edge, în secțiunea de ajutor a fiecărui browser.</p>
      </>
    ),
  },
  {
    id: "schimbari",
    titlu: "Dacă vom adăuga alte cookie-uri",
    continut: (
      <p>
        Dacă în viitor vom folosi cookie-uri de analiză sau de altă natură care nu sunt strict necesare, le vom
        activa doar după ce îți cerem acordul, printr-un panou în care poți accepta sau refuza fiecare categorie, la fel
        de ușor. Vom actualiza și această pagină.
      </p>
    ),
  },
  {
    id: "contact",
    titlu: "Contact",
    continut: (
      <p>
        Întrebări despre cookie-uri: <Val v={OPERATOR.email} />. Despre restul datelor personale citește{" "}
        <Link href="/confidentialitate">Politica de confidențialitate</Link>.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      titlu="Politica de cookie-uri"
      activ="/cookies"
      intro={<p>Folosim doar cookie-urile fără de care platforma nu ar funcționa. Fără reclame, fără urmărire.</p>}
      sectiuni={sectiuni}
    />
  );
}
