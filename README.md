# Inventario de Almacén Regional

Aplicación web (HTML/CSS/JS estático) para gestionar el inventario de un
almacén regional: alta y baja de materiales (tanques, bombas, fixture bucks),
búsqueda/filtrado y trazabilidad de validaciones. Usa **Supabase** como base
de datos y autenticación.

## Puesta en marcha

1. Sigue [`SETUP.md`](./SETUP.md) para crear el proyecto de Supabase.
2. Completa `js/config.js` con tus credenciales.
3. Sirve la carpeta con cualquier servidor estático, por ejemplo:
   ```
   npx serve .
   ```
   o abre `index.html` directamente con la extensión Live Server de tu editor.

## Estructura

- `index.html`, `css/`, `js/` — frontend estático.
- `supabase/schema.sql` — esquema de base de datos (tablas `inventario`, `salidas`) con Row Level Security.
- `assets/` — logotipos.