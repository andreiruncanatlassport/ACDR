"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { BrandMark } from "@/components/ui/BrandMark";
import { useSettings } from "@/lib/settings/context";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { AuthTabs } from "@/components/AuthTabs";

export default function LoginPage() {
  const { t } = useSettings();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [eroare, setEroare] = useState<string | null>(null);
  const [seIncarca, setSeIncarca] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEroare(null);

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      setEroare("Completează verificarea anti-spam de mai jos.");
      return;
    }

    setSeIncarca(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parola,
      options: { captchaToken: captchaToken ?? undefined },
    });

    setSeIncarca(false);
    setTurnstileKey((k) => k + 1);
    setCaptchaToken(null);

    if (error) {
      setEroare(
        error.message.includes("Invalid login")
          ? "Email sau parolă incorectă."
          : error.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16">
      <Card variant="raised" className="w-full">
        <div className="text-center">
          <BrandMark className="mx-auto h-10 w-10" />
          <h1 className="sr-only">{t.auth.login}</h1>
        </div>
        <div className="mt-5">
          <AuthTabs activ="login" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email" required>{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="parola" required>{t.auth.parola}</Label>
            <Input
              id="parola"
              type="password"
              required
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <TurnstileWidget key={turnstileKey} onToken={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

          <FieldError>{eroare}</FieldError>

          <Button type="submit" variant="seal" className="w-full" disabled={seIncarca}>
            {seIncarca ? t.common.loading : t.auth.login}
          </Button>
        </form>

      </Card>
    </div>
  );
}
