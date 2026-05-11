import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import { ClinicProvider } from './store/ClinicContext'
import Admin from './pages/Admin'
import Display from './pages/Display'
import Doctor from './pages/Doctor'
import Doctors from './pages/Doctors'
import Home from './pages/Home'
import Login from './pages/Login'
import Mobile from './pages/Mobile'
import NotFound from './pages/NotFound'
import Patient from './pages/Patient'
import Settings from './pages/Settings'

export default function App() {
  return <ClinicProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/doctors" element={<Doctors />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/patient" element={<Patient />} />
          <Route path="/display" element={<Display />} />
          <Route path="/mobile" element={<Mobile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ClinicProvider>
}
