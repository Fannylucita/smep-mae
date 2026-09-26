import Dexie, { type Table } from 'dexie';

// Todo lo que el técnico necesita en campo se cachea aquí.
// Los registros creados offline se guardan con un uuid_local
// y quedan en "cola" hasta que haya conexión para subirlos.

export interface ColaItem {
  id?: number;
  uuidLocal: string;
  tablaDestino: 'visitas' | 'mediciones_indicador' | 'evidencias';
  payload: Record<string, unknown>;
  estado: 'pendiente' | 'sincronizando' | 'completado' | 'error';
  intentos: number;
  fechaCreacionLocal: string;
  mensajeError?: string;
}

export interface CacheProyecto {
  id: string;
  nombre: string;
  data: Record<string, unknown>;
}

class BaseLocal extends Dexie {
  cola!: Table<ColaItem, number>;
  proyectosCache!: Table<CacheProyecto, string>;
  actividadesCache!: Table<CacheProyecto, string>;
  indicadoresCache!: Table<CacheProyecto, string>;
  beneficiariosCache!: Table<CacheProyecto, string>;

  constructor() {
    super('sistema_mye_offline');
    this.version(1).stores({
      cola: '++id, uuidLocal, estado',
      proyectosCache: 'id',
      actividadesCache: 'id',
      indicadoresCache: 'id',
      beneficiariosCache: 'id'
    });
  }
}

export const dbLocal = new BaseLocal();

export function generarUuid(): string {
  return crypto.randomUUID();
}

export async function encolar(item: Omit<ColaItem, 'id' | 'estado' | 'intentos'>) {
  return dbLocal.cola.add({ ...item, estado: 'pendiente', intentos: 0 });
}
