-- ============================================================================
-- SISTEMA DE MONITOREO, EVALUACIÓN Y GESTIÓN DE PROYECTOS
-- Script único de creación de base de datos
-- Cómo usar: copiar TODO este archivo y pegarlo en Supabase → SQL Editor → Run
-- ============================================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- ============================================================================
-- 1. ROLES Y USUARIOS
-- ============================================================================

create table roles (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique check (nombre in
    ('admin','coordinador','supervisor','tecnico','evaluador','contraparte','consulta')),
  descripcion text
);

insert into roles (nombre, descripcion) values
  ('admin','Administra usuarios, proyectos, catálogos y configuración'),
  ('coordinador','Consulta cartera y proyectos asignados'),
  ('supervisor','Responsable de Monitoreo: aprueba informes de campo'),
  ('tecnico','Técnico de campo: registra visitas y avances'),
  ('evaluador','Analiza indicadores e historia'),
  ('contraparte','Acceso limitado según configuración del proyecto'),
  ('consulta','Solo lectura de dashboards y reportes');

-- Perfiles, uno por cada usuario de auth.users
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  telefono text,
  rol_id uuid not null references roles(id),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table permisos (
  id uuid primary key default uuid_generate_v4(),
  rol_id uuid not null references roles(id) on delete cascade,
  modulo text not null,
  puede_ver boolean not null default false,
  puede_crear boolean not null default false,
  puede_editar boolean not null default false,
  puede_validar boolean not null default false,
  puede_aprobar boolean not null default false,
  puede_eliminar boolean not null default false,
  unique (rol_id, modulo)
);

-- ============================================================================
-- 2. PROGRAMAS, PROYECTOS, SECTORES
-- ============================================================================

create table sectores (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique
);

insert into sectores (nombre) values
  ('Seguridad alimentaria'),('Agricultura'),('Agricultura familiar'),
  ('Agricultura de precisión'),('Ganadería'),('Desarrollo rural'),
  ('Forestal'),('Medio ambiente'),('Gestión de recursos naturales'),
  ('Cambio climático'),('Restauración ambiental');

create table programas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  descripcion text,
  fecha_inicio date,
  fecha_fin date,
  estado text not null default 'activo' check (estado in ('activo','finalizado','suspendido')),
  created_at timestamptz not null default now()
);

create table proyectos (
  id uuid primary key default uuid_generate_v4(),
  programa_id uuid references programas(id) on delete set null,
  nombre text not null,
  codigo text not null unique,
  descripcion text,
  fecha_inicio date,
  fecha_fin date,
  estado text not null default 'activo' check (estado in ('activo','finalizado','suspendido','retrasado')),
  presupuesto_total numeric(14,2) default 0,
  ubicacion_general text,
  created_at timestamptz not null default now(),
  created_by uuid references perfiles(id)
);

create table proyecto_sectores (
  proyecto_id uuid references proyectos(id) on delete cascade,
  sector_id uuid references sectores(id) on delete cascade,
  primary key (proyecto_id, sector_id)
);

-- ============================================================================
-- 3. MARCO LÓGICO E INDICADORES
-- ============================================================================

create table marco_logico_elementos (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  nivel text not null check (nivel in ('impacto','resultado','producto','actividad')),
  padre_id uuid references marco_logico_elementos(id) on delete cascade,
  codigo text,
  nombre text not null,
  descripcion text,
  orden integer default 0
);

create table formulas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  tipo text not null check (tipo in ('porcentaje_meta','suma','promedio','conteo','personalizada')),
  expresion text not null, -- ej: "valor_alcanzado / meta * 100"
  variables jsonb default '{}'::jsonb,
  descripcion text
);

insert into formulas (nombre, tipo, expresion, descripcion) values
  ('Porcentaje de cumplimiento','porcentaje_meta','valor_alcanzado / meta * 100','Fórmula estándar de avance');

create table indicadores (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  marco_logico_elemento_id uuid references marco_logico_elementos(id) on delete set null,
  codigo text not null,
  nombre text not null,
  descripcion text,
  unidad_medida text,
  linea_base numeric,
  fecha_linea_base date,
  meta numeric,
  fecha_meta date,
  frecuencia_medicion text check (frecuencia_medicion in ('mensual','trimestral','semestral','anual','unica')),
  formula_id uuid references formulas(id),
  responsable_id uuid references perfiles(id),
  estado text not null default 'activo' check (estado in ('activo','cerrado')),
  unique (proyecto_id, codigo)
);

create table mediciones_indicador (
  id uuid primary key default uuid_generate_v4(),
  indicador_id uuid not null references indicadores(id) on delete cascade,
  fecha_medicion date not null,
  valor numeric not null,
  fuente_verificacion text,
  metodo_captura text default 'manual' check (metodo_captura in ('manual','calculado')),
  observaciones text,
  estado text not null default 'borrador' check (estado in ('borrador','enviado','aprobado','rechazado')),
  visita_id uuid, -- FK definida más abajo tras crear "visitas"
  revisado_por uuid references perfiles(id),
  fecha_revision timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references perfiles(id)
);

-- ============================================================================
-- 4. ACTIVIDADES
-- ============================================================================

create table actividades (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  marco_logico_elemento_id uuid references marco_logico_elementos(id) on delete set null,
  codigo text,
  nombre text not null,
  descripcion text,
  responsable_id uuid references perfiles(id),
  fecha_inicio_plan date,
  fecha_fin_plan date,
  fecha_inicio_real date,
  fecha_fin_real date,
  meta_fisica numeric,
  unidad text,
  estado text not null default 'no_iniciada'
    check (estado in ('no_iniciada','en_ejecucion','completada','retrasada','adelantada','suspendida'))
);

create table actividad_indicadores (
  actividad_id uuid references actividades(id) on delete cascade,
  indicador_id uuid references indicadores(id) on delete cascade,
  primary key (actividad_id, indicador_id)
);

-- ============================================================================
-- 5. TÉCNICOS Y ASIGNACIONES
-- ============================================================================

create table tecnicos (
  id uuid primary key references perfiles(id) on delete cascade,
  especialidad text,
  zona_asignada text
);

create table asignaciones (
  id uuid primary key default uuid_generate_v4(),
  tecnico_id uuid not null references tecnicos(id) on delete cascade,
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  actividad_id uuid references actividades(id) on delete cascade,
  indicador_id uuid references indicadores(id) on delete cascade,
  fecha_asignacion date not null default current_date,
  activo boolean not null default true
);

-- ============================================================================
-- 6. BENEFICIARIOS (con deduplicación)
-- ============================================================================

create table beneficiarios_maestro (
  id uuid primary key default uuid_generate_v4(),
  codigo_interno text not null unique, -- generado por trigger, ej: BEN-000123
  nombre text not null,
  fecha_nacimiento date,
  sexo_genero text,
  pertenece_pueblo_indigena boolean default false,
  pueblo_indigena text,
  documento_identidad text,
  hash_deduplicacion text, -- normalizado: nombre + fecha_nacimiento + comunidad
  comunidad text,
  municipio text,
  departamento text,
  created_at timestamptz not null default now()
);

create index idx_beneficiarios_hash on beneficiarios_maestro (hash_deduplicacion);

create table posibles_duplicados (
  id uuid primary key default uuid_generate_v4(),
  beneficiario_id_1 uuid references beneficiarios_maestro(id),
  beneficiario_id_2 uuid references beneficiarios_maestro(id),
  score_similitud numeric,
  estado_revision text not null default 'pendiente'
    check (estado_revision in ('pendiente','confirmado_duplicado','confirmado_diferente')),
  revisado_por uuid references perfiles(id),
  created_at timestamptz not null default now()
);

create table beneficiario_participacion (
  id uuid primary key default uuid_generate_v4(),
  beneficiario_id uuid not null references beneficiarios_maestro(id) on delete cascade,
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  componente_actividad_id uuid references actividades(id) on delete set null,
  organizacion text,
  fecha_incorporacion date default current_date,
  estado text not null default 'activo' check (estado in ('activo','inactivo','egresado')),
  unique (beneficiario_id, proyecto_id, componente_actividad_id)
);

-- Secuencia y función para generar código interno de beneficiario
create sequence if not exists beneficiario_codigo_seq;

create or replace function generar_codigo_beneficiario()
returns trigger as $$
begin
  if new.codigo_interno is null then
    new.codigo_interno := 'BEN-' || lpad(nextval('beneficiario_codigo_seq')::text, 6, '0');
  end if;
  new.hash_deduplicacion := lower(regexp_replace(coalesce(new.nombre,''), '\s+', '', 'g'))
    || '|' || coalesce(new.fecha_nacimiento::text,'')
    || '|' || lower(coalesce(new.comunidad,''));
  return new;
end;
$$ language plpgsql;

create trigger trg_codigo_beneficiario
  before insert or update on beneficiarios_maestro
  for each row execute function generar_codigo_beneficiario();

-- ============================================================================
-- 7. CONTRAPARTIDAS Y PRESUPUESTO
-- ============================================================================

create table contrapartidas (
  id uuid primary key default uuid_generate_v4(),
  beneficiario_id uuid references beneficiarios_maestro(id) on delete set null,
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  actividad_id uuid references actividades(id) on delete set null,
  tipo_aporte text not null,
  cantidad numeric,
  unidad text,
  valor_unitario numeric,
  valor_total numeric generated always as (coalesce(cantidad,0) * coalesce(valor_unitario,0)) stored,
  fecha date default current_date,
  fuente_valoracion text,
  observaciones text
);

create table presupuesto (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  componente_id uuid references marco_logico_elementos(id) on delete set null,
  periodo text,
  monto_aprobado numeric(14,2) not null default 0,
  fuente_financiamiento text
);

create table ejecucion_financiera (
  id uuid primary key default uuid_generate_v4(),
  presupuesto_id uuid not null references presupuesto(id) on delete cascade,
  fecha date not null default current_date,
  monto_ejecutado numeric(14,2) not null,
  descripcion text,
  estado text not null default 'borrador' check (estado in ('borrador','aprobado'))
);

-- ============================================================================
-- 8. GIS: PUNTOS Y POLÍGONOS (patrón polimórfico)
-- ============================================================================

create table puntos_gis (
  id uuid primary key default uuid_generate_v4(),
  tipo_entidad text not null check (tipo_entidad in
    ('proyecto','beneficiario','visita','parcela','infraestructura','actividad')),
  entidad_id uuid not null,
  latitud double precision not null,
  longitud double precision not null,
  descripcion text,
  created_at timestamptz not null default now()
);

create table poligonos_gis (
  id uuid primary key default uuid_generate_v4(),
  tipo_entidad text not null check (tipo_entidad in
    ('area_intervencion','parcela','area_forestal','area_restaurada','zona_proyecto')),
  entidad_id uuid not null,
  geometria geometry(Polygon, 4326),
  area_hectareas numeric generated always as (
    case when geometria is not null then ST_Area(geometria::geography) / 10000 else null end
  ) stored,
  descripcion text
);

-- ============================================================================
-- 9. VISITAS DE CAMPO (offline-first)
-- ============================================================================

create table visitas (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  actividad_id uuid references actividades(id) on delete set null,
  tecnico_id uuid not null references tecnicos(id),
  fecha date not null,
  hora time,
  ubicacion_punto_id uuid references puntos_gis(id),
  observaciones text,
  avance_reportado numeric,
  estado text not null default 'borrador'
    check (estado in ('borrador','enviado','aprobado','rechazado')),
  revisado_por uuid references perfiles(id),
  fecha_revision timestamptz,
  comentario_revision text,
  uuid_local uuid, -- generado en el dispositivo antes de sincronizar
  estado_sincronizacion text default 'sincronizado'
    check (estado_sincronizacion in ('pendiente','sincronizando','sincronizado','error')),
  created_at timestamptz not null default now()
);

alter table mediciones_indicador
  add constraint fk_medicion_visita foreign key (visita_id) references visitas(id) on delete set null;

create table visita_beneficiarios (
  visita_id uuid references visitas(id) on delete cascade,
  beneficiario_id uuid references beneficiarios_maestro(id) on delete cascade,
  primary key (visita_id, beneficiario_id)
);

create table riesgos (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  visita_id uuid references visitas(id) on delete set null,
  descripcion text not null,
  nivel text not null check (nivel in ('bajo','medio','alto','critico')),
  fecha_identificacion date default current_date,
  estado text not null default 'abierto' check (estado in ('abierto','mitigado','cerrado'))
);

create table problemas (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  visita_id uuid references visitas(id) on delete set null,
  descripcion text not null,
  fecha date default current_date,
  estado text not null default 'abierto' check (estado in ('abierto','en_proceso','resuelto')),
  accion_correctiva text
);

create table compromisos (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  visita_id uuid references visitas(id) on delete set null,
  descripcion text not null,
  responsable_id uuid references perfiles(id),
  fecha_compromiso date,
  fecha_cumplimiento date,
  estado text not null default 'pendiente' check (estado in ('pendiente','cumplido','vencido'))
);

-- ============================================================================
-- 10. EVIDENCIAS (patrón polimórfico)
-- ============================================================================

create table evidencias (
  id uuid primary key default uuid_generate_v4(),
  tipo_entidad text not null check (tipo_entidad in
    ('proyecto','actividad','indicador','beneficiario','visita')),
  entidad_id uuid not null,
  tipo_archivo text,
  ruta_storage text not null,
  tecnico_id uuid references tecnicos(id),
  fecha date default current_date,
  ubicacion_punto_id uuid references puntos_gis(id),
  descripcion text
);

-- ============================================================================
-- 11. SINCRONIZACIÓN OFFLINE Y ALERTAS
-- ============================================================================

create table cola_sincronizacion (
  id uuid primary key default uuid_generate_v4(),
  dispositivo_id text not null,
  tabla_destino text not null,
  registro_uuid_local uuid not null,
  payload jsonb not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','sincronizando','completado','error')),
  intentos integer default 0,
  fecha_creacion_local timestamptz not null,
  fecha_sincronizacion timestamptz,
  mensaje_error text
);

create table alertas (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null,
  entidad_tipo text not null,
  entidad_id uuid not null,
  severidad text not null default 'media' check (severidad in ('baja','media','alta','critica')),
  fecha_generacion timestamptz not null default now(),
  estado text not null default 'activa' check (estado in ('activa','atendida','descartada')),
  mensaje text
);

create table auditoria (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid references perfiles(id),
  tabla text not null,
  registro_id uuid,
  accion text not null,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  fecha timestamptz not null default now()
);

-- ============================================================================
-- 12. ÍNDICES DE APOYO
-- ============================================================================

create index idx_proyectos_programa on proyectos(programa_id);
create index idx_marco_logico_proyecto on marco_logico_elementos(proyecto_id);
create index idx_marco_logico_padre on marco_logico_elementos(padre_id);
create index idx_indicadores_proyecto on indicadores(proyecto_id);
create index idx_mediciones_indicador on mediciones_indicador(indicador_id, fecha_medicion);
create index idx_actividades_proyecto on actividades(proyecto_id);
create index idx_asignaciones_tecnico on asignaciones(tecnico_id);
create index idx_participacion_beneficiario on beneficiario_participacion(beneficiario_id);
create index idx_participacion_proyecto on beneficiario_participacion(proyecto_id);
create index idx_visitas_proyecto on visitas(proyecto_id, fecha);
create index idx_visitas_tecnico on visitas(tecnico_id);
create index idx_evidencias_entidad on evidencias(tipo_entidad, entidad_id);
create index idx_puntos_entidad on puntos_gis(tipo_entidad, entidad_id);

-- ============================================================================
-- 13. SEGURIDAD A NIVEL DE FILA (RLS) — reglas básicas del MVP
-- ============================================================================

alter table perfiles enable row level security;
alter table proyectos enable row level security;
alter table visitas enable row level security;
alter table mediciones_indicador enable row level security;
alter table beneficiarios_maestro enable row level security;
alter table asignaciones enable row level security;

-- Función auxiliar: rol del usuario autenticado
create or replace function rol_actual()
returns text as $$
  select r.nombre from perfiles p join roles r on r.id = p.rol_id where p.id = auth.uid();
$$ language sql stable security definer;

-- Perfiles: cada quien ve el suyo; admin ve todos
create policy perfiles_select on perfiles for select
  using (id = auth.uid() or rol_actual() in ('admin','coordinador','supervisor','evaluador','consulta'));

create policy perfiles_update_propio on perfiles for update
  using (id = auth.uid() or rol_actual() = 'admin');

-- Proyectos: lectura amplia para roles de gestión; técnico solo ve lo asignado
create policy proyectos_select on proyectos for select
  using (
    rol_actual() in ('admin','coordinador','supervisor','evaluador','consulta')
    or id in (select proyecto_id from asignaciones where tecnico_id = auth.uid())
  );

create policy proyectos_modificar on proyectos for all
  using (rol_actual() = 'admin') with check (rol_actual() = 'admin');

-- Visitas: técnico crea y ve las suyas; supervisor/admin ven y aprueban todas
create policy visitas_select on visitas for select
  using (tecnico_id = auth.uid() or rol_actual() in ('admin','coordinador','supervisor','evaluador'));

create policy visitas_insert on visitas for insert
  with check (tecnico_id = auth.uid() or rol_actual() = 'admin');

create policy visitas_update on visitas for update
  using (
    (tecnico_id = auth.uid() and estado = 'borrador')
    or rol_actual() in ('admin','supervisor')
  );

-- Mediciones: mismo criterio que visitas
create policy mediciones_select on mediciones_indicador for select
  using (created_by = auth.uid() or rol_actual() in ('admin','coordinador','supervisor','evaluador'));

create policy mediciones_insert on mediciones_indicador for insert
  with check (created_by = auth.uid() or rol_actual() = 'admin');

create policy mediciones_update on mediciones_indicador for update
  using ((created_by = auth.uid() and estado = 'borrador') or rol_actual() in ('admin','supervisor'));

-- Beneficiarios: lectura amplia, edición restringida
create policy beneficiarios_select on beneficiarios_maestro for select
  using (true);

create policy beneficiarios_modificar on beneficiarios_maestro for all
  using (rol_actual() in ('admin','supervisor','tecnico'))
  with check (rol_actual() in ('admin','supervisor','tecnico'));

-- Asignaciones: técnico ve las suyas, gestión ve todas
create policy asignaciones_select on asignaciones for select
  using (tecnico_id = auth.uid() or rol_actual() in ('admin','coordinador','supervisor'));

create policy asignaciones_modificar on asignaciones for all
  using (rol_actual() = 'admin') with check (rol_actual() = 'admin');

-- NOTA: estas políticas cubren el MVP. Antes de producción con datos reales,
-- revisar caso por caso (contraparte, consulta) según la configuración final de cada proyecto.

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
