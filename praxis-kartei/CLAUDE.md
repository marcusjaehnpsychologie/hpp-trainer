# Praxis-Kartei – Regeln für die Arbeit an diesem Repo

- **Niemals echte Klientendaten** in Code, Tests, Commits, Issues, Screenshots oder Beispielen. Nur Fantasiedaten (siehe `src/lib/demoDaten.ts`).
- Sprache der Oberfläche, Kommentare und Doku: Deutsch.
- Datenbankänderungen nur als neue Datei in `supabase/migrations/` (fortlaufend nummeriert), nie bestehende Migrationen ändern, sobald sie produktiv eingespielt sind.
- Fachliche Regeln (Diagnose nur Heilkunde + Erlaubnis, nur für untersuchte Klienten, 6D11 nur mit 6D10/QE50.7 …) werden in der Datenbank erzwungen (`pruefe_diagnose`) und in `scripts/test-schema.mjs` getestet. Neue Regeln dort ergänzen.
- Testverfahren: keine Items, Schablonen oder Normtabellen ins Repo (Urheberrecht). Nur Stammangaben und erfasste Werte.
- Vor jedem Commit: `npm test` und `npm run build`.
- Konzept und Begründungen: `docs/`.
