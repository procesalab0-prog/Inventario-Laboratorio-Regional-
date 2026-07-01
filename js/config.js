// ============================================================================
// CONFIGURACIÓN — completa estos valores siguiendo SETUP.md
// ============================================================================
// Este archivo se sirve tal cual al navegador (es un sitio estático), así que
// SOLO debe contener claves públicas:
//   - SUPABASE_ANON_KEY es la clave pública "anon" (no la "service_role").
//     El acceso real a los datos se controla con Row Level Security (RLS) en
//     Supabase, no ocultando esta clave.
//   - GOOGLE_SHEETS_WEBHOOK_URL es la URL de un Google Apps Script Web App
//     (ver /apps-script/Code.gs) que actúa como intermediario seguro; nunca
//     pongas aquí credenciales de una cuenta de servicio de Google.
// ============================================================================

window.APP_CONFIG = {
  // Panel de Supabase → Project Settings → API
  SUPABASE_URL: "",           // Ej: "https://xxxxxxxxxxxx.supabase.co"
  SUPABASE_ANON_KEY: "",      // Ej: "eyJhbGciOi..."

  // URL de implementación del Google Apps Script (ver /apps-script/Code.gs)
  GOOGLE_SHEETS_WEBHOOK_URL: "" // Ej: "https://script.google.com/macros/s/AKfycb.../exec"
};
