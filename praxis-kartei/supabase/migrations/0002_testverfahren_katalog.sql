-- =====================================================================
-- Praxis-Kartei – Startkatalog Testverfahren (v0.1)
-- Ausführen NACH der ersten Anmeldung in der App (dann existiert dein Nutzer).
-- Enthält nur Stammangaben – KEINE Items, KEINE Normtabellen (Urheberrecht).
-- Skalen trägst du aus dem jeweiligen Handbuch in der App nach.
-- Angaben zu Autoren/Verlag nach Kenntnisstand → vor Nutzung prüfen.
-- =====================================================================
do $$
declare v_owner uuid := (select id from auth.users order by created_at limit 1);
begin
  if v_owner is null then
    raise exception 'Noch kein Nutzer angelegt – zuerst in der App anmelden.';
  end if;

  insert into public.testverfahren
    (owner_id, kuerzel, name, autoren, verlag, lizenz, urteilsart, beurteilt,
     klinisch, allein_nicht_diagnostisch, schulung_erforderlich, angaben_klaeren, notiz)
  values
    (v_owner, 'FPI-R', 'Freiburger Persönlichkeitsinventar, revidierte Fassung',
     'Fahrenberg, Hampel, Selg', 'Hogrefe', 'ungeklaert', 'selbst', 'klient',
     false, false, false, true, 'Persönlichkeitsbeschreibung, Stanine-Profil. Angaben prüfen.'),
    (v_owner, 'PSSI', 'Persönlichkeits-Stil- und Störungs-Inventar',
     'Kuhl, Kazén', 'Hogrefe', 'ungeklaert', 'selbst', 'klient',
     false, true, false, true, 'Persönlichkeitsstile (nicht -störungen) im Coaching, im klinischen Kontext Hinweis auf Akzentuierungen. Angaben prüfen.'),
    (v_owner, 'BPI', 'Borderline-Persönlichkeits-Inventar',
     'Leichsenring', 'Hogrefe', 'ungeklaert', 'selbst', 'klient',
     true, true, false, true, 'Klinisches Verfahren: im Coaching keine diagnostische Interpretation.'),
    (v_owner, 'EBI', 'Eltern-Belastungs-Inventar',
     'Tröster', 'Hogrefe', 'ungeklaert', 'selbst', 'klient',
     false, false, false, true, 'Deutsche Fassung des Parenting Stress Index. Eltern- und Kindbereich.'),
    (v_owner, 'CBCL/6-18R', 'Child Behavior Checklist – Elternfragebogen über das Verhalten von Kindern und Jugendlichen',
     'Achenbach; dt. Fassung Arbeitsgruppe Deutsche Child Behavior Checklist', 'Hogrefe', 'ungeklaert', 'fremd', 'kind',
     true, true, false, true, 'Elternurteil über das Kind – kein Befund über das Kind. Bei Trennung beide Elternurteile getrennt erfassen. Altersversion (1½–5 / 6–18) prüfen.'),
    (v_owner, 'ADOS-2', 'Diagnostische Beobachtungsskala für Autistische Störungen – 2',
     'Lord u. a.; dt. Fassung Poustka u. a.', 'Hogrefe', 'ungeklaert', 'beobachtung', 'klient',
     true, true, true, true, 'Standardisierte Verhaltensbeobachtung (Module T, 1–4). Durchführung setzt klinisches Training voraus. Allein nicht ausreichend für eine Diagnose (Anamnese/ADI-R, Fachambulanz).')
  on conflict (owner_id, kuerzel) do nothing;
end $$;
