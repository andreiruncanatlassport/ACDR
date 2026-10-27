"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Building2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { SkeletonPage } from "@/components/ui/Skeleton";
import { LinkButton } from "@/components/ui/Button";
import { StepCont } from "./steps/StepCont";
import { StepProfil } from "./steps/StepProfil";
import { AuthTabs } from "@/components/AuthTabs";

export default function InregistrarePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apoiFirma = searchParams.get("apoi") === "firma";

  const [verificareSesiune, setVerificareSesiune] = useState(true);
  const etapa = (searchParams.get("etapa") as "cont" | "profil" | "final" | null) ?? "cont";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // deja are cont — daca a ajuns aici ca sa adauge o firma, il trimitem direct acolo
        router.replace(apoiFirma ? "/inregistrare/firma" : "/dashboard");
        return;
      }
      setVerificareSesiune(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll sus la fiecare schimbare de etapa (si la navigare inapoi din browser)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etapa]);

  function dupaCont() {
    // profilul public se completeaza imediat dupa cont — asa te gasesc ceilalti.
    // push (nu replace) ca back-ul din browser sa te duca la pasul anterior.
    router.push(`/inregistrare?etapa=profil${apoiFirma ? "&apoi=firma" : ""}`);
  }

  function dupaProfil() {
    if (apoiFirma) {
      router.push("/inregistrare/firma");
      return;
    }
    router.push("/inregistrare?etapa=final");
  }

  if (verificareSesiune) {
    return <SkeletonPage />;
  }

  if (etapa === "final") {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <Card>
          <CheckCircle2 className="mx-auto h-10 w-10 text-teal" />
          <h1 className="mt-4 text-xl font-semibold text-ink">Bine ai venit!</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Contul tău e gata. Poți deja să vezi Știri, Evenimente, Membri și să trimiți mesaje.
            Adăugarea unei firme e opțională — o poți face acum sau oricând mai târziu, din contul tău.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2.5">
            <LinkButton href="/inregistrare/firma" variant="seal" className="w-full sm:w-auto">
              <Building2 className="h-4 w-4" /> Adaugă firma acum
              <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/dashboard" variant="ghost" className="w-full sm:w-auto">
              Continuă fără firmă, deocamdată
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-14">
      <div className="text-center">
        <p className="stamp-label text-seal">
          {etapa === "profil" ? "Pasul 2 din 2" : apoiFirma ? "Un ultim pas" : "Membru nou"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          {etapa === "profil" ? "Profilul tău public" : "Creează-ți contul"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {etapa === "profil"
            ? "Cel mai important lucru în comunitate: să te găsească ceilalți."
            : apoiFirma
              ? "Ca să adaugi o firmă, ai nevoie mai întâi de un cont personal — durează un minut."
              : "Fără firmă, fără obligații — vezi Știri, Evenimente, Membri și trimite mesaje. Poți adăuga o firmă oricând, dacă vrei."}
        </p>
      </div>

      {etapa === "cont" && (
        <div className="mt-6">
          <AuthTabs activ="register" />
        </div>
      )}

      <Card variant="raised" className={etapa === "cont" ? "mt-3" : "mt-6"}>
        {etapa === "profil" ? <StepProfil onDone={dupaProfil} /> : <StepCont onDone={dupaCont} />}
      </Card>

    </div>
  );
}
