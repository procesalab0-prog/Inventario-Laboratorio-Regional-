// Sincronización con Google Sheets vía Google Apps Script Web App.
// Ver /apps-script/Code.gs para el código que se despliega en Google.
//
// El webhook es "fire and forget": si falla, el inventario en Supabase sigue
// siendo la fuente de verdad y el usuario puede forzar una resincronización
// completa con syncFullInventory().

window.SHEETS_CONFIGURED = !!(window.APP_CONFIG && window.APP_CONFIG.GOOGLE_SHEETS_WEBHOOK_URL);

async function callSheetsWebhook(payload) {
  const url = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true };
  try {
    // Apps Script Web Apps no devuelven cabeceras CORS para lectura de la
    // respuesta desde otro origen en todos los casos, así que usamos
    // no-cors y asumimos éxito si la petición no lanza una excepción de red.
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return { ok: true };
  } catch (err) {
    console.warn("No se pudo sincronizar con Google Sheets:", err);
    return { ok: false, error: err };
  }
}

function sheetsUpsertRow(row) {
  return callSheetsWebhook({ action: "upsert", row });
}

function sheetsDeleteRow(id) {
  return callSheetsWebhook({ action: "delete", id });
}

function sheetsLogSalida(salida) {
  return callSheetsWebhook({ action: "salida", row: salida });
}

function syncFullInventory(records, salidas) {
  return callSheetsWebhook({ action: "full_sync", records, salidas });
}
