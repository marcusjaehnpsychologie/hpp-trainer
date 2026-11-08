import { Link, useParams } from "react-router-dom";
import { Initialen, Kopf, Leer } from "../components/ui";
import { datum, name, zeit } from "../lib/format";
import { faelleVon, finde, flaggenPerson, useStamm } from "../lib/stamm";
import { PERSON_STATUS, PHASE, ROLLE, SETTING, TERMIN_STATUS } from "../lib/texte";

export function Akte() {
  const { id } = useParams();
  const { daten: s } = useStamm();
  const p = s ? finde(s.personen, id) : undefined;
  if (!s) return <><Kopf titel="Akte" zurueck /><main className="seite"><Leer>Lädt …</Leer></main></>;
  if (!p) return <><Kopf titel="Akte" zurueck /><main className="seite"><Leer>Person nicht gefunden.</Leer></main></>;

  const faelle = faelleVon(s, p.id);
  const fallIds = new Set(faelle.map((x) => x.f.id));
  const termine = s.termine.filter((t) => t.person_id === p.id || (t.fall_id && fallIds.has(t.fall_id)));
  const sitzungen = s.sitzungen.filter((x) => fallIds.has(x.fall_id));
  const naechster = termine.find((t) => t.status === "geplant" && t.beginn >= new Date().toISOString());

  // Zeitstrahl: Sitzungseinträge + Termine ohne Eintrag, neueste oben
  const verlauf = [
    ...sitzungen.map((x) => ({ art: "sitzung" as const, datum: x.datum, x })),
    ...termine.filter((t) => t.beginn < new Date().toISOString() && !sitzungen.some((x) => x.termin_id === t.id))
      .map((t) => ({ art: "termin" as const, datum: t.beginn, t })),
  ].sort((a, b) => b.datum.localeCompare(a.datum));

  const mail = p.emails[0];
  return (
    <>
      <Kopf titel={name(p)} zurueck rechts={<Link className="knopf klein zweit" to={`/person/${p.id}/bearbeiten`}>Bearbeiten</Link>} />
      <main className="seite">
        <div className="zeile" style={{ marginTop: 16 }}>
          <Initialen v={p.vorname} n={p.nachname} />
          <div className="mitte">
            <b>{name(p)}</b>
            <div className="chips">
              <span className={`chip ${p.status === "gesperrt" ? "rot" : p.status === "aktiv" ? "" : "grau"}`}>{PERSON_STATUS[p.status]}</span>
              {flaggenPerson(s, p).filter((f) => f.text !== "gesperrt").map((f, i) => <span key={i} className={`chip ${f.art}`}>{f.text}</span>)}
            </div>
            {naechster && <div className="leise klein">Nächster Termin: {datum(naechster.beginn)}, {zeit(naechster.beginn)}</div>}
          </div>
        </div>
        {p.status === "gesperrt" && <div className="hinweis rot" style={{ marginTop: 10 }}>Gesperrt seit {datum(p.gesperrt_seit)}. Buchungen absagen.</div>}

        <div className="aktionen">
          {p.telefon && <a href={`tel:${p.telefon.replace(/\s/g, "")}`}>📞 Anrufen</a>}
          {mail && <a href={`mailto:${mail}`}>✉️ E-Mail</a>}
          <Link to={`/termin/neu?person=${p.id}`}>📅 Termin</Link>
          {naechster && <Link to={`/sitzung/${naechster.id}`}>▶️ Sitzung</Link>}
          {p.drive_ordner_id && <a href={`https://drive.google.com/drive/folders/${p.drive_ordner_id}`} target="_blank" rel="noreferrer">📁 Drive</a>}
          <Link to={`/fall/neu?person=${p.id}`}>➕ Fall</Link>
        </div>

        <h2>Fälle</h2>
        {faelle.length === 0 ? <Leer>Noch kein Fall. Ein Fall bündelt Auftrag, Sitzungen und Rechtsrahmen.</Leer> : (
          <div className="liste">
            {faelle.map(({ b, f }) => (
              <Link key={f.id} to={`/fall/${f.id}`} className="zeile">
                <div className="mitte">
                  <b>{f.titel}</b>
                  <div className="chips">
                    <span className="chip">{SETTING[f.setting]}</span>
                    <span className={`chip ${f.rechtsrahmen === "heilkunde" ? "blau" : "grau"}`}>{f.rechtsrahmen === "heilkunde" ? "Heilkunde" : "Coaching"}</span>
                    <span className="chip grau">Phase {f.phase}: {PHASE[f.phase]}</span>
                    <span className="chip grau">{ROLLE[b.rolle]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <h2>Verlauf</h2>
        {verlauf.length === 0 ? <Leer>Noch keine Einträge.</Leer> : (
          <div className="zeitstrahl">
            {verlauf.map((v) => v.art === "sitzung" ? (
              <Link key={v.x.id} to={v.x.termin_id ? `/sitzung/${v.x.termin_id}` : `/fall/${v.x.fall_id}`} className="ereignis" style={{ color: "inherit" }}>
                <div className="leise klein">{datum(v.x.datum)} · {finde(s.faelle, v.x.fall_id)?.titel}</div>
                <div>{v.x.einschaetzung || v.x.klientenangabe || "Sitzungseintrag"}</div>
                <div className="chips">
                  {v.x.methoden.map((m) => <span key={m} className="chip">{m}</span>)}
                  {v.x.risiko_stufe && v.x.risiko_stufe !== "keine" && <span className="chip rot">Risiko {v.x.risiko_stufe}</span>}
                </div>
              </Link>
            ) : (
              <Link key={v.t.id} to={`/termin/${v.t.id}`} className="ereignis termin leise" style={{ color: "inherit" }}>
                <div className="klein">{datum(v.t.beginn)} · Termin {TERMIN_STATUS[v.t.status]} · ohne Sitzungseintrag</div>
              </Link>
            ))}
          </div>
        )}

        <details className="abschnitt">
          <summary>Stammdaten</summary>
          <div className="inhalt">
            <dl className="kv">
              <dt>Anrede</dt><dd>{p.anrede === "du" ? "Du" : "Sie"}</dd>
              {p.namensvarianten.length > 0 && <><dt>Varianten</dt><dd>{p.namensvarianten.join(", ")}</dd></>}
              <dt>Geburtsdatum</dt><dd>{datum(p.geburtsdatum)}</dd>
              <dt>Anschrift</dt><dd>{[p.strasse, [p.plz, p.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "–"}</dd>
              <dt>Telefon</dt><dd>{p.telefon || "–"}</dd>
              <dt>E-Mail</dt><dd>{p.emails.join(", ") || "–"}</dd>
              <dt>Kontaktweg</dt><dd>{p.kontaktweg || "–"}</dd>
              <dt>Notfallkontakt</dt><dd>{p.notfallkontakt || "–"}</dd>
              <dt>Quelle</dt><dd>{p.quelle || "–"}</dd>
              {p.notiz && <><dt>Notiz</dt><dd>{p.notiz}</dd></>}
            </dl>
          </div>
        </details>
        <details className="abschnitt">
          <summary>Anamnese · Einwilligungen · Krisenplan · Dokumente</summary>
          <div className="inhalt leise">In der Datenbank angelegt, Eingabemasken folgen in Stufe 2 und 3.</div>
        </details>
      </main>
    </>
  );
}
