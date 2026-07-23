import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './AppShell';
import LandingPage from './pages/LandingPage';
import MarketplacePage from './pages/MarketplacePage';
import AgentDetailPage from './pages/AgentDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/a/:agentId" element={<AgentDetailPage />} />
          <Route path="/catalog" element={<Navigate to="/marketplace" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
