import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const enlace = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

export default function Layout() {
  const { perfil, cerrarSesion } = useAuth();
  const [enLinea, setEnLinea] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setEnLinea(true);
    const off = () => setEnLinea(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const esTecnico = perfil?.rol === 'tecnico';

  return (
    <div>
      {!enLinea && <div className="estado-offline">Sin conexión — tus registros se guardan localmente y se sincronizarán al reconectar.</div>}
      <div className="app-shell">
        <aside className="sidebar">
          <h1>M&E de Proyectos</h1>
          <nav>
            <NavLink to="/" end className={enlace}>Dashboard de cartera</NavLink>
            <NavLink to="/programas" className={enlace}>Programas</NavLink>
            <NavLink to="/proyectos" className={enlace}>Proyectos</NavLink>
            <NavLink to="/beneficiarios" className={enlace}>Beneficiarios</NavLink>
            <NavLink to="/tecnicos" className={enlace}>Técnicos</NavLink>
            <NavLink to="/mapa-cartera" className={enlace}>Mapa de cartera</NavLink>
            <NavLink to="/reportes" className={enlace}>Reportes</NavLink>

            {esTecnico && (
              <>
                <div className="grupo">Mi trabajo</div>
                <NavLink to="/mis-proyectos" className={enlace}>Mis proyectos</NavLink>
                <NavLink to="/mis-actividades" className={enlace}>Mis actividades</NavLink>
                <NavLink to="/mis-indicadores" className={enlace}>Mis indicadores</NavLink>
                <NavLink to="/mis-visitas" className={enlace}>Mis visitas</NavLink>
                <NavLink to="/visitas/nueva" className={enlace}>+ Nueva visita</NavLink>
              </>
            )}

            {(perfil?.rol === 'supervisor' || perfil?.rol === 'admin') && (
              <>
                <div className="grupo">Monitoreo</div>
                <NavLink to="/aprobaciones" className={enlace}>Aprobaciones</NavLink>
              </>
            )}

            {perfil?.rol === 'admin' && (
              <>
                <div className="grupo">Administración</div>
                <NavLink to="/admin/usuarios" className={enlace}>Usuarios</NavLink>
                <NavLink to="/admin/catalogos" className={enlace}>Catálogos</NavLink>
              </>
            )}
          </nav>
          <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#B9C4B4' }}>
            <div>{perfil?.nombre_completo}</div>
            <div style={{ opacity: 0.8 }}>{perfil?.rol}</div>
            <button className="secundario" style={{ marginTop: '0.6rem', color: '#fff', borderColor: '#4A6B54' }} onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
