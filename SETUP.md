# Guía de configuración — Inventario de Almacén Regional

Esta app es un sitio estático (HTML/CSS/JS, sin build ni servidor propio) que
usa **Supabase** como base de datos + autenticación.

Sigue los pasos en orden. Todo se hace desde el navegador, sin instalar nada.

---

## Parte 1 — Supabase

### 1.1 Crear el proyecto

1. Ve a [supabase.com](https://supabase.com) → **Start your project** → inicia sesión.
2. **New project**:
   - Organización: la tuya (o crea una).
   - Name: `inventario-almacen-regional` (o el que prefieras).
   - Database Password: genera una segura y **guárdala** (no se vuelve a mostrar).
   - Region: la más cercana a tu ubicación.
3. Espera 1-2 minutos a que se aprovisione.

### 1.2 Crear las tablas

1. En el menú lateral, entra a **SQL Editor**.
2. **New query**.
3. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este repo, copia **todo** su contenido y pégalo en el editor.
4. Click **Run**. Deberías ver "Success. No rows returned" (y las 3 filas de ejemplo insertadas).
5. Verifica en **Table Editor** que aparecen las tablas `inventario` y `salidas`.

> El script ya activa **Row Level Security (RLS)**: solo usuarios autenticados pueden leer/escribir. No hay acceso público a los datos.

### 1.3 Crear los usuarios del equipo

Como es una herramienta interna, lo más simple es crear las cuentas manualmente (sin registro abierto):

1. **Authentication → Users → Add user → Create new user**.
2. Completa correo corporativo (ej. `almacen@opmobility.com`) y una contraseña temporal.
3. Marca **Auto Confirm User** para que no necesite verificar el correo.
4. Repite para cada persona del equipo que deba entrar al sistema.

Opcional: en **Authentication → Providers → Email**, desactiva "Enable email signups" para que nadie pueda crearse una cuenta por su cuenta — solo tú, desde el panel, das de alta usuarios.

### 1.4 Obtener las claves de API

1. **Project Settings** (ícono de engranaje) → **API**.
2. Copia:
   - **Project URL** (algo como `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (la clave larga que empieza con `eyJ...`)

⚠️ Usa la clave **`anon` / `public`**, nunca la `service_role` (esa es secreta y no debe estar en el frontend).

### 1.5 Configurar la app

Abre [`js/config.js`](./js/config.js) en este repo y completa:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi..."
};
```

Guarda el archivo. Con esto, el login y el guardado de inventario ya funcionan.

---

## Parte 2 — Publicar el sitio

Como es HTML/CSS/JS estático, puedes desplegarlo en cualquier hosting estático:

- **GitHub Pages**: Settings → Pages → Deploy from branch → selecciona la rama y carpeta raíz `/`.
- **Netlify / Vercel**: "Import project" apuntando a este repo, sin build command (es estático).
- **Supabase Storage** también puede servir sitios estáticos si prefieres mantener todo en un solo lugar.

No necesitas variables de entorno de servidor: toda la configuración vive en `js/config.js` (con la clave pública `anon`, que está diseñada para exponerse — la seguridad real la da RLS en Supabase, configurado en el paso 1.2).

---

## Resumen rápido

| Qué | Dónde | Archivo relacionado |
|---|---|---|
| Base de datos + Auth | Supabase | `supabase/schema.sql`, `js/config.js` |
| Frontend | Cualquier hosting estático | `index.html`, `css/`, `js/` |
