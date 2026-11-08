# Klientenkartei – Diagnosen und ICD-10 / ICD-11 (Entwurf v0.1, 08.11.2026)

Teil von [`kundenkartei-konzept.md`](kundenkartei-konzept.md).
Kennzeichnung: **[gesichert]** = durch Quelle belegt · **[Kenntnisstand]** = mein Wissen, nicht gegen Primärquelle geprüft · **[prüfen]** = vor Nutzung verifizieren.

---

## 1. Ausgangslage

- **In Deutschland gilt weiterhin die ICD-10-GM.** Einen verbindlichen Termin für die Umstellung auf ICD-11 gibt es nicht; das BfArM nennt ICD-10 als gültige Klassifikation, bis ICD-11 im jeweiligen Bereich eingeführt ist. **[gesichert]**
- Das BfArM hat eine deutsche **Entwurfsfassung** der ICD-11. Eine offizielle Überleitung ICD-10-**GM** ↔ ICD-11 stand 2024 noch aus. **[gesichert, Stand 2024 – Aktualität prüfen]**
- Die WHO stellt Überleitungstabellen ICD-10 (WHO-Fassung, nicht GM) ↔ ICD-11 bereit. **[Kenntnisstand]**

**Folge für die App:** Der **ICD-10-GM-Code ist führend** (für Berichte, Rechnungen, Stellungnahmen). Der **ICD-11-Code wird parallel geführt**, weil er bei Persönlichkeitsstörungen und Trauma fachlich genauer ist und weil du ihn für Gutachten-Kritik und Fachtexte brauchst.

---

## 2. Warum ein automatischer Abgleich nicht reicht

Die beiden Systeme sind bei deinen Schwerpunkten **strukturell verschieden**, nicht nur anders nummeriert:

### 2.1 Persönlichkeitsstörungen
- ICD-10: **Typen** (F60.0–F60.9), z. B. F60.31 emotional instabile PS, Borderline-Typ; F60.30 impulsiver Typ; Narzissmus unter F60.8. **[Kenntnisstand]**
- ICD-11: **ein** Code **6D10 Persönlichkeitsstörung** mit Schweregrad (leicht · mittelgradig · schwer · nicht näher bezeichnet), dazu optional **Merkmalsbereiche** (6D11.0–6D11.4: negative Affektivität, Distanziertheit, Dissozialität, Enthemmung, Anankasmus) und das **Borderline-Muster 6D11.5**. **[gesichert für 6D10, 6D11, 6D11.5]**
- 6D11.5 ist **kein eigenständiger Code**, sondern ein Zusatz zu 6D10 oder zur Persönlichkeitsproblematik **QE50.7** (keine Störung). **[gesichert]**
- Eine narzisstische PS gibt es in ICD-11 nicht als Typ; sie wird über Schweregrad + Merkmalsbereiche beschrieben. **[Kenntnisstand]**

→ **F60.31 lässt sich nicht automatisch übersetzen**: ICD-11 verlangt einen **Schweregrad**, den ICD-10 nicht enthält. Den musst du klinisch bestimmen.

### 2.2 Trauma- und belastungsbezogene Störungen
- PTBS: F43.1 → **6B40**, in ICD-11 mit engeren Kernkriterien (Wiedererleben in der Gegenwart, Vermeidung, anhaltendes Bedrohungsgefühl). **[Kenntnisstand]**
- **Komplexe PTBS 6B41** hat in ICD-10 keine eigene Entsprechung (Annäherung: F43.1 oder F62.0). **[Kenntnisstand; Richtung der WHO-Überleitung prüfen]**
- Anhaltende Trauerstörung 6B42 – in ICD-10 keine Entsprechung. **[Kenntnisstand]**
- Akute Belastungsreaktion F43.0 → in ICD-11 nicht mehr als Störung, sondern QE84. **[Kenntnisstand, prüfen]**
- Dissoziative Störungen F44.x → 6B6x, u. a. eigene Kategorie **partielle dissoziative Identitätsstörung 6B65**. **[Kenntnisstand]**

→ Hier ist die Zuordnung oft **1:n oder n:1**, teils ohne Entsprechung.

---

## 3. Datenmodell

### 3.1 ICD-Katalog (Stammdaten, nicht von Hand getippt)

| Feld | Inhalt |
|---|---|
| `system` | ICD-10-GM · ICD-11 |
| `version` | z. B. ICD-10-GM 2026 · ICD-11 MMS 2025-01 |
| `code` | F60.31 · 6D10.1 |
| `titel` | amtlicher Titel |
| `ist_zusatz` | ja für Codes, die nur ergänzen dürfen (z. B. 6D11.x) |
| `aktiv` | für die Auswahl sichtbar |

Import aus den **offiziellen Dateien** (BfArM für ICD-10-GM, WHO für ICD-11). Nur der für dich relevante Ausschnitt wird für die Auswahl aktiviert (Kapitel V/F bzw. Kapitel 06 plus Z-/QE-Codes). Die Beispielcodes in diesem Dokument sind **nicht** die Datengrundlage. **[Lizenzbedingungen beider Kataloge vor Import prüfen]**

### 3.2 Überleitung (Mapping)

| Feld | Inhalt |
|---|---|
| `icd10` | F60.31 |
| `icd11` | 6D10 + 6D11.5 |
| `art` | gleichwertig · 1:n · n:1 · Teilüberschneidung · keine Entsprechung |
| `braucht` | z. B. „Schweregrad“, „Merkmalsbereiche optional“ |
| `quelle` | WHO-Tabelle (Version) · eigene fachliche Festlegung |
| `hinweis` | Freitext, z. B. „ICD-11-Kriterien enger, neu prüfen“ |

Grundlage: WHO-Überleitungstabelle; **eigene Festlegungen** für deine Kernbereiche werden als solche gekennzeichnet und überschreiben die Standardvorschläge nicht stillschweigend.

### 3.3 Diagnose (pro Fall, nur Rechtsrahmen Heilkunde)

| Feld | Inhalt |
|---|---|
| Fall, Person | Diagnose gehört zur **untersuchten** Person im Fall |
| Rang | Hauptdiagnose · Nebendiagnose |
| **ICD-10-GM-Code** | führend, Pflicht |
| Diagnosesicherheit | **G** gesichert · **V** Verdacht · **Z** Zustand nach · **A** ausgeschlossen (Zusatzkennzeichen der ICD-10-GM) **[Kenntnisstand]** |
| **ICD-11-Code(s)** | parallel, optional; bei 6D10 Schweregrad Pflicht, 6D11.x als Zusätze |
| Mapping-Status | automatisch übernommen · fachlich angepasst · keine Entsprechung |
| Kriterienprüfung | Checkliste der Kriterien mit erfüllt/nicht erfüllt/unklar (Vorlage je Diagnose) |
| Grundlage | Verweise auf Messungen, Interviews, Sitzungen, Fremdbefunde |
| Begründung | Freitext |
| gestellt am / überprüft am / beendet am | Verlauf |
| Wiedervorlage | Datum der nächsten Überprüfung (Standard: Zwischenbilanz) |
| auf Rechnung erlaubt | nein (Standard) · ja, mit Datum der Einwilligung |

Jede Änderung erzeugt eine **neue Version**; alte Diagnosen werden nicht überschrieben, sondern beendet. So bleibt nachvollziehbar, wann aus V ein G oder ein A wurde.

### 3.4 Regeln, die die App erzwingt

1. **Kein Diagnosefeld in Coaching-Fällen.** Dort nur Arbeitshypothesen/Themen.
2. **Keine Diagnose für Personen, die nicht selbst untersucht wurden** (Rolle „Partner/in (erwähnt)“, „Kind (erwähnt)“, Gegenseite im Gutachtenverfahren).
3. **6D11.x nie allein** – nur zusammen mit 6D10 oder QE50.7.
4. **6D10 ohne Schweregrad** nur als „6D10.Z nicht näher bezeichnet“ mit Hinweis.
5. **Kernberg-Strukturniveau ≠ ICD-Diagnose** – getrennte Felder, keine automatische Ableitung.
6. **Diagnose → Modul**: F60.3x/6D11.5 schlägt das Borderline-Modul vor, F43.x/6B4x/F44.x/6B6x das Trauma-Modul. Vorschlag, keine Automatik.
7. **Keine Diagnose verlässt die App automatisch** (sevDesk, Export, Vorbereitungsblatt mit Schalter).

---

## 4. Startumfang des Katalogs (Vorschlag)

Nur Beispiele zur Orientierung. **Alle Codes vor dem Import gegen BfArM/WHO prüfen.**

| Bereich | ICD-10-GM | ICD-11 | Art |
|---|---|---|---|
| Borderline | F60.31 | 6D10.x + 6D11.5 | 1:n, Schweregrad nötig |
| Emotional instabil, impulsiv | F60.30 | 6D10.x + 6D11.3 (Enthemmung) / 6D11.0 | 1:n, fachliche Festlegung |
| Narzisstische PS | F60.8 | 6D10.x + Merkmalsbereiche | 1:n, fachliche Festlegung |
| PS nicht näher bez. | F60.9 | 6D10.Z | annähernd |
| Persönlichkeitsproblematik | – | QE50.7 | keine Entsprechung in ICD-10 |
| PTBS | F43.1 | 6B40 | Teilüberschneidung |
| Komplexe PTBS | (F43.1 / F62.0) | 6B41 | keine echte Entsprechung |
| Anpassungsstörung | F43.2 | 6B43 | annähernd |
| Anhaltende Trauer | (F43.2) | 6B42 | keine echte Entsprechung |
| Akute Belastungsreaktion | F43.0 | QE84 | Kategorie gewechselt |
| Dissoziative Identitätsstörung | F44.81 | 6B64 | annähernd |
| Partielle DIS | (F44.88) | 6B65 | keine echte Entsprechung |
| Depressive Episode | F32.x | 6A70.x | annähernd |
| Rezidivierende Depression | F33.x | 6A71.x | annähernd |
| Partnerschaftsprobleme (Paar) | Z63.0 | QE51.0 | annähernd **[prüfen]** |

Ergänzung nach Bedarf (Angst, Sucht, ADHS usw.) erst, wenn ein Fall es braucht.

---

## 5. Bedienung

- **Diagnose hinzufügen**: Suche nach Code oder Begriff (in beiden Systemen) → Auswahl ICD-10-GM → App schlägt ICD-11 vor und zeigt die **Mapping-Art** farbig (grün gleichwertig · gelb 1:n/Teilüberschneidung · rot keine Entsprechung) → bei gelb/rot Pflicht zur fachlichen Auswahl.
- **Kriterien-Checkliste** öffnet sich je nach Diagnose (Vorlagen für BPS, PTBS, KPTBS als Erstes).
- **Fallkopf** zeigt: `F60.31 G · 6D10.1 + 6D11.5` mit Wiedervorlagedatum.
- **Zwischenbilanz** erinnert an Überprüfung aller V-Diagnosen.

---

## Quellen (Recherche 08.11.2026)

- BfArM, ICD-11: https://www.bfarm.de/EN/Code-systems/Classifications/ICD/ICD-11/_node.html
- BMG, ICD-11-Umstiegsanalyse (Kurzbericht): https://www.bundesgesundheitsministerium.de/fileadmin/Dateien/5_Publikationen/Drogen_und_Sucht/Abschlussbericht/ICD-11-Umstiegsanalyse_kurzbericht_bf.pdf
- Bundestag, Petition 178918 (Abschlussbegründung 2025): https://epetitionen.bundestag.de/petitionen/_2025/_03/_06/Petition_178918.abschlussbegruendungpdf.pdf
- BfArM-Vortrag gmds 2024 (Stand Überleitung): https://www.gmds.de/fileadmin/user_upload/AG_MTK/2024-09-09_Ulrich_Vogel_gmds2024__BfArM_final.pdf
- 6D11.5 Borderline-Muster (Sekundärquelle, gegen WHO-Browser prüfen): https://www.findacode.com/icd-11/code-2006821354.html
- 6D10 Persönlichkeitsstörung (Sekundärquelle): https://www.cismef.org/page/detail/en/ICD11_CA_941859884
- Primärquelle für alle ICD-11-Codes: WHO ICD-11 Browser, icd.who.int
