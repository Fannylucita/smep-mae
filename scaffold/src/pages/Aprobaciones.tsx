import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function Aprobaciones() {
  const { perfil } = useAuth();
  const [visitas, setVisitas] = useState<any[]>([]);

  async function cargar() {
    const { data } = await supabase
      .from('visitas')
      .select('id, fecha, observaciones, avance_reportado, estado, proyectos(nombre), tecnicos(id)')
      .in('estado', ['borrador', 'enviado'])
      .order('fecha', { ascending: false });
    setVisitas(data ?? []);
  }
  useEffect(() => { cargar(); }, []);

  async function revisar(id: string, nuevoEstado: 'aprobado' | 'rechazado') {
    await supabase.from('visitas').update({
      estado: nuevoEstado,
      revisado_por: perfil?.id,
      fecha_revision: new Date().toISOString()
    }).eq('id', id);
    cargar();
  }

  return (
    <div>
      <h2>Aprobación de informes de campo</h2>
      <p style={{ color: '#5B6558', marginTop: -8 }}>
        Solo las visitas y mediciones aprobadas cuentan para los indicadores oficiales y los dashboards.
      </p>
      <div className="panel">
        {visitas.length === 0 ? (
          <p style={{ color: '#5B6558' }}>No hay informes pendientes de revisión.</p>
        ) : (
          <table>
            <thead><tr><th>Fecha</th><th>Proyecto</th><th>Avance</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {visitas.map((v) => (
                <tr key={v.id}>
                  <td>{v.fecha}</td>
                  <td>{v.proyectos?.nombre}</td>
                  <td>{v.avance_reportado ?? '—'}%</td>
                  <td><span className={`badge badge-${v.estado}`}>{v.estado}</span></td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => revisar(v.id, 'aprobado')}>Aprobar</button>
                    <button className="secundario" onClick={() => revisar(v.id, 'rechazado')}>Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
