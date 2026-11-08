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

## 2. Deine Verfahren

| Kurz | Verfahren (meine Annahme) | Wer wird beurteilt | Urteilsart | Einsatz | Status |
|---|---|---|---|---|---|
| FPI-R | Freiburger Persönlichkeitsinventar, revidiert | Klient/in | Selbst | Coaching + Heilkunde | Verlagsverfahren **[Kenntnisstand]** |
| SSI | **[klären]** – Selbststeuerungsinventar (Kuhl/Fuhrmann, PSI-Theorie)? | Klient/in | Selbst | Coaching + Heilkunde | **[klären]** |
| Autismus | **[klären]** – AQ, RAADS-R, SRS-2 oder anderes? | Klient/in | Selbst / Fremd | **nur Screening** | **[klären]** |
| BPI | Borderline-Persönlichkeits-Inventar (Leichsenring) | Klient/in | Selbst | klinisch → Heilkunde | Verlagsverfahren **[Kenntnisstand]** |
| EBI | Eltern-Belastungs-Inventar (Tröster), deutsche Fassung des Parenting Stress Index | Elternteil | Selbst (über Eltern- und Kindbereich) | Elterncoaching, Gutachten-Begleitung | Verlagsverfahren **[Kenntnisstand]** |
| Kinder-Screening | **[klären]** – SDQ, CBCL oder anderes? | **Kind** | **Fremd** (Elternurteil) | Elterncoaching, Gutachten-Begleitung | **[klären]** |

---

## 3. Fachliche Schwachstellen, die die App abfangen muss

1. **Screening ist keine Diagnose.** Das gilt besonders für den Autismus-Test. Eine Autismus-Diagnose bei Erwachsenen wird in Deutschland in der Regel in spezialisierten Fachambulanzen gestellt. Ein auffälliges Screening führt in der App deshalb höchstens zu „Verdacht“ (V) plus Feld „Weiterverweisung“, nie zu „gesichert“ (G). **[Kenntnisstand]**
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
| Urteilsart | Selbst · Fremd |
| Wer wird beurteilt | Klient/in · Kind · Paar |
| Altersbereich | z. B. ab 16 |
| Klinisch | ja/nein (steuert Hinweis im Coaching) |
| Nur Screening | ja/nein (sperrt „gesichert“) |
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
