import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const mensaje = await iniciarSesion(email, password);
    if (mensaje) setError(mensaje);
    setEnviando(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={manejarEnvio} className="panel" style={{ width: 340 }}>
        <h1 style={{ color: 'var(--color-brand)' }}>Sistema M&E de Proyectos</h1>
        <p style={{ color: '#5B6558', marginTop: -8, marginBottom: 20, fontSize: '0.88rem' }}>
          Ingresa con tu correo y contraseña.
        </p>
        <div className="campo">
          <label>Correo electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="campo">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}
        <button type="submit" disabled={enviando} style={{ width: '100%' }}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
