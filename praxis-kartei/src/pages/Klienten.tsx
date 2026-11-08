import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Auswahl, Bereich, Fehler, Initialen, Kopf, Leer, Text } from "../components/ui";
import { liste, name, normalisiereEmail } from "../lib/format";
import { store } from "../lib/store";
import { faelleVon, finde, flaggenPerson, useStamm } from "../lib/stamm";
import { PERSON_STATUS, SETTING } from "../lib/texte";
import type { Person, PersonStatus } from "../lib/types";

export function Klienten() {
  const { daten: s, fehler } = useStamm();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PersonStatus | "alle">("alle");
  const such = q.trim().toLowerCase();
  const treffer = (s?.personen ?? []).filter((p) => {
    if (status !== "alle" && p.status !== status) return false;
    if (!such) return true;
    const heu = [p.vorname, p.nachname, `${p.vorname} ${p.nachname}`, ...p.namensvarianten, ...p.emails, ...p.emails.map(normalisiereEmail), p.telefon ?? ""]
      .join(" ").toLowerCase();
    return heu.includes(such) || heu.includes(normalisiereEmail(such));
  });
  return (
    <>
      <Kopf titel="Klienten" rechts={<Link className="knopf klein" to="/person/neu">+ Person</Link>} />
      <main className="seite">
        <Fehler text={fehler} />
        <input className="suche" type="search" placeholder="Name, Variante, E-Mail, Telefon …" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips" style={{ margin: "8px 0 14px" }}>
          {(["alle", "anfrage", "aktiv", "ruhend", "abgeschlossen", "gesperrt"] as const).map((k) => (
            <button key={k} className={`chip ${status === k ? "" : "aus"}`} onClick={() => setStatus(k)}>
              {k === "alle" ? "alle" : PERSON_STATUS[k]}
            </button>
          ))}
        </div>
        {!s ? <Leer>Lädt …</Leer> : treffer.length === 0 ? <Leer>Keine Treffer.</Leer> : (
          <div className="liste">
            {treffer.map((p) => (
              <Link key={p.id} to={`/person/${p.id}`} className="zeile">
                <Initialen v={p.vorname} n={p.nachname} />
                <div className="mitte">
                  <b>{name(p)}</b>
                  <div className="chips">
                    <span className={`chip ${p.status === "gesperrt" ? "rot" : p.status === "aktiv" ? "" : "grau"}`}>{PERSON_STATUS[p.status]}</span>
                    {faelleVon(s, p.id).map(({ f }) => <span key={f.id} className="chip blau">{SETTING[f.setting]}</span>)}
                    {flaggenPerson(s, p).filter((f) => f.text !== "gesperrt").map((f, i) => <span key={i} className={`chip ${f.art}`}>{f.text}</span>)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

const LEER: Omit<Person, "id"> = {
  vorname: "", nachname: "", namensvarianten: [], geburtsdatum: null, strasse: null, plz: null, ort: null,
  telefon: null, emails: [], kontaktweg: "email", anrede: "sie", notfallkontakt: null, status: "anfrage",
  gesperrt_seit: null, sperrgrund: null, quelle: null, drive_ordner_id: null, notiz: null,
};

export function PersonBearbeiten() {
  const { id } = useParams();
  const nav = useNavigate();
  const { daten: s } = useStamm();
  const [p, setP] = useState<Omit<Person, "id"> | null>(null);
  const [emails, setEmails] = useState("");
  const [varianten, setVarianten] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    if (!s || p) return;
    const v = finde(s.personen, id);
    const start = v ?? LEER;
    setP(start); setEmails(start.emails.join(", ")); setVarianten(start.namensvarianten.join(", "));
  }, [s, id, p]);
  if (!s || !p) return <><Kopf titel="Person" zurueck /><main className="seite"><Leer>Lädt …</Leer></main></>;
  const setze = <K extends keyof Person>(k: K, v: Person[K]) => setP({ ...p, [k]: v });

  // Dublettenprüfung über normalisierte E-Mail
  const neueMails = liste(emails).map(normalisiereEmail);
  const dublette = s.personen.find((x) => x.id !== id && x.emails.map(normalisiereEmail).some((m) => neueMails.includes(m)));

  async function speichern(e: FormEvent) {
    e.preventDefault(); setFehler(null);
    const { id: _ignoriert, created_at: _c, updated_at: _u, ...rest } = p as Person;
    void _ignoriert; void _c; void _u;
    const daten: Partial<Person> = {
      ...rest, emails: liste(emails), namensvarianten: liste(varianten),
      geburtsdatum: p!.geburtsdatum || null,
      gesperrt_seit: p!.status === "gesperrt" ? (p!.gesperrt_seit || new Date().toISOString().slice(0, 10)) : p!.gesperrt_seit,
    };
    try {
      if (id) { await store.update("person", id, daten); nav(-1); }
      else { const neu = await store.insert("person", daten); nav(`/person/${neu.id}`, { replace: true }); }
    } catch (err) { setFehler((err as Error).message); }
  }

  return (
    <>
      <Kopf titel={id ? "Person bearbeiten" : "Neue Person"} zurueck />
      <main className="seite">
        <form className="formular" onSubmit={speichern} style={{ marginTop: 16 }}>
          <div className="zwei">
            <Text label="Vorname" wert={p.vorname} setze={(v) => setze("vorname", v)} pflicht />
            <Text label="Nachname" wert={p.nachname} setze={(v) => setze("nachname", v)} pflicht />
          </div>
          <Text label="Namensvarianten (Komma-getrennt, für Kalender/Plaud-Abgleich)" wert={varianten} setze={setVarianten} />
          <div className="zwei">
            <Auswahl label="Status" wert={p.status} setze={(v) => setze("status", v)} optionen={PERSON_STATUS} />
            <Auswahl label="Anrede" wert={p.anrede} setze={(v) => setze("anrede", v)} optionen={{ sie: "Sie", du: "Du" }} />
          </div>
          {p.status === "gesperrt" && <Text label="Sperrgrund (intern)" wert={p.sperrgrund} setze={(v) => setze("sperrgrund", v)} />}
          <Text label="E-Mail(s), Komma-getrennt" wert={emails} setze={setEmails} />
          {dublette && <div className="hinweis gelb">Gleiche E-Mail wie <Link to={`/person/${dublette.id}`}>{name(dublette)}</Link> – Dublette?</div>}
          <div className="zwei">
            <Text label="Telefon" typ="tel" wert={p.telefon} setze={(v) => setze("telefon", v)} />
            <Auswahl label="Kontaktweg" wert={p.kontaktweg ?? ""} leer="–" setze={(v) => setze("kontaktweg", (v || null) as Person["kontaktweg"])}
              optionen={{ email: "E-Mail", telefon: "Telefon", sms: "SMS", post: "Post" }} />
          </div>
          <Text label="Geburtsdatum" typ="date" wert={p.geburtsdatum} setze={(v) => setze("geburtsdatum", v)} />
          <Text label="Straße" wert={p.strasse} setze={(v) => setze("strasse", v)} />
          <div className="zwei">
            <Text label="PLZ" wert={p.plz} setze={(v) => setze("plz", v)} />
            <Text label="Ort" wert={p.ort} setze={(v) => setze("ort", v)} />
          </div>
          <Text label="Notfallkontakt" wert={p.notfallkontakt} setze={(v) => setze("notfallkontakt", v)} />
          <Auswahl label="Quelle" wert={p.quelle ?? ""} leer="–" setze={(v) => setze("quelle", (v || null) as Person["quelle"])}
            optionen={{ online_buchung: "Online-Buchung", email: "E-Mail", telefon: "Telefon", empfehlung: "Empfehlung", sonstige: "Sonstige" }} />
          <Text label="Drive-Ordner-ID" wert={p.drive_ordner_id} setze={(v) => setze("drive_ordner_id", v)} platzhalter="aus der Drive-Adresse …/folders/ID" />
          <Bereich label="Notiz (organisatorisch)" wert={p.notiz} setze={(v) => setze("notiz", v)} />
          <Fehler text={fehler} />
          <button className="knopf">Speichern</button>
        </form>
      </main>
    </>
  );
}
