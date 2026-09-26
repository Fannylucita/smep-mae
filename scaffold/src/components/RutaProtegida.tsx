import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

export default function RutaProtegida({ children }: { children: ReactNode }) {
  const { perfil, cargando } = useAuth();
  if (cargando) return <p style={{ padding: '2rem' }}>Cargando…</p>;
  if (!perfil) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
