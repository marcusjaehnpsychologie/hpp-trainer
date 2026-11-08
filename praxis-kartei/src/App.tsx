import { HashRouter, Route, Routes } from "react-router-dom";
import { Anmeldung } from "./components/Anmeldung";
import { TabBar } from "./components/ui";
import { Heute } from "./pages/Heute";
import { Termine, TerminBearbeiten } from "./pages/Termine";
import { Klienten, PersonBearbeiten } from "./pages/Klienten";
import { Akte } from "./pages/Akte";
import { FallAnsicht, FallBearbeiten } from "./pages/Fall";
import { Sitzung } from "./pages/Sitzung";
import { Fristen } from "./pages/Fristen";
import { Mehr } from "./pages/Mehr";

// HashRouter: funktioniert auf GitHub Pages ohne Server-Konfiguration
export function App() {
  return (
    <Anmeldung>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Heute />} />
          <Route path="/termine" element={<Termine />} />
          <Route path="/termin/neu" element={<TerminBearbeiten />} />
          <Route path="/termin/:id" element={<TerminBearbeiten />} />
          <Route path="/klienten" element={<Klienten />} />
          <Route path="/person/neu" element={<PersonBearbeiten />} />
          <Route path="/person/:id/bearbeiten" element={<PersonBearbeiten />} />
          <Route path="/person/:id" element={<Akte />} />
          <Route path="/fall/neu" element={<FallBearbeiten />} />
          <Route path="/fall/:id/bearbeiten" element={<FallBearbeiten />} />
          <Route path="/fall/:id" element={<FallAnsicht />} />
          <Route path="/sitzung/:terminId" element={<Sitzung />} />
          <Route path="/fristen" element={<Fristen />} />
          <Route path="/mehr" element={<Mehr />} />
          <Route path="*" element={<Heute />} />
        </Routes>
        <TabBar />
      </HashRouter>
    </Anmeldung>
  );
}
