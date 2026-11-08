// Typen für die Tabellen, die Stufe 1 der App nutzt.
// Die Datenbank enthält bereits alle Tabellen (siehe supabase/migrations).

export interface Basis {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export type PersonStatus = "anfrage" | "aktiv" | "ruhend" | "abgeschlossen" | "gesperrt";

export interface Person extends Basis {
  vorname: string;
  nachname: string;
  namensvarianten: string[];
  geburtsdatum: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  telefon: string | null;
  emails: string[];
  kontaktweg: "email" | "telefon" | "sms" | "post" | null;
  anrede: "du" | "sie";
  notfallkontakt: string | null;
  status: PersonStatus;
  gesperrt_seit: string | null;
  sperrgrund: string | null;
  quelle: "online_buchung" | "email" | "telefon" | "empfehlung" | "sonstige" | null;
  drive_ordner_id: string | null;
  notiz: string | null;
}

export type Setting =
  | "einzel" | "paar" | "mediation" | "elterncoaching" | "trennung"
  | "borderline" | "trauma" | "gutachten_begleitung" | "supervision" | "sonstiges";

export interface Fall extends Basis {
  titel: string;
  setting: Setting;
  rechtsrahmen: "coaching" | "heilkunde";
  rechtsrahmen_seit: string;
  rechtsrahmen_begruendung: string | null;
  phase: number;
  beginn: string | null;
  abschluss: string | null;
  abschlussgrund: string | null;
  anliegen: string | null;
  auftrag: string | null;
  honorar: number | null;
  frequenz: string | null;
  aktenzeichen: string | null;
  gericht: string | null;
  gutachter: string | null;
  anwalt: string | null;
  risiko_pflicht: boolean;
}

export type Rolle =
  | "klient" | "partner" | "elternteil" | "kind_erwaehnt"
  | "anwalt" | "gutachter" | "zuweiser" | "sonstige";

export interface Fallbeteiligung extends Basis {
  fall_id: string;
  person_id: string;
  rolle: Rolle;
  ist_klient: boolean;
}

export type TerminStatus =
  | "geplant" | "stattgefunden" | "abgesagt" | "kurzfristig_abgesagt" | "nicht_erschienen";

export interface Termin extends Basis {
  fall_id: string | null;
  person_id: string | null;
  beginn: string;
  dauer_min: number;
  ort: "praxis" | "online" | "telefon" | "sonstiges";
  status: TerminStatus;
  quelle: "manuell" | "online_buchung" | "kalender";
  abrechnungsstatus: "offen" | "uebergeben" | "abgerechnet" | "nicht_abrechenbar";
  notiz: string | null;
}

export interface Sitzungseintrag extends Basis {
  termin_id: string | null;
  fall_id: string;
  datum: string;
  klientenangabe: string | null;
  beobachtung: string | null;
  einschaetzung: string | null;
  themen: string[];
  methoden: string[];
  risiko_erfragt: boolean | null;
  risiko_stufe: "keine" | "latent" | "akut" | null;
  risiko_massnahme: string | null;
  dbt_ebene: number | null;
  naechste_schritte: string | null;
  vorbereitung_drive_id: string | null;
  transkript_drive_id: string | null;
}

export interface Frist extends Basis {
  fall_id: string | null;
  faellig: string;
  text: string;
  erledigt_am: string | null;
}

export interface Einstellungen extends Basis {
  praxis_name: string | null;
  berufsbezeichnung: string | null;
  anschrift: string | null;
  telefon: string | null;
  email: string | null;
  website: string | null;
  heilkunde_erlaubnis_datum: string | null;
  heilkunde_erlaubnis_behoerde: string | null;
  heilkunde_erlaubnis_aktenzeichen: string | null;
  standard_sitzungsdauer: number;
  zwischenbilanz_intervall: number;
  loeschfrist_coaching_jahre: number;
}

export interface TabellenTypen {
  person: Person;
  fall: Fall;
  fallbeteiligung: Fallbeteiligung;
  termin: Termin;
  sitzungseintrag: Sitzungseintrag;
  frist: Frist;
  praxis_einstellungen: Einstellungen;
}
export type Tabelle = keyof TabellenTypen;
