import Link from "next/link";
import { LegalPage, Val, type SectiuneLegala } from "@/components/legal/LegalPage";
import { OPERATOR } from "@/lib/legal";

export const metadata = { title: "Regulamentul comunității — ACDR" };

const sectiuni: SectiuneLegala[] = [
  {
    id: "spirit",
    titlu: "Spiritul comunității",
    continut: (
      <p>
        ACDR adună antreprenori care își conduc afacerile după valori creștine: hărnicie, integritate, învățare,
        perseverență, respect, generozitate și colaborare. Regulile de mai jos apără încrederea dintre membri.
      </p>
    ),
  },
  {
    id: "cine",
    titlu: "Cine poate fi membru",
    continut: (
      <ul>
        <li>Persoane de cel puțin 18 ani care se declară antreprenori creștini.</li>
        <li>Firme active din România, cu CUI valid la ANAF. Un CUI poate avea un singur profil.</li>
        <li>Profilurile duplicate sau cu date false se suspendă.</li>
      </ul>
    ),
  },
  {
    id: "verificare",
    titlu: "Verificare și aprobare",
    continut: (
      <ul>
        <li>Datele oficiale ale firmei se preiau automat de la ANAF.</li>
        <li>Firmele active apar automat în catalog; cele cu semnale neclare intră în verificare manuală.</li>
        <li>
          Membrii noi apar ca „nou” până îi verifică un administrator. Datele de contact ale firmelor devin vizibile
          după verificare.
        </li>
      </ul>
    ),
  },
  {
    id: "comportament",
    titlu: "Comportament așteptat",
    continut: (
      <ul>
        <li>Comunicare respectuoasă și de bună-credință, inclusiv în dezacord.</li>
        <li>Oferte și oportunități reale, descrise corect (preț, termen, condiții).</li>
        <li>Recenzii cinstite, doar despre colaborări reale, cu dovadă.</li>
        <li>Respectarea angajamentelor luate față de alți membri și în cercuri.</li>
        <li>Discreție: ce se discută într-un cerc rămâne în cerc.</li>
      </ul>
    ),
  },
  {
    id: "interzis",
    titlu: "Ce nu e permis",
    continut: (
      <ul>
        <li>Spam, mesaje comerciale nesolicitate trimise în masă, scheme piramidale sau de tip MLM.</li>
        <li>Hărțuire, limbaj jignitor, discriminare, presiune religioasă sau politică asupra altor membri.</li>
        <li>Folosirea datelor membrilor în afara platformei fără acordul lor (de exemplu, liste de marketing).</li>
        <li>Recenzii false, conturi multiple, uzurparea identității unei alte persoane sau firme.</li>
        <li>Conținut ilegal, înșelător sau care încalcă drepturile altora.</li>
      </ul>
    ),
  },
  {
    id: "sanctiuni",
    titlu: "Ce se întâmplă dacă încalci regulile",
    continut: (
      <>
        <p>În funcție de gravitate: avertisment, ascunderea conținutului, suspendarea temporară sau închiderea contului.</p>
        <p>
          Deciziile le iau administratorii. Le poți contesta la <Val v={OPERATOR.email} />, iar contestația o analizează
          alt administrator decât cel care a luat decizia, dacă e posibil.
        </p>
      </>
    ),
  },
  {
    id: "raportare",
    titlu: "Cum raportezi o problemă",
    continut: (
      <p>
        Dacă vezi un profil fals, o ofertă suspectă sau un comportament nepotrivit, scrie-ne la{" "}
        <Val v={OPERATOR.email} /> cu linkul către pagina respectivă. Tratăm raportările confidențial.
      </p>
    ),
  },
  {
    id: "modificari",
    titlu: "Modificări",
    continut: (
      <p>
        Regulamentul poate fi actualizat pe măsură ce comunitatea crește. Schimbările importante le anunțăm membrilor.
        Regulamentul face parte din <Link href="/termeni">Termenii și condițiile</Link> platformei.
      </p>
    ),
  },
];

export default function RegulamentPage() {
  return (
    <LegalPage
      titlu="Regulamentul comunității"
      activ="/regulament"
      intro={<p>Reguli simple, ca ACDR să rămână un loc de încredere.</p>}
      sectiuni={sectiuni}
    />
  );
}
