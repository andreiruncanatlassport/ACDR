import Link from "next/link";
import { LegalPage, TabelLegal, Val, type SectiuneLegala } from "@/components/legal/LegalPage";
import { ANSPDCP, OPERATOR } from "@/lib/legal";

export const metadata = { title: "Politica de confidențialitate — ACDR" };

const sectiuni: SectiuneLegala[] = [
  {
    id: "operator",
    titlu: "Cine răspunde de datele tale",
    continut: (
      <>
        <p>
          Operatorul datelor este <Val v={OPERATOR.denumire} /> (<Val v={OPERATOR.formaJuridica} />), CUI{" "}
          <Val v={OPERATOR.cui} />, cu sediul în <Val v={OPERATOR.sediu} />.
        </p>
        <p>
          Pentru orice întrebare despre datele tale ne scrii la <Val v={OPERATOR.email} />. Răspundem în cel mult o
          lună de la primirea cererii, cum prevede GDPR.
        </p>
      </>
    ),
  },
  {
    id: "date",
    titlu: "Ce date colectăm",
    continut: (
      <>
        <p>Colectăm doar ce e necesar ca platforma să funcționeze:</p>
        <ul>
          <li>
            <strong>Date de cont:</strong> nume, adresă de email, parolă (păstrată criptat, nu o putem citi), telefon
            personal, data acceptării termenilor.
          </li>
          <li>
            <strong>Profilul de membru</strong>, dacă îl completezi: poză, funcție, descriere, oraș, județ, firma pe
            care o reprezinți, link LinkedIn, domeniile în care cauți sprijin.
          </li>
          <li>
            <strong>Datele firmei:</strong> preluate de la ANAF pe baza CUI-ului (denumire, adresă, cod CAEN, stare,
            TVA) și ce adaugi tu (descriere, contact, logo, poze, persoane de contact, lucrări).
          </li>
          <li>
            <strong>Ce faci pe platformă:</strong> mesaje, conexiuni între firme, recenzii și dovezile de colaborare
            încărcate pentru ele, oportunități, înscrieri la evenimente, cercuri, propuneri de știri și evenimente,
            notificări.
          </li>
          <li>
            <strong>Date tehnice:</strong> adresa IP și datele browserului, în jurnalele serverului și la verificarea
            anti-spam (Cloudflare Turnstile).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "date-sensibile",
    titlu: "Convingerile religioase: date sensibile",
    continut: (
      <>
        <p>
          ACDR este comunitatea antreprenorilor creștini. Simplul fapt că ești membru, împreună cu declarația că îți
          desfășori activitatea potrivit valorilor creștine, arată convingerile tale religioase. Legea (art. 9 din
          GDPR) le tratează ca date sensibile.
        </p>
        <p>
          De aceea le prelucrăm doar cu <strong>consimțământul tău explicit</strong>, pe care îl dai separat la
          înregistrare. Consimțământul acoperă și afișarea profilului tău în directorul public de membri.
        </p>
        <p>
          Îți poți retrage consimțământul oricând. Ascunzi profilul din directorul public din{" "}
          <Link href="/dashboard/profil">Contul meu → Profil</Link> (opțiunea „Vizibil în directorul de membri”). Ca
          să-ți închizi contul și să ștergem datele, ne scrii la <Val v={OPERATOR.email} />. Retragerea nu afectează
          prelucrarea făcută înainte de ea.
        </p>
      </>
    ),
  },
  {
    id: "scopuri",
    titlu: "De ce folosim datele și pe ce bază legală",
    continut: (
      <TabelLegal
        cap={["Scop", "Date", "Temei legal (GDPR)"]}
        randuri={[
          ["Crearea și administrarea contului", "date de cont", "art. 6(1)(b): contractul (Termenii) pe care îl accepți"],
          ["Apartenența la comunitate și directorul de membri", "profil, declarația de valori", "art. 9(2)(a) și art. 6(1)(a): consimțământul explicit"],
          ["Verificarea firmei la ANAF și afișarea ei în catalog", "CUI, date publice ANAF", "art. 6(1)(f): interesul legitim de a avea doar firme reale"],
          ["Mesaje, conexiuni, recenzii, oportunități, evenimente, cercuri", "conținutul creat de tine", "art. 6(1)(b): contractul"],
          ["Notificări în aplicație și pe email", "email, tipul notificării", "art. 6(1)(b): contractul"],
          ["Protecție anti-spam și securitate", "IP, date de browser", "art. 6(1)(f): interesul legitim de a proteja platforma"],
          ["Răspuns la cereri legale ale autorităților", "datele cerute", "art. 6(1)(c): obligație legală"],
        ]}
      />
    ),
  },
  {
    id: "public",
    titlu: "Ce e public și ce e privat",
    continut: (
      <>
        <TabelLegal
          cap={["Informație", "Cine o vede"]}
          randuri={[
            ["Firma: denumire, adresă, domenii, descriere, logo, lucrări", "Oricine, după ce firma e aprobată"],
            ["Profilul de membru: nume, poză, funcție, oraș, firmă, LinkedIn, descriere", "Oricine, dacă profilul e vizibil în director (setarea implicită); îl poți ascunde"],
            ["Telefonul și emailul firmei", "Membrii verificați de un administrator"],
            ["Telefonul și emailul tău personal", "Firmele cu care ai o conexiune acceptată și administratorii"],
            ["Mesajele", "Doar participanții la conversație"],
            ["Dovezile de colaborare la recenzii", "Doar tu și administratorii"],
            ["Discuțiile și angajamentele din cercuri", "Doar membrii cercului"],
          ]}
        />
      </>
    ),
  },
  {
    id: "destinatari",
    titlu: "Cu cine lucrăm (destinatari)",
    continut: (
      <>
        <p>Nu vindem și nu închiriem datele. Folosim furnizori care le prelucrează doar la instrucțiunile noastre:</p>
        <TabelLegal
          cap={["Furnizor", "Pentru ce", "Unde"]}
          randuri={[
            ["Supabase", "baza de date, conturi, stocarea fișierelor", "Uniunea Europeană"],
            ["Railway", "găzduirea aplicației", "Uniunea Europeană (Amsterdam)"],
            ["Cloudflare (Turnstile)", "verificarea anti-spam la înregistrare și autentificare", "UE și SUA"],
            ["Resend", "trimiterea emailurilor de notificare", "SUA"],
            ["ANAF", "verificarea firmei după CUI (date publice)", "România"],
            ["OpenStreetMap (Nominatim)", "poziția aproximativă a sediului firmei pe hartă (doar adresa firmei)", "UE / Regatul Unit"],
            ["goQR.me (QR Server)", "codul QR al paginii firmei (primește doar adresa paginii)", "Germania"],
          ]}
        />
        <p>
          Unde datele ajung în afara Spațiului Economic European (SUA), transferul se face pe baza Cadrului UE–SUA
          privind protecția datelor (Data Privacy Framework) sau a clauzelor contractuale standard aprobate de Comisia
          Europeană.
        </p>
      </>
    ),
  },
  {
    id: "pastrare",
    titlu: "Cât timp păstrăm datele",
    continut: (
      <ul>
        <li>Datele contului și ale profilului: cât timp contul e activ.</li>
        <li>
          După ce ceri închiderea contului: le ștergem în cel mult 30 de zile. Copiile de siguranță se suprascriu
          automat în aceeași perioadă.
        </li>
        <li>
          Recenziile și mesajele trimise altor membri pot rămâne la destinatari, fără numele tău, ca să nu se piardă
          firul conversațiilor.
        </li>
        <li>Jurnalele tehnice ale serverului: cel mult 30 de zile.</li>
        <li>Datele cerute de lege (de exemplu în caz de litigiu): cât prevede legea.</li>
      </ul>
    ),
  },
  {
    id: "drepturi",
    titlu: "Drepturile tale",
    continut: (
      <>
        <p>Potrivit GDPR (art. 15–22) ai dreptul:</p>
        <ul>
          <li>să afli ce date avem despre tine și să primești o copie (acces);</li>
          <li>să le corectezi, direct din cont sau prin cerere (rectificare);</li>
          <li>să ceri ștergerea lor (dreptul de a fi uitat);</li>
          <li>să ceri restricționarea prelucrării;</li>
          <li>să primești datele într-un format pe care îl poți duce în altă parte (portabilitate);</li>
          <li>să te opui prelucrării bazate pe interesul legitim;</li>
          <li>să îți retragi consimțământul oricând, fără să afecteze prelucrarea de dinainte.</li>
        </ul>
        <p>
          Scrie-ne la <Val v={OPERATOR.email} />. Nu luăm decizii bazate exclusiv pe prelucrare automată care să
          aibă efecte juridice asupra ta. Firmele pe care ANAF le arată active sunt publicate automat; orice respingere
          sau suspendare o decide un administrator.
        </p>
        <p>
          Dacă nu ești mulțumit de răspuns, poți depune o plângere la {ANSPDCP.denumire}, {ANSPDCP.adresa},{" "}
          {ANSPDCP.email},{" "}
          <a href={ANSPDCP.site} target="_blank" rel="noopener noreferrer">
            dataprotection.ro
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "securitate",
    titlu: "Cum protejăm datele",
    continut: (
      <ul>
        <li>Conexiune criptată (HTTPS) pe toată platforma.</li>
        <li>Parolele sunt păstrate doar sub formă criptată ireversibil.</li>
        <li>
          Reguli de acces la nivel de bază de date: fiecare utilizator vede doar ce are voie (de exemplu, mesajele
          doar participanții).
        </li>
        <li>Datele de contact devin vizibile abia după verificare sau conexiune acceptată.</li>
        <li>Confirmarea identității prin cod pe email înainte de acțiuni sensibile.</li>
      </ul>
    ),
  },
  {
    id: "minori",
    titlu: "Minori",
    continut: <p>Platforma e destinată antreprenorilor. Nu acceptăm conturi pentru persoane sub 18 ani.</p>,
  },
  {
    id: "cookie",
    titlu: "Cookie-uri",
    continut: (
      <p>
        Folosim doar cookie-uri strict necesare (autentificare, limba aleasă, protecție anti-spam). Detaliile sunt în{" "}
        <Link href="/cookies">Politica de cookie-uri</Link>.
      </p>
    ),
  },
  {
    id: "modificari",
    titlu: "Modificări",
    continut: (
      <p>
        Când schimbăm ceva important în această politică, te anunțăm în aplicație sau pe email înainte să intre în
        vigoare. Data ultimei actualizări apare sus, pe această pagină.
      </p>
    ),
  },
];

export default function ConfidentialitatePage() {
  return (
    <LegalPage
      titlu="Politica de confidențialitate"
      activ="/confidentialitate"
      intro={
        <p>
          Pe scurt: colectăm doar datele de care e nevoie ca să găsești și să lucrezi cu alți antreprenori creștini.
          Nu le vindem, nu facem publicitate țintită și poți cere oricând să le vezi sau să le ștergem.
        </p>
      }
      sectiuni={sectiuni}
    />
  );
}
