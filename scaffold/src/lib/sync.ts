import { supabase } from './supabase';
import { dbLocal } from './db-local';

// Recorre la cola local y trata de insertar cada registro pendiente en Supabase.
// Si un uuid_local ya existe en el servidor, se ignora (idempotencia) en vez
// de duplicarlo. Esto evita reenvíos duplicados si la app se cierra a mitad
// de una sincronización.
export async function sincronizarCola(): Promise<{ ok: number; error: number }> {
  const pendientes = await dbLocal.cola.where('estado').anyOf('pendiente', 'error').toArray();
  let ok = 0;
  let error = 0;

  for (const item of pendientes) {
    await dbLocal.cola.update(item.id!, { estado: 'sincronizando' });
    try {
      const { data: existente } = await supabase
        .from(item.tablaDestino)
        .select('id')
        .eq('uuid_local', item.uuidLocal)
        .maybeSingle();

      if (!existente) {
        const { error: errIns } = await supabase.from(item.tablaDestino).insert(item.payload);
        if (errIns) throw errIns;
      }

      await dbLocal.cola.update(item.id!, { estado: 'completado' });
      ok++;
    } catch (e: any) {
      await dbLocal.cola.update(item.id!, {
        estado: 'error',
        intentos: item.intentos + 1,
        mensajeError: e?.message ?? 'Error desconocido'
      });
      error++;
    }
  }
  return { ok, error };
}

export function iniciarSincronizacionAutomatica() {
  const intentar = () => {
    if (navigator.onLine) sincronizarCola();
  };
  window.addEventListener('online', intentar);
  // Reintento periódico por si "online" no se dispara de forma confiable
  setInterval(intentar, 30_000);
  intentar();
}
