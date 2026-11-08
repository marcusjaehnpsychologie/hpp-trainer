# Klientenkartei – Modul Rechnungen (Entwurf v0.1, 08.11.2026)

Ergänzung zu `kundenkartei-konzept.md`. Getroffene Entscheidungen (08.11.2026):
- zunächst **ohne** Ende-zu-Ende-Verschlüsselung
- **ein Nutzer** (Marcus)
- **Coaching und Heilkunde** in einer App, Unterscheidung **pro Fall**
- **eigenes privates Repo** (Vorschlag: `praxis-kartei`), getrennt vom HPP-Trainer
- Rechnungen **in der App**

> Steuerliche Aussagen unten sind mein Kenntnisstand (Stand Ende 2026), keine Steuerberatung.
> Vor dem ersten echten Einsatz mit Steuerberater abstimmen. Markierung: **[prüfen]**.

---

## 1. Rechtliche Leitplanken, die das Datenmodell bestimmen

| Regel | Folge für die App |
|---|---|
| Pflichtangaben § 14 Abs. 4 UStG (Name/Anschrift beider Seiten, Steuernummer, Datum, fortlaufende Nummer, Art/Umfang/Zeitpunkt der Leistung, Entgelt, Steuersatz bzw. Befreiungshinweis) | Pflichtfelder; Rechnung lässt sich ohne sie nicht festschreiben |
| Fortlaufende, **einmalige** Rechnungsnummer | Nummer vergibt die **Datenbank** (nicht das Handy) – also nur online festschreibbar. Getrennte Nummernkreise sind zulässig, solange jede Nummer eindeutig ist |
| GoBD: Unveränderbarkeit | Nach Festschreiben **keine Änderung** mehr. Korrektur nur per Storno-Rechnung + neue Rechnung |
| Aufbewahrung Buchungsbelege: **8 Jahre** (seit 2025) | Löschsperre für Rechnungen; läuft **getrennt** von der Aktenaufbewahrung (Heilkunde 10 Jahre nach § 630f BGB) |
| Heilbehandlung umsatzsteuerfrei nach § 4 Nr. 14a UStG | Nur bei **Heilkunde-Erlaubnis** (HP-Erlaubnis Psychotherapie oder Approbation) **und** therapeutischem Ziel **[prüfen]** |
| Coaching/Beratung umsatzsteuerpflichtig (19 %), außer Kleinunternehmer § 19 UStG | Steuersatz pro Leistung, Kleinunternehmer-Schalter in den Praxis-Einstellungen. Steuerfreie Heilbehandlungsumsätze zählen nach meinem Kenntnisstand nicht in die Kleinunternehmergrenze **[prüfen]** |
| E-Rechnung | Privatklienten (B2C): nicht nötig. Supervision/Beratung für Unternehmen (B2B): Ausstellungspflicht ab 2027/2028, Kleinunternehmer ausgenommen **[prüfen]** → spätere Stufe (ZUGFeRD) |
| Ausfallhonorar | Nach meinem Kenntnisstand meist nicht steuerbarer Schadensersatz **[prüfen]** → eigener Leistungstyp |

**Die wichtigste Konsequenz:** Der Rechtsrahmen des **Falls** (Coaching oder Heilkunde) bestimmt automatisch Steuersatz, Rechnungstext und Wortwahl. Eine Coaching-Rechnung darf nicht „Therapie“ heißen, eine Heilkunde-Rechnung ohne Erlaubnis darf nicht steuerfrei sein.

---

## 2. Datenstruktur

```
Praxis-Einstellungen (1x)
Leistungskatalog ──< Rechnungsposition >── Rechnung ──< Zahlung
                          │                   │
                       Termin               Fall ── Person (Empfänger)
                                              │
                                        Storno-Bezug
```

### 2.1 Praxis-Einstellungen
- Name, Berufsbezeichnung, Anschrift, Telefon, E-Mail, Website
- Steuernummer (ggf. USt-IdNr.), Finanzamt
- Bankverbindung (IBAN, BIC), Zahlungsziel Standard (z. B. 14 Tage)
- Kleinunternehmer ja/nein (mit Gültig-ab-Datum)
- Heilkunde-Erlaubnis: Art, Behörde, Datum – **ohne Eintrag ist Rechtsrahmen „Heilkunde“ gesperrt**
- Logo, Fußzeile, Rechnungstext-Vorlagen je Rechtsrahmen

### 2.2 Leistungskatalog (Preisliste)
| Feld | Beispiel |
|---|---|
| Bezeichnung | Einzelsitzung 50 Min. |
| Rechtsrahmen | Coaching / Heilkunde / beides |
| Preis | 120,00 € |
| USt-Satz Standard | 19 % / 0 % (§ 4 Nr. 14a) / Kleinunternehmer |
| Gebührenziffer (optional) | nur Heilkunde, für Erstattung durch PKV/Beihilfe **[prüfen: GebüH vs. GOP analog]** |
| Typ | Sitzung · Paarsitzung · Mediation · Ausfallhonorar · Gutachten-Begleitung (Stunde) · Supervision · Pauschale |

Preisänderungen erzeugen eine neue Version; alte Rechnungen behalten ihren Preis.

### 2.3 Rechnung
- Nummer (z. B. `H-2026-0012` Heilkunde, `C-2026-0047` Coaching, `S-2026-0003` Storno) – von der Datenbank vergeben
- Status: **Entwurf → festgeschrieben → teilbezahlt → bezahlt** · **storniert**
- Rechnungsdatum, Leistungszeitraum, Fälligkeitsdatum
- Fall, Empfänger-Person
- **Empfänger-Schnappschuss**: Name und Anschrift werden beim Festschreiben in die Rechnung kopiert (spätere Adressänderung ändert alte Rechnungen nicht)
- Rechtsrahmen, Steuerhinweis-Text
- Summen netto / USt / brutto
- PDF-Datei + Prüfsumme (SHA-256) als Beleg der Unveränderbarkeit
- Storno-Bezug (bei Stornorechnung: Verweis auf Original)
- Versand: Datum, Weg (E-Mail / Papier / persönlich)
- Mahnstufe 0–2

### 2.4 Rechnungsposition
- Leistung aus Katalog, Leistungsdatum, Beschreibung, Menge, Einzelpreis, USt-Satz
- Verweis auf Termin (verhindert Doppelabrechnung: ein Termin = höchstens eine Position)

### 2.5 Zahlung
- Datum, Betrag, Art (Überweisung, bar, Karte, PayPal), Notiz
- Bei Barzahlung: Quittung als PDF

---

## 3. Ablauf in der App

1. **Termin auf „stattgefunden“** (oder „kurzfristig abgesagt“) setzen → landet in der Liste **„offen abzurechnen“**.
2. **Rechnung erstellen**: einzeln nach der Sitzung oder als **Sammelrechnung** (z. B. monatlich pro Fall). Positionen werden aus den Terminen und dem Leistungskatalog vorbefüllt.
3. **Entwurf prüfen** – frei änderbar, keine Nummer.
4. **Festschreiben** (nur online): Nummer wird vergeben, PDF erzeugt, Prüfsumme gespeichert, Datensatz gesperrt.
5. **Versenden**: Teilen-Menü des iPhones (Mail, AirDrop, Drucken) oder Download im Browser.
6. **Zahlung erfassen** → Status bezahlt. Fällige, unbezahlte Rechnungen erscheinen in der Fristen-Ansicht; Mahnung als Vorlage.
7. **Fehler?** → „Stornieren“ erzeugt Stornorechnung mit eigener Nummer, Original bleibt erhalten; danach neue Rechnung.

**Paarsetting / Mediation:** Beim Fall festlegen, wer Rechnungsempfänger ist – eine Person oder Aufteilung (z. B. 50/50 auf zwei Rechnungen).

---

## 4. Ansichten

- **Klientenakte → Abschnitt Rechnungen**: alle Rechnungen des Klienten, offene Beträge oben.
- **Tab „Mehr“ → Finanzen**:
  - offen abzurechnen (Termine ohne Rechnung)
  - offene Posten / überfällig
  - Umsatz nach Monat, getrennt nach Coaching / Heilkunde / USt-Satz
  - **Export für den Steuerberater**: CSV (Rechnungsliste mit Zahlungen) + ZIP aller PDFs eines Jahres; später DATEV-Format, falls der Steuerberater es braucht

---

## 5. Speicherung

| Was | Wo | Warum |
|---|---|---|
| Rechnungsdaten | Supabase-Datenbank (Region Frankfurt) | Eine Quelle, iPhone und Browser synchron |
| Rechnungs-PDF | Supabase Storage (gleiche Region), privater Bucket | Beleg neben den Daten, nicht verstreut |
| Jahresarchiv | Export-ZIP, von dir zusätzlich offline gesichert | Abhängigkeit von einem Anbieter begrenzen; 8 Jahre sind länger als die Lebensdauer vieler Dienste |

Nummernvergabe und Festschreiben laufen als Datenbankfunktion (Transaktion) – so kann auch bei schlechtem Netz keine doppelte oder übersprungene Nummer entstehen. Festgeschriebene Rechnungen sind per Datenbankregel gegen Änderung und Löschung gesperrt.

---

## 6. Datenschutz bei Rechnungen

- **Keine Diagnose auf der Rechnung**, außer der Klient will bei PKV/Beihilfe einreichen und bittet ausdrücklich darum (Feld „Diagnose auf Rechnung“ nur dann sichtbar).
- Leistungsbeschreibung neutral („Psychologische Sitzung, 50 Min.“) – Inhalte gehören in die Akte, nicht auf die Rechnung.
- Da ohne Ende-zu-Ende-Verschlüsselung gestartet wird: Login mit 2FA/Passkey, Row Level Security, AV-Vertrag mit Supabase vor dem ersten echten Datensatz.
- Datenmodell so anlegen, dass sensible Freitexte (Notizen, Risiko, Krisenplan) in eigenen Spalten liegen → Verschlüsselung lässt sich später nachrüsten, ohne alles umzubauen.

---

## 7. Einordnung in die Stufen

Rechnungen bleiben **Stufe 5** im Gesamtplan, weil sie Termine (Stufe 1–2) voraussetzen. Innerhalb von Stufe 5:

| Teil | Inhalt |
|---|---|
| 5a | Praxis-Einstellungen, Leistungskatalog, Rechnung aus Terminen, Festschreiben, PDF |
| 5b | Zahlungen, offene Posten, Mahnvorlage, Storno |
| 5c | Steuerberater-Export, Umsatzübersicht |
| 5d (bei Bedarf) | E-Rechnung ZUGFeRD für Unternehmenskunden |

---

## 8. Offene Punkte

1. **Heilkunde-Erlaubnis:** Welche liegt vor (HP-Erlaubnis beschränkt auf Psychotherapie, Approbation)? Davon hängt ab, ob Heilkunde-Rechnungen steuerfrei sein dürfen.
2. **Kleinunternehmer:** ja oder nein?
3. **Rechnungsrhythmus:** pro Sitzung oder monatliche Sammelrechnung als Standard?
4. **PKV-Erstattung:** Reichen Klienten Heilkunde-Rechnungen bei Versicherungen ein? Dann Gebührenziffern-Feld in 5a, sonst weglassen.
5. **Steuerberater:** Welches Exportformat wird erwartet (CSV, DATEV, nur PDFs)?
