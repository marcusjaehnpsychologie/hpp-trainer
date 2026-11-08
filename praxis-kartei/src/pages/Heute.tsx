import { Link } from "react-router-dom";
import { Fehler, Kopf, Leer } from "../components/ui";
import { datum, isoTag, name, tag, tageBis, zeit } from "../lib/format";
import { finde, flaggenPerson, offeneFristen, useStamm } from "../lib/stamm";
import { SETTING, TERMIN_STATUS } from "../lib/texte";

export function Heute() {
  const { daten: s, fehler } = useStamm();
  const heute = isoTag();
  const termine = s?.termine.filter((t) => isoTag(new Date(t.beginn)) === heute) ?? [];
  const fristen = s ? offeneFristen(s).filter((f) => tageBis(f.faellig) <= 14) : [];
  const gesperrteBuchungen = s?.termine.filter((t) => {
    const p = finde(s.personen, t.person_id);
    return p?.status === "gesperrt" && t.status === "geplant" && t.beginn >= new Date().toISOString();
  }) ?? [];

  return (
    <>
      <Kopf titel={tag(new Date().toISOString())} />
      <main className="seite">
        <Fehler text={fehler} />
        {gesperrteBuchungen.length > 0 && (
          <div className="hinweis rot" style={{ marginTop: 12 }}>
            <b>Buchung gesperrter Person:</b>{" "}
            {gesperrteBuchungen.map((t) => <Link key={t.id} to={`/termin/${t.id}`}>{name(finde(s!.personen, t.person_id))} am {datum(t.beginn)}</Link>)}
          </div>
        )}

        <h2>Termine heute</h2>
        {!s ? <Leer>Lädt …</Leer> : termine.length === 0 ? <Leer>Keine Termine heute.</Leer> : (
          <div className="liste">
            {termine.map((t) => {
              const p = finde(s.personen, t.person_id);
              const f = finde(s.faelle, t.fall_id);
              const sitzung = s.sitzungen.find((x) => x.termin_id === t.id);
              return (
                <div key={t.id} className="zeile">
                  <span className="zeit">{zeit(t.beginn)}</span>
                  <Link to={p ? `/person/${p.id}` : `/termin/${t.id}`} className="mitte" style={{ color: "inherit" }}>
                    <b>{name(p)}</b>
                    <div className="chips">
                      {f && <span className="chip">{SETTING[f.setting]}</span>}
                      {t.ort === "online" && <span className="chip blau">online</span>}
                      {t.status !== "geplant" && <span className="chip grau">{TERMIN_STATUS[t.status]}</span>}
                      {p && flaggenPerson(s, p).map((fl, i) => <span key={i} className={`chip ${fl.art}`}>{fl.text}</span>)}
                    </div>
                  </Link>
                  {t.status === "geplant" || sitzung
                    ? <Link className="knopf klein" to={`/sitzung/${t.id}`}>{sitzung ? "Notiz" : "Start"}</Link>
                    : null}
                </div>
              );
            })}
          </div>
        )}

        <h2>Fristen (14 Tage)</h2>
        {fristen.length === 0 ? <Leer>Keine offenen Fristen.</Leer> : (
          <div className="liste">
            {fristen.map((f) => {
              const d = tageBis(f.faellig);
              const fall = finde(s!.faelle, f.fall_id);
              return (
                <Link key={f.id} to={fall ? `/fall/${fall.id}` : "/fristen"} className="zeile">
                  <span className={`chip ${d < 0 ? "rot" : "gelb"}`}>{d < 0 ? `${-d} T überfällig` : d === 0 ? "heute" : `in ${d} T`}</span>
                  <div className="mitte"><b>{f.text}</b>{fall && <span className="leise">{fall.titel}</span>}</div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
