"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { TERMENI_VERSIUNE } from "@/lib/terms";
import { TurnstileWidget } from "@/components/TurnstileWidget";

interface Props {
  onDone: () => void;
}

export function StepCont({ onDone }: Props) {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [numeComplet, setNumeComplet] = useState("");
  const [telefonPersonal, setTelefonPersonal] = useState("");
  const [acceptaTermeni, setAcceptaTermeni] = useState(false);
  const [declaraValori, setDeclaraValori] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [eroare, setEroare] = useState<string | null>(null);
  const [emailDejaFolosit, setEmailDejaFolosit] = useState(false);
  const [confirmareNecesara, setConfirmareNecesara] = useState(false);
  const [seIncarca, setSeIncarca] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEroare(null);

    if (!acceptaTermeni) {
      setEroare("Trebuie să confirmi că ai cel puțin 18 ani și să accepți Termenii și Regulamentul.");
      return;
    }
    if (!declaraValori) {
      setEroare("Pentru a fi membru ACDR e nevoie de declarația și consimțământul de mai jos.");
      return;
    }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      setEroare("Completează verificarea anti-spam de mai jos.");
      return;
    }

    setSeIncarca(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: parola,
      options: {
        data: { nume_complet: numeComplet },
        captchaToken: captchaToken ?? undefined,
      },
    });

    setSeIncarca(false);
    setTurnstileKey((k) => k + 1); // token-ul Turnstile e single-use — resetam widgetul dupa orice incercare
    setCaptchaToken(null);

    // Cazul 1: adresa exista deja, iar "Confirm email" e DEZACTIVAT in Supabase
    // -> Supabase intoarce o eroare explicita.
    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        setEmailDejaFolosit(true);
      } else {
        setEroare(error.message);
      }
      return;
    }

    // Cazul 2: adresa exista deja, iar "Confirm email" e ACTIVAT
    // -> Supabase intoarce, intentionat, un user "fals" fara sesiune, ca sa nu
    //    se poata afla ce adrese sunt inregistrate. Semnul distinctiv e
    //    identities = [] (documentat de Supabase).
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setEmailDejaFolosit(true);
      return;
    }

    // Cazul 3: adresa e noua, dar "Confirm email" e inca ACTIVAT in Supabase
    // -> contul e creat, insa fara sesiune pana la click-ul din email.
    //    Nu putem continua inregistrarea firmei; anuntam clar de ce.
    if (!data.session) {
      setConfirmareNecesara(true);
      return;
    }

    // Salvam telefonul personal si acceptul termenilor (trigger-ul de bd a creat deja randul din profiles)
    await supabase
      .from("profiles")
      .update({
        telefon_personal: telefonPersonal || null,
        termeni_acceptati_la: new Date().toISOString(),
        termeni_versiune: TERMENI_VERSIUNE,
        declaratie_valori: true,
      } as never)
      .eq("id", data.user!.id);

    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="numeComplet" required>Numele tău</Label>
        <Input
          id="numeComplet"
          required
          value={numeComplet}
          onChange={(e) => setNumeComplet(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="telefonPersonal">Telefon personal</Label>
        <Input
          id="telefonPersonal"
          type="tel"
          value={telefonPersonal}
          onChange={(e) => setTelefonPersonal(e.target.value)}
        />
        <FieldHint>
          Vizibil doar către firmele cu care accepți o conexiune — nu e public.
        </FieldHint>
      </div>
      <div>
        <Label htmlFor="email" required>Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailDejaFolosit(false);
            setConfirmareNecesara(false);
          }}
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="parola" required>Parolă</Label>
        <Input
          id="parola"
          type="password"
          required
          minLength={8}
          value={parola}
          onChange={(e) => setParola(e.target.value)}
          autoComplete="new-password"
        />
        <FieldHint>Minim 8 caractere.</FieldHint>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={declaraValori}
          onChange={(e) => setDeclaraValori(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-seal"
        />
        <span>
          Declar că sunt antreprenor/oare și că îmi desfășor activitatea potrivit valorilor creștine. Îmi dau{" "}
          <strong className="text-ink">consimțământul explicit</strong> ca ACDR să prelucreze această informație despre
          convingerile mele religioase și să afișeze profilul meu în directorul de membri, conform{" "}
          <Link href="/confidentialitate#date-sensibile" target="_blank" className="font-medium text-seal hover:underline">
            Politicii de confidențialitate
          </Link>
          . Pot retrage acordul oricând.
        </span>
      </label>

      <label className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={acceptaTermeni}
          onChange={(e) => setAcceptaTermeni(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-seal"
        />
        <span>
          Am cel puțin 18 ani, am citit și sunt de acord cu{" "}
          <Link href="/termeni" target="_blank" className="font-medium text-seal hover:underline">
            Termenii și condițiile
          </Link>{" "}
          și{" "}
          <Link href="/regulament" target="_blank" className="font-medium text-seal hover:underline">
            Regulamentul comunității
          </Link>
          . Am citit{" "}
          <Link href="/confidentialitate" target="_blank" className="font-medium text-seal hover:underline">
            Politica de confidențialitate
          </Link>{" "}
          și{" "}
          <Link href="/cookies" target="_blank" className="font-medium text-seal hover:underline">
            Politica de cookie-uri
          </Link>
          .
        </span>
      </label>

      <p className="text-xs text-ink-soft/80">
        Contul tău va fi vizibil ca &bdquo;nou&rdquo; până când un administrator îl verifică — de obicei
        durează puțin, nu blochează navigarea pe platformă.
      </p>

      <TurnstileWidget key={turnstileKey} onToken={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

      {confirmareNecesara && (
        <div className="rounded-xl border border-teal/30 bg-teal/8 p-4 text-sm">
          <p className="font-semibold text-ink">Contul a fost creat.</p>
          <p className="mt-1 text-ink-soft">
            Confirmarea prin email e activată în Supabase, așa că trebuie să deschizi emailul
            trimis la <strong className="text-ink">{email}</strong> și să apeși pe link, apoi să te{" "}
            <Link href="/login" className="font-medium text-seal hover:underline">
              autentifici
            </Link>{" "}
            ca să continui.
          </p>
          <p className="mt-2 text-xs text-ink-soft/80">
            Ca administrator: poți elimina acest pas dezactivând <em>Confirm email</em> din
            Supabase (Authentication → Sign In / Providers → Email). Aplicația are deja propriul
            sistem de verificare, opțional.
          </p>
        </div>
      )}

      {emailDejaFolosit && (
        <div className="rounded-xl border border-seal/30 bg-seal/8 p-4 text-sm">
          <p className="font-semibold text-ink">Există deja un cont cu acest email.</p>
          <p className="mt-1 text-ink-soft">
            <Link href="/login" className="font-medium text-seal hover:underline">
              Autentifică-te
            </Link>{" "}
            și revino aici — vei putea continua direct cu înregistrarea firmei. Dacă ai uitat
            parola, o poți reseta din pagina de autentificare.
          </p>
        </div>
      )}

      <FieldError>{eroare}</FieldError>

      <Button type="submit" variant="seal" className="w-full" disabled={seIncarca}>
        {seIncarca ? "Se creează contul..." : "Continuă"}
      </Button>
    </form>
  );
}
