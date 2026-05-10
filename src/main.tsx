import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Protected } from './components/Protected';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { BookingsPage } from './pages/BookingsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DoctorPage } from './pages/DoctorPage';
import { PatientPage } from './pages/PatientPage';
import { DisplayPage } from './pages/DisplayPage';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/patient" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/patient" element={<PatientPage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/admin" element={<Protected roles={["admin", "reception"]}><AdminPage /></Protected>} />
          <Route path="/admin/bookings" element={<Protected roles={["admin", "reception"]}><BookingsPage /></Protected>} />
          <Route path="/admin/doctors" element={<Protected roles={["admin"]}><DoctorsPage /></Protected>} />
          <Route path="/doctor" element={<Protected roles={["admin", "doctor", "reception"]}><DoctorPage /></Protected>} />
          <Route path="*" element={<Navigate to="/patient" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
