import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const PESTANAS = [
  'Resumen', 'Marco lógico', 'Indicadores', 'Actividades', 'Cronograma',
  'Presupuesto', 'Beneficiarios', 'Visitas', 'Mapa'
] as const;

export default function ProyectoDetalle() {
  const { id } = useParams();
  const [proyecto, setProyecto] = useState<any>(null);
  const [pestana, setPestana] = useState<typeof PESTANAS[number]>('Resumen');
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);

  useEffect(() => {
    async function cargar() {
      const { data: p } = await supabase.from('proyectos').select('*').eq('id', id).single();
      setProyecto(p);
      const { data: ind } = await supabase.from('indicadores').select('*').eq('proyecto_id', id);
      setIndicadores(ind ?? []);
      const { data: act } = await supabase.from('actividades').select('*').eq('proyecto_id', id);
      setActividades(act ?? []);
    }
    if (id) cargar();
  }, [id]);

  if (!proyecto) return <p>Cargando…</p>;

  return (
    <div>
      <h2>{proyecto.nombre}</h2>
      <p style={{ color: '#5B6558', marginTop: -8 }}>{proyecto.codigo} · {proyecto.estado}</p>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {PESTANAS.map((p) => (
          <button
            key={p}
            className={pestana === p ? '' : 'secundario'}
            onClick={() => setPestana(p)}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="panel">
        {pestana === 'Resumen' && (
          <div>
            <p><strong>Descripción:</strong> {proyecto.descripcion || 'Sin descripción registrada.'}</p>
            <p><strong>Presupuesto total:</strong> {proyecto.presupuesto_total ?? 0}</p>
          </div>
        )}

        {pestana === 'Indicadores' && (
          <>
            {indicadores.length === 0 ? (
              <p style={{ color: '#5B6558' }}>Este proyecto todavía no tiene indicadores configurados.</p>
            ) : (
              <table>
                <thead><tr><th>Código</th><th>Nombre</th><th>Meta</th><th>Unidad</th></tr></thead>
                <tbody>
                  {indicadores.map((i) => (
                    <tr key={i.id}><td>{i.codigo}</td><td>{i.nombre}</td><td>{i.meta}</td><td>{i.unidad_medida}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {pestana === 'Actividades' && (
          <>
            {actividades.length === 0 ? (
              <p style={{ color: '#5B6558' }}>Este proyecto todavía no tiene actividades registradas.</p>
            ) : (
              <table>
                <thead><tr><th>Nombre</th><th>Estado</th><th>Inicio plan.</th><th>Fin plan.</th></tr></thead>
                <tbody>
                  {actividades.map((a) => (
                    <tr key={a.id}><td>{a.nombre}</td><td>{a.estado}</td><td>{a.fecha_inicio_plan}</td><td>{a.fecha_fin_plan}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {!['Resumen', 'Indicadores', 'Actividades'].includes(pestana) && (
          <p style={{ color: '#5B6558' }}>
            Módulo "{pestana}" — estructura de página lista; la lógica específica se conecta en la siguiente iteración de desarrollo.
          </p>
        )}
      </div>
    </div>
  );
}
