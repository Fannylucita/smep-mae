import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

export default function Proyectos() {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const { data } = await supabase.from('proyectos').select('*').order('created_at', { ascending: false });
    setProyectos(data ?? []);
  }

  useEffect(() => { cargar(); }, []);

  async function crearProyecto(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const { error } = await supabase.from('proyectos').insert({ nombre, codigo, estado: 'activo' });
    setGuardando(false);
    if (!error) {
      setNombre('');
      setCodigo('');
      setMostrarForm(false);
      cargar();
    } else {
      alert('No se pudo crear el proyecto: ' + error.message);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Proyectos</h2>
        <button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? 'Cancelar' : '+ Nuevo proyecto'}</button>
      </div>

      {mostrarForm && (
        <form className="panel" onSubmit={crearProyecto}>
          <div className="campo">
            <label>Nombre del proyecto</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="campo">
            <label>Código único</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} required placeholder="Ej: PROY-001" />
          </div>
          <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Crear proyecto'}</button>
        </form>
      )}

      <div className="panel">
        <table>
          <thead>
            <tr><th>Código</th><th>Nombre</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {proyectos.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.nombre}</td>
                <td><span className="badge badge-aprobado">{p.estado}</span></td>
                <td><Link to={`/proyectos/${p.id}`}>Ver detalle →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
