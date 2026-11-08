# Klientenkartei – Struktur (Entwurf v0.2, 08.11.2026)

Status: **Planung, noch kein Code.**
Diagnosen und ICD-10/ICD-11 sind in [`diagnosen-icd.md`](diagnosen-icd.md) ausgearbeitet.

## 0. Entscheidungen (Stand 08.11.2026)

| Thema | Entscheidung |
|---|---|
| Verschlüsselung | Zunächst **ohne** Ende-zu-Ende-Verschlüsselung. Sensible Freitexte stehen in eigenen Spalten, damit sie sich später verschlüsseln lassen |
| Nutzer | Nur Marcus |
| Rechtsrahmen | Coaching **und** Heilkunde, festgelegt **pro Fall** |
| Repo | Eigenes privates Repo (Vorschlag `praxis-kartei`), getrennt vom HPP-Trainer |
| Rechnungen | Bleiben in **sevDesk**. API-Anbindung erst, wenn die Kartei steht (Abschnitt 7) |
| Priorität | Kartei von der Erstanfrage bis zur Gesprächsvorbereitung, inklusive Diagnosen |
| Heilkunde-Erlaubnis | HP-Psychotherapie-Prüfung im **Dezember 2026**. Bis die Erlaubnis erteilt ist, gelten **alle Fälle als Coaching**, das Diagnosemodul ist gesperrt. Freischaltung über die Praxis-Einstellungen (Datum der Erlaubnis, Behörde, Aktenzeichen) |
| Testverfahren | FPI-R, PSSI, ADOS-2, BPI, EBI, CBCL; weitere folgen → [`testverfahren.md`](testverfahren.md) |

**Übergang Coaching → Heilkunde:** Ein laufender Coaching-Fall wird nach der Erlaubnis **nicht rückwirkend umgestellt**. Entweder wird er ab einem Stichtag umgestellt (frühere Sitzungen bleiben Coaching), oder es wird ein neuer Heilkunde-Fall angelegt. Diagnosen gelten frühestens ab dem Datum der Erlaubnis.

---

## 1. Grundprinzipien

1. **Person ≠ Fall.** Eine Person kann in mehreren Aufträgen auftauchen (Einzel + Paar, Mediation, Gutachten-Begleitung). Alles Fachliche – Diagnose, Ziele, Sitzungen, Krisenplan – hängt am **Fall**, nicht an der Person.
2. **Der Rechtsrahmen steuert die Felder.** Ein Coaching-Fall hat **kein** Diagnosefeld, sondern nur Themen und Arbeitshypothesen. Ein Heilkunde-Fall hat Diagnosen nach ICD. Das schützt dich vor dem Vorwurf unerlaubter Heilkunde und hält die Sprache sauber.
3. **Diagnosen nur für untersuchte Klienten.** Für Dritte, die nur über den Klienten bekannt sind (z. B. der „narzisstische Ex-Partner“), wird **nie** eine Diagnose gespeichert, nur „Beschreibung durch Klient/in“. Das ist besonders bei Narzissmus-Betroffenen und in der Gutachten-Begleitung wichtig.
4. **Drei Ebenen getrennt** (wie im Therapiebericht-Skill): Klientenangabe · eigene Beobachtung · fachliche Einschätzung.
5. **Die Kartei ist der Index, Drive der Speicher.** Transkripte, Vorbereitungs-DOCX und Berichte bleiben im Drive-Klientenordner. Die Kartei hält die Verweise und die strukturierten Daten.

---

## 2. Der Klientenweg – von der Erstanfrage bis zur Gesprächsvorbereitung

Jeder Fall durchläuft Phasen. Die App zeigt pro Fall die aktuelle Phase und was in dieser Phase noch fehlt (rote Punkte).

| Phase | Auslöser | Was erfasst wird | Pflicht vor nächster Phase |
|---|---|---|---|
| **1 Anfrage** | Online-Buchung, Mail, Telefon, Empfehlung | Person (Name, Kontakt), Quelle, Anliegen in einem Satz, Dringlichkeit, **Sperrlisten-Abgleich** automatisch | Sperrliste geprüft |
| **2 Erstgespräch** | erster Termin | Auftragsklärung, Setting, **Rechtsrahmen-Entscheidung** (Checkliste unten), Beteiligte | Rechtsrahmen festgelegt |
| **3 Aufnahme** | nach Erstgespräch | Einwilligungen (Datenschutz, Aufzeichnung Plaud, ggf. Schweigepflichtentbindung), Anamnese, Kontrakt (Honorar, Frequenz, Absageregel) | Datenschutz-Einwilligung; bei Plaud: Aufzeichnungs-Einwilligung |
| **4 Diagnostik / Einschätzung** | Sitzung 1–3 | Testverfahren (Prä-Messung), Strukturhypothese, **Heilkunde: Diagnose(n)** · **Coaching: Themen/Hypothesen**, Risikoeinschätzung | Risikoeinschätzung dokumentiert |
| **5 Planung** | nach Diagnostik | Ziele, Methoden, Behandlungsphase, **Krisenplan** (bei Borderline/Trauma Pflicht) | Ziele erfasst |
| **6 Laufende Arbeit** | jeder Termin | Vorbereitung (DOCX-Verweis), Sitzungseintrag, Plaud-Transkript-Verweis, Hausaufgaben, Diary Card / Trauma-Daten, Verlaufsmessung | – |
| **7 Zwischenbilanz** | z. B. alle 10 Sitzungen (einstellbar) | Zielabgleich, Verlaufsmessung, Diagnose überprüfen, ggf. Verlaufsbericht | – |
| **8 Abschluss** | letzte Sitzung | Post-Messung, Abschlussbericht, Abschlussgrund | Abschlussdatum → startet Aufbewahrungsfrist |
| **9 Nachsorge / Ruhend** | – | Wiederaufnahme legt einen **neuen Fall** an oder öffnet den alten | – |

**Checkliste Rechtsrahmen (Phase 2)** – Hinweise, keine automatische Entscheidung:
- Liegt ein Leiden mit möglichem Krankheitswert vor (Symptome, Leidensdruck, Funktionseinschränkung)? → Heilkunde, sofern Erlaubnis vorhanden; sonst Verweis auf ärztliche/psychotherapeutische Behandlung
- Akute Suizidalität, Psychose, schwere Sucht? → Weiterverweisung dokumentieren
- Ziel ist Entwicklung/Klärung ohne Krankheitswert? → Coaching
- Ergebnis und Begründung werden gespeichert (Nachweis bei späteren Fragen)

---

## 3. Datenmodell

### 3.1 Übersicht

```
Person ──< Fallbeteiligung >── Fall
  │                             │
  ├─ Kontakt, Sperrvermerk      ├──< Termin ──1:1── Sitzungseintrag ──< Hausaufgabe
  ├─< Einwilligung              ├──< Diagnose (nur Heilkunde) ──> ICD-Katalog / Mapping
  ├─  Anamnese (einmal,         ├──< Arbeitshypothese / Thema
  │    versioniert)             ├──< Messung (Testwerte)
  └─  sevDesk-Kontakt-ID        ├──< Ziel
                                ├──  Krisenplan
                                ├──< Dokument (Drive-Verweis)
                                ├──< Frist / Aufgabe
                                ├──  Modul Borderline  (Diary Card, Skills)
                                └──  Modul Trauma      (Ereignisse, Phase, EMDR/NET)
```

### 3.2 Kern

**Person**
- Vorname, Nachname, Namensvarianten (für Kalender- und Plaud-Abgleich), Geburtsdatum, Anschrift
- E-Mail(s) normalisiert, Telefon, bevorzugter Kontaktweg, Anrede Du/Sie
- Notfallkontakt
- Status: Anfrage · aktiv · ruhend · abgeschlossen · **gesperrt** (+ Sperrdatum → ersetzt die Sperrliste)
- Drive-Ordner-ID (`Gesprächsnotizen/[Buchstabe]/[Klient]`)
- `sevdesk_contact_id` (leer bis zur Anbindung)

**Fall**
- Titel (z. B. „Paar M./K. 2026“), Setting, **Rechtsrahmen** (Coaching/Heilkunde) mit Begründung und Datum
- Phase (1–9), Beginn, Abschluss, Abschlussgrund
- Anliegen (Klientenwortlaut), Auftrag (eigene Formulierung)
- Kontrakt: Honorar, Frequenz, Absageregel, Datum
- Bei Gutachten-Begleitung: Aktenzeichen, Gericht, Gutachter/in, Anwalt/Anwältin (ersetzt `_FAELLE.md`)
- Kontaktbilanz (berechnet, bei Paar/Mediation)

**Fallbeteiligung** – Person ↔ Fall mit Rolle: Klient/in · Partner/in · Elternteil · Kind (erwähnt) · Anwalt · Gutachter/in · Zuweiser

**Termin** – Datum, Dauer (Standard 50 Min.), online/vor Ort, Teilnehmende, Quelle (Google-Calendar-ID), Status (geplant · stattgefunden · kurzfristig abgesagt · nicht erschienen), Abrechnungsstatus (für sevDesk)

**Sitzungseintrag**
- Klientenangabe · Beobachtung · Einschätzung (drei Felder)
- Themen, eingesetzte Methoden (Auswahlliste: NET, EMDR, DBT-Skill, Stabilisierung, U.M.W.E.G.©, TA, systemisch …)
- **Risikoeinschätzung**: Suizidalität erfragt ja/nein, Einstufung (keine · latent · akut), Maßnahme – Pflicht bei Borderline/Trauma-Fällen
- Verweise: Vorbereitung-DOCX, Plaud-Transkript (Drive-IDs)
- Nächste Schritte

**Hausaufgabe** – Text, vergeben am, Besprechung am, erledigt ja/teilweise/nein

**Anamnese** (pro Person, versioniert) – Biografie, Familie, Partnerschaft, Beruf, Vorbehandlungen, Medikation, körperliche Erkrankungen, Substanzkonsum, Ressourcen, Suizidversuche in der Vorgeschichte

**Einwilligung** – Typ, Textversion, Datum, Unterschrift (PDF), widerrufen am

**Ziel** – Formulierung, Messkriterium, Ausgangswert, Stand, erreicht ja/teilweise/nein

**Messung** – Verfahren, Datum, Messzeitpunkt (Prä · Verlauf · Post), Rohwert, Einordnung; Verlaufskurve pro Verfahren

**Krisenplan** – Frühwarnzeichen, Auslöser, wirksame Skills, hilfreiche Personen, Notfallnummern, Abmachungen; Export als PDF für Klient/in

**Dokument** – Typ, Datum, Titel, Drive-ID

**Frist/Aufgabe** – Fälligkeit, Text, erledigt (Startseite: alles ≤ 14 Tage)

**Arbeitshypothese** (Coaching **und** Heilkunde)
- Strukturhypothese nach Kernberg: neurotisches · Borderline- · psychotisches Strukturniveau (= **Organisationsniveau, keine Diagnose**)
- OPD-Strukturniveau (optional)
- Themen-Cluster: Narzissmus-Betroffenheit, Trennung, Selbstwert, Bindung, Elternschaft …
- Beleg, Revisionskriterium (aus dem Persönlichkeitsstruktur-Skill)

> Wichtig: „Borderline-**Persönlichkeitsorganisation**“ (Kernberg, Strukturniveau) und „Borderline-**Persönlichkeitsstörung**“ (ICD) sind getrennte Felder. Die App darf aus dem einen nie das andere ableiten.

**Diagnose** → siehe [`diagnosen-icd.md`](diagnosen-icd.md)

### 3.3 Modul Borderline (aktiv, wenn Diagnose F60.3x / 6D11.5 oder manuell eingeschaltet)

- **Diary Card** → ausgearbeitet in [`diary-card.md`](diary-card.md)
- **Spannungskurve** über Wochen
- **Behandlungshierarchie** (nach DBT): 1. suizidales/selbstverletzendes Verhalten · 2. therapiegefährdendes Verhalten · 3. Verhalten, das die Lebensqualität beeinträchtigt · 4. Skills-Aufbau → markiert, auf welcher Ebene die Sitzung arbeitet
- **Skills-Repertoire**: welche Skills eingeführt, geübt, wirksam
- Verlaufsmessung (z. B. BSL-23) **[Lizenz/Nutzungsbedingungen prüfen]**

### 3.4 Modul Trauma (aktiv bei Diagnose F43.x / 6B4x / dissoziativen Störungen oder manuell)

- **Ereignisliste** (Stichworte, keine Detailschilderung): Art, Alter, Typ I (einmalig) / Typ II (wiederholt), Täterbezug ja/nein
- **Behandlungsphase**: Stabilisierung · Konfrontation/Verarbeitung · Integration – mit Datum des Wechsels und Begründung
- **Stabilisierungsressourcen**: sicherer Ort, Tresor, innere Helfer, Notfallkoffer
- **Dissoziation**: Ausprägung, Warnzeichen, was zurückholt (Grounding)
- **NET**: Lebenslinie (Blumen/Steine) als Verweis auf Foto/Dokument, bearbeitete Steine mit Datum
- **EMDR**: Zielerinnerung (Ausgangsbild in Stichworten), negative/positive Kognition, VoC 1–7, SUD 0–10 (Start/Ende), Körperempfindung, Status (offen · in Bearbeitung · abgeschlossen)
- Verlaufsmessung (z. B. IES-R, PCL-5, ITQ für komplexe PTBS) **[Lizenz/Nutzungsbedingungen prüfen]**

---

## 4. Klientenakte auf dem iPhone

Tabs unten: **Heute · Termine · Klienten · Fristen · Mehr**

Die **Akte** ist eine Seite mit aufklappbaren Abschnitten:

1. **Kopf**: Name, Status, aktive Fälle als Chips, Warnflaggen (🔴 Risiko akut · Krisenplan · Sperre · fehlende Einwilligung · Frist)
2. **Schnellaktionen**: Anrufen · E-Mail · Sitzung starten · Drive-Ordner · **Vorbereitungsblatt**
3. **Fall-Wechsler** (bei mehreren Fällen)
4. **Überblick des Falls**: Phase, Rechtsrahmen, Diagnosen/Hypothesen, Ziele mit Fortschritt
5. **Verlauf** (Zeitstrahl: Termine, Sitzungseinträge, Messungen, Dokumente)
6. **Modul Borderline / Trauma** (nur wenn aktiv)
7. **Messwerte** (Kurven)
8. **Anamnese · Einwilligungen · Krisenplan · Dokumente**

**„Sitzung starten“**: Timer 50 Min., letzte Hausaufgabe und offene Punkte oben, Notizfelder in den drei Ebenen, Risikofeld, am Ende „nächste Schritte“ + Hausaufgabe.

---

## 5. Anbindung an die Gesprächsvorbereitung

Heute liest der Skill `gespraechsvorbereitung` den Drive-Ordner und den Kalender. Mit der Kartei kommt eine strukturierte Quelle dazu:

**Vorbereitungsblatt** (pro Fall, auf Knopfdruck oder per Abfrage durch den Skill):
- Kopf: Name (Vorname + Initiale), Setting, Rechtsrahmen, Phase, Sitzungsnummer
- aktive Diagnosen / Arbeitshypothesen
- Ziele + Stand
- letzte 3 Sitzungen (Kernpunkte, nächste Schritte)
- offene Hausaufgaben
- Risikostatus + Krisenplan-Kurzform
- Modul-Daten: Diary-Card-Trend der letzten 2 Wochen / Behandlungsphase und offene EMDR-Ziele
- Messwerte-Trend
- Fristen

Technische Varianten (Entscheidung offen, Abschnitt 9):
- **A)** Der Skill fragt die Datenbank direkt ab (nur lesender Zugang). Immer aktuell, keine Kopien.
- **B)** Die App schreibt das Blatt als Datei in den Drive-Klientenordner. Einfach, aber erzeugt Kopien sensibler Daten in Drive.

Empfehlung: **A**.

---

## 6. Architektur (unverändert)

PWA (iPhone + Browser), TypeScript/React/Vite, eigenes privates Repo, Hosting Cloudflare oder GitHub Pages (nur Code), Datenbank Supabase Region Frankfurt mit AV-Vertrag, Login mit zweitem Faktor, Zugriffsregeln (Row Level Security), Offline-Kopie im Gerät. **Keine Klientendaten in GitHub**, Tests nur mit Fantasiedaten.

---

## 7. sevDesk (später)

Für die spätere Anbindung werden jetzt nur Felder vorgesehen:
- Person: `sevdesk_contact_id`
- Termin: Abrechnungsstatus (offen · an sevDesk übergeben · abgerechnet), `sevdesk_invoice_id`
- Fall: Rechnungsempfänger (bei Paar/Mediation: wer zahlt, ggf. Aufteilung)

Grundregel schon jetzt: **Keine Diagnose wandert automatisch zu sevDesk.** Nur auf ausdrücklichen Wunsch des Klienten (Einreichung bei PKV/Beihilfe) und pro Rechnung bestätigt.

---

## 8. Datenschutz – Mindestbedingungen

- AV-Vertrag mit Supabase vor dem ersten echten Datensatz; Region EU
- Login mit Passkey/2FA, automatische Sperre
- Protokoll aller Änderungen und Löschungen
- Aufbewahrung: Heilkunde-Fälle 10 Jahre nach Abschluss (§ 630f BGB); Coaching-Fälle: Löschfrist selbst festlegen (Vorschlag: 3 Jahre) **[prüfen]**
- Diagnosen sind der sensibelste Teil – deshalb Abschnitt 3 in `diagnosen-icd.md`
- Offener Altpunkt: Google-Privatkonto ohne AV-Vertrag (siehe v0.1)

---

## 9. Stufen

| Stufe | Inhalt |
|---|---|
| 1 | Person, Fall, Fallbeteiligung, Termin, Sitzungseintrag, Akte, Suche, Login |
| 2 | Phasen mit Pflichtpunkten, Einwilligungen, Anamnese, Kalender-Import, Sperrliste |
| 3 | **Diagnosen + ICD-Katalog + Mapping**, Arbeitshypothesen, Ziele, Krisenplan |
| 4 | Module Borderline und Trauma, Messungen mit Kurven |
| 5 | Vorbereitungsblatt + Anbindung Gesprächsvorbereitung |
| 6 | sevDesk-Anbindung |

## 10. Offene Punkte

1. ~~Heilkunde-Erlaubnis~~ → Prüfung Dezember 2026, Freischaltung per Einstellung
2. Vorbereitungsblatt: Variante A oder B (Abschnitt 5)?
3. ~~Testverfahren~~ → FPI-R, PSSI, ADOS-2, BPI, EBI, CBCL bestätigt
4. Diary Card: reicht deine Eingabe, oder sollen Klient/innen später selbst eintragen?
5. Repo `praxis-kartei` anlegen → Projektgerüst liegt fertig vor (siehe README)
