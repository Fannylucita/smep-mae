-- ============================================================================
-- PASO 2: Vincular tu usuario administrador
-- ============================================================================
-- Antes de correr esto, ve a Supabase → Authentication → Users → "Add user"
-- y crea un usuario con tu correo y una contraseña. Luego reemplaza abajo
-- 'tu-correo@ejemplo.com' por el correo EXACTO que usaste, y ejecuta este script.

insert into perfiles (id, nombre_completo, rol_id, activo)
select
  u.id,
  'Administrador',
  (select id from roles where nombre = 'admin'),
  true
from auth.users u
where u.email = 'fanny.salamanca.maqueda@gmail.com'
on conflict (id) do update set rol_id = (select id from roles where nombre = 'admin');

-- Verifica que funcionó:
select p.nombre_completo, r.nombre as rol, u.email
from perfiles p
join roles r on r.id = p.rol_id
join auth.users u on u.id = p.id;
