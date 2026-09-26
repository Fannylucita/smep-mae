import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

interface Resumen {
  totalProyectos: number;
  activos: number;
  finalizados: number;
  retrasados: number;
  presupuestoTotal: number;
}

export default function DashboardCartera() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('proyectos')
        .select('id, nombre, codigo, estado, presupuesto_total')
        .order('created_at', { ascending: false });

      const lista = data ?? [];
      setProyectos(lista);
      setResumen({
        totalProyectos: lista.length,
        activos: lista.filter((p) => p.estado === 'activo').length,
        finalizados: lista.filter((p) => p.estado === 'finalizado').length,
        retrasados: lista.filter((p) => p.estado === 'retrasado').length,
        presupuestoTotal: lista.reduce((acc, p) => acc + (p.presupuesto_total ?? 0), 0)
      });
      setCargando(false);
    }
    cargar();
  }, []);

  return (
    <div>
      <h2>Dashboard de cartera</h2>

      {cargando ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="panel grid-kpi">
            <div className="kpi">
              <div className="valor">{resumen?.totalProyectos ?? 0}</div>
              <div className="etiqueta">Proyectos en cartera</div>
            </div>
            <div className="kpi">
              <div className="valor">{resumen?.activos ?? 0}</div>
              <div className="etiqueta">Proyectos activos</div>
            </div>
            <div className="kpi">
              <div className="valor">{resumen?.retrasados ?? 0}</div>
              <div className="etiqueta">Proyectos retrasados</div>
            </div>
            <div className="kpi">
              <div className="valor">
                {new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 0 }).format(
                  resumen?.presupuestoTotal ?? 0
                )}
              </div>
              <div className="etiqueta">Presupuesto total</div>
            </div>
          </div>

          <div className="panel">
            <h3>Proyectos</h3>
            {proyectos.length === 0 ? (
              <p style={{ color: '#5B6558' }}>
                Aún no hay proyectos registrados. Ve a "Proyectos" para crear el primero.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {proyectos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.codigo}</td>
                      <td>{p.nombre}</td>
                      <td><span className={`badge badge-${p.estado === 'activo' ? 'aprobado' : 'borrador'}`}>{p.estado}</span></td>
                      <td><Link to={`/proyectos/${p.id}`}>Ver detalle →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
