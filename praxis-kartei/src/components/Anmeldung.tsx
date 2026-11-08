// Anmeldung mit Passwort + Pflicht zum zweiten Faktor (Authenticator-App, TOTP).
// Die Datenbank gibt Daten nur bei Zwei-Faktor-Anmeldung (aal2) heraus.
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { DEMO, supabase } from "../lib/supabase";
import { Fehler, Text } from "./ui";

type Zustand = "laden" | "abgemeldet" | "einrichten" | "pruefen" | "fertig";

export function Anmeldung({ children }: { children: ReactNode }) {
  const [zustand, setZustand] = useState<Zustand>(DEMO ? "fertig" : "laden");

  async function bestimme() {
    const { data: { session } } = await supabase!.auth.getSession();
    if (!session) return setZustand("abgemeldet");
    const { data } = await supabase!.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel === "aal2") return setZustand("fertig");
    setZustand(data?.nextLevel === "aal2" ? "pruefen" : "einrichten");
  }

  useEffect(() => {
    if (DEMO) return;
    bestimme();
    const { data } = supabase!.auth.onAuthStateChange(() => { bestimme(); });
    return () => data.subscription.unsubscribe();
  }, []);

  if (zustand === "fertig") return <>{children}</>;
  if (zustand === "laden") return <div className="anmeldung leise">Lädt …</div>;
  if (zustand === "abgemeldet") return <Login />;
  if (zustand === "einrichten") return <FaktorEinrichten onFertig={bestimme} />;
  return <FaktorPruefen onFertig={bestimme} />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  async function senden(e: FormEvent) {
    e.preventDefault(); setLaeuft(true); setFehler(null);
    const { error } = await supabase!.auth.signInWithPassword({ email, password: pw });
    if (error) setFehler("Anmeldung fehlgeschlagen: " + error.message);
    setLaeuft(false);
  }
  return (
    <form className="anmeldung formular" onSubmit={senden}>
      <h1>Praxis-Kartei</h1>
      <Text label="E-Mail" typ="email" wert={email} setze={setEmail} pflicht />
      <Text label="Passwort" typ="password" wert={pw} setze={setPw} pflicht />
      <Fehler text={fehler} />
      <button className="knopf" disabled={laeuft}>Anmelden</button>
    </form>
  );
}

function FaktorEinrichten({ onFertig }: { onFertig: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [geheim, setGeheim] = useState<string | null>(null);
  const [faktorId, setFaktorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // nicht abgeschlossene Faktoren aus früheren Versuchen entfernen
      const { data: liste } = await supabase!.auth.mfa.listFactors();
      for (const f of liste?.all ?? []) if (f.status !== "verified") await supabase!.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await supabase!.auth.mfa.enroll({ factorType: "totp", friendlyName: "iPhone" });
      if (error) return setFehler(error.message);
      setFaktorId(data.id); setQr(data.totp.qr_code); setGeheim(data.totp.secret);
    })();
  }, []);

  async function bestaetigen(e: FormEvent) {
    e.preventDefault(); setFehler(null);
    const { error } = await supabase!.auth.mfa.challengeAndVerify({ factorId: faktorId!, code: code.trim() });
    if (error) return setFehler("Code ungültig: " + error.message);
    onFertig();
  }

  return (
    <form className="anmeldung formular" onSubmit={bestaetigen}>
      <h1>Zweiter Faktor einrichten</h1>
      <p className="leise">Einmalig: QR-Code mit einer Authenticator-App scannen (z. B. die in iOS integrierte Passwort-App, Google Authenticator oder 1Password) und den 6-stelligen Code eingeben.</p>
      {qr && <div className="qr"><img src={qr} alt="QR-Code für die Authenticator-App" /></div>}
      {geheim && <p className="leise klein">Manuell: <code>{geheim}</code></p>}
      <Text label="Code aus der App" wert={code} setze={setCode} pflicht />
      <Fehler text={fehler} />
      <button className="knopf" disabled={!faktorId}>Bestätigen</button>
      <button type="button" className="knopf zweit" onClick={() => supabase!.auth.signOut()}>Abmelden</button>
    </form>
  );
}

function FaktorPruefen({ onFertig }: { onFertig: () => void }) {
  const [code, setCode] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  async function senden(e: FormEvent) {
    e.preventDefault(); setFehler(null);
    const { data } = await supabase!.auth.mfa.listFactors();
    const faktor = data?.totp[0];
    if (!faktor) return setFehler("Kein zweiter Faktor gefunden.");
    const { error } = await supabase!.auth.mfa.challengeAndVerify({ factorId: faktor.id, code: code.trim() });
    if (error) return setFehler("Code ungültig: " + error.message);
    onFertig();
  }
  return (
    <form className="anmeldung formular" onSubmit={senden}>
      <h1>Bestätigung</h1>
      <p className="leise">6-stelligen Code aus der Authenticator-App eingeben.</p>
      <Text label="Code" wert={code} setze={setCode} pflicht />
      <Fehler text={fehler} />
      <button className="knopf">Weiter</button>
      <button type="button" className="knopf zweit" onClick={() => supabase!.auth.signOut()}>Abmelden</button>
    </form>
  );
}
