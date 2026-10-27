/**
 * Datele operatorului platformei, afisate in paginile legale si in subsol.
 *
 * Legea 365/2002 (art. 5) cere ca pe site sa fie afisate permanent: denumirea,
 * sediul, datele de contact, numarul de inregistrare si codul fiscal. GDPR
 * (art. 13) cere identitatea si datele de contact ale operatorului.
 *
 * Completeaza valorile de mai jos o singura data; toate paginile le preiau de aici.
 * Cat timp o valoare incepe cu „[”, ea apare pe site evidentiata, ca text de completat.
 */
export const OPERATOR = {
  denumire: "[DENUMIRE OPERATOR]",
  formaJuridica: "[asociație / SRL]",
  cui: "[CUI]",
  nrRegistru: "[Nr. Registrul Comerțului / Registrul asociațiilor]",
  sediu: "[ADRESA SEDIULUI]",
  email: "[EMAIL]",
  telefon: "[TELEFON]",
} as const;

/** Data ultimei actualizari a documentelor legale (afisata pe fiecare pagina). */
export const DATA_DOCUMENTE_LEGALE = "27 octombrie 2026";

/** Autoritatea de supraveghere pentru protectia datelor, in Romania. */
export const ANSPDCP = {
  denumire: "Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)",
  adresa: "B-dul G-ral. Gheorghe Magheru nr. 28-30, sector 1, București",
  email: "anspdcp@dataprotection.ro",
  site: "https://www.dataprotection.ro",
} as const;

export function esteDeCompletat(valoare: string): boolean {
  return valoare.startsWith("[");
}
