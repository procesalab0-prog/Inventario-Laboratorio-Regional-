/**
 * Inventario de Almacén Regional — puente con Google Sheets.
 *
 * Instrucciones de instalación en SETUP.md. En resumen:
 * 1. Crea una Google Sheet con dos pestañas: "Inventario" y "Salidas".
 * 2. Extensiones → Apps Script, pega este archivo como Code.gs.
 * 3. Implementar → Nueva implementación → Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario
 * 4. Copia la URL /exec resultante en js/config.js → GOOGLE_SHEETS_WEBHOOK_URL
 */

const INVENTARIO_SHEET = 'Inventario';
const SALIDAS_SHEET = 'Salidas';

const INVENTARIO_HEADERS = [
  'ID', 'Material', 'Fecha entrada', 'Proyecto', 'PAE',
  'Validación 1', 'Validación 2', 'Validación 3', 'Condición', 'Cantidad', 'Rack'
];
const SALIDAS_HEADERS = ['ID', 'Material', 'Motivo', 'Nota', 'Fecha salida'];

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  if (action === 'upsert') upsertInventarioRow_(body.row);
  else if (action === 'delete') deleteInventarioRow_(body.id);
  else if (action === 'salida') appendSalidaRow_(body.row);
  else if (action === 'full_sync') fullSync_(body.records || [], body.salidas || []);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowById_(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-indexed row
  }
  return -1;
}

function inventarioRowValues_(row) {
  return [row.id, row.material, row.fecha || '', row.proyecto || '', row.pae || '',
    row.v1 || '', row.v2 || '', row.v3 || '', row.cond || 'N/A', row.cant || '1', row.rack || 'N/A'];
}

function upsertInventarioRow_(row) {
  const sheet = getSheet_(INVENTARIO_SHEET, INVENTARIO_HEADERS);
  const values = inventarioRowValues_(row);
  const existingRow = findRowById_(sheet, row.id);
  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}

function deleteInventarioRow_(id) {
  const sheet = getSheet_(INVENTARIO_SHEET, INVENTARIO_HEADERS);
  const existingRow = findRowById_(sheet, id);
  if (existingRow > 0) sheet.deleteRow(existingRow);
}

function appendSalidaRow_(row) {
  const sheet = getSheet_(SALIDAS_SHEET, SALIDAS_HEADERS);
  sheet.appendRow([row.item_id, row.material, row.motivo || '', row.nota || '', row.fecha || '']);
}

function fullSync_(records, salidas) {
  const invSheet = getSheet_(INVENTARIO_SHEET, INVENTARIO_HEADERS);
  invSheet.clear();
  invSheet.appendRow(INVENTARIO_HEADERS);
  if (records.length) invSheet.getRange(2, 1, records.length, INVENTARIO_HEADERS.length)
    .setValues(records.map(inventarioRowValues_));
  invSheet.setFrozenRows(1);

  const salSheet = getSheet_(SALIDAS_SHEET, SALIDAS_HEADERS);
  salSheet.clear();
  salSheet.appendRow(SALIDAS_HEADERS);
  if (salidas.length) salSheet.getRange(2, 1, salidas.length, SALIDAS_HEADERS.length)
    .setValues(salidas.map(s => [s.item_id, s.material, s.motivo || '', s.nota || '', s.fecha || '']));
  salSheet.setFrozenRows(1);
}
