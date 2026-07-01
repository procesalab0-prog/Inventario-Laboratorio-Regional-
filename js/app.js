// Inventario de Almacén Regional — lógica de la aplicación.
// Sustituye el estado en memoria del prototipo de diseño por datos reales
// persistidos en Supabase (tablas `inventario` y `salidas`).

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const VALIDATIONS = [
  'FUEL GAUGE CHARACTERISTICS', 'STATIC VENTING', 'COLD ROLL OVER', 'PRESSURE VACUUM',
  'SOAKING', 'DROP IMPACT', 'GPMM', 'PRESSURE DURABILITY', 'FUEL PERMEATION',
  'WELD STRENGTH', 'TOTAL VOLUME', 'FUEL SOAK'
];
const COND_STYLE = {
  'POR DISPONERSE': { bg: '#FEF3C7', color: '#B45309' },
  'SIN CONTACTO': { bg: '#FEE2E2', color: '#B91C1C' },
  'DISPONIBLE': { bg: '#DCFCE7', color: '#15803D' },
  'SCRAP': { bg: '#E2E8F0', color: '#475569' },
  'N/A': { bg: '#F1F5F9', color: '#94A3B8' }
};

function fmtDate(iso) {
  if (!iso) return '—';
  const p = String(iso).split('-');
  if (p.length < 3) return iso;
  return p[2].padStart(2, '0') + ' ' + (MONTHS[(+p[1]) - 1] || '?') + ' ' + p[0];
}
function dash(v) { return (v === undefined || v === null || String(v).trim() === '') ? '—' : v; }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const state = {
  authed: false,
  tab: 'inventario',
  records: [],
  salidas: [],
  entry: emptyEntry(),
  search: { id: '', material: '', proyecto: '', pae: '', cond: '', rack: '' },
  salSel: '', salQuery: '', salMotivo: '', salNota: '',
  loading: false
};

function emptyEntry() {
  return { id: '', material: '', fecha: '', proyecto: '', pae: '', cond: '', v1: '', v2: '', v3: '', cant: '1', rack: '' };
}

// ---------------------------------------------------------------------------
// Config guard
// ---------------------------------------------------------------------------
function checkConfig() {
  const banner = document.getElementById('config-banner');
  if (!window.SUPABASE_CONFIGURED) {
    banner.classList.remove('hidden');
    banner.innerHTML = 'Supabase aún no está configurado. Completa <code>js/config.js</code> siguiendo <b>SETUP.md</b> para activar el inicio de sesión y el guardado de datos.';
    document.getElementById('login-btn').disabled = true;
    return false;
  }
  banner.classList.add('hidden');
  return true;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
let toastTimer = null;
function flash(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3400);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
async function doLogin(email, pass) {
  if (!email.trim()) { flash('Introduce tu correo'); return; }
  const btn = document.getElementById('login-btn');
  const errBox = document.getElementById('login-error');
  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Ingresando…';
  const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: pass });
  btn.disabled = false;
  btn.textContent = 'Iniciar sesión';
  if (error) {
    errBox.textContent = error.message === 'Invalid login credentials'
      ? 'Correo o contraseña incorrectos.'
      : error.message;
    errBox.classList.remove('hidden');
    return;
  }
  await enterApp();
}

async function doLogout() {
  await window.supabaseClient.auth.signOut();
  state.authed = false;
  state.records = [];
  state.salidas = [];
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

async function enterApp() {
  state.authed = true;
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  await loadData();
  setTab('inventario');
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function loadData() {
  const [invRes, salRes] = await Promise.all([
    window.supabaseClient.from('inventario').select('*').order('created_at', { ascending: false }),
    window.supabaseClient.from('salidas').select('*').order('created_at', { ascending: false })
  ]);
  if (invRes.error) { flash('Error cargando inventario: ' + invRes.error.message); }
  else { state.records = invRes.data || []; }
  if (salRes.error) { flash('Error cargando salidas: ' + salRes.error.message); }
  else { state.salidas = salRes.data || []; }
  renderAll();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function condBadge(cond) {
  const c = cond || 'N/A';
  const s = COND_STYLE[c] || COND_STYLE['N/A'];
  return `<span class="badge" style="background:${s.bg};color:${s.color}">${esc(c)}</span>`;
}
function rackBadge(rack) {
  const na = (!rack || rack === 'N/A');
  return `<span class="rack-badge${na ? ' na' : ''}">${esc(dash(rack))}</span>`;
}

function renderStats() {
  const recs = state.records;
  document.getElementById('stat-total').textContent = recs.length;
  document.getElementById('stat-tanques').textContent = recs.filter(r => r.material === 'TANQUE').length;
  document.getElementById('stat-por-disponerse').textContent = recs.filter(r => r.cond === 'POR DISPONERSE').length;
  document.getElementById('stat-sin-contacto').textContent = recs.filter(r => r.cond === 'SIN CONTACTO').length;
}

function rowHtml(r, withAction) {
  return `<tr>
    <td class="mono">${esc(r.id)}</td>
    <td class="strong">${esc(r.material)}</td>
    <td class="muted">${esc(fmtDate(r.fecha))}</td>
    <td>${esc(dash(r.proyecto))}</td>
    <td class="muted">${esc(dash(r.pae))}</td>
    <td class="muted">${esc(dash(r.v1))}</td>
    <td class="muted">${esc(dash(r.v2))}</td>
    <td class="muted">${esc(dash(r.v3))}</td>
    <td>${condBadge(r.cond)}</td>
    <td class="center">${esc(r.cant)}</td>
    <td class="center">${rackBadge(r.rack)}</td>
    ${withAction ? `<td class="center"><button class="btn-row-action" data-salida-id="${esc(r.id)}">Salida</button></td>` : ''}
  </tr>`;
}

function renderInventario() {
  document.getElementById('inv-count').textContent = state.records.length;
  document.getElementById('inv-tbody').innerHTML = state.records.map(r => rowHtml(r, true)).join('');
  document.querySelectorAll('[data-salida-id]').forEach(btn => {
    btn.addEventListener('click', () => quickSalida(btn.getAttribute('data-salida-id')));
  });
}

function renderSalidaView() {
  const q = state.salQuery.trim().toLowerCase();
  const matches = state.records.filter(r => {
    if (!q) return true;
    return String(r.id).toLowerCase().includes(q)
      || String(r.material || '').toLowerCase().includes(q)
      || String(r.proyecto || '').toLowerCase().includes(q);
  });
  const matchesWrap = document.getElementById('sal-matches');
  if (matches.length === 0) {
    matchesWrap.innerHTML = `<div class="empty-note">Sin coincidencias para "${esc(state.salQuery)}".</div>`;
  } else {
    matchesWrap.innerHTML = matches.map(r => `
      <div class="match-row${r.id === state.salSel ? ' selected' : ''}" data-pick-id="${esc(r.id)}">
        <div class="match-row-left">
          <span class="match-id">${esc(r.id)}</span>
          <span class="match-material">${esc(r.material)}</span>
          <span class="match-proyecto">${esc(dash(r.proyecto))}</span>
        </div>
        ${r.id === state.salSel ? '<span class="match-check">✓</span>' : ''}
      </div>`).join('');
    matchesWrap.querySelectorAll('[data-pick-id]').forEach(el => {
      el.addEventListener('click', () => { state.salSel = el.getAttribute('data-pick-id'); renderSalidaView(); });
    });
  }

  const selItem = state.records.find(r => r.id === state.salSel);
  const summary = document.getElementById('sal-item-summary');
  if (selItem) {
    summary.classList.remove('hidden');
    summary.innerHTML = `
      <div><b>${esc(selItem.material)}</b> · <span class="id">${esc(selItem.id)}</span></div>
      <div>Proyecto: ${esc(dash(selItem.proyecto))}</div>
      <div>Entrada: ${esc(fmtDate(selItem.fecha))} · Rack ${esc(dash(selItem.rack))}</div>`;
  } else {
    summary.classList.add('hidden');
    summary.innerHTML = '';
  }

  const histWrap = document.getElementById('sal-history-wrap');
  if (state.salidas.length === 0) {
    histWrap.innerHTML = '<div class="empty-note big">Aún no se han registrado salidas.</div>';
  } else {
    histWrap.innerHTML = `<div class="scrollx"><table style="min-width:480px"><thead><tr>
      <th>ID</th><th>Material</th><th>Motivo</th><th>Fecha salida</th>
    </tr></thead><tbody>${state.salidas.map(s => `
      <tr><td class="mono">${esc(s.item_id)}</td><td class="strong">${esc(s.material)}</td>
      <td class="muted">${esc(s.motivo)}</td><td class="muted">${esc(fmtDate(s.fecha))}</td></tr>`).join('')}
    </tbody></table></div>`;
  }
}

function renderBuscarView() {
  const f = state.search;
  const filtered = state.records.filter(r => {
    if (f.id && !String(r.id).toLowerCase().includes(f.id.trim().toLowerCase())) return false;
    if (f.material && r.material !== f.material) return false;
    if (f.proyecto && !String(r.proyecto || '').toLowerCase().includes(f.proyecto.trim().toLowerCase())) return false;
    if (f.pae && !String(r.pae || '').toLowerCase().includes(f.pae.trim().toLowerCase())) return false;
    if (f.cond && (r.cond || 'N/A') !== f.cond) return false;
    if (f.rack && (r.rack || 'N/A') !== f.rack) return false;
    return true;
  });
  document.getElementById('search-count').textContent = filtered.length;
  const wrap = document.getElementById('search-results-wrap');
  if (filtered.length === 0) {
    wrap.innerHTML = '<div class="empty-note big2">No se encontraron registros con esos filtros.</div>';
  } else {
    wrap.innerHTML = `<div class="scrollx"><table><thead><tr>
      <th>ID</th><th>Material</th><th>Fecha entrada</th><th>Proyecto</th><th>PAE</th>
      <th>Validación 1</th><th>Validación 2</th><th>Validación 3</th><th>Condición</th>
      <th class="center">Cant.</th><th class="center">Rack</th>
    </tr></thead><tbody>${filtered.map(r => rowHtml(r, false)).join('')}</tbody></table></div>`;
  }
}

function renderAll() {
  renderStats();
  renderInventario();
  renderSalidaView();
  renderBuscarView();
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function setTab(name) {
  state.tab = name;
  document.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  ['inventario', 'entrada', 'salida', 'buscar'].forEach(v => {
    document.getElementById('view-' + v).classList.toggle('hidden', v !== name);
  });
  if (name === 'salida') renderSalidaView();
  if (name === 'buscar') renderBuscarView();
}

function quickSalida(id) {
  state.salSel = id; state.salQuery = ''; state.salMotivo = ''; state.salNota = '';
  document.getElementById('sal-query').value = '';
  document.getElementById('sal-motivo').value = '';
  document.getElementById('sal-nota').value = '';
  setTab('salida');
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------
function populateValidationSelects() {
  ['e-v1', 'e-v2', 'e-v3'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">— Ninguna —</option>' + VALIDATIONS.map(v => `<option>${esc(v)}</option>`).join('');
  });
}

async function registerEntry(evt) {
  evt.preventDefault();
  const e = {
    id: document.getElementById('e-id').value.trim(),
    material: document.getElementById('e-material').value,
    fecha: document.getElementById('e-fecha').value || null,
    proyecto: document.getElementById('e-proyecto').value.trim(),
    pae: document.getElementById('e-pae').value.trim(),
    cond: document.getElementById('e-cond').value || 'N/A',
    v1: document.getElementById('e-v1').value,
    v2: document.getElementById('e-v2').value,
    v3: document.getElementById('e-v3').value,
    cant: document.getElementById('e-cant').value || '1',
    rack: document.getElementById('e-rack').value || 'N/A'
  };
  if (!e.id || !e.material) { flash('Completa al menos ID y Material'); return; }

  const btn = document.getElementById('entry-submit');
  btn.disabled = true;
  const { data, error } = await window.supabaseClient.from('inventario').insert(e).select().single();
  btn.disabled = false;
  if (error) { flash('Error al registrar: ' + error.message); return; }

  state.records.unshift(data);
  clearEntryForm();
  setTab('inventario');
  renderAll();
  flash('Entrada ' + e.id + ' registrada');
}

function clearEntryForm() {
  document.getElementById('entry-form').reset();
  document.getElementById('e-cant').value = '1';
}

// ---------------------------------------------------------------------------
// Salida
// ---------------------------------------------------------------------------
async function registerSalida() {
  const id = state.salSel;
  if (!id) { flash('Selecciona un material'); return; }
  const rec = state.records.find(r => r.id === id);
  if (!rec) return;

  const motivo = document.getElementById('sal-motivo').value || '—';
  const nota = document.getElementById('sal-nota').value.trim();
  const salida = { item_id: rec.id, material: rec.material, motivo, nota, fecha: todayISO() };

  const btn = document.getElementById('sal-submit');
  btn.disabled = true;
  const { data: salRow, error: salErr } = await window.supabaseClient.from('salidas').insert(salida).select().single();
  if (salErr) { btn.disabled = false; flash('Error al registrar salida: ' + salErr.message); return; }

  const { error: delErr } = await window.supabaseClient.from('inventario').delete().eq('id', id);
  btn.disabled = false;
  if (delErr) { flash('Salida registrada, pero no se pudo quitar del inventario: ' + delErr.message); }

  state.records = state.records.filter(r => r.id !== id);
  state.salidas.unshift(salRow);
  state.salSel = ''; state.salQuery = ''; state.salMotivo = ''; state.salNota = '';
  document.getElementById('sal-query').value = '';
  document.getElementById('sal-motivo').value = '';
  document.getElementById('sal-nota').value = '';
  renderAll();
  flash('Salida de ' + id + ' registrada · inventario actualizado');
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function wireEvents() {
  document.getElementById('login-form').addEventListener('submit', evt => {
    evt.preventDefault();
    doLogin(document.getElementById('login-email').value, document.getElementById('login-pass').value);
  });
  document.getElementById('logout-btn').addEventListener('click', doLogout);

  document.getElementById('tabs').addEventListener('click', evt => {
    const el = evt.target.closest('[data-tab]');
    if (el) setTab(el.dataset.tab);
  });

  document.getElementById('entry-form').addEventListener('submit', registerEntry);
  document.getElementById('entry-clear').addEventListener('click', clearEntryForm);

  document.getElementById('sal-query').addEventListener('input', evt => { state.salQuery = evt.target.value; renderSalidaView(); });
  document.getElementById('sal-submit').addEventListener('click', registerSalida);

  ['s-id', 's-proyecto', 's-pae'].forEach(id => {
    document.getElementById(id).addEventListener('input', evt => {
      state.search[id.slice(2)] = evt.target.value;
      renderBuscarView();
    });
  });
  ['s-material', 's-cond', 's-rack'].forEach(id => {
    document.getElementById(id).addEventListener('change', evt => {
      state.search[id.slice(2)] = evt.target.value;
      renderBuscarView();
    });
  });
  document.getElementById('search-clear').addEventListener('click', () => {
    state.search = { id: '', material: '', proyecto: '', pae: '', cond: '', rack: '' };
    document.querySelectorAll('#view-buscar input, #view-buscar select').forEach(el => el.value = '');
    renderBuscarView();
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
(async function boot() {
  populateValidationSelects();
  wireEvents();
  if (!checkConfig()) return;

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session) { await enterApp(); }

  window.supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') { doLogout(); }
  });
})();
