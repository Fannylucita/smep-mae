import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Perfil {
  id: string;
  nombre_completo: string;
  rol: string;
}

interface AuthContextValue {
  perfil: Perfil | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargarPerfil(userId: string) {
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, roles(nombre)')
      .eq('id', userId)
      .single();
    if (data) {
      setPerfil({
        id: data.id,
        nombre_completo: data.nombre_completo,
        rol: (data as any).roles?.nombre ?? 'consulta'
      });
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) cargarPerfil(data.session.user.id).finally(() => setCargando(false));
      else setCargando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) cargarPerfil(session.user.id);
      else setPerfil(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function iniciarSesion(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ perfil, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
