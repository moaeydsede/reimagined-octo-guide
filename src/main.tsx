import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Protected } from './components/Shell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DoctorPage } from './pages/DoctorPage';
import { PatientPage } from './pages/PatientPage';
import { DisplayPage } from './pages/DisplayPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles/global.css';

const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/patient" element={<PatientPage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/admin" element={<Protected roles={["admin", "reception"]}><AdminPage /></Protected>} />
          <Route path="/admin/doctors" element={<Protected roles={["admin", "reception"]}><DoctorsPage /></Protected>} />
          <Route path="/doctor" element={<Protected roles={["admin", "reception", "doctor"]}><DoctorPage /></Protected>} />
          <Route path="/reports" element={<Protected roles={["admin", "reception"]}><ReportsPage /></Protected>} />
          <Route path="/settings" element={<Protected roles={["admin", "reception", "doctor"]}><SettingsPage /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
