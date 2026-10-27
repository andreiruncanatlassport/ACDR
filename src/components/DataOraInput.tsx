"use client";

import { Input } from "@/components/ui/Field";

const ORE = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const selectClass =
  "h-[42px] rounded-xl border border-line-strong bg-surface px-2.5 text-sm text-ink outline-none focus:border-seal focus:ring-3 focus:ring-seal/12 disabled:opacity-45";

/**
 * Data + ora optionala, mereu in format de 24 de ore.
 *
 * Nu folosim <input type="time"> sau "datetime-local": in multe browsere (si pe
 * Windows/Android in engleza) acestea afiseaza AM/PM si dau erori la tastare.
 * Aici ora si minutele sunt doua liste simple: 00–23 si 00–55 din 5 in 5.
 * Valoarea orei e "" (fara ora) sau "HH:MM".
 */
export function DataOraInput({
  id,
  data,
  ora,
  onData,
  onOra,
}: {
  id: string;
  data: string;
  ora: string;
  onData: (v: string) => void;
  onOra: (v: string) => void;
}) {
  const [hh, mm] = ora ? ora.split(":") : ["", ""];
  // Minute care nu sunt multiplu de 5 (date vechi): le pastram in lista.
  const minute = mm && !MINUTE.includes(mm) ? [...MINUTE, mm].sort() : MINUTE;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input id={id} type="date" value={data} onChange={(e) => onData(e.target.value)} className="min-w-[10.5rem] flex-1" />
      <div className="flex items-center gap-1">
        <select
          aria-label="Ora"
          value={hh}
          onChange={(e) => onOra(e.target.value ? `${e.target.value}:${mm || "00"}` : "")}
          className={selectClass}
        >
          <option value="">Fără oră</option>
          {ORE.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span aria-hidden className="text-ink-soft">
          :
        </span>
        <select
          aria-label="Minute"
          value={mm}
          disabled={!hh}
          onChange={(e) => onOra(`${hh}:${e.target.value}`)}
          className={selectClass}
        >
          {!hh && <option value="">--</option>}
          {minute.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
