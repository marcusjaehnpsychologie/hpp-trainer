// Gemeinsame Ladefunktionen und Ableitungen
import { store, useDaten } from "./store";
import type { Fall, Fallbeteiligung, Frist, Person, Sitzungseintrag, Termin, Einstellungen } from "./types";
import { tageBis } from "./format";

export interface Stamm {
  personen: Person[];
  faelle: Fall[];
  beteiligungen: Fallbeteiligung[];
  termine: Termin[];
  sitzungen: Sitzungseintrag[];
  fristen: Frist[];
  einstellungen: Einstellungen | null;
}

export function useStamm() {
  return useDaten<Stamm>(async () => {
    const [personen, faelle, beteiligungen, termine, sitzungen, fristen, einst] = await Promise.all([
      store.list("person"), store.list("fall"), store.list("fallbeteiligung"),
      store.list("termin"), store.list("sitzungseintrag"), store.list("frist"),
      store.list("praxis_einstellungen"),
    ]);
    personen.sort((a, b) => (a.nachname + a.vorname).localeCompare(b.nachname + b.vorname, "de"));
    termine.sort((a, b) => a.beginn.localeCompare(b.beginn));
    sitzungen.sort((a, b) => b.datum.localeCompare(a.datum));
    fristen.sort((a, b) => a.faellig.localeCompare(b.faellig));
    return { personen, faelle, beteiligungen, termine, sitzungen, fristen, einstellungen: einst[0] ?? null };
  });
}

export const finde = <T extends { id: string }>(l: T[], id: string | null | undefined) =>
  id ? l.find((x) => x.id === id) : undefined;

export const faelleVon = (s: Stamm, personId: string) =>
  s.beteiligungen.filter((b) => b.person_id === personId)
    .map((b) => ({ b, f: finde(s.faelle, b.fall_id)! })).filter((x) => x.f);

export const beteiligteVon = (s: Stamm, fallId: string) =>
  s.beteiligungen.filter((b) => b.fall_id === fallId)
    .map((b) => ({ b, p: finde(s.personen, b.person_id)! })).filter((x) => x.p);

export const offeneFristen = (s: Stamm) => s.fristen.filter((f) => !f.erledigt_am);

export function letzteRisikoStufe(s: Stamm, fallId: string) {
  return s.sitzungen.find((x) => x.fall_id === fallId && x.risiko_stufe)?.risiko_stufe ?? null;
}

export type Flagge = { text: string; art: "rot" | "gelb" | "blau" | "grau" };

export function flaggenPerson(s: Stamm, p: Person): Flagge[] {
  const f: Flagge[] = [];
  if (p.status === "gesperrt") f.push({ text: "gesperrt", art: "rot" });
  for (const { f: fall } of faelleVon(s, p.id)) {
    if (letzteRisikoStufe(s, fall.id) === "akut") f.push({ text: "Risiko akut", art: "rot" });
    const fr = offeneFristen(s).filter((x) => x.fall_id === fall.id && tageBis(x.faellig) <= 14);
    if (fr.length) f.push({ text: `${fr.length} Frist${fr.length > 1 ? "en" : ""}`, art: "gelb" });
  }
  return f;
}

export const erlaubnisVorhanden = (s: Stamm) => !!s.einstellungen?.heilkunde_erlaubnis_datum;
