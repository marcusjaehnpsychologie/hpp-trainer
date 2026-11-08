// Prüft das Datenbankschema lokal mit PGlite (Postgres im Prozess), ohne Supabase.
// Aufruf: npm run test:schema
// Simuliert die Supabase-Funktionen auth.uid() und auth.jwt().
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const db = new PGlite();
const OWNER = "11111111-1111-1111-1111-111111111111";
const FREMD = "22222222-2222-2222-2222-222222222222";
let fehler = 0;

async function ok(name, sql) {
  try { await db.exec(sql); console.log("  ✓", name); }
  catch (e) { fehler++; console.log("  ✗", name, "→", e.message); }
}
async function scheitert(name, sql, erwartet) {
  try { await db.exec(sql); fehler++; console.log("  ✗", name, "→ hätte scheitern müssen"); }
  catch (e) {
    if (erwartet && !e.message.includes(erwartet)) { fehler++; console.log("  ✗", name, "→ falscher Fehler:", e.message); }
    else console.log("  ✓", name, "(abgelehnt:", e.message.split("\n")[0] + ")");
  }
}
const als = (uid, aal) => `select set_config('test.uid','${uid}',false), set_config('test.aal','${aal}',false);`;

// --- Supabase-Umgebung nachbilden ---
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key, email text, created_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('aal', current_setting('test.aal', true)) $$;
  create role authenticated;
  insert into auth.users(id,email) values ('${OWNER}','marcus@example.org'),('${FREMD}','fremd@example.org');
`);

console.log("Migration 0001");
await ok("Grundschema", readFileSync(new URL("../supabase/migrations/0001_grundschema.sql", import.meta.url), "utf8"));
await db.exec(`grant usage on schema public, auth to authenticated;
  grant all on all tables in schema public to authenticated;
  grant all on all sequences in schema public to authenticated;
  grant select on auth.users to authenticated;`);
console.log("Migration 0002");
await ok("Testverfahren-Katalog", readFileSync(new URL("../supabase/migrations/0002_testverfahren_katalog.sql", import.meta.url), "utf8"));

await db.exec(`set role authenticated;`);

console.log("Zugriffsrechte");
await db.exec(als(OWNER, "aal2"));
await ok("Eigentümer mit 2FA legt Person an",
  `insert into person(id,vorname,nachname,emails,status) values ('aaaaaaaa-0000-0000-0000-000000000001','Anna','Test',array['A.Test@GoogleMail.com'],'aktiv');`);
const norm = await db.query(`select emails_normalisiert from person`);
console.log("  ✓ E-Mail normalisiert:", norm.rows[0].emails_normalisiert);
await db.exec(als(OWNER, "aal1"));
const ohne2fa = await db.query(`select count(*)::int n from person`);
if (ohne2fa.rows[0].n !== 0) { fehler++; console.log("  ✗ ohne 2FA sichtbar"); } else console.log("  ✓ ohne 2FA keine Daten sichtbar");
await db.exec(als(FREMD, "aal2"));
const fremd = await db.query(`select count(*)::int n from person`);
if (fremd.rows[0].n !== 0) { fehler++; console.log("  ✗ fremder Nutzer sieht Daten"); } else console.log("  ✓ fremder Nutzer sieht keine Daten");
await db.exec(als(OWNER, "aal2"));
const kat = await db.query(`select count(*)::int n from testverfahren`);
console.log(kat.rows[0].n === 6 ? "  ✓ 6 Testverfahren im Katalog" : (fehler++, "  ✗ Katalog: " + kat.rows[0].n));

console.log("Diagnose-Regeln");
await ok("Einstellungen ohne Erlaubnis", `insert into praxis_einstellungen(praxis_name) values ('Test');`);
await ok("Coaching-Fall + Beteiligung", `
  insert into fall(id,titel,setting) values ('bbbbbbbb-0000-0000-0000-000000000001','Coaching','einzel');
  insert into fallbeteiligung(fall_id,person_id,rolle) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','klient');`);
await scheitert("Diagnose ohne Erlaubnis",
  `insert into diagnose(fall_id,person_id,icd10_code,sicherheit) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','F60.31','V');`,
  "Heilkunde-Erlaubnis");
await db.exec(`update praxis_einstellungen set heilkunde_erlaubnis_datum = '2027-01-15';`);
await scheitert("Diagnose vor Erlaubnisdatum",
  `insert into diagnose(fall_id,person_id,icd10_code,sicherheit,gestellt_am) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','F60.31','V','2026-12-01');`,
  "vor dem Datum");
await scheitert("Diagnose im Coaching-Fall",
  `insert into diagnose(fall_id,person_id,icd10_code,sicherheit,gestellt_am) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','F60.31','V','2027-02-01');`,
  "Coaching-Fälle");
await ok("Heilkunde-Fall", `
  insert into person(id,vorname,nachname) values ('aaaaaaaa-0000-0000-0000-000000000002','Ex','Partner');
  insert into fall(id,titel,setting,rechtsrahmen) values ('bbbbbbbb-0000-0000-0000-000000000002','Heilkunde','borderline','heilkunde');
  insert into fallbeteiligung(fall_id,person_id,rolle) values ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','klient');
  insert into fallbeteiligung(fall_id,person_id,rolle,ist_klient) values ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','partner',false);`);
await scheitert("Diagnose für nicht untersuchte Person",
  `insert into diagnose(fall_id,person_id,icd10_code,sicherheit,gestellt_am) values ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','F60.8','V','2027-02-01');`,
  "selbst Klient");
await scheitert("6D11.5 ohne 6D10",
  `insert into diagnose(fall_id,person_id,icd10_code,sicherheit,gestellt_am,icd11_codes) values ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','F60.31','V','2027-02-01',array['6D11.5']);`,
  "6D11");
await scheitert("6D10 ohne Schweregrad",
  `insert into diagnose(fall_id,person_id,icd10_code,sicherheit,gestellt_am,icd11_codes) values ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','F60.31','V','2027-02-01',array['6D10','6D11.5']);`,
  "Schweregrad");
await scheitert("Gesichert nur auf Screening-Basis",
  `insert into diagnose(fall_id,person_id,icd10_code,sicherheit,gestellt_am,nur_screening_basis) values ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','F84.5','G','2027-02-01',true);`,
  "allein");
await ok("Gültige Diagnose F60.31 G · 6D10 mittelgradig + 6D11.5",
  `insert into diagnose(fall_id,person_id,icd10_code,sicherheit,gestellt_am,icd11_codes,icd11_schweregrad) values ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','F60.31','G','2027-02-01',array['6D10','6D11.5'],'mittelgradig');`);

console.log("Weitere Tabellen");
await ok("Termin + Sitzung + Diary + Kontaktbilanz", `
  insert into termin(id,fall_id,person_id,beginn,status) values ('cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001',now(),'stattgefunden');
  insert into sitzungseintrag(termin_id,fall_id,klientenangabe,risiko_erfragt,risiko_stufe) values ('cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','Test',true,'keine');
  insert into diary_eintrag(fall_id,datum,anspannung,draenge) values ('bbbbbbbb-0000-0000-0000-000000000002',current_date,70,'{"Selbstverletzung":{"wert":3,"aufgetreten":false}}');
  select * from kontaktbilanz;`);
const prot = await db.query(`select tabelle, aktion, geaenderte_felder from aenderungsprotokoll where aktion='geaendert' limit 1`);
console.log("  ✓ Protokoll:", JSON.stringify(prot.rows[0]));

console.log(fehler ? `\n${fehler} FEHLER` : "\nAlle Prüfungen bestanden.");
process.exit(fehler ? 1 : 0);
