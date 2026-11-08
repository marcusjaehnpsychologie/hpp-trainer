-- =====================================================================
-- Praxis-Kartei – Grundschema (v0.1)
-- Ausführen im Supabase-Dashboard: SQL Editor → New query → einfügen → Run
-- Region des Projekts: Frankfurt (eu-central-1)
--
-- Sicherheitsprinzip:
--   * Jede Zeile gehört genau einem Nutzer (owner_id).
--   * Zugriff nur für den Eigentümer UND nur mit zweitem Faktor (aal2).
--   * Sensible Freitexte stehen in eigenen Spalten, damit sie später
--     verschlüsselt werden können.
-- =====================================================================

-- gen_random_uuid() ist ab Postgres 13 eingebaut (Supabase: Postgres 15+)

-- ---------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------

-- Zugriff nur für den Eigentümer mit Zwei-Faktor-Anmeldung
create or replace function public.ist_eigentuemer(owner uuid)
returns boolean language sql stable as $$
  select owner = auth.uid()
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function public.setze_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- E-Mail normalisieren: klein, googlemail = gmail, Punkte im Gmail-Lokalteil ignorieren
create or replace function public.normalisiere_email(e text)
returns text language plpgsql immutable as $$
declare lokal text; domain text;
begin
  if e is null then return null; end if;
  e := lower(trim(e));
  lokal := split_part(e, '@', 1);
  domain := split_part(e, '@', 2);
  if domain = 'googlemail.com' then domain := 'gmail.com'; end if;
  if domain = 'gmail.com' then
    lokal := replace(split_part(lokal, '+', 1), '.', '');
  end if;
  return lokal || '@' || domain;
end $$;

-- ---------------------------------------------------------------------
-- Makro: Standardspalten + RLS + Trigger für eine Tabelle
-- ---------------------------------------------------------------------
create or replace function public.richte_tabelle_ein(t text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', t);
  execute format('drop policy if exists eigentuemer on public.%I', t);
  execute format(
    'create policy eigentuemer on public.%I for all
       using (public.ist_eigentuemer(owner_id))
       with check (public.ist_eigentuemer(owner_id))', t);
  execute format('drop trigger if exists t_updated on public.%I', t);
  execute format(
    'create trigger t_updated before update on public.%I
       for each row execute function public.setze_updated_at()', t);
  execute format('drop trigger if exists t_protokoll on public.%I', t);
  execute format(
    'create trigger t_protokoll after insert or update or delete on public.%I
       for each row execute function public.protokolliere()', t);
end $$;

-- ---------------------------------------------------------------------
-- Änderungsprotokoll (speichert nur WELCHE Felder geändert wurden,
-- keine Inhalte – sonst würden sensible Daten verdoppelt)
-- ---------------------------------------------------------------------
create table if not exists public.aenderungsprotokoll (
  id bigserial primary key,
  owner_id uuid not null default auth.uid(),
  zeitpunkt timestamptz not null default now(),
  tabelle text not null,
  datensatz_id uuid,
  aktion text not null,
  geaenderte_felder text[]
);
alter table public.aenderungsprotokoll enable row level security;
drop policy if exists lesen on public.aenderungsprotokoll;
create policy lesen on public.aenderungsprotokoll for select using (public.ist_eigentuemer(owner_id));

create or replace function public.protokolliere()
returns trigger language plpgsql security definer set search_path = public as $$
declare felder text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(n.key) into felder
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o using (key)
     where n.value is distinct from o.value and n.key <> 'updated_at';
    insert into aenderungsprotokoll(owner_id, tabelle, datensatz_id, aktion, geaenderte_felder)
    values (new.owner_id, tg_table_name, new.id, 'geaendert', felder);
    return new;
  elsif tg_op = 'INSERT' then
    insert into aenderungsprotokoll(owner_id, tabelle, datensatz_id, aktion)
    values (new.owner_id, tg_table_name, new.id, 'angelegt');
    return new;
  else
    insert into aenderungsprotokoll(owner_id, tabelle, datensatz_id, aktion)
    values (old.owner_id, tg_table_name, old.id, 'geloescht');
    return old;
  end if;
end $$;

-- =====================================================================
-- KERN
-- =====================================================================

create table if not exists public.praxis_einstellungen (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  praxis_name text,
  berufsbezeichnung text default 'Diplom-Psychologe',
  anschrift text,
  telefon text,
  email text,
  website text,
  -- Heilkunde-Erlaubnis: solange leer, ist das Diagnosemodul gesperrt
  heilkunde_erlaubnis_datum date,
  heilkunde_erlaubnis_behoerde text,
  heilkunde_erlaubnis_aktenzeichen text,
  standard_sitzungsdauer int not null default 50,
  zwischenbilanz_intervall int not null default 10,
  loeschfrist_coaching_jahre int not null default 3
);

create table if not exists public.person (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vorname text not null,
  nachname text not null,
  namensvarianten text[] not null default '{}',
  geburtsdatum date,
  strasse text,
  plz text,
  ort text,
  telefon text,
  emails text[] not null default '{}',
  emails_normalisiert text[] not null default '{}',
  kontaktweg text check (kontaktweg in ('email','telefon','sms','post')),
  anrede text not null default 'sie' check (anrede in ('du','sie')),
  notfallkontakt text,
  status text not null default 'anfrage'
    check (status in ('anfrage','aktiv','ruhend','abgeschlossen','gesperrt')),
  gesperrt_seit date,
  sperrgrund text,
  quelle text check (quelle in ('online_buchung','email','telefon','empfehlung','sonstige')),
  drive_ordner_id text,
  sevdesk_contact_id text,
  notiz text
);
create index if not exists person_name_idx on public.person (owner_id, nachname, vorname);
create index if not exists person_email_idx on public.person using gin (emails_normalisiert);

create or replace function public.person_vor_speichern()
returns trigger language plpgsql as $$
begin
  new.emails_normalisiert := coalesce(
    (select array_agg(public.normalisiere_email(e)) from unnest(new.emails) e), '{}');
  if new.status = 'gesperrt' and new.gesperrt_seit is null then
    new.gesperrt_seit := current_date;
  end if;
  return new;
end $$;
drop trigger if exists t_person_vor on public.person;
create trigger t_person_vor before insert or update on public.person
  for each row execute function public.person_vor_speichern();

create table if not exists public.fall (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  titel text not null,
  setting text not null check (setting in (
    'einzel','paar','mediation','elterncoaching','trennung',
    'borderline','trauma','gutachten_begleitung','supervision','sonstiges')),
  rechtsrahmen text not null default 'coaching' check (rechtsrahmen in ('coaching','heilkunde')),
  rechtsrahmen_seit date not null default current_date,
  rechtsrahmen_begruendung text,
  phase int not null default 1 check (phase between 1 and 9),
  beginn date default current_date,
  abschluss date,
  abschlussgrund text,
  anliegen text,
  auftrag text,
  honorar numeric(8,2),
  frequenz text,
  absageregel text,
  kontrakt_datum date,
  -- Gutachten-Begleitung
  aktenzeichen text,
  gericht text,
  gutachter text,
  anwalt text,
  -- Abrechnung (sevDesk später)
  rechnungsempfaenger text,
  -- Risiko-Pflichtfeld in Sitzungen (Standard bei Borderline/Trauma)
  risiko_pflicht boolean not null default false,
  loeschdatum date
);

create table if not exists public.fallbeteiligung (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  person_id uuid not null references public.person(id) on delete restrict,
  rolle text not null check (rolle in (
    'klient','partner','elternteil','kind_erwaehnt','anwalt','gutachter','zuweiser','sonstige')),
  -- nur für Personen, die selbst Klient/in sind, dürfen Diagnosen gestellt werden
  ist_klient boolean not null default true,
  unique (fall_id, person_id)
);

create table if not exists public.termin (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid references public.fall(id) on delete set null,
  person_id uuid references public.person(id) on delete set null,
  beginn timestamptz not null,
  dauer_min int not null default 50,
  ort text not null default 'praxis' check (ort in ('praxis','online','telefon','sonstiges')),
  status text not null default 'geplant' check (status in (
    'geplant','stattgefunden','abgesagt','kurzfristig_abgesagt','nicht_erschienen')),
  quelle text not null default 'manuell' check (quelle in ('manuell','online_buchung','kalender')),
  kalender_event_id text,
  abrechnungsstatus text not null default 'offen'
    check (abrechnungsstatus in ('offen','uebergeben','abgerechnet','nicht_abrechenbar')),
  sevdesk_invoice_id text,
  notiz text
);
create index if not exists termin_beginn_idx on public.termin (owner_id, beginn);

create table if not exists public.termin_teilnehmer (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  termin_id uuid not null references public.termin(id) on delete cascade,
  person_id uuid not null references public.person(id) on delete cascade,
  unique (termin_id, person_id)
);

create table if not exists public.sitzungseintrag (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  termin_id uuid unique references public.termin(id) on delete set null,
  fall_id uuid not null references public.fall(id) on delete cascade,
  datum date not null default current_date,
  -- drei getrennte Ebenen (sensibel)
  klientenangabe text,
  beobachtung text,
  einschaetzung text,
  themen text[] not null default '{}',
  methoden text[] not null default '{}',
  -- Risiko (sensibel)
  risiko_erfragt boolean,
  risiko_stufe text check (risiko_stufe in ('keine','latent','akut')),
  risiko_massnahme text,
  dbt_ebene int check (dbt_ebene between 1 and 4),
  naechste_schritte text,
  vorbereitung_drive_id text,
  transkript_drive_id text
);

create table if not exists public.hausaufgabe (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  sitzung_id uuid references public.sitzungseintrag(id) on delete set null,
  text text not null,
  vergeben_am date not null default current_date,
  besprechen_am date,
  ergebnis text not null default 'offen' check (ergebnis in ('offen','erledigt','teilweise','nicht'))
);

create table if not exists public.anamnese (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  person_id uuid not null references public.person(id) on delete cascade,
  version int not null default 1,
  stand date not null default current_date,
  biografie text, familie text, partnerschaft text, beruf text,
  vorbehandlungen text, medikation text, koerperlich text, substanzen text,
  ressourcen text, suizidversuche_vorgeschichte text,
  unique (person_id, version)
);

create table if not exists public.einwilligung (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  person_id uuid not null references public.person(id) on delete cascade,
  fall_id uuid references public.fall(id) on delete set null,
  typ text not null check (typ in (
    'datenschutz','aufzeichnung','schweigepflichtentbindung','online_sitzung',
    'kontakt_email','kontakt_sms','kind_sorgeberechtigte','diagnose_auf_rechnung','sonstige')),
  empfaenger text,
  textversion text,
  erteilt_am date not null default current_date,
  widerrufen_am date,
  dokument_drive_id text
);

create table if not exists public.ziel (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  formulierung text not null,
  messkriterium text,
  ausgangswert text,
  stand text,
  status text not null default 'offen' check (status in ('offen','teilweise','erreicht','verworfen'))
);

create table if not exists public.arbeitshypothese (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  person_id uuid references public.person(id) on delete cascade,
  art text not null check (art in ('struktur_kernberg','opd','thema','sonstige')),
  -- Kernberg: ORGANISATIONSNIVEAU, keine Diagnose
  kernberg_niveau text check (kernberg_niveau in ('neurotisch','borderline','psychotisch')),
  opd_niveau text,
  thema text,
  beleg text,
  revisionskriterium text,
  gueltig_ab date not null default current_date,
  gueltig_bis date
);

create table if not exists public.krisenplan (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null unique references public.fall(id) on delete cascade,
  fruehwarnzeichen text, ausloeser text, skills text, personen text,
  notfallnummern text not null default
    'Notruf 112 · Ärztlicher Bereitschaftsdienst 116 117 · Telefonseelsorge 0800 111 0 111',
  abmachungen text,
  stand date not null default current_date
);

create table if not exists public.dokument (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid references public.fall(id) on delete cascade,
  person_id uuid references public.person(id) on delete cascade,
  typ text not null check (typ in (
    'bericht','vorbereitung','gutachten','schriftsatz','scan','transkript','testbogen','sonstiges')),
  datum date not null default current_date,
  titel text not null,
  drive_id text
);

create table if not exists public.frist (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid references public.fall(id) on delete cascade,
  faellig date not null,
  text text not null,
  erledigt_am date
);

-- =====================================================================
-- DIAGNOSEN (gesperrt bis Heilkunde-Erlaubnis)
-- =====================================================================

create table if not exists public.icd_katalog (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  system text not null check (system in ('ICD-10-GM','ICD-11')),
  version text not null,
  code text not null,
  titel text not null,
  ist_zusatz boolean not null default false,
  aktiv boolean not null default true,
  unique (owner_id, system, version, code)
);

create table if not exists public.icd_mapping (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  icd10_code text not null,
  icd11_codes text[] not null default '{}',
  art text not null check (art in (
    'gleichwertig','eins_zu_n','n_zu_eins','teilueberschneidung','keine_entsprechung')),
  braucht text,
  quelle text not null,
  hinweis text
);

create table if not exists public.diagnose (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  person_id uuid not null references public.person(id) on delete cascade,
  rang text not null default 'haupt' check (rang in ('haupt','neben')),
  icd10_code text not null,
  sicherheit text not null check (sicherheit in ('G','V','Z','A')),
  icd11_codes text[] not null default '{}',
  icd11_schweregrad text check (icd11_schweregrad in ('leicht','mittelgradig','schwer','nnb')),
  mapping_status text check (mapping_status in ('automatisch','angepasst','keine_entsprechung')),
  kriterien jsonb not null default '{}',
  grundlage text,
  begruendung text,
  nur_screening_basis boolean not null default false,
  gestellt_am date not null default current_date,
  ueberprueft_am date,
  beendet_am date,
  wiedervorlage date,
  auf_rechnung_erlaubt boolean not null default false,
  vorgaenger_id uuid references public.diagnose(id)
);

-- Fachliche Regeln, die die Datenbank selbst erzwingt
create or replace function public.pruefe_diagnose()
returns trigger language plpgsql as $$
declare erlaubnis date; rahmen text; klient boolean;
begin
  select heilkunde_erlaubnis_datum into erlaubnis
    from public.praxis_einstellungen where owner_id = new.owner_id;
  if erlaubnis is null then
    raise exception 'Diagnosen sind erst nach Eintrag der Heilkunde-Erlaubnis möglich.';
  end if;
  if new.gestellt_am < erlaubnis then
    raise exception 'Diagnosedatum liegt vor dem Datum der Heilkunde-Erlaubnis.';
  end if;
  select rechtsrahmen into rahmen from public.fall where id = new.fall_id;
  if rahmen <> 'heilkunde' then
    raise exception 'Coaching-Fälle haben keine Diagnosen – nur Arbeitshypothesen.';
  end if;
  select ist_klient into klient from public.fallbeteiligung
   where fall_id = new.fall_id and person_id = new.person_id;
  if klient is distinct from true then
    raise exception 'Diagnosen nur für Personen, die selbst Klient/in im Fall sind.';
  end if;
  if new.nur_screening_basis and new.sicherheit = 'G' then
    raise exception 'Dieses Verfahren allein ergibt keine gesicherte Diagnose (höchstens V).';
  end if;
  if exists (select 1 from unnest(new.icd11_codes) c where c like '6D11%')
     and not exists (select 1 from unnest(new.icd11_codes) c where c like '6D10%' or c = 'QE50.7') then
    raise exception '6D11.x ist nur zusammen mit 6D10 oder QE50.7 zulässig.';
  end if;
  if exists (select 1 from unnest(new.icd11_codes) c where c = '6D10')
     and new.icd11_schweregrad is null then
    raise exception 'ICD-11 6D10 verlangt einen Schweregrad (oder „nnb“).';
  end if;
  return new;
end $$;
drop trigger if exists t_diagnose_pruefen on public.diagnose;
create trigger t_diagnose_pruefen before insert or update on public.diagnose
  for each row execute function public.pruefe_diagnose();

-- =====================================================================
-- TESTVERFAHREN (nur Ergebnisse – keine Items, keine Normtabellen)
-- =====================================================================

create table if not exists public.testverfahren (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kuerzel text not null,
  name text not null,
  autoren text,
  verlag text,
  version text,
  lizenz text not null default 'ungeklaert'
    check (lizenz in ('papier','verlagssystem','frei','ungeklaert')),
  -- selbst = Selbstbeurteilung · fremd = Fremdurteil (z. B. Eltern über Kind) · beobachtung = Untersucher (z. B. ADOS-2)
  urteilsart text not null check (urteilsart in ('selbst','fremd','beobachtung')),
  beurteilt text not null default 'klient' check (beurteilt in ('klient','kind','paar')),
  altersbereich text,
  klinisch boolean not null default false,
  -- Ergebnis allein reicht nicht für eine gesicherte Diagnose (Screenings, aber auch ADOS-2 ohne Anamnese/ADI-R)
  allein_nicht_diagnostisch boolean not null default false,
  schulung_erforderlich boolean not null default false,
  angaben_klaeren boolean not null default false,
  notiz text,
  unique (owner_id, kuerzel)
);

create table if not exists public.testskala (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  testverfahren_id uuid not null references public.testverfahren(id) on delete cascade,
  reihenfolge int not null default 0,
  name text not null,
  normtyp text not null default 'rohwert'
    check (normtyp in ('t_wert','stanine','prozentrang','rohwert','sonstige')),
  wert_min numeric,
  wert_max numeric,
  auffaellig_ab numeric,
  auffaellig_richtung text check (auffaellig_richtung in ('hoch','niedrig'))
);

create table if not exists public.messung (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  testverfahren_id uuid not null references public.testverfahren(id) on delete restrict,
  beurteilte_person_id uuid not null references public.person(id) on delete cascade,
  beurteilende_person_id uuid references public.person(id) on delete set null,
  datum date not null default current_date,
  zeitpunkt text not null default 'einmalig' check (zeitpunkt in ('prae','verlauf','post','einmalig')),
  durchfuehrung text check (durchfuehrung in ('papier','verlagssystem')),
  testversion text not null,
  normstichprobe text not null,
  validitaetshinweise text,
  ergebnis text, einordnung text, grenzen text,
  scan_drive_id text,
  einwilligung_id uuid references public.einwilligung(id)
);

create table if not exists public.messwert (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  messung_id uuid not null references public.messung(id) on delete cascade,
  testskala_id uuid not null references public.testskala(id) on delete restrict,
  rohwert numeric,
  normwert numeric,
  unique (messung_id, testskala_id)
);

-- =====================================================================
-- MODUL BORDERLINE – Diary Card
-- =====================================================================

create table if not exists public.diary_vorlage (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null unique references public.fall(id) on delete cascade,
  variante text not null default 'wochenprotokoll' check (variante in ('dbt','wochenprotokoll')),
  anspannung_max int not null default 100,
  draenge text[] not null default '{}',
  gefuehle text[] not null default '{Scham,Wut,Angst,Traurigkeit,Leere}',
  skills text[] not null default '{}'
);

create table if not exists public.diary_eintrag (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  datum date not null,
  anspannung int,
  draenge jsonb not null default '{}',   -- {"Selbstverletzung": {"wert": 3, "aufgetreten": false}}
  gefuehle jsonb not null default '{}',  -- {"Scham": 4}
  skills jsonb not null default '{}',    -- {"Kaltreiz": 4}
  bemerkung text,
  erfasst_von text not null default 'marcus' check (erfasst_von in ('marcus','klient')),
  erfasst_am timestamptz not null default now(),
  unique (fall_id, datum)
);

-- =====================================================================
-- MODUL TRAUMA
-- =====================================================================

create table if not exists public.trauma_status (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null unique references public.fall(id) on delete cascade,
  phase text not null default 'stabilisierung'
    check (phase in ('stabilisierung','verarbeitung','integration')),
  phase_seit date not null default current_date,
  phase_begruendung text,
  sicherer_ort text, tresor text, innere_helfer text, notfallkoffer text,
  dissoziation_auspraegung text, dissoziation_warnzeichen text, grounding text,
  net_lebenslinie_drive_id text
);

create table if not exists public.trauma_ereignis (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  stichwort text not null,           -- keine Detailschilderung
  art text,
  alter_jahre int,
  typ text check (typ in ('I','II')),
  taeterbezug boolean
);

create table if not exists public.emdr_ziel (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fall_id uuid not null references public.fall(id) on delete cascade,
  ausgangsbild text not null,        -- Stichworte
  negative_kognition text,
  positive_kognition text,
  voc_start int check (voc_start between 1 and 7),
  voc_ende int check (voc_ende between 1 and 7),
  sud_start int check (sud_start between 0 and 10),
  sud_ende int check (sud_ende between 0 and 10),
  koerper text,
  status text not null default 'offen' check (status in ('offen','in_bearbeitung','abgeschlossen'))
);

-- =====================================================================
-- RLS, updated_at und Protokoll für alle Tabellen einrichten
-- =====================================================================
select public.richte_tabelle_ein(t) from unnest(array[
  'praxis_einstellungen','person','fall','fallbeteiligung','termin','termin_teilnehmer',
  'sitzungseintrag','hausaufgabe','anamnese','einwilligung','ziel','arbeitshypothese',
  'krisenplan','dokument','frist','icd_katalog','icd_mapping','diagnose',
  'testverfahren','testskala','messung','messwert','diary_vorlage','diary_eintrag',
  'trauma_status','trauma_ereignis','emdr_ziel'
]) t;

-- =====================================================================
-- Sicht: Kontaktbilanz (Einzeltermine je Person in Paar-/Mediationsfällen)
-- =====================================================================
create or replace view public.kontaktbilanz with (security_invoker = true) as
select fb.fall_id, fb.person_id,
       count(t.id) filter (where t.status = 'stattgefunden') as einzeltermine
  from public.fallbeteiligung fb
  left join public.termin t
    on t.fall_id = fb.fall_id
   and t.person_id = fb.person_id
   and (select count(*) from public.termin_teilnehmer tt where tt.termin_id = t.id) <= 1
 where fb.ist_klient
 group by fb.fall_id, fb.person_id;
