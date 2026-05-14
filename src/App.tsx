import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { SchoolProtectedRoute } from './components/layout/SchoolProtectedRoute';
import { Layout } from './components/layout/Layout';

import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import PublicRegistration from './pages/PublicRegistration';
import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import Events from './pages/Events';
import Results from './pages/Results';
import PaperPresentations from './pages/PaperPresentations.tsx';
import Certificates from './pages/Certificates';
import SchoolCertificates from './pages/SchoolCertificates';
import Schools from './pages/Schools';
import SchoolRegister from './pages/SchoolRegister';
import SchoolLogin from './pages/SchoolLogin';
import SchoolDashboard from './pages/SchoolDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin auth */}
          <Route path="/login" element={<Login />} />
          {/* Public registration */}
          <Route path="/register" element={<PublicRegistration />} />

          {/* School public routes */}
          <Route path="/school/register" element={<SchoolRegister />} />
          <Route path="/school/login" element={<SchoolLogin />} />

          {/* School protected routes */}
          <Route element={<SchoolProtectedRoute />}>
            <Route path="/school/dashboard" element={<SchoolDashboard />} />
          </Route>

          {/* Admin protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/participants" element={<Participants />} />
              <Route path="/events" element={<Events />} />
              <Route path="/results" element={<Results />} />
              <Route path="/papers" element={<PaperPresentations />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/school-certificates" element={<SchoolCertificates />} />
              <Route path="/schools" element={<Schools />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
