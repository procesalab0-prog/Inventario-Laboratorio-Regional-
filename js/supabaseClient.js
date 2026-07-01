// Inicializa el cliente de Supabase a partir de js/config.js.
// Si las credenciales no están configuradas, exportamos null y el resto de
// la app muestra un aviso en vez de intentar llamadas que fallarían.

window.supabaseClient = null;
window.SUPABASE_CONFIGURED = false;

(function initSupabase() {
  const cfg = window.APP_CONFIG || {};
  if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
    window.supabaseClient = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    window.SUPABASE_CONFIGURED = true;
  }
})();
