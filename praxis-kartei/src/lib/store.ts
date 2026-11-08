// Datenzugriff: eine Schnittstelle, zwei Umsetzungen.
//  - Supabase (echte Daten, Frankfurt)
//  - Demo (Fantasiedaten im Browser-Speicher, nur zum Ausprobieren)
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { DEMO, supabase } from "./supabase";
import type { Tabelle, TabellenTypen } from "./types";
import { demoDaten } from "./demoDaten";

type Filter = Record<string, string | number | boolean | null>;
type Zeile<T extends Tabelle> = TabellenTypen[T];

interface Store {
  list<T extends Tabelle>(t: T, filter?: Filter): Promise<Zeile<T>[]>;
  get<T extends Tabelle>(t: T, id: string): Promise<Zeile<T> | null>;
  insert<T extends Tabelle>(t: T, row: Partial<Zeile<T>>): Promise<Zeile<T>>;
  update<T extends Tabelle>(t: T, id: string, patch: Partial<Zeile<T>>): Promise<Zeile<T>>;
  remove(t: Tabelle, id: string): Promise<void>;
}

// ---------------------------------------------------------------- Demo
const DEMO_KEY = "praxis-kartei-demo-v1";
type DemoDb = { [K in Tabelle]: Zeile<K>[] };

function ladeDemo(): DemoDb {
  try {
    const s = localStorage.getItem(DEMO_KEY);
    if (s) return JSON.parse(s);
  } catch { /* Speicher nicht verfügbar */ }
  return demoDaten();
}
let demoDb: DemoDb | null = null;
const db = () => (demoDb ??= ladeDemo());
function speichereDemo() {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(db())); } catch { /* ignorieren */ }
}
export function demoZuruecksetzen() {
  try { localStorage.removeItem(DEMO_KEY); } catch { /* ignorieren */ }
  demoDb = demoDaten();
  geaendert();
}

const passt = (row: object, f?: Filter) =>
  !f || Object.entries(f).every(([k, v]) => (row as Record<string, unknown>)[k] === v);

const demoStore: Store = {
  async list(t, f) { return (db()[t] as Zeile<typeof t>[]).filter((r) => passt(r, f)) as never; },
  async get(t, id) { return ((db()[t] as { id: string }[]).find((r) => r.id === id) ?? null) as never; },
  async insert(t, row) {
    const jetzt = new Date().toISOString();
    const neu = { id: crypto.randomUUID(), created_at: jetzt, updated_at: jetzt, ...row };
    (db()[t] as unknown[]).push(neu);
    speichereDemo();
    return neu as never;
  },
  async update(t, id, patch) {
    const liste = db()[t] as { id: string }[];
    const i = liste.findIndex((r) => r.id === id);
    if (i < 0) throw new Error("Datensatz nicht gefunden");
    liste[i] = { ...liste[i], ...patch, updated_at: new Date().toISOString() };
    speichereDemo();
    return liste[i] as never;
  },
  async remove(t, id) {
    (db() as Record<string, { id: string }[]>)[t] = (db()[t] as { id: string }[]).filter((r) => r.id !== id);
    speichereDemo();
  },
};

// ---------------------------------------------------------------- Supabase
function pruefe<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
const sbStore: Store = {
  async list(t, f) {
    let q = supabase!.from(t).select("*");
    for (const [k, v] of Object.entries(f ?? {})) q = v === null ? q.is(k, null) : q.eq(k, v);
    return pruefe(await q) as never;
  },
  async get(t, id) { return pruefe(await supabase!.from(t).select("*").eq("id", id).maybeSingle()) as never; },
  async insert(t, row) { return pruefe(await supabase!.from(t).insert(row as never).select().single()) as never; },
  async update(t, id, patch) { return pruefe(await supabase!.from(t).update(patch as never).eq("id", id).select().single()) as never; },
  async remove(t, id) { pruefe(await supabase!.from(t).delete().eq("id", id)); },
};

const basis: Store = DEMO ? demoStore : sbStore;

// ---------------------------------------------------------------- Änderungen melden
let version = 0;
const hoerer = new Set<() => void>();
function geaendert() { version++; hoerer.forEach((h) => h()); }
const abonniere = (h: () => void) => { hoerer.add(h); return () => hoerer.delete(h); };

/** Schreibende Aufrufe lösen ein Neuladen aller Ansichten aus. */
export const store: Store = {
  list: basis.list,
  get: basis.get,
  async insert(t, row) { const r = await basis.insert(t, row); geaendert(); return r; },
  async update(t, id, p) { const r = await basis.update(t, id, p); geaendert(); return r; },
  async remove(t, id) { await basis.remove(t, id); geaendert(); },
};

/** Lädt Daten und lädt neu, sobald irgendwo etwas gespeichert wurde. */
export function useDaten<T>(laden: () => Promise<T>, abh: unknown[] = []) {
  const v = useSyncExternalStore(abonniere, () => version);
  const [daten, setDaten] = useState<T | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(laden, abh);
  useEffect(() => {
    let aktiv = true;
    fn().then((d) => { if (aktiv) { setDaten(d); setFehler(null); } })
      .catch((e: Error) => { if (aktiv) setFehler(e.message); });
    return () => { aktiv = false; };
  }, [fn, v]);
  return { daten, fehler };
}

/** Komplette Sicherung aller Tabellen dieser App-Stufe als JSON */
export async function exportiereAlles() {
  const tabellen: Tabelle[] = ["person", "fall", "fallbeteiligung", "termin", "sitzungseintrag", "frist", "praxis_einstellungen"];
  const out: Record<string, unknown> = { exportiert_am: new Date().toISOString(), demo: DEMO };
  for (const t of tabellen) out[t] = await basis.list(t);
  return out;
}
