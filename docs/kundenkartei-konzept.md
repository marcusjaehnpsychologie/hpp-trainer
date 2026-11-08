# Klientenkartei – Konzept (Entwurf v0.1, 08.11.2026)

Ziel: alle Daten eines Klienten an einem Ort – iPhone und Browser, gleiche Daten, entwickelt über GitHub.
Status: **Planung, noch kein Code.** Offene Entscheidungen stehen am Ende (Abschnitt 9).

---

## 1. Was vom InLei-Vorbild übertragbar ist – und was nicht

| InLei-Funktion | Übertragung in die Praxis | Bewertung |
|---|---|---|
| Termine Tag/Woche/5 Tage | Terminansicht, Import aus Google Calendar (Online-Terminreservierung) | übernehmen |
| Digitale Kundenakte | Klientenakte mit Fällen, Verlauf, Dokumenten | übernehmen, aber tiefer (mehrere Aufträge pro Person) |
| Digitaler Fragebogen mit Datenschutz-Einwilligung, PDF | Anamnesebogen, Einwilligungen (DSGVO, Schweigepflicht, **Aufzeichnung Plaud**) | übernehmen |
| Schritt-für-Schritt-Assistent mit Timer | Sitzungsablauf (50 Min.), Leitfaden aus der Gesprächsvorbereitung | übernehmen |
| Vorher/Nachher | Prä-Post-Messwerte (BSL-23, IES-R usw.) als Verlaufskurve | nur als Messwerte |
| Vorher/Nachher → Social-Media-Beitrag | – | **streichen** (Schweigepflicht) |
| Treue-Bonus | – | **streichen** (in Therapie unangemessen) |
| Erinnerung per WhatsApp | Erinnerung per E-Mail/SMS | **WhatsApp streichen** – Metadaten an Meta, für Gesundheitsdaten nicht vertretbar |
| Nachbestellen | Rechnungen / Zahlungsstatus | anpassen |

Kernunterschied: Ein Kosmetikstudio hat *eine Person = eine Akte*. Deine Arbeit hat **Personen, die in mehreren Aufträgen auftauchen** (Paar + Einzel, Mediation, Gutachten-Begleitung, Supervision). Die Kartei muss deshalb zwischen **Person** und **Fall/Auftrag** trennen – sonst entsteht genau die Vermischung, die dein Supervisions-Skill als Allparteilichkeitsproblem beschreibt.

---

## 2. Datenstruktur (Datenmodell)

```
Person ──< Fallbeteiligung >── Fall ──< Termin ──1:1── Sitzungseintrag
  │                              │
  ├──< Einwilligung              ├──< Messung (Testwerte)
  ├──< Kontaktweg                ├──< Dokument (Verweis auf Drive)
  └──  Sperrvermerk              ├──< Frist / Aufgabe
                                 ├──  Krisenplan
                                 └──< Rechnung
```

### 2.1 Person (Stammdaten)
- Vorname, Nachname, **Namensvarianten/Aliase** (für Kalender- und Plaud-Abgleich, z. B. „Yasmin“/„Jasmin“)
- Geburtsdatum, Anschrift, Telefon, E-Mail(s) – E-Mail **normalisiert** gespeichert (googlemail = gmail, Punkte ignorieren), wie im Sperrlisten-Skill
- Bevorzugter Kontaktweg + Anrede (Du/Sie)
- Notfallkontakt
- Status: Anfrage · aktiv · pausiert · abgeschlossen · **gesperrt**
- Sperrvermerk (Datum, Grund intern) → ersetzt `/areas/terminsperrliste.md` als Quelle der Wahrheit
- Drive-Klientenordner-ID (`Gesprächsnotizen/[Buchstabe]/[Klient]`)

### 2.2 Fall / Auftrag (Kontrakt)
- Setting: Einzel/Persönlichkeitsentwicklung · Paar · Mediation · Elterncoaching · Trennung · Borderline/DBT · Trauma (NET/EMDR) · Gutachten-Begleitung · Supervision
- Rechtsrahmen: Coaching/Beratung **oder** heilkundliche Tätigkeit (steuert Sprache in Berichten, Aufbewahrungsfrist)
- Beteiligte Personen mit Rolle (Klient, Partner/in, Elternteil, Kind – nur erwähnt, Anwalt, Gutachter/in)
- Anliegen, vereinbarte Ziele, Kontraktdatum, Honorar, Frequenz
- **Kontaktbilanz** (automatisch): Einzeltermine je beteiligter Person – Warnung bei Ungleichgewicht im Paarsetting
- Nur bei Gutachten-Begleitung: Aktenzeichen, Gericht, Gutachter/in, Fristen (→ übernimmt die Rolle von `_FAELLE.md`)
- Status: offen · laufend · ruhend · abgeschlossen (mit Abschlussdatum → startet Aufbewahrungsfrist)

### 2.3 Termin
- Datum, Beginn, Dauer (Standard 50 Min.), Ort/Online, Fall, teilnehmende Personen
- Quelle: Online-Buchung (Google-Calendar-Event-ID) oder manuell
- Status: geplant · stattgefunden · abgesagt (rechtzeitig/kurzfristig) · nicht erschienen
- Abrechnungsstatus

### 2.4 Sitzungseintrag (Verlauf)
- Verknüpft mit Termin
- Freitext-Notiz, Themen, eingesetzte Methoden (NET-Lifeline, EMDR-Protokoll, DBT-Skill, U.M.W.E.G.©-Baustein …)
- Hausaufgabe / Vereinbarung bis zum nächsten Mal
- **Risikoeinschätzung** (Pflichtfeld bei Borderline/Trauma: Suizidalität erfragt ja/nein, Einschätzung)
- Verweise: Plaud-Transkript (Drive-Datei-ID), Vorbereitungs-DOCX (Drive-Datei-ID)
- Trennung der Ebenen wie im Berichts-Skill: *Klientenangabe* / *Beobachtung* / *Einschätzung* als getrennte Felder

### 2.5 Einwilligung
- Typ: Datenschutzinformation · Schweigepflichtentbindung (gegenüber wem) · Einwilligung Aufzeichnung (Plaud) · Online-Sitzung · Kontakt per E-Mail/SMS
- Datum, Version des Textes, unterschrieben (PDF), widerrufen am

### 2.6 Messung (Fragebogen/Testwert)
- Verfahren, Datum, Rohwert, Normwert/Einordnung, Messzeitpunkt (Prä · Verlauf · Post)
- Darstellung als Verlaufskurve in der Akte
- **Achtung Lizenzen:** BDI-II ist urheberrechtlich geschützt (Pearson). Digitale Durchführung im eigenen Tool nur mit Lizenz. Frei verfügbare Verfahren vorher einzeln prüfen. *Nicht von mir verifiziert, welche deiner Verfahren frei nutzbar sind.*

### 2.7 Dokument
- Typ (Bericht, Vorbereitung, Gutachten, Schriftsatz, Scan, Transkript), Datum, Titel
- **Speicherort bleibt Drive** – die Kartei speichert nur die Datei-ID und öffnet den Link. Keine Doppelablage.

### 2.8 Frist / Aufgabe
- Fälligkeit, Fall, Text, erledigt – Startseite zeigt Fristen ≤ 14 Tage (Logik aus dem Fall-Cockpit)

### 2.9 Krisenplan (nur bei Bedarf)
- Frühwarnzeichen, wirksame Skills, Personen, die helfen, Notfallnummern (112, 116 117, Telefonseelsorge 0800 111 0 111)
- Exportierbar als PDF für den Klienten

### 2.10 Rechnung
- Nummer, Datum, Termine, Betrag, bezahlt am – Export für Steuer

### 2.11 Protokoll (technisch)
- Wer hat wann welchen Datensatz geändert/gelöscht. Pflicht für Nachvollziehbarkeit.

---

## 3. Bildschirme auf dem iPhone

Untere Tab-Leiste (wie InLei):

1. **Heute** – Termine des Tages, je Termin: Name, Setting, Warnflaggen (Sperre, Krisenplan aktiv, Frist), Button „Sitzung starten“ (Timer 50 Min., Notizfeld, Risikofeld)
2. **Termine** – Tag / Woche / 5 Tage, Import aus Google Calendar
3. **Klienten** – Suche (auch nach Alias), Filter nach Status und Setting
4. **Fristen** – Gutachtenfristen, offene Aufgaben, fehlende Einwilligungen
5. **Mehr** – Sperrliste, Export, Einstellungen, Sperrbildschirm

**Klientenakte (eine Seite, Abschnitte aufklappbar):**
- Kopf: Name, Status, Setting-Chips, Warnhinweise
- Schnellaktionen: Anrufen · E-Mail · Neue Notiz · Drive-Ordner öffnen · Vorbereitung anstoßen
- Fälle (bei Paar: beide Personen sichtbar, Kontaktbilanz)
- Verlauf (Zeitstrahl: Termine + Notizen + Dokumente gemischt, neueste oben)
- Messwerte (Kurve)
- Einwilligungen (grün/rot)
- Krisenplan
- Rechnungen

Auf dem Desktop-Browser dieselbe App, breiteres Layout (Liste links, Akte rechts).

---

## 4. Technische Architektur

### 4.1 Grundsatz
**GitHub enthält nur Programmcode – niemals Klientendaten.** Das ist der wichtigste Unterschied zum HPP-Trainer: Dessen Sync über GitHub Gists ist für Lernstände in Ordnung, für Gesundheitsdaten (Art. 9 DSGVO, § 203 StGB) ausgeschlossen.

### 4.2 Empfohlener Aufbau

| Schicht | Vorschlag | Begründung |
|---|---|---|
| App | **PWA** (Web-App, auf dem iPhone „Zum Home-Bildschirm“) | Eine Codebasis für iPhone + Browser, kein App-Store, funktioniert bei dir bereits mit dem HPP-Trainer |
| Code | Neues **privates** Repo, TypeScript + React + Vite | Mehr Struktur als eine 2-MB-`index.html`; Typen schützen das Datenmodell bei Änderungen durch Claude |
| Hosting | Cloudflare Pages oder GitHub Pages (nur der Code) | Kostenlos, automatisches Deployment bei jedem Push |
| Datenbank | **Supabase, Region Frankfurt**, mit AV-Vertrag | Postgres, Login, Zugriffsregeln (Row Level Security); Sync iPhone ↔ Browser |
| Offline | Lokale Kopie in IndexedDB (Dexie) | Akte auch ohne Netz lesbar |
| Verschlüsselung | Freitextfelder (Notizen, Risiko, Krisenplan) **im Gerät verschlüsselt** (WebCrypto AES-GCM), Schlüssel aus deiner Passphrase | Der Server-Betreiber sieht nur Chiffretext |
| Login | E-Mail + Passkey/2FA, automatische Sperre nach X Minuten | Gerät verloren ≠ Daten weg |
| Dokumente | Bleiben in Google Drive, Kartei hält nur die Datei-ID | Deine Skills (Gesprächsvorbereitung, Plaud-Zuordnung) arbeiten unverändert weiter |

### 4.3 Verworfene Alternativen
- **Nur lokal im Browser (ohne Server):** sicherer, aber iPhone und Desktop sehen unterschiedliche Daten; Safari kann Website-Daten löschen, wenn die Seite nicht als Home-Bildschirm-App installiert ist. Für eine Kartei, die überall gleich sein soll, ungeeignet.
- **Native iOS-App (Swift):** besser auf dem iPhone, aber zweite Codebasis für den Browser, App-Store-Konto, deutlich höherer Aufwand.
- **Daten als JSON in Google Drive:** einfache Anbindung an deine Skills, aber kein Mehrbenutzer-Sync, Konfliktgefahr bei gleichzeitiger Bearbeitung.

---

## 5. Datenschutz – Schwachstellen, die vor dem Bau geklärt sein müssen

1. **Google-Privatkonto (`@googlemail.com`):** Nach meinem Kenntnisstand bietet Google einen Auftragsverarbeitungsvertrag nur für Google Workspace, nicht für private Konten. Deine Gesprächsnotizen und Plaud-Transkripte liegen dort bereits heute. Das ist unabhängig von der neuen App ein offener Punkt. *Bitte rechtlich prüfen lassen – ich bin kein Ersatz für Datenschutzberatung.*
2. **Plaud-Aufzeichnungen:** Einwilligung der Klienten zur Aufzeichnung muss dokumentiert sein → eigener Einwilligungstyp in der Kartei.
3. **Supabase:** AV-Vertrag abschließen, Region EU wählen. Supabase Inc. ist ein US-Unternehmen – Drittlandbezug trotz EU-Rechenzentrum. Die Ende-zu-Ende-Verschlüsselung der Freitexte mindert das Risiko deutlich.
4. **Aufbewahrung/Löschung:** Bei heilkundlicher Tätigkeit 10 Jahre nach Abschluss (§ 630f BGB); bei reinem Coaching keine vergleichbare Pflicht – dann eher löschen. Die Kartei braucht pro Fall ein Löschdatum und eine Löschliste.
5. **Verzeichnis der Verarbeitungstätigkeiten** um die neue App ergänzen.
6. **Gerätesicherheit:** iPhone mit Code + Face ID; App mit eigener Sperre.

---

## 6. Zusammenspiel mit deinen bestehenden Abläufen

| Heute | Mit Kartei |
|---|---|
| Online-Buchung landet in Google Calendar | Import-Button: Buchung → Termin, Person wird über E-Mail zugeordnet oder neu angelegt |
| Sperrliste in `/areas/terminsperrliste.md` | Status „gesperrt“ in der Person; Import markiert Buchungen gesperrter Personen rot |
| Fallregister `_FAELLE.md` (Gutachten) | Fälle mit Aktenzeichen + Fristen in der Kartei; `_FAELLE.md` als Export weiterführen oder ablösen |
| Plaud-Transkript im Klientenordner | Sitzungseintrag verweist auf die Drive-Datei |
| Gesprächsvorbereitung als DOCX im Drive | Dokument-Eintrag in der Akte mit Link |
| Therapiebericht aus Notizen | „Bericht vorbereiten“: Export der Sitzungseinträge eines Zeitraums als Text für den Berichts-Skill |

---

## 7. Umsetzung in Stufen

| Stufe | Inhalt | Ergebnis |
|---|---|---|
| 0 | Entscheidungen aus Abschnitt 9, Datenschutzklärung | Freigabe |
| 1 (MVP) | Login, Person, Fall, Termin manuell, Sitzungsnotiz (verschlüsselt), Klientenakte, Suche | Nutzbar auf iPhone + Browser |
| 2 | Google-Calendar-Import, Sperrliste, Fristen-Ansicht, Kontaktbilanz | Ersetzt manuelle Pflege |
| 3 | Einwilligungen mit Unterschrift + PDF, Krisenplan-PDF | Papierlos |
| 4 | Messwerte + Verlaufskurve, Export für Berichte | Prä-Post sichtbar |
| 5 | Rechnungen, Export Steuer | Abrechnung |
| später | Fragebogen-Link für Klienten zum Selbstausfüllen | **Eigener Sicherheitsaufwand** (öffentlicher Zugang) – bewusst zuletzt |

Jede Stufe: eigener Branch, Test mit **Fantasiedaten**, nie mit echten Klientendaten im Repo.

---

## 8. Was ich an der Ausgangsidee kritisch sehe

- **„Alles an einem Ort“** ist nur halb richtig: Dokumente bleiben sinnvollerweise in Drive. Die Kartei ist der *Index* auf alles, nicht der Speicher für alles. Wer beides doppelt pflegt, hat nach drei Monaten zwei widersprüchliche Akten.
- **Eigenbau vs. Kauf:** Es gibt Praxissoftware für Psychotherapie/Heilpraxis mit Kartei, Terminen, Rechnungen und Datenschutzdokumentation. Ich habe keinen aktuellen Marktvergleich gemacht. Eigenbau lohnt sich nur, wenn die Verzahnung mit deinen Skills (Plaud, Gesprächsvorbereitung, Fall-Cockpit) den Ausschlag gibt – das ist bei dir plausibel, aber eine Abwägung, kein Selbstläufer.
- **Wartung:** Eine selbstgebaute App mit Gesundheitsdaten braucht Updates, Backups und einen Notfallplan (Was passiert mit den Daten, wenn die App nicht mehr läuft?). Stufe 1 enthält deshalb einen vollständigen Export (verschlüsselte Datei).

---

## 9. Entscheidungen

**Getroffen am 08.11.2026:**
- Start **ohne** Ende-zu-Ende-Verschlüsselung (Freitexte in eigenen Spalten, damit sie sich später nachrüsten lässt)
- Nur ein Nutzer
- Coaching **und** Heilkunde, Rechtsrahmen pro Fall
- Eigenes privates Repo, getrennt vom HPP-Trainer
- Rechnungen in der App → siehe `kundenkartei-rechnungen.md`

**Ursprüngliche Fragen (Stand v0.1):**

1. **Verschlüsselung vs. Claude-Zugriff:** Sind Notizen Ende-zu-Ende-verschlüsselt, können deine Claude-Skills sie nicht direkt lesen – nur über einen Export, den du bewusst auslöst. Unverschlüsselt wäre die Anbindung bequemer, aber datenschutzrechtlich schwächer. Meine Empfehlung: verschlüsseln + bewusster Export.
2. **Nur du oder auch Mitarbeitende/Vertretung?** Ändert Rechte- und Rollenmodell.
3. **Coaching oder Heilkunde?** Bestimmt Aufbewahrungsfristen und Berichtssprache je Fall.
4. **Eigenes Repo:** Vorschlag `praxis-kartei` (privat), getrennt vom HPP-Trainer.
5. **Rechnungen:** in der App oder weiterhin extern?
