"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Category, CategoryCaenCode } from "@/types/database";
import type { CategoryNode } from "@/app/inregistrare/types";

function buildTree(flat: Category[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  flat.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) byId.get(node.parent_id)!.children.push(node);
    else if (!node.parent_id) roots.push(node);
  });
  return roots;
}

function RandCategorie({
  categorie,
  coduri,
  onAdd,
  onRemove,
}: {
  categorie: CategoryNode;
  coduri: CategoryCaenCode[];
  onAdd: (categoryId: string, cod: string, versiune: "rev2" | "rev3") => void;
  onRemove: (id: string) => void;
}) {
  const [codNou, setCodNou] = useState("");
  const [versiune, setVersiune] = useState<"rev2" | "rev3">("rev2");
  const proprii = coduri.filter((c) => c.category_id === categorie.id);

  return (
    <div className="border-b border-line py-3 last:border-0">
      <p className="text-sm font-medium text-ink">{categorie.name_ro}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {proprii.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 rounded-full bg-ink/8 px-2 py-0.5 font-mono-num text-xs text-ink"
          >
            {c.caen_code}
            <span className="text-ink-soft/70">{c.caen_version}</span>
            <button onClick={() => onRemove(c.id)} className="text-ink-soft/70 hover:text-rust">
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        <Input
          placeholder="cod CAEN, ex: 4120"
          value={codNou}
          onChange={(e) => setCodNou(e.target.value)}
          className="w-32 !py-1 text-xs"
        />
        <Select value={versiune} onChange={(e) => setVersiune(e.target.value as "rev2" | "rev3")} className="w-24 !py-1 text-xs">
          <option value="rev2">Rev.2</option>
          <option value="rev3">Rev.3</option>
        </Select>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (codNou.trim()) {
              onAdd(categorie.id, codNou.trim(), versiune);
              setCodNou("");
            }
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function CategoriiManager() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [coduri, setCoduri] = useState<CategoryCaenCode[]>([]);

  async function incarca() {
    const supabase = createClient();
    const [{ data: cats }, { data: caen }] = await Promise.all([
      supabase.from("categories").select("id, slug, name_ro, name_en, parent_id, ordine, created_at").order("ordine"),
      supabase.from("category_caen_codes").select("id, category_id, caen_code, caen_version, descriere"),
    ]);
    setTree(buildTree((cats as Category[]) ?? []));
    setCoduri((caen as CategoryCaenCode[]) ?? []);
  }

  useEffect(() => {
    // Incarcare initiala de date de la Supabase — pattern standard de
    // "fetch la montare", nu sincronizare de stare React<->React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    incarca();
  }, []);

  async function adauga(categoryId: string, cod: string, versiune: "rev2" | "rev3") {
    await fetch("/api/admin/caen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: categoryId, caen_code: cod, caen_version: versiune }),
    });
    incarca();
  }

  async function elimina(id: string) {
    await fetch(`/api/admin/caen/${id}`, { method: "DELETE" });
    incarca();
  }

  return (
    <div className="space-y-6">
      {tree.map((parinte) => (
        <Card key={parinte.id}>
          <h3 className="text-base font-semibold text-ink">{parinte.name_ro}</h3>
          <div className="mt-2">
            <RandCategorie categorie={parinte} coduri={coduri} onAdd={adauga} onRemove={elimina} />
            {parinte.children.map((copil) => (
              <RandCategorie key={copil.id} categorie={copil} coduri={coduri} onAdd={adauga} onRemove={elimina} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
