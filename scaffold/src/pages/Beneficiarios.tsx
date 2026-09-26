import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function normalizarHash(nombre: string, fechaNacimiento: string, comunidad: string) {
  return `${nombre.replace(/\s+/g, '').toLowerCase()}|${fechaNacimiento || ''}|${comunidad.toLowerCase()}`;
}

export default function Beneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<any[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [posibleDuplicado, setPosibleDuplicado] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', fecha_nacimiento: '', sexo_genero: '', comunidad: '', municipio: '', departamento: '' });
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const { data } = await supabase.from('beneficiarios_maestro').select('*').order('created_at', { ascending: false }).limit(100);
    setBeneficiarios(data ?? []);
  }
  useEffect(() => { cargar(); }, []);

  async function verificarDuplicado() {
    const hash = normalizarHash(form.nombre, form.fecha_nacimiento, form.comunidad);
    const { data } = await supabase.from('beneficiarios_maestro').select('*').eq('hash_deduplicacion', hash).maybeSingle();
    return data;
  }

  async function manejarEnvio(e: React.FormEvent, forzarCreacion = false) {
    e.preventDefault();
    if (!forzarCreacion) {
      const existente = await verificarDuplicado();
      if (existente) {
        setPosibleDuplicado(existente);
        return;
      }
    }
    setGuardando(true);
    const { error } = await supabase.from('beneficiarios_maestro').insert(form);
    setGuardando(false);
    if (!error) {
      setForm({ nombre: '', fecha_nacimiento: '', sexo_genero: '', comunidad: '', municipio: '', departamento: '' });
      setMostrarForm(false);
      setPosibleDuplicado(null);
      cargar();
    } else {
      alert('No se pudo registrar: ' + error.message);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Beneficiarios (registro maestro)</h2>
        <button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? 'Cancelar' : '+ Nuevo beneficiario'}</button>
      </div>

      {mostrarForm && (
        <form className="panel" onSubmit={(e) => manejarEnvio(e)}>
          <div className="campo"><label>Nombre completo</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="campo"><label>Fecha de nacimiento</label>
            <input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
          </div>
          <div className="campo"><label>Comunidad</label>
            <input value={form.comunidad} onChange={(e) => setForm({ ...form, comunidad: e.target.value })} />
          </div>
          <div className="campo"><label>Municipio</label>
            <input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
          </div>

          {posibleDuplicado && (
            <div className="panel" style={{ borderColor: 'var(--color-accent)', background: '#FBF3E9' }}>
              <p style={{ marginTop: 0 }}>
                Ya existe un registro similar: <strong>{posibleDuplicado.nombre}</strong> ({posibleDuplicado.codigo_interno}) en {posibleDuplicado.comunidad}.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="secundario" onClick={() => setPosibleDuplicado(null)}>Es otra persona, cancelar</button>
                <button type="button" onClick={(e: any) => manejarEnvio(e, true)}>Registrar de todas formas</button>
              </div>
            </div>
          )}

          {!posibleDuplicado && (
            <button type="submit" disabled={guardando}>{guardando ? 'Verificando…' : 'Registrar beneficiario'}</button>
          )}
        </form>
      )}

      <div className="panel">
        <table>
          <thead><tr><th>Código</th><th>Nombre</th><th>Comunidad</th><th>Municipio</th></tr></thead>
          <tbody>
            {beneficiarios.map((b) => (
              <tr key={b.id}><td>{b.codigo_interno}</td><td>{b.nombre}</td><td>{b.comunidad}</td><td>{b.municipio}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
