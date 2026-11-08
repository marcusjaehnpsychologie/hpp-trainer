// FANTASIEDATEN für den Demo-Modus. Keine echten Personen.
import type { Fall, Fallbeteiligung, Frist, Person, Sitzungseintrag, Termin, Einstellungen } from "./types";
import { isoTag } from "./format";

const id = () => crypto.randomUUID();

function person(p: Partial<Person> & Pick<Person, "vorname" | "nachname">): Person {
  return {
    id: id(), namensvarianten: [], geburtsdatum: null, strasse: null, plz: null, ort: null,
    telefon: null, emails: [], kontaktweg: "email", anrede: "sie", notfallkontakt: null,
    status: "aktiv", gesperrt_seit: null, sperrgrund: null, quelle: "online_buchung",
    drive_ordner_id: null, notiz: null, ...p,
  };
}
function fall(f: Partial<Fall> & Pick<Fall, "titel" | "setting">): Fall {
  return {
    id: id(), rechtsrahmen: "coaching", rechtsrahmen_seit: isoTag(), rechtsrahmen_begruendung: null,
    phase: 6, beginn: isoTag(), abschluss: null, abschlussgrund: null, anliegen: null, auftrag: null,
    honorar: 120, frequenz: "14-tägig", aktenzeichen: null, gericht: null, gutachter: null, anwalt: null,
    risiko_pflicht: false, ...f,
  };
}
function termin(t: Partial<Termin> & Pick<Termin, "beginn">): Termin {
  return {
    id: id(), fall_id: null, person_id: null, dauer_min: 50, ort: "praxis", status: "geplant",
    quelle: "online_buchung", abrechnungsstatus: "offen", notiz: null, ...t,
  };
}
function um(tage: number, h: number, m = 0) {
  const d = new Date(); d.setDate(d.getDate() + tage); d.setHours(h, m, 0, 0); return d.toISOString();
}
function tagIn(tage: number) { const d = new Date(); d.setDate(d.getDate() + tage); return isoTag(d); }

export function demoDaten() {
  const lena = person({ vorname: "Lena", nachname: "Beispiel", namensvarianten: ["Lene"], emails: ["lena.beispiel@example.org"], telefon: "0170 0000001" });
  const tom = person({ vorname: "Tom", nachname: "Muster", emails: ["tom.muster@example.org"], anrede: "du" });
  const mara = person({ vorname: "Mara", nachname: "Muster", emails: ["mara.muster@example.org"], anrede: "du" });
  const jonas = person({ vorname: "Jonas", nachname: "Probe", status: "anfrage", emails: ["jonas.probe@example.org"] });
  const sperre = person({ vorname: "Erika", nachname: "Gesperrt", status: "gesperrt", gesperrt_seit: tagIn(-20), emails: ["erika@example.org"] });

  const fLena = fall({ titel: "Lena B. – Emotionsregulation", setting: "borderline", risiko_pflicht: true, anliegen: "„Ich will nicht mehr so schnell explodieren.“" });
  const fPaar = fall({ titel: "Paar Muster", setting: "paar", anliegen: "Dauerstreit seit Geburt des Kindes" });
  const fJonas = fall({ titel: "Jonas P. – Erstanfrage", setting: "einzel", phase: 1 });

  const bet: Fallbeteiligung[] = [
    { id: id(), fall_id: fLena.id, person_id: lena.id, rolle: "klient", ist_klient: true },
    { id: id(), fall_id: fPaar.id, person_id: tom.id, rolle: "klient", ist_klient: true },
    { id: id(), fall_id: fPaar.id, person_id: mara.id, rolle: "partner", ist_klient: true },
    { id: id(), fall_id: fJonas.id, person_id: jonas.id, rolle: "klient", ist_klient: true },
  ];

  const tAlt = termin({ beginn: um(-7, 10), fall_id: fLena.id, person_id: lena.id, status: "stattgefunden" });
  const termine: Termin[] = [
    tAlt,
    termin({ beginn: um(0, 9), fall_id: fLena.id, person_id: lena.id }),
    termin({ beginn: um(0, 11), fall_id: fPaar.id, person_id: tom.id }),
    termin({ beginn: um(0, 15), fall_id: fJonas.id, person_id: jonas.id, ort: "online" }),
    termin({ beginn: um(2, 10), fall_id: fPaar.id, person_id: mara.id }),
    termin({ beginn: um(4, 9), person_id: sperre.id, notiz: "Online-Buchung einer gesperrten Person" }),
  ];

  const sitzungen: Sitzungseintrag[] = [{
    id: id(), termin_id: tAlt.id, fall_id: fLena.id, datum: tagIn(-7),
    klientenangabe: "Sie berichtet von einem Streit mit der Mutter am Wochenende.",
    beobachtung: "Zu Beginn angespannt, ab Minute 20 ruhiger.",
    einschaetzung: "Auslöser: Gefühl, nicht gehört zu werden. Skill Kaltreiz wirkte.",
    themen: ["Mutter", "Anspannung"], methoden: ["DBT-Skill", "Verhaltensanalyse"],
    risiko_erfragt: true, risiko_stufe: "keine", risiko_massnahme: null, dbt_ebene: 3,
    naechste_schritte: "Diary Card weiterführen, Skill „Gegenteil tun“ einführen.",
    vorbereitung_drive_id: null, transkript_drive_id: null,
  }];

  const fristen: Frist[] = [
    { id: id(), fall_id: fPaar.id, faellig: tagIn(5), text: "Einwilligung Aufzeichnung von Mara einholen", erledigt_am: null },
    { id: id(), fall_id: null, faellig: tagIn(30), text: "HP-Erlaubnis: Datum in Einstellungen eintragen", erledigt_am: null },
  ];

  const einstellungen: Einstellungen[] = [{
    id: id(), praxis_name: "Demo-Praxis", berufsbezeichnung: "Diplom-Psychologe", anschrift: null,
    telefon: null, email: null, website: null, heilkunde_erlaubnis_datum: null,
    heilkunde_erlaubnis_behoerde: null, heilkunde_erlaubnis_aktenzeichen: null,
    standard_sitzungsdauer: 50, zwischenbilanz_intervall: 10, loeschfrist_coaching_jahre: 3,
  }];

  return {
    person: [lena, tom, mara, jonas, sperre],
    fall: [fLena, fPaar, fJonas],
    fallbeteiligung: bet,
    termin: termine,
    sitzungseintrag: sitzungen,
    frist: fristen,
    praxis_einstellungen: einstellungen,
  };
}
