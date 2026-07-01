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
  SUPABASE_URL: "https://ljatjgebbqqzjtievmsp.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqYXRqZ2ViYnFxemp0aWV2bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjIxNTEsImV4cCI6MjA5ODQ5ODE1MX0.FA5J2jegLAKI8Ujrz6OYJhm8rSrHzOikMvF_w2vMwQY",

  // URL de implementación del Google Apps Script (ver /apps-script/Code.gs)
  GOOGLE_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbx0i74yQd7borPk0Toiuv-kC1iwWR2pyXXblWs1oiSa7M7nCNye4iDrm_bLaPDwYepr/exec"
};
