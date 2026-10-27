// BookOS Voice Recorder — frontend
const invoke = (cmd, args) => window.__TAURI__.core.invoke(cmd, args);
const win = () => window.__TAURI__.window.getCurrentWindow();

// El idioma y el tema se eligen en Ajustes de BookOS, no por ventana.
for (const id of ["theme-btn", "lang-btn"]) {
  const control = document.getElementById(id);
  if (control) control.hidden = true;
}
for (const id of ["ui-lang", "seg-theme"]) {
  const control = document.getElementById(id);
  control?.closest(".detail-item")?.remove();
}
const selectorTema = document.getElementById("themePicker")?.closest(".settings-row");
if (selectorTema) selectorTema.hidden = true;



// Selector de archivos: el explorador de BookOS (AI-DESIGN-SYSTEM §9). Toma las
// opciones de `dialog.open/save` de Tauri para que, si el explorador no está
// instalado, pasen tal cual al diálogo de siempre.
async function elegirRuta(modo, opciones = {}) {
  const filtros = opciones.filters || [];
  const exts = filtros.flatMap(f => f.extensions);
  // Un filtro «*» es «todo»; el explorador solo aplica uno, la unión del resto.
  const patrones = exts.includes('*') ? [] : exts.map(e => '*.' + e);
  const ruta = opciones.defaultPath || '';
  const corte = ruta.lastIndexOf('/');
  try {
    const rutas = await window.__TAURI__.core.invoke('elegir_ruta', { eleccion: {
      modo: opciones.directory ? 'folder' : modo,
      multiple: !!opciones.multiple,
      patrones,
      nombreFiltro: filtros.length === 1 ? filtros[0].name : undefined,
      titulo: opciones.title,
      nombre: modo === 'save' && ruta ? ruta.slice(corte + 1) : undefined,
      inicio: corte > 0 ? ruta.slice(0, corte) : undefined,
    } });
    if (!rutas) return null;
    return opciones.multiple ? rutas : rutas[0];
  } catch (e) {
    if (e !== 'sin-explorador') throw e;
    return window.__TAURI__.dialog[modo](opciones);
  }
}

// ============ i18n ============
const I18N = {
  es: {
    "app.title":"Grabador de voz",
    "tb.folder":"Abrir carpeta de grabaciones",
    "tb.library":"Grabaciones",
    "tb.settings":"Ajustes",
    "tb.fullscreen":"Pantalla completa (F11)",
    "tb.theme":"Cambiar tema",
    "wm.minimize":"Minimizar","wm.maximize":"Maximizar","wm.close":"Cerrar",
    "sb.title":"Grabaciones",
    "sb.collapse":"Ocultar panel","sb.expand":"Mostrar grabaciones",
    "sb.search":"Buscar nombre o #tag…",
    "sb.all":"Todas","sb.fav":"Favoritas",
    "sb.empty.t":"Sin grabaciones",
    "sb.empty.h":"Pulsa el botón rojo para empezar",
    "sb.empty.noMatch":"Sin coincidencias",
    "sb.empty.adjust":"Ajusta el filtro o búsqueda",
    "rec.idle":"Listo para grabar",
    "rec.recording":"Grabando",
    "rec.paused":"En pausa",
    "rec.mic":"Dispositivo de entrada",
    "rec.cancel":"Descartar","rec.rec":"Grabar (Espacio)","rec.pause":"Pausar",
    "rec.hintIdle":'Pulsa el botón o <kbd>Espacio</kbd> para empezar',
    "rec.hintRec":'<kbd>Espacio</kbd> detener · <kbd>P</kbd> pausar · <kbd>Esc</kbd> descartar',
    "pl.fav":"Marcar como favorito",
    "pl.export":"Exportar","pl.reveal":"Mostrar en archivos","pl.delete":"Eliminar",
    "pl.back":"Atrás 5s (←)","pl.play":"Reproducir (Espacio)","pl.fwd":"Avanzar 5s (→)",
    "pl.loop":"Repetir en bucle (L)","pl.loopLabel":"Bucle","pl.speed":"Velocidad",
    "tags.title":"Etiquetas","tags.hint":"Enter para añadir · click en × para quitar","tags.ph":"Nueva etiqueta…",
    "tr.title":"Transcripción","tr.run":"Transcribir","tr.copy":"Copiar",
    "tr.ph":"Aún sin transcribir. Pulsa Transcribir.",
    "tr.running":"Transcribiendo…",
    "tr.foot":"Motor: {engine} · Idioma: {lang}",
    "tr.no.engine":"—",
    "settings":"Ajustes",
    "sec.appearance":"Apariencia","sec.rec":"Grabación","sec.trans":"Transcripción","sec.storage":"Almacenamiento","sec.about":"Acerca de",
    "theme":"Tema","theme.ds":"Sigue al sistema cuando es Automático",
    "theme.auto":"Auto","theme.light":"Claro","theme.dark":"Oscuro",
    "ui.lang":"Idioma de la interfaz","ui.lang.ds":"Cambia el idioma de toda la aplicación",
    "rec.quality":"Calidad","rec.quality.ds":"Bitrate de codificación Opus",
    "rec.autosave":"Auto-guardar al detener","rec.autosave.ds":"Guarda directamente sin pedir nombre",
    "rec.countdown":"Cuenta atrás antes de grabar","rec.countdown.ds":"3·2·1 antes de empezar",
    "trans.engine":"Motor","trans.engine.detecting":"Detectando…",
    "trans.engine.none":"Ninguno detectado. Instala whisper.cpp o vosk-transcriber",
    "trans.engine.avail":"{n} disponible{s}: {names}",
    "trans.model":"Modelo","optional":"opcional",
    "trans.model.none":"No seleccionado · usa el por defecto del motor",
    "trans.model.clear":"Quitar modelo","trans.model.clear.ds":"Vuelve a usar el por defecto",
    "trans.lang":"Idioma del audio","trans.lang.ds":"Idioma esperado de las grabaciones",
    "trans.help":"Whisper: <code>pacman -S whisper.cpp</code> y descarga modelo .bin de <code>ggml-*</code>. Vosk: <code>pip install vosk</code> + modelo. Necesita <code>ffmpeg</code>.",
    "storage.folder":"Carpeta de grabaciones",
    "about.ds":"Versión 0.1.0 · BookOS",
    "save.title":"Guardar grabación","save.ph":"Nombre de la grabación",
    "save.discard":"Descartar","save.save":"Guardar",
    "save.dur":"Duración {d}",
    "toast.saved":"Guardada · {d}","toast.discarded":"Descartada","toast.deleted":"Eliminada",
    "toast.favOn":"Añadida a favoritas","toast.favOff":"Quitada de favoritas",
    "toast.copied":"Copiado","toast.transcribed":"Transcrito",
    "toast.exported":"Exportada","toast.engineCfg":"Configura un motor en Ajustes",
    "toast.err":"Error: {m}","toast.mic":"Mic: {m}",
    "rec.autoName":"Grabación",
  },
  en: {
    "app.title":"Voice Recorder",
    "tb.folder":"Open recordings folder",
    "tb.library":"Recordings",
    "tb.settings":"Settings",
    "tb.fullscreen":"Fullscreen (F11)",
    "tb.theme":"Change theme",
    "wm.minimize":"Minimize","wm.maximize":"Maximize","wm.close":"Close",
    "sb.title":"Recordings",
    "sb.collapse":"Hide panel","sb.expand":"Show recordings",
    "sb.search":"Search name or #tag…",
    "sb.all":"All","sb.fav":"Favorites",
    "sb.empty.t":"No recordings",
    "sb.empty.h":"Press the red button to start",
    "sb.empty.noMatch":"No matches",
    "sb.empty.adjust":"Adjust filter or search",
    "rec.idle":"Ready to record",
    "rec.recording":"Recording",
    "rec.paused":"Paused",
    "rec.mic":"Input device",
    "rec.cancel":"Discard","rec.rec":"Record (Space)","rec.pause":"Pause",
    "rec.hintIdle":'Press the button or <kbd>Space</kbd> to start',
    "rec.hintRec":'<kbd>Space</kbd> stop · <kbd>P</kbd> pause · <kbd>Esc</kbd> discard',
    "pl.fav":"Mark as favorite",
    "pl.export":"Export","pl.reveal":"Show in files","pl.delete":"Delete",
    "pl.back":"Back 5s (←)","pl.play":"Play (Space)","pl.fwd":"Forward 5s (→)",
    "pl.loop":"Loop (L)","pl.loopLabel":"Loop","pl.speed":"Speed",
    "tags.title":"Tags","tags.hint":"Enter to add · click × to remove","tags.ph":"New tag…",
    "tr.title":"Transcription","tr.run":"Transcribe","tr.copy":"Copy",
    "tr.ph":"Not transcribed yet. Press Transcribe.",
    "tr.running":"Transcribing…",
    "tr.foot":"Engine: {engine} · Language: {lang}",
    "tr.no.engine":"—",
    "settings":"Settings",
    "sec.appearance":"Appearance","sec.rec":"Recording","sec.trans":"Transcription","sec.storage":"Storage","sec.about":"About",
    "theme":"Theme","theme.ds":"Follows system when Automatic",
    "theme.auto":"Auto","theme.light":"Light","theme.dark":"Dark",
    "ui.lang":"Interface language","ui.lang.ds":"Change language for the whole app",
    "rec.quality":"Quality","rec.quality.ds":"Opus encoding bitrate",
    "rec.autosave":"Auto-save on stop","rec.autosave.ds":"Save directly without asking name",
    "rec.countdown":"Countdown before recording","rec.countdown.ds":"3·2·1 before starting",
    "trans.engine":"Engine","trans.engine.detecting":"Detecting…",
    "trans.engine.none":"None detected. Install whisper.cpp or vosk-transcriber",
    "trans.engine.avail":"{n} available: {names}",
    "trans.model":"Model","optional":"optional",
    "trans.model.none":"Not selected · uses engine default",
    "trans.model.clear":"Clear model","trans.model.clear.ds":"Back to engine default",
    "trans.lang":"Audio language","trans.lang.ds":"Expected language of recordings",
    "trans.help":"Whisper: <code>pacman -S whisper.cpp</code> and download .bin model from <code>ggml-*</code>. Vosk: <code>pip install vosk</code> + model. Needs <code>ffmpeg</code>.",
    "storage.folder":"Recordings folder",
    "about.ds":"Version 0.1.0 · BookOS",
    "save.title":"Save recording","save.ph":"Recording name",
    "save.discard":"Discard","save.save":"Save",
    "save.dur":"Duration {d}",
    "toast.saved":"Saved · {d}","toast.discarded":"Discarded","toast.deleted":"Deleted",
    "toast.favOn":"Added to favorites","toast.favOff":"Removed from favorites",
    "toast.copied":"Copied","toast.transcribed":"Transcribed",
    "toast.exported":"Exported","toast.engineCfg":"Set an engine in Settings",
    "toast.err":"Error: {m}","toast.mic":"Mic: {m}",
    "rec.autoName":"Recording",
  },
};
let CUR_LANG = "es";
function detectLang() {
  const sys = (navigator.language || "es").toLowerCase();
  return sys.startsWith("en") ? "en" : "es";
}
function t(key, vars) {
  let s = (I18N[CUR_LANG] && I18N[CUR_LANG][key]) || (I18N.es[key]) || key;
  if (vars) for (const k in vars) s = s.split("{"+k+"}").join(vars[k]);
  return s;
}
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); el.setAttribute("aria-label", t(el.dataset.i18nTitle)); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.title = t("app.title");
}

const $ = (id) => document.getElementById(id);
const toast = (msg) => {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
};

// ============ State ============
const state = {
  theme: "auto",
  quality: "mid",
  autosave: false,
  countdown: false,
  recordings: [],
  selected: null,
  recording: false,
  paused: false,
  startTs: 0,
  elapsedBeforePause: 0,
  mediaRecorder: null,
  mediaStream: null,
  chunks: [],
  audioCtx: null,
  analyser: null,
  rafId: 0,
  micDeviceId: "default",
  filter: "all",
  loop: false,
  speed: 1,
  engines: [],
  transEngine: "",
  transModel: "",
  transLang: "auto",
  uiLang: "auto",
  sidebarCollapsed: false,
  activityLevel: 0,
  activityLast: 0,
};

// ============ Window controls ============
$("minimize").onclick = () => win().minimize();
$("maximize").onclick = () => win().toggleMaximize();
$("close").onclick = () => win().close();
const mc = document.getElementById("mc");
let isFullscreen = false;
let fsHotzone = null;
function setupFsChrome() {
  const titlebar = document.querySelector(".titlebar");
  if (fsHotzone) fsHotzone.remove();
  fsHotzone = document.createElement("div");
  fsHotzone.className = "fs-hotzone";
  document.body.append(fsHotzone);
  const show = () => mc.classList.add("show-chrome");
  const hide = () => mc.classList.remove("show-chrome");
  fsHotzone.addEventListener("mouseenter", show);
  titlebar.addEventListener("mouseenter", show);
  titlebar.addEventListener("mouseleave", hide);
}
function teardownFsChrome() {
  mc.classList.remove("show-chrome");
  if (fsHotzone) { fsHotzone.remove(); fsHotzone = null; }
}
async function toggleFullscreen() {
  isFullscreen = !isFullscreen;
  mc.classList.toggle("fullscreen-mode", isFullscreen);
  mc.classList.toggle("windowed", !isFullscreen);
  if (isFullscreen) setupFsChrome(); else teardownFsChrome();
  try {
    await win().setFullscreen(isFullscreen);
  } catch (e) {
    try { await win().toggleMaximize(); } catch {}
  }
}
$("fullscreen-btn").onclick = toggleFullscreen;
document.addEventListener("keydown", (e) => {
  if (e.key === "F11") { e.preventDefault(); toggleFullscreen(); }
  else if (e.key === "Escape" && isFullscreen && !state.recording) { e.preventDefault(); toggleFullscreen(); }
});

// ============ Theme ============
async function applyTheme(t) {
  state.theme = t;
  const root = document.documentElement;
  root.classList.remove("light-mode", "dark-mode");
  let eff = t;
  if (t === "auto") {
    try { eff = await invoke("detect_system_theme"); } catch { eff = "auto"; }
    if (eff === "auto") eff = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.classList.add(eff === "dark" ? "dark-mode" : "light-mode");
  document.querySelectorAll('#seg-theme button').forEach(b => b.classList.toggle("on", b.dataset.v === t));
}

$("theme-btn").onclick = async () => {
  const next = state.theme === "auto" ? "light" : state.theme === "light" ? "dark" : "auto";
  await applyTheme(next);
  await persistState();
};

// ============ Pages ============
function showPage(name) {
  const pages = { rec: "page-rec", settings: "page-settings" };
  Object.values(pages).forEach(id => $(id).classList.add("hidden"));
  const id = pages[name] || pages.rec;
  const el = $(id);
  el.classList.remove("hidden", "slide-in-r", "slide-in-l");
  void el.offsetWidth;
  el.classList.add(name === "settings" ? "slide-in-r" : "slide-in-l");
  $("library-btn").classList.toggle("active", name === "rec");
  $("settings-btn").classList.toggle("active", name === "settings");
}
$("library-btn").onclick = () => showPage("rec");
$("settings-btn").onclick = async () => {
  showPage("settings");
  try { $("rec-dir-path").textContent = await invoke("get_recordings_dir"); } catch {}
};
function applySidebarUI() {
  $("rec-sidebar").classList.toggle("collapsed", state.sidebarCollapsed);
  $("sb-expand-btn").classList.toggle("hidden", !state.sidebarCollapsed);
}
$("sb-collapse-btn").onclick = async () => { state.sidebarCollapsed = true; applySidebarUI(); await persistState(); };
$("sb-expand-btn").onclick = async () => { state.sidebarCollapsed = false; applySidebarUI(); await persistState(); };
$("open-folder-btn").onclick = openRecordingsFolder;
$("open-folder-row").onclick = openRecordingsFolder;
async function openRecordingsFolder() {
  try { const d = await invoke("get_recordings_dir"); await invoke("reveal_in_files", { path: d }); }
  catch (e) { toast(t("toast.err", { m: e })); }
}

// ============ Settings segs/toggles ============
document.querySelectorAll('.seg').forEach(seg => {
  seg.querySelectorAll('button').forEach(b => {
    b.onclick = async () => {
      const k = seg.dataset.key, v = b.dataset.v;
      seg.querySelectorAll('button').forEach(x => x.classList.toggle("on", x === b));
      if (k === "theme") await applyTheme(v);
      else state[k] = v;
      await persistState();
    };
  });
});
function bindToggle(id, key) {
  const el = $(id);
  el.onclick = async () => { state[key] = !state[key]; el.classList.toggle("active", state[key]); await persistState(); };
  el.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); el.click(); } });
}
bindToggle("tg-autosave", "autosave");
bindToggle("tg-countdown", "countdown");

// ============ Persist ============
async function persistState() {
  try {
    await invoke("save_state", { state: {
      theme: state.theme,
      settings: {
        quality: state.quality,
        autosave: state.autosave,
        countdown: state.countdown,
        micDeviceId: state.micDeviceId,
        loop: state.loop,
        speed: state.speed,
        transEngine: state.transEngine,
        transModel: state.transModel,
        transLang: state.transLang,
        uiLang: state.uiLang,
        sidebarCollapsed: state.sidebarCollapsed,
      }
    }});
  } catch {}
}
async function loadState() {
  try {
    const s = await invoke("load_state");
    if (s.theme) state.theme = s.theme;
    const cfg = s.settings || {};
    if (cfg.quality) state.quality = cfg.quality;
    state.autosave = !!cfg.autosave;
    state.countdown = !!cfg.countdown;
    if (cfg.micDeviceId) state.micDeviceId = cfg.micDeviceId;
    state.loop = !!cfg.loop;
    if (typeof cfg.speed === "number") state.speed = cfg.speed;
    if (cfg.transEngine) state.transEngine = cfg.transEngine;
    if (cfg.transModel) state.transModel = cfg.transModel;
    if (cfg.transLang) state.transLang = cfg.transLang;
    if (cfg.uiLang) state.uiLang = cfg.uiLang;
    state.sidebarCollapsed = !!cfg.sidebarCollapsed;
  } catch {}
  state.uiLang = await invoke("bookos_language").catch(() => "es");
  CUR_LANG = state.uiLang;
  applyI18n();
  state.theme = 'auto';
  await applyTheme(state.theme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.theme === 'auto') applyTheme('auto'); });
  const ul = $("ui-lang"); if (ul) ul.value = state.uiLang;
  document.querySelectorAll('#seg-quality button').forEach(b => b.classList.toggle("on", b.dataset.v === state.quality));
  $("tg-autosave").classList.toggle("active", state.autosave);
  $("tg-countdown").classList.toggle("active", state.countdown);
  $("ts-lang").value = state.transLang || "auto";
  applySpeedUI();
  applyLoopUI();
  applySidebarUI();
  $("ui-lang").onchange = async () => {
    state.uiLang = $("ui-lang").value;
    CUR_LANG = state.uiLang === "auto" ? detectLang() : state.uiLang;
    applyI18n();
    await persistState();
    // Refresh dynamic-rendered parts
    renderList();
    updateTrFoot();
    refreshModelUI();
    if (state.engines.length) refreshEngineDS();
  };
  $("ts-lang").onchange = async () => {
    state.transLang = $("ts-lang").value;
    await persistState();
    updateTrFoot();
  };
}

function refreshEngineDS() {
  const avail = state.engines.filter(e => e.available);
  const ds = $("ts-engine-ds");
  if (avail.length === 0) { ds.textContent = t("trans.engine.none"); return; }
  ds.textContent = t("trans.engine.avail", { n: avail.length, s: avail.length === 1 ? "" : "s", names: avail.map(e => e.name).join(", ") });
}

// ============ Mic list ============
async function listMics() {
  const sel = $("mic-select");
  try {
    // request perm so labels populate
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach(t => t.stop());
  } catch (e) { sel.innerHTML = '<option>Permiso denegado</option>'; return; }
  const devs = await navigator.mediaDevices.enumerateDevices();
  const mics = devs.filter(d => d.kind === "audioinput");
  sel.innerHTML = "";
  if (mics.length === 0) { sel.innerHTML = '<option>Sin micrófonos</option>'; return; }
  mics.forEach((m, i) => {
    const o = document.createElement("option");
    o.value = m.deviceId; o.textContent = m.label || `Micrófono ${i+1}`;
    sel.appendChild(o);
  });
  if (state.micDeviceId && mics.some(m => m.deviceId === state.micDeviceId)) sel.value = state.micDeviceId;
  else state.micDeviceId = sel.value;
  sel.onchange = async () => { state.micDeviceId = sel.value; await persistState(); };
}

// ============ Waveform ============
const wave = $("wave");
const wctx = wave.getContext("2d");
function resizeWave() {
  const dpr = window.devicePixelRatio || 1;
  const r = wave.getBoundingClientRect();
  wave.width = r.width * dpr; wave.height = r.height * dpr;
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resizeWave).observe(wave);

const waveHistory = new Array(220).fill(0);
function drawWave(level) {
  waveHistory.shift();
  waveHistory.push(level);
  const r = wave.getBoundingClientRect();
  const W = r.width, H = r.height;
  wctx.clearRect(0, 0, W, H);
  const barCount = waveHistory.length;
  const gap = 2;
  const barW = Math.max(2, (W - gap * (barCount - 1)) / barCount);
  const isRec = state.recording && !state.paused;
  const isPause = state.paused;
  const accent = getComputedStyle(document.documentElement).getPropertyValue(isPause ? "--orange" : isRec ? "--red" : "--tx2").trim();
  wctx.fillStyle = accent;
  for (let i = 0; i < barCount; i++) {
    const v = waveHistory[i];
    const h = Math.max(2, v * H * 0.92);
    const x = i * (barW + gap);
    const y = (H - h) / 2;
    wctx.globalAlpha = isRec || isPause ? 0.85 : 0.35;
    roundRect(wctx, x, y, barW, h, Math.min(barW / 2, 2));
    wctx.fill();
  }
  wctx.globalAlpha = 1;
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

// En reposo NO redibuja a 60 fps (CPU/batería tirada en una app parada):
// pinta la onda plana una vez y re-comprueba cada 500 ms por si empezó a
// grabar. El buffer del analizador se reutiliza (sin asignar uno por frame).
let _waveBuf = null;
function waveLoop() {
  if (!state.analyser) {
    drawWave(0);
    state.rafId = null;
    setTimeout(() => { if (!state.rafId) state.rafId = requestAnimationFrame(waveLoop); }, 500);
    return;
  }
  const a = state.analyser;
  if (!_waveBuf || _waveBuf.length !== a.fftSize) _waveBuf = new Uint8Array(a.fftSize);
  a.getByteTimeDomainData(_waveBuf);
  let sum = 0;
  for (let i = 0; i < _waveBuf.length; i++) { const v = (_waveBuf[i] - 128) / 128; sum += v * v; }
  const rms = Math.sqrt(sum / _waveBuf.length);
  const level = state.paused ? 0.04 : Math.min(1, rms * 2.4);
  state.activityLevel = level;
  publishRecorderActivity();
  drawWave(level);
  state.rafId = requestAnimationFrame(waveLoop);
}
state.rafId = requestAnimationFrame(waveLoop);

// ============ Timer ============
function fmtTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
  return { mm, ss, cs };
}
function updateTime() {
  let ms = state.elapsedBeforePause;
  if (state.recording && !state.paused) ms += Date.now() - state.startTs;
  const { mm, ss, cs } = fmtTime(ms);
  const time = $("rec-time");
  time.querySelector(".t-mm").textContent = mm;
  time.querySelector(".t-ss").textContent = ss;
  time.querySelector(".t-ms").textContent = "." + cs;
  if (state.recording) requestAnimationFrame(updateTime);
}

function recorderElapsed() {
  return state.elapsedBeforePause + (state.recording && !state.paused ? Date.now() - state.startTs : 0);
}
function publishRecorderActivity(force=false) {
  if (!state.recording) return;
  const now = Date.now();
  if (!force && now - state.activityLast < 450) return;
  state.activityLast = now;
  invoke('bookos_activity_publish', { appId:'com.bookos.voicerecorder', kind:'recorder', state:{
    activo: !state.paused, pausado: state.paused,
    titulo: state.paused ? 'Grabación en pausa' : 'Grabando',
    subtitulo: 'Grabadora de voz', posicion_ms: Math.round(recorderElapsed()),
    nivel: state.activityLevel,
  }}).catch(() => {});
}

// ============ Recorder ============
const btnRec = $("btn-rec");
const btnPause = $("btn-pause");
const btnCancel = $("btn-cancel");
const recCard = $("rec-card");
const recPill = $("rec-state-pill");
const recPillText = $("rec-state-text");

function setRecState(mode) {
  recCard.classList.toggle("is-rec", mode === "rec");
  recCard.classList.toggle("is-pause", mode === "pause");
  recPill.classList.remove("rec", "pause");
  if (mode === "rec") { recPill.classList.add("rec"); recPillText.textContent = t("rec.recording"); }
  else if (mode === "pause") { recPill.classList.add("pause"); recPillText.textContent = t("rec.paused"); }
  else recPillText.textContent = t("rec.idle");
}

function bitrateFor(q) { return q === "low" ? 64000 : q === "high" ? 128000 : 96000; }

async function startRecording() {
  if (state.recording) return;
  if (state.countdown) await runCountdown();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: state.micDeviceId && state.micDeviceId !== "default" ? { exact: state.micDeviceId } : undefined,
        echoCancellation: true, noiseSuppression: true, autoGainControl: true,
      }
    });
  } catch (e) { toast(t("toast.mic", { m: e.message || e })); return; }
  state.mediaStream = stream;

  state.audioCtx = state.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (state.audioCtx.state === "suspended") await state.audioCtx.resume();
  const src = state.audioCtx.createMediaStreamSource(stream);
  const an = state.audioCtx.createAnalyser();
  an.fftSize = 1024; an.smoothingTimeConstant = 0.6;
  src.connect(an);
  state.analyser = an;

  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "audio/ogg;codecs=opus" : "";
  state.chunks = [];
  state.mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: bitrateFor(state.quality) } : {});
  state.mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) state.chunks.push(e.data); };
  state.mediaRecorder.onstop = onRecorderStop;
  state.mediaRecorder.start(250);

  state.recording = true; state.paused = false;
  state.startTs = Date.now(); state.elapsedBeforePause = 0;
  setRecState("rec");
  btnPause.disabled = false; btnCancel.disabled = false;
  $("rec-hint").innerHTML = t("rec.hintRec");
  requestAnimationFrame(updateTime);
  publishRecorderActivity(true);
}

function pauseRecording() {
  if (!state.recording) return;
  if (state.paused) {
    state.mediaRecorder.resume();
    state.paused = false;
    state.startTs = Date.now();
    setRecState("rec");
    requestAnimationFrame(updateTime);
  } else {
    state.mediaRecorder.pause();
    state.paused = true;
    state.elapsedBeforePause += Date.now() - state.startTs;
    setRecState("pause");
  }
  publishRecorderActivity(true);
}

let cancelMode = false;
function stopRecording(cancel = false) {
  if (!state.recording) return;
  cancelMode = cancel;
  if (state.paused) state.elapsedBeforePause; // keep accumulated
  else state.elapsedBeforePause += Date.now() - state.startTs;
  try { state.mediaRecorder.stop(); } catch {}
  invoke('bookos_activity_close', { appId:'com.bookos.voicerecorder' }).catch(() => {});
}

async function onRecorderStop() {
  state.recording = false; state.paused = false;
  // Otra vez aquí y no solo en stopRecording: entre stop() y este evento
  // `waveLoop` sigue viendo `recording` y republica, y esa publicación llegaba
  // después del cierre y dejaba la isla en «Grabando» para siempre.
  invoke('bookos_activity_close', { appId:'com.bookos.voicerecorder' }).catch(() => {});
  setRecState("idle");
  btnPause.disabled = true; btnCancel.disabled = true;
  $("rec-hint").innerHTML = t("rec.hintIdle");

  state.mediaStream?.getTracks().forEach(t => t.stop());
  state.mediaStream = null;
  state.analyser = null;

  if (cancelMode) { cancelMode = false; state.elapsedBeforePause = 0; updateTime(); toast(t("toast.discarded")); return; }

  const mime = state.mediaRecorder.mimeType || "audio/webm";
  const ext = mime.includes("ogg") ? "ogg" : "webm";
  const blob = new Blob(state.chunks, { type: mime });
  const durMs = state.elapsedBeforePause;
  state.elapsedBeforePause = 0; updateTime();

  if (state.autosave) {
    const name = autoName();
    await saveBlob(blob, ext, name, durMs);
  } else {
    openSaveDialog(blob, ext, durMs);
  }
}

function autoName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${t("rec.autoName")} ${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}.${p(d.getMinutes())}.${p(d.getSeconds())}`;
}

async function saveBlob(blob, ext, name, durMs) {
  try {
    // El audio va como cuerpo binario, no en base64 (ver save_recording en main.rs).
    const path = await window.__TAURI__.core.invoke("save_recording", await blob.arrayBuffer(),
      { headers: { nombre: encodeURIComponent(name), ext } });
    toast(t("toast.saved", { d: fmtDuration(durMs) }));
    await refreshList();
    const item = state.recordings.find(r => r.path === path);
    if (item) selectRecording(item);
  } catch (e) { toast(t("toast.err", { m: e })); }
}

// ============ Save modal ============
let pendingBlob = null, pendingExt = "webm", pendingDur = 0;
function openSaveDialog(blob, ext, durMs) {
  pendingBlob = blob; pendingExt = ext; pendingDur = durMs;
  $("save-name").value = autoName();
  $("save-modal-sub").textContent = t("save.dur", { d: fmtDuration(durMs) });
  $("save-modal").classList.remove("hidden");
  setTimeout(() => { $("save-name").focus(); $("save-name").select(); }, 50);
}
$("save-cancel").onclick = () => { pendingBlob = null; $("save-modal").classList.add("hidden"); toast(t("toast.discarded")); };
$("save-confirm").onclick = async () => {
  if (!pendingBlob) return;
  const name = $("save-name").value.trim() || autoName();
  $("save-modal").classList.add("hidden");
  await saveBlob(pendingBlob, pendingExt, name, pendingDur);
  pendingBlob = null;
};
$("save-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("save-confirm").click();
  if (e.key === "Escape") $("save-cancel").click();
});

// ============ Countdown ============
async function runCountdown() {
  const ov = $("countdown-overlay"); const n = $("countdown-num");
  ov.classList.remove("hidden");
  for (const v of ["3","2","1"]) {
    n.textContent = v;
    n.style.animation = "none"; void n.offsetWidth; n.style.animation = "";
    await new Promise(r => setTimeout(r, 800));
  }
  ov.classList.add("hidden");
}

// ============ Recorder buttons ============
btnRec.onclick = () => { state.recording ? stopRecording(false) : startRecording(); };
btnPause.onclick = pauseRecording;
btnCancel.onclick = () => stopRecording(true);

window.__TAURI__.event.listen('bookos://activity-action', ({payload}) => {
  if (payload?.action === 'stop') stopRecording(false);
  else if ((payload?.action === 'pause' && !state.paused) ||
           (payload?.action === 'resume' && state.paused)) pauseRecording();
});

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea, [contenteditable]")) return;
  if (!$("save-modal").classList.contains("hidden")) return;
  // Player shortcuts when not recording and an audio is loaded
  if (!state.recording && audio.src) {
    if (e.code === "Space") { e.preventDefault(); $("pl-play").click(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); $("pl-back").click(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); $("pl-fwd").click(); return; }
    if (e.key === "l" || e.key === "L") { $("pl-loop").click(); return; }
    if (e.key === "f" || e.key === "F") { $("pl-fav").click(); return; }
  }
  if (e.code === "Space") { e.preventDefault(); btnRec.click(); }
  else if (e.key === "p" || e.key === "P") { if (state.recording) btnPause.click(); }
  else if (e.key === "Escape" && state.recording) { btnCancel.click(); }
});

// ============ Library list ============
async function refreshList() {
  try { state.recordings = await invoke("list_recordings"); }
  catch { state.recordings = []; }
  renderList();
}
function renderList() {
  const raw = ($("sb-search").value || "").trim().toLowerCase();
  const tagQ = raw.startsWith("#") ? raw.slice(1) : "";
  const nameQ = raw.startsWith("#") ? "" : raw;
  let list = state.recordings.filter(r => {
    if (state.filter === "fav" && !r.favorite) return false;
    if (nameQ && !r.name.toLowerCase().includes(nameQ)) return false;
    if (tagQ && !(r.tags || []).some(t => t.toLowerCase().includes(tagQ))) return false;
    return true;
  });
  const root = $("sb-list");
  $("sb-count").textContent = state.recordings.length;
  root.innerHTML = "";
  if (list.length === 0) {
    const e = document.createElement("div");
    e.className = "sb-empty";
    const isEmpty = state.recordings.length === 0;
    e.innerHTML = isEmpty
      ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"/></svg><div>${t("sb.empty.t")}</div><div class="sb-empty-hint">${t("sb.empty.h")}</div>`
      : `<div>${t("sb.empty.noMatch")}</div><div class="sb-empty-hint">${t("sb.empty.adjust")}</div>`;
    root.appendChild(e);
    return;
  }
  list.forEach(r => {
    const it = document.createElement("div");
    it.className = "sb-item" + (state.selected && state.selected.path === r.path ? " active" : "");
    const date = new Date(r.mtime * 1000);
    const dateStr = sameDay(date, new Date()) ? "Hoy " + fmtClock(date) : fmtDate(date);
    const tagsHtml = (r.tags || []).slice(0, 3).map(t => `<span class="sb-tag"></span>`).join("");
    it.innerHTML = `
      ${r.favorite ? '<svg class="sb-fav-star" viewBox="0 0 24 24" fill="currentColor"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"/></svg>' : ''}
      <div class="sb-item-name"></div>
      <div class="sb-item-meta"><span></span><span>${fmtSize(r.size)}</span></div>
      ${tagsHtml ? `<div class="sb-tags">${tagsHtml}</div>` : ''}`;
    it.querySelector(".sb-item-name").textContent = r.name;
    it.querySelector(".sb-item-meta span").textContent = dateStr;
    const tagEls = it.querySelectorAll(".sb-tag");
    (r.tags || []).slice(0, 3).forEach((t, i) => { if (tagEls[i]) tagEls[i].textContent = "#" + t; });
    it.onclick = () => selectRecording(r);
    root.appendChild(it);
  });
}
$("sb-search").addEventListener("input", renderList);
document.querySelectorAll('.sb-fchip').forEach(b => {
  b.onclick = () => {
    state.filter = b.dataset.filter;
    document.querySelectorAll('.sb-fchip').forEach(x => x.classList.toggle("on", x === b));
    renderList();
  };
});

function sameDay(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function fmtClock(d) { return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0"); }
function fmtDate(d) { return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; }
function fmtSize(n) { if (n < 1024) return n+" B"; if (n < 1024*1024) return (n/1024).toFixed(1)+" KB"; return (n/1024/1024).toFixed(2)+" MB"; }
function fmtDuration(ms) {
  const t = Math.floor(ms/1000);
  const m = Math.floor(t/60), s = t%60;
  return m + ":" + String(s).padStart(2,"0");
}

// ============ Player ============
const audio = $("audio-el");
async function selectRecording(r) {
  state.selected = r;
  renderList();
  $("player-card").classList.remove("hidden");
  $("tags-card").classList.remove("hidden");
  $("trans-card").classList.remove("hidden");
  $("pl-title").value = r.name;
  $("pl-meta").textContent = `${r.ext.toUpperCase()} · ${fmtSize(r.size)}${r.favorite ? " · ★" : ""}`;
  $("pl-fav").classList.toggle("on", !!r.favorite);
  audio.loop = state.loop;
  audio.playbackRate = state.speed;
  try {
    const bytes = await invoke("read_recording", { path: r.path });
    const blob = new Blob([bytes], { type: r.ext === "wav" ? "audio/wav" : r.ext === "mp3" ? "audio/mp3" : r.ext === "ogg" ? "audio/ogg" : "audio/webm" });
    if (audio.src) URL.revokeObjectURL(audio.src);
    audio.src = URL.createObjectURL(blob);
    audio.onloadedmetadata = () => updatePlayerTime();
  } catch (e) { toast(t("toast.err", { m: e })); }
  // Load metadata (tags, transcript)
  try {
    const meta = await invoke("get_meta", { path: r.path });
    renderTags(meta.tags || []);
    $("tr-text").value = meta.transcript || "";
    updateTrFoot();
  } catch { renderTags([]); $("tr-text").value = ""; }
}

// Favorite
$("pl-fav").onclick = async () => {
  if (!state.selected) return;
  const next = !state.selected.favorite;
  try { await invoke("set_favorite", { path: state.selected.path, value: next }); }
  catch (e) { toast(t("toast.err", { m: e })); return; }
  state.selected.favorite = next;
  $("pl-fav").classList.toggle("on", next);
  toast(next ? t("toast.favOn") : t("toast.favOff"));
  await refreshList();
};

// Skip ±5s
$("pl-back").onclick = () => { if (audio.src) audio.currentTime = Math.max(0, audio.currentTime - 5); };
$("pl-fwd").onclick = () => { if (audio.src && isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); };

// Loop
function applyLoopUI() { $("pl-loop").classList.toggle("on", state.loop); audio.loop = state.loop; }
$("pl-loop").onclick = async () => { state.loop = !state.loop; applyLoopUI(); await persistState(); };

// Speed
function applySpeedUI() {
  document.querySelectorAll('#seg-speed button').forEach(b => b.classList.toggle("on", parseFloat(b.dataset.v) === state.speed));
  audio.playbackRate = state.speed;
}
document.querySelectorAll('#seg-speed button').forEach(b => {
  b.onclick = async () => { state.speed = parseFloat(b.dataset.v); applySpeedUI(); await persistState(); };
});

// Tags
function renderTags(tags) {
  const root = $("tag-list");
  root.innerHTML = "";
  tags.forEach((t, i) => {
    const el = document.createElement("span");
    el.className = "tag";
    const txt = document.createElement("span");
    txt.textContent = "#" + t;
    const x = document.createElement("button");
    x.className = "tag-x"; x.textContent = "×"; x.title = "Quitar";
    x.onclick = async () => {
      const newTags = tags.filter((_, idx) => idx !== i);
      await commitTags(newTags);
    };
    el.appendChild(txt); el.appendChild(x);
    root.appendChild(el);
  });
  state._currentTags = tags;
}
async function commitTags(tags) {
  if (!state.selected) return;
  try {
    await invoke("set_tags", { path: state.selected.path, tags });
    renderTags(tags);
    state.selected.tags = tags;
    renderList();
  } catch (e) { toast(t("toast.err", { m: e })); }
}
$("tag-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const v = e.target.value.trim().replace(/^#/, "");
    if (!v) return;
    const cur = state._currentTags || [];
    if (cur.includes(v)) { e.target.value = ""; return; }
    commitTags([...cur, v]);
    e.target.value = "";
  } else if (e.key === "Backspace" && !e.target.value) {
    const cur = state._currentTags || [];
    if (cur.length) commitTags(cur.slice(0, -1));
  }
});

// Transcription
async function loadEngines() {
  try { state.engines = await invoke("list_transcribe_engines"); } catch { state.engines = []; }
  const sel = $("ts-engine");
  sel.innerHTML = "";
  state.engines.forEach(e => {
    const o = document.createElement("option");
    o.value = e.id;
    o.textContent = e.name + (e.available ? "" : " (no instalado)");
    o.disabled = !e.available;
    sel.appendChild(o);
  });
  const avail = state.engines.filter(e => e.available);
  if (!state.transEngine || !avail.some(e => e.id === state.transEngine)) {
    state.transEngine = avail.length ? avail[0].id : "";
  }
  if (state.transEngine) sel.value = state.transEngine;
  refreshEngineDS();
  sel.onchange = async () => { state.transEngine = sel.value; await persistState(); updateTrFoot(); };
  refreshModelUI();
}
function refreshModelUI() {
  const has = !!state.transModel;
  $("ts-model-ds").textContent = has ? state.transModel : t("trans.model.none");
  $("ts-model-clear").style.display = has ? "" : "none";
}
$("ts-model-row").onclick = async () => {
  const p = await elegirRuta('open', { filters: [{ name: "Modelo", extensions: ["bin", "*"] }] });
  if (!p) return;
  state.transModel = p;
  await persistState();
  refreshModelUI();
  updateTrFoot();
};
$("ts-model-clear").onclick = async () => {
  state.transModel = "";
  await persistState();
  refreshModelUI();
  updateTrFoot();
};
function updateTrFoot() {
  const eng = state.engines.find(e => e.id === state.transEngine);
  $("tr-foot").textContent = t("tr.foot", { engine: eng ? eng.name : t("tr.no.engine"), lang: state.transLang || "auto" });
}

$("tr-run").onclick = async () => {
  if (!state.selected) return;
  if (!state.transEngine) { toast(t("toast.engineCfg")); return; }
  const btn = $("tr-run");
  btn.disabled = true; btn.classList.add("is-running");
  btn.querySelector("span").textContent = "Transcribiendo…";
  try {
    const text = await invoke("transcribe", {
      path: state.selected.path,
      engine: state.transEngine,
      modelPath: state.transModel || "",
      language: state.transLang || "auto",
    });
    $("tr-text").value = text;
    await invoke("set_transcript", { path: state.selected.path, text });
    state.selected.has_transcript = true;
    toast(t("toast.transcribed"));
    await refreshList();
  } catch (e) {
    toast(t("toast.err", { m: typeof e === "string" ? e : e.message || e }));
  } finally {
    btn.disabled = false; btn.classList.remove("is-running");
    btn.querySelector("span").textContent = "Transcribir";
  }
};
$("tr-text").addEventListener("blur", async () => {
  if (!state.selected) return;
  try { await invoke("set_transcript", { path: state.selected.path, text: $("tr-text").value }); }
  catch {}
});
$("tr-copy").onclick = async () => {
  try { await navigator.clipboard.writeText($("tr-text").value); toast(t("toast.copied")); }
  catch (e) { toast(t("toast.err", { m: e })); }
};

const playBtn = $("pl-play");
playBtn.onclick = () => {
  if (!audio.src) return;
  if (audio.paused) audio.play(); else audio.pause();
};
audio.onplay = () => { playBtn.classList.add("playing"); $("pl-play-icon").outerHTML = '<svg id="pl-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"/></svg>'; };
audio.onpause = () => { playBtn.classList.remove("playing"); $("pl-play-icon").outerHTML = '<svg id="pl-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"/></svg>'; };
audio.onended = () => { audio.currentTime = 0; updatePlayerTime(); };
audio.ontimeupdate = updatePlayerTime;
function updatePlayerTime() {
  const cur = audio.currentTime || 0, dur = isFinite(audio.duration) ? audio.duration : 0;
  const pct = dur ? (cur / dur) * 100 : 0;
  $("pl-track-fill").style.width = pct + "%";
  $("pl-track-knob").style.left = pct + "%";
  $("pl-time").textContent = fmtSec(cur) + " / " + fmtSec(dur);
}
function fmtSec(s) { s = Math.max(0, Math.floor(s||0)); return Math.floor(s/60) + ":" + String(s%60).padStart(2,"0"); }
const track = $("pl-track");
let seeking = false;
track.addEventListener("pointerdown", (e) => { seeking = true; track.setPointerCapture(e.pointerId); seekTo(e); });
track.addEventListener("pointermove", (e) => { if (seeking) seekTo(e); });
track.addEventListener("pointerup", (e) => { seeking = false; try { track.releasePointerCapture(e.pointerId); } catch {} });
function seekTo(e) {
  const r = track.getBoundingClientRect();
  const x = Math.max(0, Math.min(r.width, e.clientX - r.left));
  if (isFinite(audio.duration)) audio.currentTime = (x / r.width) * audio.duration;
}

$("pl-delete").onclick = async () => {
  if (!state.selected) return;
  try { await invoke("delete_recording", { path: state.selected.path }); }
  catch (e) { toast(t("toast.err", { m: e })); return; }
  toast(t("toast.deleted"));
  audio.pause(); if (audio.src) { URL.revokeObjectURL(audio.src); audio.removeAttribute("src"); }
  state.selected = null;
  $("player-card").classList.add("hidden");
  $("tags-card").classList.add("hidden");
  $("trans-card").classList.add("hidden");
  await refreshList();
};
$("pl-reveal").onclick = async () => {
  if (!state.selected) return;
  try { await invoke("reveal_in_files", { path: state.selected.path }); } catch (e) { toast(t("toast.err", { m: e })); }
};
$("pl-export").onclick = async () => {
  if (!state.selected) return;
  const r = state.selected;
  const dest = await elegirRuta('save', { defaultPath: r.name + "." + r.ext, filters: [{ name: "Audio", extensions: [r.ext] }] });
  if (!dest) return;
  try {
    const bytes = await invoke("read_recording", { path: r.path });
    const { writeFile } = window.__TAURI__.fs;
    await writeFile(dest, new Uint8Array(bytes));
    toast(t("toast.exported"));
  } catch (e) { toast(t("toast.err", { m: e })); }
};

const titleInput = $("pl-title");
titleInput.addEventListener("blur", () => commitRename());
titleInput.addEventListener("keydown", (e) => { if (e.key === "Enter") titleInput.blur(); if (e.key === "Escape") { titleInput.value = state.selected?.name || ""; titleInput.blur(); } });
async function commitRename() {
  if (!state.selected) return;
  const nv = titleInput.value.trim();
  if (!nv || nv === state.selected.name) { titleInput.value = state.selected.name; return; }
  try {
    const np = await invoke("rename_recording", { path: state.selected.path, newName: nv });
    await refreshList();
    const found = state.recordings.find(x => x.path === np);
    if (found) { state.selected = found; titleInput.value = found.name; renderList(); }
  } catch (e) { toast(t("toast.err", { m: e })); titleInput.value = state.selected.name; }
}

// ============ Boot ============
(async function init() {
  try {
    resizeWave();
    await loadState();
    await listMics();
    await loadEngines();
    updateTrFoot();
    await refreshList();
    showPage("rec");
  } catch (e) {
    console.error("[VR] init:", e);
  }
})();
