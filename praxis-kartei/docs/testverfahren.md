# Klientenkartei – Testverfahren (Entwurf v0.1, 08.11.2026)

Teil von [`kundenkartei-konzept.md`](kundenkartei-konzept.md).
Kennzeichnung: **[Kenntnisstand]** = nicht gegen Primärquelle geprüft · **[klären]** = Angabe von Marcus nötig.

---

## 1. Grundsatz: Ergebnisse erfassen, nicht Tests nachbauen

Die meisten Verfahren sind **urheberrechtlich geschützte Verlagsprodukte** (überwiegend Hogrefe). Testitems, Auswertungsschablonen und Normtabellen dürfen nach meinem Kenntnisstand **nicht** in eine eigene App oder ein GitHub-Repo übernommen werden. Hogrefe bietet digitale Durchführung über das eigene Testsystem gegen Lizenz an. **[Kenntnisstand]**

Die Kartei macht deshalb:
- **Durchführung**: auf Papier oder im Verlagssystem
- **Erfassung in der App**: Rohwerte und Normwerte je Skala (aus Handbuch/Verlagsauswertung abgelesen), Interpretation, Scan des Bogens als Drive-Verweis
- **Darstellung**: Skalenprofil und Verlauf über mehrere Messzeitpunkte

Keine Items, keine Normtabellen im Code. Skalennamen und Wertebereiche trägst du einmalig aus dem Handbuch in den Katalog ein.

---

## 2. Deine Verfahren (bestätigt 08.11.2026)

| Kurz | Verfahren | Wer wird beurteilt | Urteilsart | Einsatz | Hinweis |
|---|---|---|---|---|---|
| FPI-R | Freiburger Persönlichkeitsinventar, revidiert (Fahrenberg, Hampel, Selg) | Klient/in | Selbst | Coaching + Heilkunde | Stanine-Profil |
| PSSI | Persönlichkeits-Stil- und Störungs-Inventar (Kuhl, Kazén) | Klient/in | Selbst | Coaching + Heilkunde | Stile ≠ Störungen; allein nicht diagnostisch |
| ADOS-2 | Diagnostische Beobachtungsskala für Autistische Störungen – 2 | Klient/in | **Beobachtung** durch Untersucher | Heilkunde | **Schulung erforderlich**; allein nicht ausreichend (Anamnese, ggf. ADI-R, Fachambulanz) |
| BPI | Borderline-Persönlichkeits-Inventar (Leichsenring) | Klient/in | Selbst | klinisch → Heilkunde | im Coaching keine diagnostische Interpretation |
| EBI | Eltern-Belastungs-Inventar (Tröster) | Elternteil | Selbst | Elterncoaching, Gutachten-Begleitung | Eltern- und Kindbereich |
| CBCL/6-18R | Child Behavior Checklist, Elternfragebogen (Achenbach; dt. Fassung) | **Kind** | **Fremd** (Elternurteil) | Elterncoaching, Gutachten-Begleitung | Altersversion prüfen (1½–5 / 6–18) |

Alle sechs liegen als Startkatalog in `supabase/migrations/0002_testverfahren_katalog.sql` – nur Stammangaben, keine Items, keine Normen. Autoren-/Verlagsangaben nach Kenntnisstand, im Katalog als „Angaben klären“ markiert.

**ADOS-2 ist kein Fragebogen**, sondern eine standardisierte Verhaltensbeobachtung (Module T, 1–4) mit Algorithmus-Klassifikation und Vergleichswert. Durchführung und Auswertung setzen nach meinem Kenntnisstand ein klinisches Training voraus. **[prüfen: ob du die Schulung hast]**

## 3. Fachliche Schwachstellen, die die App abfangen muss

1. **Ein Verfahren allein ist keine Diagnose.** Das gilt besonders für ADOS-2. Eine Autismus-Diagnose bei Erwachsenen wird in Deutschland in der Regel in spezialisierten Fachambulanzen gestellt. Ein auffälliges Screening führt in der App deshalb höchstens zu „Verdacht“ (V) plus Feld „Weiterverweisung“, nie zu „gesichert“ (G). **[Kenntnisstand]**
2. **Kinder-Screening ist ein Elternurteil, kein Befund über das Kind.** In Trennungs- und Gutachtenfällen beurteilt ein Elternteil im Konflikt das Kind. Die App speichert das als „Einschätzung von [Elternteil] über [Kind]“ und hängt es an den Fall des Elternteils. Für das Kind entsteht weder eine eigene Akte noch eine Diagnose. Bei zwei Elternteilen lassen sich zwei Elternurteile nebeneinander zeigen; Abweichungen sind fachlich oft aussagekräftiger als der Einzelwert.
3. **Einwilligung bei Kindern.** Wird das Kind selbst untersucht, braucht es bei gemeinsamem Sorgerecht nach meinem Kenntnisstand die Zustimmung **beider** Sorgeberechtigten. Die App fragt das als Pflichtfeld ab. **[Kenntnisstand, rechtlich prüfen]**
4. **BPI im Coaching.** Ein Borderline-Inventar ist ein klinisches Verfahren. In einem Coaching-Fall lässt die App es zu, zeigt aber den Hinweis, dass die Interpretation keine diagnostische Aussage sein darf.
5. **Testwerte im Gutachtenkontext sind zitierfähig.** Werden Ergebnisse später in Stellungnahmen verwendet, muss nachvollziehbar sein, welche Normstichprobe und welche Testversion galten. Deshalb sind diese Felder Pflicht.

---

## 4. Datenmodell

### 4.1 Verfahrenskatalog (einmal pro Verfahren)

| Feld | Beispiel |
|---|---|
| Kürzel, Name, Autor/en, Verlag, Auflage/Version | BPI, Borderline-Persönlichkeits-Inventar, … |
| Lizenz | Papier gekauft · Verlagssystem · frei verfügbar · ungeklärt |
| Urteilsart | Selbst · Fremd · Beobachtung |
| Wer wird beurteilt | Klient/in · Kind · Paar |
| Altersbereich | z. B. ab 16 |
| Klinisch | ja/nein (steuert Hinweis im Coaching) |
| Allein nicht diagnostisch | ja/nein (sperrt „gesichert“, wenn die Diagnose nur darauf beruht) |
| Schulung erforderlich | ja/nein |
| Skalen | Liste: Name, Normwert-Typ (T-Wert · Stanine · Prozentrang · Rohwert), Wertebereich, Auffälligkeitsgrenze **(nur wenn du sie aus dem Handbuch einträgst)** |

### 4.2 Messung (pro Durchführung)

| Feld | Inhalt |
|---|---|
| Fall, Verfahren | |
| beurteilte Person | Klient/in oder Kind |
| beurteilende Person | bei Fremdurteil: welcher Elternteil |
| Datum, Messzeitpunkt | Prä · Verlauf · Post · einmalig |
| Durchführung | Papier · Verlagssystem |
| Normstichprobe | z. B. Gesamt, Geschlecht, Alter |
| Skalenwerte | Rohwert + Normwert je Skala |
| Validitätshinweise | z. B. Offenheits-/Kontrollskalen, Antworttendenz |
| Interpretation | drei Ebenen: Ergebnis · Einordnung · Grenzen |
| Scan | Drive-Verweis auf den ausgefüllten Bogen |
| Einwilligung | Verweis (bei Kindern: beide Sorgeberechtigte) |

### 4.3 Darstellung

- **Profil**: alle Skalen eines Verfahrens als Balken- oder Linienprofil mit Normbereich (z. B. Stanine 4–6, T 40–60)
- **Verlauf**: dieselbe Skala über Messzeitpunkte (Prä → Post)
- **Vergleich**: zwei Elternurteile über dasselbe Kind nebeneinander

---

## 5. Erweiterung

Weitere Verfahren legst du im Katalog an, ohne Programmierung: Name, Skalen, Wertebereiche. Bei jedem neuen Verfahren wird der Lizenzstatus abgefragt.
