import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Auswahl, Bereich, Fehler, Kopf, Leer, Text } from "../components/ui";
import { datum, isoTag, liste, name, zeit } from "../lib/format";
import { store } from "../lib/store";
import { finde, useStamm } from "../lib/stamm";
import { DBT_EBENE, METHODEN } from "../lib/texte";
import type { Sitzungseintrag } from "../lib/types";

function useTimer(schluessel: string) {
  const [start] = useState(() => {
    try {
      const s = sessionStorage.getItem(schluessel);
      if (s) return Number(s);
      const jetzt = Date.now(); sessionStorage.setItem(schluessel, String(jetzt)); return jetzt;
    } catch { return Date.now(); }
  });
  const [jetzt, setJetzt] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(i); }, []);
  return Math.floor((jetzt - start) / 1000);
}

export function Sitzung() {
  const { terminId } = useParams();
  const nav = useNavigate();
  const { daten: s } = useStamm();
  const sek = useTimer(`timer-${terminId}`);
  const [e, setE] = useState<Partial<Sitzungseintrag> | null>(null);
  const [themen, setThemen] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);

  const t = s ? finde(s.termine, terminId) : undefined;
  const f = s && t ? finde(s.faelle, t.fall_id) : undefined;
  const vorhanden = s?.sitzungen.find((x) => x.termin_id === terminId);
  const vorige = s && f ? s.sitzungen.find((x) => x.fall_id === f.id && x.termin_id !== terminId && (!t || x.datum <= isoTag(new Date(t.beginn)))) : undefined;

  useEffect(() => {
    if (!s || e || !t) return;
    const start = vorhanden ?? { termin_id: t.id, fall_id: t.fall_id ?? undefined, datum: isoTag(new Date(t.beginn)), themen: [], methoden: [] };
    setE(start); setThemen((start.themen ?? []).join(", "));
  }, [s, t, e, vorhanden]);

  if (!s) return <><Kopf titel="Sitzung" zurueck /><main className="seite"><Leer>Lädt …</Leer></main></>;
  if (!t) return <><Kopf titel="Sitzung" zurueck /><main className="seite"><Leer>Termin nicht gefunden.</Leer></main></>;
  const p = finde(s.personen, t.person_id);
  if (!f) return (
    <><Kopf titel="Sitzung" zurueck /><main className="seite">
      <div className="hinweis gelb" style={{ marginTop: 16 }}>Dieser Termin hat noch keinen Fall. Erst einen Fall anlegen oder zuordnen.</div>
      <div className="knopfreihe" style={{ marginTop: 12 }}>
        {p && <Link className="knopf" to={`/fall/neu?person=${p.id}`}>Fall anlegen</Link>}
        <Link className="knopf zweit" to={`/termin/${t.id}`}>Termin bearbeiten</Link>
      </div>
    </main></>
  );
  if (!e) return null;

  const setze = <K extends keyof Sitzungseintrag>(k: K, v: Sitzungseintrag[K]) => setE({ ...e, [k]: v });
  const soll = (t.dauer_min || 50) * 60;
  const mm = String(Math.floor(sek / 60)).padStart(2, "0");
  const ss = String(sek % 60).padStart(2, "0");
  const offeneAufgabe = vorige?.naechste_schritte;

  async function speichern(ev: FormEvent) {
    ev.preventDefault(); setFehler(null);
    if (f!.risiko_pflicht && (e!.risiko_erfragt == null || (e!.risiko_erfragt && !e!.risiko_stufe))) {
      return setFehler("Risikoeinschätzung ist in diesem Fall Pflicht.");
    }
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = e as Sitzungseintrag;
    void _i; void _c; void _u;
    const daten: Partial<Sitzungseintrag> = { ...rest, fall_id: f!.id, themen: liste(themen) };
    try {
      if (vorhanden) await store.update("sitzungseintrag", vorhanden.id, daten);
      else await store.insert("sitzungseintrag", daten);
      if (t!.status === "geplant") await store.update("termin", t!.id, { status: "stattgefunden" });
      try { sessionStorage.removeItem(`timer-${terminId}`); } catch { /* ignorieren */ }
      nav(`/fall/${f!.id}`);
    } catch (err) { setFehler((err as Error).message); }
  }

  const toggleMethode = (m: string) => {
    const akt = e.methoden ?? [];
    setze("methoden", akt.includes(m) ? akt.filter((x) => x !== m) : [...akt, m]);
  };

  return (
    <>
      <Kopf titel={name(p)} zurueck />
      <main className="seite">
        <div className="karte" style={{ marginTop: 14 }}>
          <div className="leise klein">{datum(t.beginn)}, {zeit(t.beginn)} · {f.titel}</div>
          {!vorhanden && <>
            <div className={`timer ${sek > soll ? "ueber" : ""}`}>{mm}:{ss}</div>
            <div className="fortschritt"><div style={{ width: `${Math.min(100, (sek / soll) * 100)}%` }} /></div>
          </>}
        </div>
        {offeneAufgabe && <div className="hinweis" style={{ marginTop: 10 }}><b>Aus der letzten Sitzung ({datum(vorige!.datum)}):</b> {offeneAufgabe}</div>}

        <form className="formular" onSubmit={speichern} style={{ marginTop: 16 }}>
          <Bereich label="Klientenangabe (was berichtet wurde)" wert={e.klientenangabe} setze={(v) => setze("klientenangabe", v)} />
          <Bereich label="Beobachtung (was ich wahrgenommen habe)" wert={e.beobachtung} setze={(v) => setze("beobachtung", v)} />
          <Bereich label="Einschätzung (fachlich)" wert={e.einschaetzung} setze={(v) => setze("einschaetzung", v)} />
          <Text label="Themen (Komma-getrennt)" wert={themen} setze={setThemen} />
          <div className="feld"><span>Methoden</span>
            <div className="chips">{METHODEN.map((m) => (
              <button type="button" key={m} className={`chip ${(e.methoden ?? []).includes(m) ? "" : "aus"}`} onClick={() => toggleMethode(m)}>{m}</button>
            ))}</div>
          </div>
          {f.setting === "borderline" && (
            <Auswahl label="DBT-Behandlungsebene" wert={e.dbt_ebene ?? ""} leer="–"
              optionen={Object.entries(DBT_EBENE).map(([k, v]) => [Number(k), v] as [number, string])}
              setze={(v) => setze("dbt_ebene", v ? Number(v) : null)} />
          )}

          <div className="karte formular">
            <b>Risikoeinschätzung{f.risiko_pflicht ? " *" : ""}</b>
            <div className="chips">
              <button type="button" className={`chip ${e.risiko_erfragt === true ? "" : "aus"}`} onClick={() => setze("risiko_erfragt", true)}>erfragt</button>
              <button type="button" className={`chip ${e.risiko_erfragt === false ? "" : "aus"}`} onClick={() => setE({ ...e, risiko_erfragt: false, risiko_stufe: null })}>nicht erfragt</button>
            </div>
            {e.risiko_erfragt && <>
              <div className="chips">
                {(["keine", "latent", "akut"] as const).map((r) => (
                  <button type="button" key={r} className={`chip ${r === "akut" ? "rot" : r === "latent" ? "gelb" : ""} ${e.risiko_stufe === r ? "" : "aus"}`} onClick={() => setze("risiko_stufe", r)}>{r}</button>
                ))}
              </div>
              {e.risiko_stufe && e.risiko_stufe !== "keine" && <Bereich label="Maßnahme / Absprache" wert={e.risiko_massnahme} setze={(v) => setze("risiko_massnahme", v)} />}
            </>}
          </div>

          <Bereich label="Nächste Schritte / Hausaufgabe" wert={e.naechste_schritte} setze={(v) => setze("naechste_schritte", v)} />
          <details className="abschnitt">
            <summary>Drive-Verweise</summary>
            <div className="inhalt formular">
              <Text label="Vorbereitung (Drive-Datei-ID)" wert={e.vorbereitung_drive_id} setze={(v) => setze("vorbereitung_drive_id", v || null)} />
              <Text label="Plaud-Transkript (Drive-Datei-ID)" wert={e.transkript_drive_id} setze={(v) => setze("transkript_drive_id", v || null)} />
            </div>
          </details>
          <Fehler text={fehler} />
          <button className="knopf">{vorhanden ? "Änderungen speichern" : "Sitzung abschließen"}</button>
        </form>
      </main>
    </>
  );
}
