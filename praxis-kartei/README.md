# Praxis-Kartei

Klientenkartei für die Praxis Marcus Jähn – als Web-App für iPhone und Browser (PWA).
Stand: **v0.1 · Stufe 1** (Person, Fall, Beteiligte, Termine, Sitzungseinträge, Fristen, Sperrliste, Einstellungen).
Die Datenbank enthält bereits alle Tabellen für die späteren Stufen (Diagnosen ICD-10-GM/ICD-11, Testverfahren, Diary Card, Trauma-Modul).

Konzept: [`docs/kundenkartei-konzept.md`](docs/kundenkartei-konzept.md) · Diagnosen: [`docs/diagnosen-icd.md`](docs/diagnosen-icd.md) · Testverfahren: [`docs/testverfahren.md`](docs/testverfahren.md) · Diary Card: [`docs/diary-card.md`](docs/diary-card.md)

> **Grundregel:** GitHub enthält nur Programmcode. Klientendaten liegen ausschließlich in der Datenbank (Supabase, Frankfurt).

---

## Einrichtung – Schritt für Schritt (ca. 45 Minuten, am Rechner)

### 1. GitHub-Repo
1. Auf github.com ein neues Repository **`praxis-kartei`** anlegen, **Private**, ohne README.
2. Inhalt dieses Ordners hochladen – entweder ich pushe ihn (Claude-Sitzung, Repo freigeben) oder per „Add file → Upload files“.

### 2. Supabase (Datenbank + Anmeldung)
1. Auf supabase.com ein Konto anlegen → **New project** → Region **Central EU (Frankfurt)** → starkes Datenbank-Passwort (in den Passwortmanager).
2. **Auftragsverarbeitungsvertrag (DPA)** mit Supabase abschließen, bevor echte Daten eingegeben werden. *(Wo genau im Dashboard: bitte bei Supabase nachsehen – Stand nicht von mir geprüft.)*
3. **Authentication → Users → Add user**: deine E-Mail + Passwort, „Auto Confirm User“ an.
4. **Authentication → Sign In / Providers**: „Allow new users to sign up“ **ausschalten** (sonst könnte sich jeder registrieren – Daten sähe er wegen der Zugriffsregeln trotzdem nicht).
5. **SQL Editor → New query**: Inhalt von `supabase/migrations/0001_grundschema.sql` einfügen → **Run**.
6. Danach ebenso `supabase/migrations/0002_testverfahren_katalog.sql` → **Run** (legt FPI-R, PSSI, ADOS-2, BPI, EBI, CBCL an).
7. **Project Settings → API**: „Project URL“ und „anon public key“ notieren (der anon-Key ist öffentlich gedacht; geschützt wird über Anmeldung + Zugriffsregeln).

### 3. Veröffentlichen
**Variante A – GitHub Pages** (bei privatem Repo nach meinem Kenntnisstand nur mit kostenpflichtigem GitHub-Plan, z. B. Pro):
1. Repo → **Settings → Secrets and variables → Actions → Variables**: `SUPABASE_URL` und `SUPABASE_ANON_KEY` anlegen.
2. Repo → **Settings → Pages → Source: GitHub Actions**.
3. Jeder Push auf `main` veröffentlicht automatisch. Adresse: `https://<github-name>.github.io/praxis-kartei/`

**Variante B – Cloudflare Pages** (kostenlos, auch mit privatem Repo):
1. Cloudflare → Workers & Pages → Create → Pages → mit GitHub verbinden → `praxis-kartei`.
2. Build command `npm run build`, Output `dist`.
3. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Danach in Supabase unter **Authentication → URL Configuration** die Site-URL auf die veröffentlichte Adresse setzen.

### 4. iPhone
1. Adresse in **Safari** öffnen → anmelden.
2. Beim ersten Mal: **zweiten Faktor einrichten** (QR-Code mit Authenticator-App scannen). Ohne zweiten Faktor gibt die Datenbank keine Daten heraus.
3. **Teilen → Zum Home-Bildschirm**. Die App startet dann wie eine normale App.

---

## Ausprobieren ohne Datenbank (Demo-Modus)
Ohne `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` startet die App mit **Fantasiedaten** im Browser:
```bash
npm install
npm run dev        # http://localhost:5173
```

## Prüfen
```bash
npm test           # Typen + Datenbankschema mit allen Regeln (läuft lokal mit PGlite, ohne Supabase)
npm run build      # fertige App in dist/
```
GitHub prüft das bei jedem Push automatisch (Workflow „Prüfen“).

## Aufbau
```
supabase/migrations/   Datenbank: Tabellen, Zugriffsregeln (nur Eigentümer + 2FA), Diagnose-Regeln, Protokoll
scripts/test-schema.mjs  Tests für Schema und Regeln
src/lib/               Datenzugriff (Supabase oder Demo), Typen, Texte
src/pages/             Heute · Termine · Klienten · Akte · Fall · Sitzung · Fristen · Mehr
src/components/        Anmeldung (Passwort + 2FA), Bedienelemente
docs/                  Konzept und fachliche Begründungen
```

## Sicherheit – was umgesetzt ist
- Zugriff nur für dein Konto **und** nur mit zweitem Faktor (Row Level Security, `aal2`).
- Änderungsprotokoll: welche Felder wann geändert wurden (ohne Inhalte).
- Service Worker speichert nur die App-Hülle, **keine** Klientendaten.
- Diagnosen werden von der Datenbank abgelehnt, solange keine Heilkunde-Erlaubnis eingetragen ist, im Coaching-Fall, für nicht untersuchte Personen und bei unzulässigen ICD-11-Kombinationen.
- Noch **keine** Ende-zu-Ende-Verschlüsselung (bewusste Entscheidung v0.1). Sensible Freitexte liegen in eigenen Spalten, damit sie nachgerüstet werden kann.

## Stufen
| Stufe | Inhalt | Stand |
|---|---|---|
| 1 | Person, Fall, Beteiligte, Termin, Sitzungseintrag, Akte, Suche, Fristen, Sperrliste, Login + 2FA | **fertig** |
| 2 | Phasen-Pflichtpunkte, Einwilligungen, Anamnese, Google-Calendar-Import | Tabellen da |
| 3 | Diagnosen + ICD-Katalog/Mapping, Arbeitshypothesen, Ziele, Krisenplan | Tabellen + Regeln da |
| 4 | Module Borderline (Diary Card) und Trauma, Testergebnisse mit Profil/Verlauf | Tabellen da |
| 5 | Vorbereitungsblatt für die Gesprächsvorbereitung | offen |
| 6 | sevDesk-Anbindung | Felder vorgesehen |
