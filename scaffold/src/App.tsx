import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import RutaProtegida from '@/components/RutaProtegida';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import DashboardCartera from '@/pages/DashboardCartera';
import Proyectos from '@/pages/Proyectos';
import ProyectoDetalle from '@/pages/ProyectoDetalle';
import Beneficiarios from '@/pages/Beneficiarios';
import NuevaVisita from '@/pages/NuevaVisita';
import Aprobaciones from '@/pages/Aprobaciones';
import EnConstruccion from '@/pages/EnConstruccion';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            <Route index element={<DashboardCartera />} />
            <Route path="programas" element={<EnConstruccion titulo="Programas" />} />
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="proyectos/:id" element={<ProyectoDetalle />} />
            <Route path="beneficiarios" element={<Beneficiarios />} />
            <Route path="tecnicos" element={<EnConstruccion titulo="Técnicos" />} />
            <Route path="mapa-cartera" element={<EnConstruccion titulo="Mapa de cartera" />} />
            <Route path="reportes" element={<EnConstruccion titulo="Reportes" />} />
            <Route path="evaluacion" element={<EnConstruccion titulo="Evaluación" />} />
            <Route path="alertas" element={<EnConstruccion titulo="Alertas" />} />

            <Route path="mis-proyectos" element={<EnConstruccion titulo="Mis proyectos" />} />
            <Route path="mis-actividades" element={<EnConstruccion titulo="Mis actividades" />} />
            <Route path="mis-indicadores" element={<EnConstruccion titulo="Mis indicadores" />} />
            <Route path="mis-visitas" element={<EnConstruccion titulo="Mis visitas" />} />
            <Route path="visitas/nueva" element={<NuevaVisita />} />
            <Route path="mis-pendientes" element={<EnConstruccion titulo="Mis pendientes" />} />

            <Route path="aprobaciones" element={<Aprobaciones />} />
            <Route path="evidencias" element={<EnConstruccion titulo="Evidencias" />} />

            <Route path="admin/usuarios" element={<EnConstruccion titulo="Usuarios" />} />
            <Route path="admin/roles" element={<EnConstruccion titulo="Roles" />} />
            <Route path="admin/catalogos" element={<EnConstruccion titulo="Catálogos" />} />
            <Route path="admin/configuracion" element={<EnConstruccion titulo="Configuración" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
