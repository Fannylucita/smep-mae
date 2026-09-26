# Sistema de Monitoreo y Evaluación de Proyectos — Guía de instalación

Esta guía asume que no tienes conocimientos técnicos. Sigue los pasos en orden.

## Parte 1 — Crear la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo (o usa uno existente).
2. En el menú izquierdo, ve a **SQL Editor**.
3. Abre el archivo `sql/01_schema_completo.sql` de esta entrega, copia **todo** su contenido, pégalo en el editor y presiona **Run**. Esto crea todas las tablas, relaciones y reglas de seguridad.
4. Ve a **Authentication → Users → Add user** y crea tu usuario administrador (tu correo y una contraseña).
5. Abre el archivo `sql/02_crear_administrador.sql`, reemplaza `'tu-correo@ejemplo.com'` por el correo que usaste en el paso anterior, pégalo en el SQL Editor y presiona **Run**. Esto convierte a ese usuario en Administrador del sistema.
6. Ve a **Project Settings → Data API** (o "API" según la versión) y copia dos datos:
   - **Project URL**
   - **anon public key** (la clave pública)
   Los necesitarás en la Parte 3.

## Parte 2 — Crear el bucket de archivos (fotos y documentos)

1. En Supabase, ve a **Storage → New bucket**.
2. Crea un bucket llamado exactamente: `evidencias-campo`. Márcalo como **privado** (no público).
3. Repite y crea otro bucket llamado: `documentos-proyecto`, también privado.

## Parte 3 — Configurar la aplicación

1. Descomprime la carpeta `scaffold` (es el código de la aplicación).
2. Dentro de esa carpeta, copia el archivo `.env.example` y renombra la copia a `.env`.
3. Abre `.env` con cualquier editor de texto y reemplaza los dos valores:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
   ```
   con los datos que copiaste en el paso 6 de la Parte 1.

## Parte 4 — Probar en tu computadora (opcional pero recomendado)

Necesitas tener instalado [Node.js](https://nodejs.org) (versión 18 o superior). Luego, en una terminal dentro de la carpeta `scaffold`:

```
npm install
npm run dev
```

Abre la dirección que aparezca (normalmente `http://localhost:5173`) e inicia sesión con el correo y contraseña del administrador que creaste.

## Parte 5 — Publicar en Netlify

1. Sube la carpeta `scaffold` a un repositorio de GitHub (o arrastra la carpeta directamente en Netlify si usas "Deploy manually").
2. En [netlify.com](https://netlify.com), crea un nuevo sitio a partir de ese repositorio.
3. En **Site settings → Environment variables**, agrega las mismas dos variables que pusiste en tu archivo `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Netlify detectará automáticamente la configuración de compilación gracias al archivo `netlify.toml` incluido. Presiona **Deploy**.
5. Cuando termine, tendrás un enlace público de tu aplicación, instalable como app (PWA) desde el celular.

---

## Resumen rápido (checklist)

- [ ] Correr `01_schema_completo.sql` en Supabase
- [ ] Crear usuario admin en Authentication
- [ ] Correr `02_crear_administrador.sql` con tu correo
- [ ] Copiar Project URL y anon key
- [ ] Crear buckets `evidencias-campo` y `documentos-proyecto` (privados)
- [ ] Completar el archivo `.env` en la carpeta `scaffold`
- [ ] `npm install` y `npm run dev` para probar localmente
- [ ] Subir a Netlify y agregar las mismas dos variables de entorno
- [ ] Deploy

## Qué incluye esta entrega (MVP) y qué falta

**Funcionando de extremo a extremo:** login, dashboard de cartera, creación y listado de proyectos, detalle de proyecto (indicadores/actividades), registro de beneficiarios con detección de posibles duplicados, registro de visitas de campo que funciona sin conexión y se sincroniza sola, y la bandeja de aprobación del Responsable de Monitoreo.

**Como estructura lista para la siguiente iteración** (ruta, menú y tablas ya creadas, pantalla pendiente de conectar): Programas, Técnicos, Mapa de cartera, Reportes, Evaluación, Alertas, Evidencias, y las pantallas de Administración. Estas se construyen módulo por módulo sobre esta misma base — avísame cuál priorizar primero.
