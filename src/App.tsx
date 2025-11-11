import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import CityProvider from "./providers/city-provider";
import LandingPage from "./features/landing/landing-page";
import ProcessingPage from "./features/processing/processing-page";
import ProcessingSuccessPage from "./features/processing/processing-success-page";

/**
 * Application routing and providers.
 */
const App = () => (
  <CityProvider>
    <CssBaseline />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/processing" element={<ProcessingPage />} />
        <Route path="/processing/success" element={<ProcessingSuccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </CityProvider>
);

export default App;
