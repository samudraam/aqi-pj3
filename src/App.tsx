import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import CityProvider from "./providers/city-provider";
import LandingPage from "./features/landing/landing-page";
import MistPage from "./features/processing/mist";
import ExaminePage from "./features/processing/examine";
import MorePage from "./features/processing/more";
import { DebugParticlesOnly } from "./features/processing/particlesDebug";
import ParticleView from "./features/processing/particleView";
import ConclusionPage from "./features/processing/conclusion";
/**
 * Application routing and providers.
 */
const App = () => (
  <CityProvider>
    <CssBaseline />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mist" element={<MistPage />} />
        <Route path="/examine" element={<ExaminePage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/particles-debug" element={<DebugParticlesOnly />} />
        <Route path="/particle-view" element={<ParticleView />} />
        <Route path="/conclusion" element={<ConclusionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </CityProvider>
);

export default App;
