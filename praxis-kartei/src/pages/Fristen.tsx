import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Auswahl, Fehler, Kopf, Leer, Text } from "../components/ui";
import { datum, isoTag, tageBis } from "../lib/format";
import { store } from "../lib/store";
import { finde, offeneFristen, useStamm } from "../lib/stamm";

export function Fristen() {
  const { daten: s, fehler } = useStamm();
  const [text, setText] = useState("");
  const [tag, setTag] = useState(isoTag());
  const [fall, setFall] = useState("");
  async function anlegen(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await store.insert("frist", { text: text.trim(), faellig: tag, fall_id: fall || null, erledigt_am: null });
    setText("");
  }
  const offen = s ? offeneFristen(s) : [];
  return (
    <>
      <Kopf titel="Fristen & Aufgaben" />
      <main className="seite">
        <Fehler text={fehler} />
        <h2>Offen</h2>
        {!s ? <Leer>Lädt …</Leer> : offen.length === 0 ? <Leer>Nichts offen.</Leer> : (
          <div className="liste">
            {offen.map((f) => {
              const d = tageBis(f.faellig);
              const fa = finde(s.faelle, f.fall_id);
              return (
                <div key={f.id} className="zeile">
                  <span className={`chip ${d < 0 ? "rot" : d <= 14 ? "gelb" : "grau"}`}>{datum(f.faellig)}</span>
                  <div className="mitte">
                    <b>{f.text}</b>
                    {fa && <Link to={`/fall/${fa.id}`} className="klein">{fa.titel}</Link>}
                  </div>
                  <button className="knopf klein zweit" onClick={() => store.update("frist", f.id, { erledigt_am: isoTag() })}>erledigt</button>
                </div>
              );
            })}
          </div>
        )}
        <h2>Neue Frist</h2>
        <form className="formular karte" onSubmit={anlegen}>
          <Text label="Text" wert={text} setze={setText} pflicht />
          <div className="zwei">
            <Text label="fällig am" typ="date" wert={tag} setze={setTag} />
            <Auswahl label="Fall (optional)" wert={fall} leer="–" setze={setFall}
              optionen={(s?.faelle ?? []).map((f) => [f.id, f.titel] as [string, string])} />
          </div>
          <button className="knopf klein">Anlegen</button>
        </form>
      </main>
    </>
  );
}
