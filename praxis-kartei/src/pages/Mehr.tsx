import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Fehler, Kopf, Leer, Text } from "../components/ui";
import { datum, name } from "../lib/format";
import { demoZuruecksetzen, exportiereAlles, store } from "../lib/store";
import { useStamm } from "../lib/stamm";
import { DEMO, supabase } from "../lib/supabase";
import type { Einstellungen } from "../lib/types";

export function Mehr() {
  const { daten: s } = useStamm();
  const [e, setE] = useState<Partial<Einstellungen> | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    if (s && !e) setE(s.einstellungen ?? { standard_sitzungsdauer: 50, zwischenbilanz_intervall: 10, loeschfrist_coaching_jahre: 3, berufsbezeichnung: "Diplom-Psychologe" });
  }, [s, e]);
  const setze = <K extends keyof Einstellungen>(k: K, v: Einstellungen[K]) => setE({ ...e, [k]: v });

  async function speichern(ev: FormEvent) {
    ev.preventDefault(); setFehler(null); setMeldung(null);
    const { id, created_at: _c, updated_at: _u, ...rest } = e as Einstellungen;
    void _c; void _u;
    const daten = { ...rest, heilkunde_erlaubnis_datum: rest.heilkunde_erlaubnis_datum || null };
    try {
      if (id) await store.update("praxis_einstellungen", id, daten);
      else setE(await store.insert("praxis_einstellungen", daten));
      setMeldung("Gespeichert.");
    } catch (err) { setFehler((err as Error).message); }
  }

  async function exportieren() {
    const daten = await exportiereAlles();
    const blob = new Blob([JSON.stringify(daten, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kartei-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const gesperrt = s?.personen.filter((p) => p.status === "gesperrt") ?? [];

  return (
    <>
      <Kopf titel="Mehr" />
      <main className="seite">
        <h2>Sperrliste</h2>
        {gesperrt.length === 0 ? <Leer>Niemand gesperrt.</Leer> : (
          <div className="liste">
            {gesperrt.map((p) => (
              <Link key={p.id} to={`/person/${p.id}`} className="zeile">
                <div className="mitte"><b>{name(p)}</b><span className="leise klein">seit {datum(p.gesperrt_seit)} · {p.emails.join(", ")}</span></div>
              </Link>
            ))}
          </div>
        )}

        <h2>Einstellungen</h2>
        {!e ? <Leer>Lädt …</Leer> : (
          <form className="formular karte" onSubmit={speichern}>
            <Text label="Praxisname" wert={e.praxis_name} setze={(v) => setze("praxis_name", v)} />
            <Text label="Berufsbezeichnung" wert={e.berufsbezeichnung} setze={(v) => setze("berufsbezeichnung", v)} />
            <Text label="Anschrift" wert={e.anschrift} setze={(v) => setze("anschrift", v)} />
            <div className="zwei">
              <Text label="Telefon" wert={e.telefon} setze={(v) => setze("telefon", v)} />
              <Text label="E-Mail" typ="email" wert={e.email} setze={(v) => setze("email", v)} />
            </div>
            <div className="zwei">
              <Text label="Standard-Sitzungsdauer (Min.)" typ="number" wert={e.standard_sitzungsdauer} setze={(v) => setze("standard_sitzungsdauer", Number(v))} />
              <Text label="Zwischenbilanz alle … Sitzungen" typ="number" wert={e.zwischenbilanz_intervall} setze={(v) => setze("zwischenbilanz_intervall", Number(v))} />
            </div>
            <h3 style={{ marginTop: 8 }}>Heilkunde-Erlaubnis</h3>
            <div className="hinweis">Solange kein Datum eingetragen ist, sind alle Fälle Coaching und das Diagnosemodul ist gesperrt. Erst eintragen, wenn der Erlaubnisbescheid vorliegt – nicht am Prüfungstag.</div>
            <Text label="Erlaubnis erteilt am" typ="date" wert={e.heilkunde_erlaubnis_datum} setze={(v) => setze("heilkunde_erlaubnis_datum", v)} />
            <div className="zwei">
              <Text label="Behörde" wert={e.heilkunde_erlaubnis_behoerde} setze={(v) => setze("heilkunde_erlaubnis_behoerde", v)} />
              <Text label="Aktenzeichen" wert={e.heilkunde_erlaubnis_aktenzeichen} setze={(v) => setze("heilkunde_erlaubnis_aktenzeichen", v)} />
            </div>
            <Fehler text={fehler} />
            {meldung && <div className="hinweis">{meldung}</div>}
            <button className="knopf">Speichern</button>
          </form>
        )}

        <h2>Sicherung</h2>
        <div className="karte formular">
          <p className="leise" style={{ margin: 0 }}>Lädt alle Daten als JSON-Datei herunter. Die Datei enthält Gesundheitsdaten – nur verschlüsselt ablegen (z. B. verschlüsseltes Disk-Image), nie per Mail verschicken.</p>
          <button className="knopf zweit" onClick={exportieren}>Sicherung herunterladen</button>
        </div>

        <h2>Konto</h2>
        <div className="knopfreihe">
          {DEMO
            ? <button className="knopf zweit" onClick={() => confirm("Alle Demo-Daten zurücksetzen?") && demoZuruecksetzen()}>Demo-Daten zurücksetzen</button>
            : <button className="knopf zweit" onClick={() => supabase!.auth.signOut()}>Abmelden</button>}
        </div>
        <p className="leise klein" style={{ marginTop: 24 }}>Praxis-Kartei v0.1 · Stufe 1 {DEMO ? "· Demo-Modus" : ""}</p>
      </main>
    </>
  );
}
