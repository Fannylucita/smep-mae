import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { dbLocal, encolar, generarUuid } from '@/lib/db-local';
import { sincronizarCola } from '@/lib/sync';

export default function NuevaVisita() {
  const { perfil } = useAuth();
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [proyectoId, setProyectoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [avance, setAvance] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null);
  const [guardado, setGuardado] = useState<'idle' | 'local' | 'sincronizado'>('idle');

  useEffect(() => {
    // Intenta traer proyectos asignados; si no hay conexión, usa el caché local.
    async function cargar() {
      if (navigator.onLine) {
        const { data } = await supabase
          .from('asignaciones')
          .select('proyecto_id, proyectos(id, nombre)')
          .eq('tecnico_id', perfil?.id)
          .eq('activo', true);
        const lista = (data ?? []).map((a: any) => a.proyectos).filter(Boolean);
        setProyectos(lista);
        for (const p of lista) await dbLocal.proyectosCache.put({ id: p.id, nombre: p.nombre, data: p });
      } else {
        const cache = await dbLocal.proyectosCache.toArray();
        setProyectos(cache.map((c) => ({ id: c.id, nombre: c.nombre })));
      }
    }
    if (perfil) cargar();
  }, [perfil]);

  function capturarUbicacion() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoordenadas({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('No se pudo obtener la ubicación GPS. Verifica los permisos.')
    );
  }

  async function guardarVisita(e: React.FormEvent) {
    e.preventDefault();
    const uuidLocal = generarUuid();

    const payload = {
      uuid_local: uuidLocal,
      proyecto_id: proyectoId,
      tecnico_id: perfil?.id,
      fecha: new Date().toISOString().slice(0, 10),
      observaciones,
      avance_reportado: avance ? Number(avance) : null,
      estado: 'borrador' as const
    };

    // Guarda coordenadas como punto GIS ligado a esta visita al sincronizar (simplificado aquí: se anexa al payload)
    await encolar({
      uuidLocal,
      tablaDestino: 'visitas',
      payload: { ...payload, _coordenadas: coordenadas },
      fechaCreacionLocal: new Date().toISOString()
    });

    setGuardado('local');

    if (navigator.onLine) {
      const resultado = await sincronizarCola();
      if (resultado.ok > 0) setGuardado('sincronizado');
    }
  }

  if (guardado !== 'idle') {
    return (
      <div className="panel">
        <h3>Visita guardada</h3>
        <p>
          {guardado === 'sincronizado'
            ? 'La visita se guardó y ya se sincronizó con el servidor. Queda en estado "borrador" hasta que el Responsable de Monitoreo la revise.'
            : 'La visita se guardó en este dispositivo. Se sincronizará automáticamente cuando haya conexión a Internet.'}
        </p>
        <button onClick={() => { setGuardado('idle'); setObservaciones(''); setAvance(''); setCoordenadas(null); }}>
          Registrar otra visita
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Nueva visita de campo</h2>
      <form className="panel" onSubmit={guardarVisita}>
        <div className="campo">
          <label>Proyecto</label>
          <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)} required>
            <option value="">Selecciona un proyecto</option>
            {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Avance reportado (%)</label>
          <input type="number" min={0} max={100} value={avance} onChange={(e) => setAvance(e.target.value)} />
        </div>
        <div className="campo">
          <label>Observaciones</label>
          <textarea rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </div>
        <div className="campo">
          <label>Ubicación GPS</label>
          <button type="button" className="secundario" onClick={capturarUbicacion}>
            {coordenadas ? `Capturado: ${coordenadas.lat.toFixed(5)}, ${coordenadas.lng.toFixed(5)}` : 'Capturar mi ubicación'}
          </button>
        </div>
        <button type="submit">Guardar visita</button>
      </form>
    </div>
  );
}
