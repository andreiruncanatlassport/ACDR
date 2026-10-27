import Link from "next/link";
import { LegalPage, Val, type SectiuneLegala } from "@/components/legal/LegalPage";
import { OPERATOR } from "@/lib/legal";
import { TERMENI_VERSIUNE } from "@/lib/terms";

export const metadata = { title: "Termeni și condiții — ACDR" };

const sectiuni: SectiuneLegala[] = [
  {
    id: "operator",
    titlu: "Cine suntem",
    continut: (
      <>
        <p>
          Platforma ACDR (Antreprenori Creștini din România) este operată de <Val v={OPERATOR.denumire} /> (
          <Val v={OPERATOR.formaJuridica} />), cu sediul în <Val v={OPERATOR.sediu} />, CUI <Val v={OPERATOR.cui} />,
          înregistrată sub nr. <Val v={OPERATOR.nrRegistru} />.
        </p>
        <p>
          Contact: <Val v={OPERATOR.email} />, telefon <Val v={OPERATOR.telefon} />.
        </p>
      </>
    ),
  },
  {
    id: "acceptare",
    titlu: "Acceptarea termenilor",
    continut: (
      <p>
        Când îți faci cont, bifezi că ai citit și ești de acord cu acești Termeni, cu{" "}
        <Link href="/regulament">Regulamentul comunității</Link> și cu{" "}
        <Link href="/confidentialitate">Politica de confidențialitate</Link>. Dacă nu ești de acord, te rugăm să nu
        folosești platforma. Poți răsfoi paginile publice și fără cont.
      </p>
    ),
  },
  {
    id: "serviciu",
    titlu: "Ce oferă ACDR",
    continut: (
      <>
        <p>
          ACDR este o comunitate online a antreprenorilor creștini: catalog de firme verificate la ANAF, director de
          membri, mesaje, conexiuni între firme, oportunități și proiecte, evenimente, știri, cercuri locale și unelte
          ajutătoare, precum calendarul fiscal.
        </p>
        <p>
          Folosirea platformei este gratuită. Dacă vom introduce vreodată servicii cu plată, prețurile (cu precizarea
          TVA) și condițiile vor fi afișate clar înainte de orice comandă.
        </p>
        <p>
          ACDR pune oamenii în legătură, dar <strong>nu este parte</strong> în înțelegerile dintre membri și nu
          garantează calitatea, prețul sau rezultatul unei colaborări.
        </p>
      </>
    ),
  },
  {
    id: "eligibilitate",
    titlu: "Cine își poate face cont",
    continut: (
      <ul>
        <li>Persoane de cel puțin 18 ani.</li>
        <li>
          Care se declară antreprenori și își desfășoară activitatea potrivit valorilor creștine (vezi{" "}
          <Link href="/confidentialitate#date-sensibile">consimțământul pentru date sensibile</Link>).
        </li>
        <li>
          Pentru a adăuga o firmă: să o reprezinți legal sau să ai acordul reprezentantului. Firma trebuie să fie activă
          și înregistrată în România. Un CUI poate avea un singur profil.
        </li>
      </ul>
    ),
  },
  {
    id: "cont",
    titlu: "Contul tău",
    continut: (
      <ul>
        <li>Datele introduse trebuie să fie reale și actualizate.</li>
        <li>Ții parola secretă și ne anunți imediat dacă bănuiești că altcineva îți folosește contul.</li>
        <li>Un cont aparține unei singure persoane; nu se transferă.</li>
        <li>
          Contul nou apare ca „nou” până când un administrator îl verifică. Unele funcții (de exemplu datele de contact
          ale firmelor) devin disponibile după verificare.
        </li>
      </ul>
    ),
  },
  {
    id: "continut",
    titlu: "Conținutul pe care îl publici",
    continut: (
      <>
        <p>
          Răspunzi pentru tot ce publici: descrieri, poze, mesaje, recenzii, oportunități, propuneri de știri și
          evenimente. Trebuie să ai drepturile asupra lui și să nu încalce legea sau drepturile altora.
        </p>
        <p>
          Conținutul rămâne al tău. Ne dai o licență gratuită, neexclusivă, valabilă cât timp e pe platformă, să îl
          afișăm, să îl redimensionăm și să îl arătăm altor membri, strict pentru funcționarea ACDR.
        </p>
        <p>Nu sunt permise:</p>
        <ul>
          <li>conținut fals, înșelător, defăimător, obscen sau care incită la ură;</li>
          <li>spam, mesaje comerciale nesolicitate în masă, scheme piramidale;</li>
          <li>folosirea datelor altor membri în afara scopului pentru care ți-au fost arătate (de exemplu, liste de marketing);</li>
          <li>încercări de a ocoli securitatea, de a extrage automat date sau de a supraîncărca platforma.</li>
        </ul>
      </>
    ),
  },
  {
    id: "moderare",
    titlu: "Verificare și moderare",
    continut: (
      <>
        <p>
          Administratorii pot verifica, aproba, edita pentru formă, ascunde sau șterge conținut și pot suspenda conturi
          care încalcă acești termeni sau Regulamentul. Recenziile apar doar după verificarea unei dovezi de
          colaborare.
        </p>
        <p>
          Pentru încălcări grave (fraudă, date false, hărțuire) putem închide contul fără avertisment. Poți contesta
          orice decizie la <Val v={OPERATOR.email} />.
        </p>
      </>
    ),
  },
  {
    id: "anaf",
    titlu: "Datele de la ANAF",
    continut: (
      <p>
        Datele oficiale ale firmelor provin din serviciile publice ale ANAF și reflectă informația de la momentul
        preluării. Nu garantăm că sunt actualizate în timp real. Verifică-le independent înainte de o decizie
        comercială importantă.
      </p>
    ),
  },
  {
    id: "calendar-fiscal",
    titlu: "Calendarul fiscal și alte unelte",
    continut: (
      <p>
        Calendarul fiscal și celelalte unelte sunt doar un ajutor. Nu înlocuiesc sfatul unui contabil sau consultant
        fiscal. Răspunderea pentru depunerea la timp a declarațiilor rămâne a firmei.
      </p>
    ),
  },
  {
    id: "proprietate",
    titlu: "Proprietate intelectuală",
    continut: (
      <p>
        Numele ACDR, sigla, designul și codul platformei aparțin operatorului. Nu le poți copia sau folosi în scop
        comercial fără acord scris. Conținutul membrilor rămâne al lor (vezi punctul despre conținut).
      </p>
    ),
  },
  {
    id: "raspundere",
    titlu: "Limitarea răspunderii",
    continut: (
      <>
        <p>
          Platforma e oferită gratuit, „ca atare”. Facem tot ce putem să funcționeze fără întreruperi și fără erori,
          dar nu putem garanta asta.
        </p>
        <p>
          În limitele permise de lege, nu răspundem pentru pagube care vin din colaborările dintre membri, din
          conținutul publicat de alți membri sau din decizii luate pe baza informațiilor de pe platformă. Această
          limitare nu se aplică în cazul faptelor intenționate sau al culpei grave.
        </p>
      </>
    ),
  },
  {
    id: "incetare",
    titlu: "Închiderea contului",
    continut: (
      <p>
        Poți cere oricând închiderea contului și ștergerea datelor la <Val v={OPERATOR.email} />. Datele se șterg cum
        e descris în <Link href="/confidentialitate#pastrare">Politica de confidențialitate</Link>.
      </p>
    ),
  },
  {
    id: "modificari",
    titlu: "Modificarea termenilor",
    continut: (
      <p>
        Putem actualiza acești termeni. Pentru schimbările importante te anunțăm cu cel puțin 15 zile înainte, în
        aplicație sau pe email. Dacă nu ești de acord, îți poți închide contul. Continuarea folosirii după intrarea în
        vigoare înseamnă acceptarea noii versiuni.
      </p>
    ),
  },
  {
    id: "lege",
    titlu: "Legea aplicabilă și litigii",
    continut: (
      <>
        <p>
          Acești termeni sunt guvernați de legea română. Încercăm să rezolvăm orice neînțelegere pe cale amiabilă,
          scriindu-ne la <Val v={OPERATOR.email} />. Dacă nu reușim, competența aparține instanțelor române.
        </p>
        <p>
          Dacă folosești platforma în calitate de consumator, poți apela și la Autoritatea Națională pentru Protecția
          Consumatorilor (
          <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer">
            anpc.ro
          </a>
          ).
        </p>
      </>
    ),
  },
];

export default function TermeniPage() {
  return (
    <LegalPage
      titlu="Termeni și condiții"
      activ="/termeni"
      versiune={TERMENI_VERSIUNE}
      intro={
        <p>
          Regulile de folosire a platformei ACDR. Le-am scris cât mai simplu; dacă ceva nu e clar, scrie-ne la{" "}
          <Val v={OPERATOR.email} />.
        </p>
      }
      sectiuni={sectiuni}
    />
  );
}
