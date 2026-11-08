import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { DEMO } from "../lib/supabase";

export function Kopf({ titel, zurueck, rechts }: { titel: string; zurueck?: boolean; rechts?: ReactNode }) {
  const nav = useNavigate();
  return (
    <>
      {DEMO && <div className="demo-band">DEMO-Modus · nur Fantasiedaten · nichts wird übertragen</div>}
      <header className="kopf">
        <div className="kopf-in">
          {zurueck && <button className="zurueck" onClick={() => nav(-1)} aria-label="Zurück">‹ Zurück</button>}
          <h1>{titel}</h1>
          {rechts}
        </div>
      </header>
    </>
  );
}

const ICON: Record<string, ReactNode> = {
  heute: <path d="M12 3v2m0 14v2M5 12H3m18 0h-2M6.3 6.3 4.9 4.9m14.2 14.2-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />,
  termine: <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
  klienten: <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.2a3.5 3.5 0 0 1 0 6.6" />,
  fristen: <path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
  mehr: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />,
};

export function TabBar() {
  const tabs: [string, string, string][] = [
    ["/", "heute", "Heute"], ["/termine", "termine", "Termine"], ["/klienten", "klienten", "Klienten"],
    ["/fristen", "fristen", "Fristen"], ["/mehr", "mehr", "Mehr"],
  ];
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      <div className="tabbar-in">
        {tabs.map(([to, ic, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICON[ic]}</svg>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

type FeldProps = { label: string; children: ReactNode };
export const Feld = ({ label, children }: FeldProps) => <label className="feld"><span>{label}</span>{children}</label>;

export function Text({ label, wert, setze, typ = "text", pflicht, platzhalter }: {
  label: string; wert: string | number | null | undefined; setze: (v: string) => void;
  typ?: string; pflicht?: boolean; platzhalter?: string;
}) {
  return (
    <Feld label={label + (pflicht ? " *" : "")}>
      <input type={typ} value={wert ?? ""} required={pflicht} placeholder={platzhalter} onChange={(e) => setze(e.target.value)} />
    </Feld>
  );
}

export function Bereich({ label, wert, setze, platzhalter }: {
  label: string; wert: string | null | undefined; setze: (v: string) => void; platzhalter?: string;
}) {
  return <Feld label={label}><textarea value={wert ?? ""} placeholder={platzhalter} onChange={(e) => setze(e.target.value)} /></Feld>;
}

export function Auswahl<T extends string | number>({ label, wert, setze, optionen, leer }: {
  label: string; wert: T | null | undefined; setze: (v: T) => void;
  optionen: Record<string, string> | [T, string][]; leer?: string;
}) {
  const ops = Array.isArray(optionen) ? optionen : (Object.entries(optionen) as [T, string][]);
  return (
    <Feld label={label}>
      <select value={wert ?? ""} onChange={(e) => {
        const roh = e.target.value;
        const treffer = ops.find(([k]) => String(k) === roh);
        setze((treffer ? treffer[0] : roh) as T);
      }}>
        {leer !== undefined && <option value="">{leer}</option>}
        {ops.map(([k, v]) => <option key={String(k)} value={String(k)}>{v}</option>)}
      </select>
    </Feld>
  );
}

export const Leer = ({ children }: { children: ReactNode }) => <div className="leer">{children}</div>;

export function Fehler({ text }: { text: string | null }) {
  return text ? <div className="hinweis rot" role="alert">{text}</div> : null;
}

export const Initialen = ({ v, n }: { v: string; n: string }) =>
  <div className="avatar" aria-hidden>{(v[0] ?? "") + (n[0] ?? "")}</div>;
