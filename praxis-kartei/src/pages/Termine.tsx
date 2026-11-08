import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Auswahl, Bereich, Fehler, Kopf, Leer, Text } from "../components/ui";
import { isoTag, name, tag, zeit } from "../lib/format";
import { store } from "../lib/store";
import { faelleVon, finde, useStamm } from "../lib/stamm";
import { SETTING, TERMIN_STATUS } from "../lib/texte";
import type { Termin } from "../lib/types";

export function Termine() {
  const { daten: s, fehler } = useStamm();
  const [vergangen, setVergangen] = useState(false);
  const jetzt = isoTag();
  const termine = (s?.termine ?? []).filter((t) => (vergangen ? isoTag(new Date(t.beginn)) < jetzt : isoTag(new Date(t.beginn)) >= jetzt));
  if (vergangen) termine.reverse();
  const tage = new Map<string, Termin[]>();
  for (const t of termine) {
    const k = isoTag(new Date(t.beginn));
    tage.set(k, [...(tage.get(k) ?? []), t]);
  }
  return (
    <>
      <Kopf titel="Termine" rechts={<Link className="knopf klein" to="/termin/neu">+ Termin</Link>} />
      <main className="seite">
        <Fehler text={fehler} />
        <div className="chips" style={{ margin: "12px 0" }}>
          <button className={`chip ${vergangen ? "aus" : ""}`} onClick={() => setVergangen(false)}>Kommend</button>
          <button className={`chip ${vergangen ? "" : "aus"}`} onClick={() => setVergangen(true)}>Vergangen</button>
        </div>
        {!s ? <Leer>Lädt …</Leer> : tage.size === 0 ? <Leer>Keine Termine.</Leer> :
          [...tage.entries()].map(([k, liste]) => (
            <section key={k}>
              <h2>{tag(k)}</h2>
              <div className="liste">
                {liste.map((t) => {
                  const p = finde(s.personen, t.person_id);
                  const f = finde(s.faelle, t.fall_id);
                  return (
                    <Link key={t.id} to={`/termin/${t.id}`} className="zeile">
                      <span className="zeit">{zeit(t.beginn)}</span>
                      <div className="mitte">
                        <b>{name(p)}</b>
                        <div className="chips">
                          {f && <span className="chip">{SETTING[f.setting]}</span>}
                          {p?.status === "gesperrt" && <span className="chip rot">gesperrt</span>}
                          {t.status !== "geplant" && <span className="chip grau">{TERMIN_STATUS[t.status]}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
      </main>
    </>
  );
}

export function TerminBearbeiten() {
  const { id } = useParams();
  const [such] = useSearchParams();
  const nav = useNavigate();
  const { daten: s } = useStamm();
  const [t, setT] = useState<Partial<Termin> | null>(null);
  const [tagWert, setTag] = useState(isoTag());
  const [uhr, setUhr] = useState("10:00");
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    if (!s || t) return;
    const vorhanden = finde(s.termine, id);
    if (vorhanden) {
      setT(vorhanden);
      const d = new Date(vorhanden.beginn);
      setTag(isoTag(d));
      setUhr(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    } else {
      const personId = such.get("person");
      const fallId = such.get("fall") ?? (personId ? faelleVon(s, personId)[0]?.f.id : null) ?? null;
      setT({ person_id: personId, fall_id: fallId, dauer_min: s.einstellungen?.standard_sitzungsdauer ?? 50, ort: "praxis", status: "geplant", quelle: "manuell", abrechnungsstatus: "offen" });
    }
  }, [s, id, such, t]);

  if (!s || !t) return <><Kopf titel="Termin" zurueck /><main className="seite"><Leer>Lädt …</Leer></main></>;
  const setze = <K extends keyof Termin>(k: K, v: Termin[K]) => setT({ ...t, [k]: v });
  const person = finde(s.personen, t.person_id);
  const faelle = person ? faelleVon(s, person.id).map((x) => x.f) : s.faelle;

  async function speichern(e: FormEvent) {
    e.preventDefault(); setFehler(null);
    if (!t!.person_id) return setFehler("Bitte eine Person wählen.");
    const beginn = new Date(`${tagWert}T${uhr}`).toISOString();
    const daten = { ...t, beginn, dauer_min: Number(t!.dauer_min) || 50 };
    try {
      if (id) await store.update("termin", id, daten);
      else await store.insert("termin", daten);
      nav(-1);
    } catch (err) { setFehler((err as Error).message); }
  }
  async function loeschen() {
    if (!id || !confirm("Termin löschen?")) return;
    await store.remove("termin", id); nav(-1);
  }

  return (
    <>
      <Kopf titel={id ? "Termin bearbeiten" : "Neuer Termin"} zurueck />
      <main className="seite">
        <form className="formular" onSubmit={speichern} style={{ marginTop: 16 }}>
          {person?.status === "gesperrt" && <div className="hinweis rot">Diese Person ist gesperrt (seit {person.gesperrt_seit}). Termin absagen und Standard-Absage senden.</div>}
          <Auswahl label="Person *" wert={t.person_id ?? ""} leer="– wählen –"
            optionen={s.personen.map((p) => [p.id, `${name(p)}${p.status === "gesperrt" ? " (gesperrt)" : ""}`] as [string, string])}
            setze={(v) => setT({ ...t, person_id: v || null, fall_id: null })} />
          <Auswahl label="Fall" wert={t.fall_id ?? ""} leer="– ohne Fall (Anfrage) –"
            optionen={faelle.map((f) => [f.id, f.titel] as [string, string])} setze={(v) => setze("fall_id", v || null)} />
          <div className="zwei">
            <Text label="Datum" typ="date" wert={tagWert} setze={setTag} pflicht />
            <Text label="Uhrzeit" typ="time" wert={uhr} setze={setUhr} pflicht />
          </div>
          <div className="zwei">
            <Text label="Dauer (Min.)" typ="number" wert={t.dauer_min} setze={(v) => setze("dauer_min", Number(v))} />
            <Auswahl label="Ort" wert={t.ort} setze={(v) => setze("ort", v)}
              optionen={{ praxis: "Praxis", online: "Online", telefon: "Telefon", sonstiges: "Sonstiges" }} />
          </div>
          <Auswahl label="Status" wert={t.status} setze={(v) => setze("status", v)} optionen={TERMIN_STATUS} />
          <Bereich label="Notiz (organisatorisch)" wert={t.notiz} setze={(v) => setze("notiz", v)} />
          <Fehler text={fehler} />
          <div className="knopfreihe">
            <button className="knopf">Speichern</button>
            {id && <Link className="knopf zweit" to={`/sitzung/${id}`}>Sitzung</Link>}
            {id && <button type="button" className="knopf rot" onClick={loeschen}>Löschen</button>}
          </div>
        </form>
      </main>
    </>
  );
}
