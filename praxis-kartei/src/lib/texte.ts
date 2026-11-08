import type { PersonStatus, Rolle, Setting, TerminStatus } from "./types";

export const SETTING: Record<Setting, string> = {
  einzel: "Einzel / Persönlichkeitsentwicklung",
  paar: "Paar",
  mediation: "Mediation",
  elterncoaching: "Elterncoaching",
  trennung: "Trennung",
  borderline: "Borderline / DBT",
  trauma: "Trauma (NET/EMDR)",
  gutachten_begleitung: "Gutachten-Begleitung",
  supervision: "Supervision",
  sonstiges: "Sonstiges",
};

export const PERSON_STATUS: Record<PersonStatus, string> = {
  anfrage: "Anfrage",
  aktiv: "aktiv",
  ruhend: "ruhend",
  abgeschlossen: "abgeschlossen",
  gesperrt: "gesperrt",
};

export const ROLLE: Record<Rolle, string> = {
  klient: "Klient/in",
  partner: "Partner/in",
  elternteil: "Elternteil",
  kind_erwaehnt: "Kind (erwähnt)",
  anwalt: "Anwalt/Anwältin",
  gutachter: "Gutachter/in",
  zuweiser: "Zuweiser/in",
  sonstige: "Sonstige",
};

export const TERMIN_STATUS: Record<TerminStatus, string> = {
  geplant: "geplant",
  stattgefunden: "stattgefunden",
  abgesagt: "abgesagt",
  kurzfristig_abgesagt: "kurzfristig abgesagt",
  nicht_erschienen: "nicht erschienen",
};

export const PHASE: Record<number, string> = {
  1: "Anfrage",
  2: "Erstgespräch",
  3: "Aufnahme",
  4: "Diagnostik / Einschätzung",
  5: "Planung",
  6: "Laufende Arbeit",
  7: "Zwischenbilanz",
  8: "Abschluss",
  9: "Nachsorge / ruhend",
};

export const METHODEN = [
  "NET", "EMDR", "DBT-Skill", "Stabilisierung", "U.M.W.E.G.©", "TA",
  "Systemisch", "Psychoedukation", "Verhaltensanalyse", "Imagination", "Mentalisierung",
];

export const DBT_EBENE: Record<number, string> = {
  1: "1 · suizidales / selbstverletzendes Verhalten",
  2: "2 · therapiegefährdendes Verhalten",
  3: "3 · Lebensqualität",
  4: "4 · Skills-Aufbau",
};

/** Settings, bei denen das Risikofeld standardmäßig Pflicht ist */
export const RISIKO_SETTINGS: Setting[] = ["borderline", "trauma"];
