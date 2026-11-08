const datumFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const tagFmt = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
const zeitFmt = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });

export const datum = (s: string | null | undefined) => (s ? datumFmt.format(new Date(s)) : "–");
export const tag = (s: string) => tagFmt.format(new Date(s));
export const zeit = (s: string) => zeitFmt.format(new Date(s));

/** ISO-Datum (YYYY-MM-DD) in lokaler Zeit */
export function isoTag(d: Date = new Date()): string {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function tageBis(s: string): number {
  const heute = new Date(isoTag());
  return Math.round((new Date(s).getTime() - heute.getTime()) / 86400000);
}

export const name = (p: { vorname: string; nachname: string } | undefined | null) =>
  p ? `${p.vorname} ${p.nachname}` : "–";

export function normalisiereEmail(e: string): string {
  let [lokal, domain = ""] = e.trim().toLowerCase().split("@");
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") lokal = lokal.split("+")[0].replace(/\./g, "");
  return `${lokal}@${domain}`;
}

/** Text für Freitextlisten: "a, b, c" ↔ ["a","b","c"] */
export const liste = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
