import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Auswahl, Bereich, Fehler, Kopf, Leer, Text } from "../components/ui";
import { datum, isoTag, name, tageBis } from "../lib/format";
import { store } from "../lib/store";
import { beteiligteVon, erlaubnisVorhanden, finde, offeneFristen, useStamm } from "../lib/stamm";
import { PHASE, RISIKO_SETTINGS, ROLLE, SETTING, TERMIN_STATUS } from "../lib/texte";
import type { Fall, Rolle } from "../lib/types";

export function FallAnsicht() {
  const { id } = useParams();
  const { daten: s } = useStamm();
  const [neuPerson, setNeuPerson] = useState("");
  const [neuRolle, setNeuRolle] = useState<Rolle>("partner");
  const [fristText, setFristText] = useState("");
  const [fristTag, setFristTag] = useState(isoTag());
  const [fehler, setFehler] = useState<string | null>(null);
  const f = s ? finde(s.faelle, id) : undefined;
  if (!s) return <><Kopf titel="Fall" zurueck /><main className="seite"><Leer>Lädt …</Leer></main></>;
  if (!f) return <><Kopf titel="Fall" zurueck /><main className="seite"><Leer>Fall nicht gefunden.</Leer></main></>;

  const beteiligte = beteiligteVon(s, f.id);
  const termine = s.termine.filter((t) => t.fall_id === f.id);
  const sitzungen = s.sitzungen.filter((x) => x.fall_id === f.id);
  const fristen = offeneFristen(s).filter((x) => x.fall_id === f.id);
  const mehrere = beteiligte.filter((x) => x.b.ist_klient).length > 1;
  const erlaubnis = erlaubnisVorhanden(s);

  // Kontaktbilanz: stattgefundene Termine, bei denen nur diese Person eingetragen war
  const bilanz = beteiligte.filter((x) => x.b.ist_klient).map(({ p }) => ({
    p, n: termine.filter((t) => t.status === "stattgefunden" && t.person_id === p.id).length,
  }));
  const ungleich = mehrere && bilanz.length > 1 && Math.max(...bilanz.map((x) => x.n)) - Math.min(...bilanz.map((x) => x.n)) >= 2;

  async function phase(delta: number) {
    const neu = Math.min(9, Math.max(1, f!.phase + delta));
    await store.update("fall", f!.id, { phase: neu, ...(neu === 8 && !f!.abschluss ? { abschluss: isoTag() } : {}) });
  }
  async function beteiligen(e: FormEvent) {
    e.preventDefault(); setFehler(null);
    if (!neuPerson) return;
    try {
      await store.insert("fallbeteiligung", {
        fall_id: f!.id, person_id: neuPerson, rolle: neuRolle,
        ist_klient: ["klient", "partner", "elternteil"].includes(neuRolle),
      });
      setNeuPerson("");
    } catch (err) { setFehler((err as Error).message); }
  }
  async function fristAnlegen(e: FormEvent) {
    e.preventDefault();
    if (!fristText.trim()) return;
    await store.insert("frist", { fall_id: f!.id, text: fristText.trim(), faellig: fristTag, erledigt_am: null });
    setFristText("");
  }

  return (
    <>
      <Kopf titel={f.titel} zurueck rechts={<Link className="knopf klein zweit" to={`/fall/${f.id}/bearbeiten`}>Bearbeiten</Link>} />
      <main className="seite">
        <div className="chips" style={{ marginTop: 14 }}>
          <span className="chip">{SETTING[f.setting]}</span>
          <span className={`chip ${f.rechtsrahmen === "heilkunde" ? "blau" : "grau"}`}>{f.rechtsrahmen === "heilkunde" ? "Heilkunde" : "Coaching"} seit {datum(f.rechtsrahmen_seit)}</span>
          {f.risiko_pflicht && <span className="chip gelb">Risikofeld Pflicht</span>}
        </div>

        <h2>Phase {f.phase}: {PHASE[f.phase]}</h2>
        <div className="fortschritt"><div style={{ width: `${(f.phase / 9) * 100}%` }} /></div>
        <div className="knopfreihe" style={{ marginTop: 10 }}>
          <button className="knopf klein zweit" disabled={f.phase <= 1} onClick={() => phase(-1)}>‹ zurück</button>
          <button className="knopf klein" disabled={f.phase >= 9} onClick={() => phase(1)}>weiter: {PHASE[Math.min(9, f.phase + 1)]} ›</button>
        </div>

        <h2>Beteiligte</h2>
        <div className="liste">
          {beteiligte.map(({ b, p }) => (
            <div key={b.id} className="zeile">
              <Link to={`/person/${p.id}`} className="mitte" style={{ color: "inherit" }}>
                <b>{name(p)}</b>
                <div className="chips">
                  <span className="chip">{ROLLE[b.rolle]}</span>
                  {!b.ist_klient && <span className="chip grau">nicht untersucht – keine Diagnosen</span>}
                </div>
              </Link>
              <button className="knopf klein zweit" aria-label="Beteiligung entfernen"
                onClick={() => confirm(`${name(p)} aus dem Fall entfernen?`) && store.remove("fallbeteiligung", b.id)}>✕</button>
            </div>
          ))}
        </div>
        <form className="formular karte" style={{ marginTop: 10 }} onSubmit={beteiligen}>
          <div className="zwei">
            <Auswahl label="Person hinzufügen" wert={neuPerson} leer="– wählen –" setze={setNeuPerson}
              optionen={s.personen.filter((p) => !beteiligte.some((x) => x.p.id === p.id)).map((p) => [p.id, name(p)] as [string, string])} />
            <Auswahl label="Rolle" wert={neuRolle} setze={setNeuRolle} optionen={ROLLE} />
          </div>
          <Fehler text={fehler} />
          <button className="knopf klein zweit" disabled={!neuPerson}>Hinzufügen</button>
        </form>

        {mehrere && (
          <>
            <h2>Kontaktbilanz (Einzeltermine)</h2>
            <div className="karte">
              {bilanz.map(({ p, n }) => <div key={p.id}>{name(p)}: <b>{n}</b></div>)}
              {ungleich && <div className="hinweis gelb" style={{ marginTop: 8 }}>Ungleichgewicht – Allparteilichkeit ansprechen, bevor es die andere Seite tut.</div>}
            </div>
          </>
        )}

        <details className="abschnitt" open>
          <summary>Auftrag</summary>
          <div className="inhalt">
            <dl className="kv">
              <dt>Anliegen</dt><dd>{f.anliegen || "–"}</dd>
              <dt>Auftrag</dt><dd>{f.auftrag || "–"}</dd>
              <dt>Beginn</dt><dd>{datum(f.beginn)}</dd>
              <dt>Honorar</dt><dd>{f.honorar != null ? `${f.honorar} €` : "–"}</dd>
              <dt>Frequenz</dt><dd>{f.frequenz || "–"}</dd>
              {f.rechtsrahmen_begruendung && <><dt>Rechtsrahmen</dt><dd>{f.rechtsrahmen_begruendung}</dd></>}
              {f.setting === "gutachten_begleitung" && <>
                <dt>Aktenzeichen</dt><dd>{f.aktenzeichen || "–"}</dd>
                <dt>Gericht</dt><dd>{f.gericht || "–"}</dd>
                <dt>Gutachter/in</dt><dd>{f.gutachter || "–"}</dd>
                <dt>Anwalt</dt><dd>{f.anwalt || "–"}</dd>
              </>}
            </dl>
          </div>
        </details>

        <details className="abschnitt">
          <summary>Diagnosen / Arbeitshypothesen</summary>
          <div className="inhalt">
            {f.rechtsrahmen === "coaching"
              ? <div className="hinweis">Coaching-Fall: keine Diagnosen. Arbeitshypothesen (z. B. Strukturniveau nach Kernberg, Themen) – Eingabe folgt in Stufe 3.</div>
              : !erlaubnis
                ? <div className="hinweis gelb">Diagnosemodul gesperrt, bis die Heilkunde-Erlaubnis unter „Mehr → Einstellungen“ eingetragen ist.</div>
                : <div className="hinweis">Diagnosen nach ICD-10-GM mit ICD-11-Abgleich – Eingabe folgt in Stufe 3. Die Datenbank prüft die Regeln bereits.</div>}
          </div>
        </details>

        <h2>Sitzungen</h2>
        {sitzungen.length === 0 ? <Leer>Noch keine Sitzungseinträge.</Leer> : (
          <div className="zeitstrahl">
            {sitzungen.map((x) => (
              <Link key={x.id} to={x.termin_id ? `/sitzung/${x.termin_id}` : "#"} className="ereignis" style={{ color: "inherit" }}>
                <div className="leise klein">{datum(x.datum)}{x.dbt_ebene ? ` · DBT-Ebene ${x.dbt_ebene}` : ""}</div>
                <div>{x.einschaetzung || x.klientenangabe || "Sitzungseintrag"}</div>
                {x.naechste_schritte && <div className="leise klein">→ {x.naechste_schritte}</div>}
              </Link>
            ))}
          </div>
        )}

        <h2>Termine</h2>
        <div className="knopfreihe" style={{ marginBottom: 8 }}><Link className="knopf klein zweit" to={`/termin/neu?fall=${f.id}&person=${beteiligte[0]?.p.id ?? ""}`}>+ Termin</Link></div>
        {termine.length === 0 ? <Leer>Keine Termine.</Leer> : (
          <div className="liste">
            {[...termine].reverse().map((t) => (
              <Link key={t.id} to={`/termin/${t.id}`} className="zeile">
                <div className="mitte"><b>{datum(t.beginn)}</b><span className="leise">{name(finde(s.personen, t.person_id))} · {TERMIN_STATUS[t.status]}</span></div>
              </Link>
            ))}
          </div>
        )}

        <h2>Fristen</h2>
        <div className="liste">
          {fristen.map((x) => {
            const d = tageBis(x.faellig);
            return (
              <div key={x.id} className="zeile">
                <span className={`chip ${d < 0 ? "rot" : d <= 14 ? "gelb" : "grau"}`}>{datum(x.faellig)}</span>
                <div className="mitte">{x.text}</div>
                <button className="knopf klein zweit" onClick={() => store.update("frist", x.id, { erledigt_am: isoTag() })}>erledigt</button>
              </div>
            );
          })}
        </div>
        <form className="formular karte" style={{ marginTop: 10 }} onSubmit={fristAnlegen}>
          <div className="zwei">
            <Text label="Neue Frist" wert={fristText} setze={setFristText} />
            <Text label="fällig am" typ="date" wert={fristTag} setze={setFristTag} />
          </div>
          <button className="knopf klein zweit" disabled={!fristText.trim()}>Anlegen</button>
        </form>
      </main>
    </>
  );
}

export function FallBearbeiten() {
  const { id } = useParams();
  const [such] = useSearchParams();
  const nav = useNavigate();
  const { daten: s } = useStamm();
  const [f, setF] = useState<Partial<Fall> | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    if (!s || f) return;
    const v = finde(s.faelle, id);
    if (v) return setF(v);
    const p = finde(s.personen, such.get("person"));
    setF({ titel: p ? `${p.vorname} ${p.nachname[0]}.` : "", setting: "einzel", rechtsrahmen: "coaching",
      rechtsrahmen_seit: isoTag(), phase: 1, beginn: isoTag(), honorar: null, risiko_pflicht: false });
  }, [s, id, such, f]);
  if (!s || !f) return <><Kopf titel="Fall" zurueck /><main className="seite"><Leer>Lädt …</Leer></main></>;
  const setze = <K extends keyof Fall>(k: K, v: Fall[K]) => setF({ ...f, [k]: v });
  const erlaubnis = erlaubnisVorhanden(s);
  const vorher = finde(s.faelle, id);

  async function speichern(e: FormEvent) {
    e.preventDefault(); setFehler(null);
    if (f!.rechtsrahmen === "heilkunde" && !erlaubnis) return setFehler("Heilkunde erst nach Eintrag der Erlaubnis (Mehr → Einstellungen).");
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = f as Fall;
    void _i; void _c; void _u;
    const daten: Partial<Fall> = { ...rest, honorar: f!.honorar === null || (f!.honorar as unknown) === "" ? null : Number(f!.honorar) };
    // Rechtsrahmen-Wechsel: Stichtag setzen, nichts rückwirkend
    if (vorher && vorher.rechtsrahmen !== f!.rechtsrahmen) daten.rechtsrahmen_seit = isoTag();
    try {
      if (id) { await store.update("fall", id, daten); nav(-1); }
      else {
        const neu = await store.insert("fall", daten);
        const personId = such.get("person");
        if (personId) await store.insert("fallbeteiligung", { fall_id: neu.id, person_id: personId, rolle: "klient", ist_klient: true });
        nav(`/fall/${neu.id}`, { replace: true });
      }
    } catch (err) { setFehler((err as Error).message); }
  }

  return (
    <>
      <Kopf titel={id ? "Fall bearbeiten" : "Neuer Fall"} zurueck />
      <main className="seite">
        <form className="formular" onSubmit={speichern} style={{ marginTop: 16 }}>
          <Text label="Titel" wert={f.titel} setze={(v) => setze("titel", v)} pflicht platzhalter="z. B. Paar M./K. 2026" />
          <Auswahl label="Setting" wert={f.setting} optionen={SETTING}
            setze={(v) => setF({ ...f, setting: v, risiko_pflicht: f.risiko_pflicht || RISIKO_SETTINGS.includes(v) })} />
          <Auswahl label="Rechtsrahmen" wert={f.rechtsrahmen} setze={(v) => setze("rechtsrahmen", v)}
            optionen={[["coaching", "Coaching / Beratung"], ["heilkunde", erlaubnis ? "Heilkunde" : "Heilkunde (gesperrt – keine Erlaubnis eingetragen)"]]} />
          {vorher && vorher.rechtsrahmen !== f.rechtsrahmen && <div className="hinweis gelb">Wechsel gilt ab heute. Frühere Sitzungen bleiben im bisherigen Rechtsrahmen.</div>}
          <Bereich label="Begründung Rechtsrahmen" wert={f.rechtsrahmen_begruendung} setze={(v) => setze("rechtsrahmen_begruendung", v)}
            platzhalter="Krankheitswert? Leidensdruck? Weiterverweisung nötig?" />
          <div className="zwei">
            <Auswahl label="Phase" wert={f.phase} setze={(v) => setze("phase", Number(v))}
              optionen={Object.entries(PHASE).map(([k, v]) => [Number(k), `${k} · ${v}`] as [number, string])} />
            <Text label="Beginn" typ="date" wert={f.beginn} setze={(v) => setze("beginn", v || null)} />
          </div>
          <Bereich label="Anliegen (Wortlaut Klient/in)" wert={f.anliegen} setze={(v) => setze("anliegen", v)} />
          <Bereich label="Auftrag (eigene Formulierung)" wert={f.auftrag} setze={(v) => setze("auftrag", v)} />
          <div className="zwei">
            <Text label="Honorar (€)" typ="number" wert={f.honorar} setze={(v) => setze("honorar", (v === "" ? null : Number(v)) as number | null)} />
            <Text label="Frequenz" wert={f.frequenz} setze={(v) => setze("frequenz", v)} platzhalter="z. B. 14-tägig" />
          </div>
          {f.setting === "gutachten_begleitung" && <>
            <div className="zwei">
              <Text label="Aktenzeichen" wert={f.aktenzeichen} setze={(v) => setze("aktenzeichen", v)} />
              <Text label="Gericht" wert={f.gericht} setze={(v) => setze("gericht", v)} />
            </div>
            <div className="zwei">
              <Text label="Gutachter/in" wert={f.gutachter} setze={(v) => setze("gutachter", v)} />
              <Text label="Anwalt/Anwältin" wert={f.anwalt} setze={(v) => setze("anwalt", v)} />
            </div>
          </>}
          <label className="check"><input type="checkbox" checked={!!f.risiko_pflicht} onChange={(e) => setze("risiko_pflicht", e.target.checked)} /> Risikoeinschätzung in jeder Sitzung Pflicht</label>
          {f.phase === 8 && <Text label="Abschlussgrund" wert={f.abschlussgrund} setze={(v) => setze("abschlussgrund", v)} />}
          <Fehler text={fehler} />
          <button className="knopf">Speichern</button>
        </form>
      </main>
    </>
  );
}
