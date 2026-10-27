/**
 * Apel JSON catre rutele API proprii, din componentele client.
 * Intoarce { ok, data, error } — eroarea e deja mesajul sigur trimis de server.
 */
export async function trimiteJson<T = unknown>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json?.error ?? "A apărut o eroare. Încearcă din nou." };
    return { ok: true, data: json?.data as T };
  } catch {
    return { ok: false, error: "Nu am putut contacta serverul. Verifică conexiunea." };
  }
}
