#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod bookos_activity;

use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;

fn config_dir() -> PathBuf {
    let mut p = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push("bookos-voicerecorder");
    let _ = fs::create_dir_all(&p);
    p
}

fn recordings_dir() -> PathBuf {
    let mut p = dirs::audio_dir()
        .or_else(dirs::home_dir)
        .unwrap_or_else(|| PathBuf::from("."));
    p.push("BookOS Recordings");
    let _ = fs::create_dir_all(&p);
    p
}

fn state_path() -> PathBuf { let mut p = config_dir(); p.push("state.json"); p }
fn meta_path() -> PathBuf { let mut p = config_dir(); p.push("metadata.json"); p }

#[derive(Clone, Default, Serialize, Deserialize)]
struct RecMetaEntry {
    #[serde(default)] favorite: bool,
    #[serde(default)] tags: Vec<String>,
    #[serde(default)] transcript: String,
    #[serde(default)] notes: String,
}

struct MetaStore(Mutex<HashMap<String, RecMetaEntry>>);

fn load_meta_map() -> HashMap<String, RecMetaEntry> {
    fs::read_to_string(meta_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}
/// Escritura atómica: escribe a un temporal en el mismo directorio, hace fsync
/// y renombra encima del destino. Evita dejar el archivo truncado/corrupto si
/// el proceso muere o se corta la corriente a mitad de la escritura.
fn atomic_write(path: &std::path::Path, bytes: &[u8]) -> Result<(), String> {
    use std::io::Write;
    let dir = path.parent().unwrap_or_else(|| std::path::Path::new("."));
    let fname = path.file_name().map(|s| s.to_string_lossy().to_string()).unwrap_or_else(|| "tmp".into());
    let tmp = dir.join(format!(".{}.tmp-{}", fname, std::process::id()));
    {
        let mut f = fs::File::create(&tmp).map_err(|e| e.to_string())?;
        f.write_all(bytes).map_err(|e| { let _ = fs::remove_file(&tmp); e.to_string() })?;
        f.flush().map_err(|e| { let _ = fs::remove_file(&tmp); e.to_string() })?;
        let _ = f.sync_all();
    }
    if let Err(e) = fs::rename(&tmp, path) {
        let _ = fs::remove_file(&tmp);
        return Err(e.to_string());
    }
    Ok(())
}

fn save_meta_map(m: &HashMap<String, RecMetaEntry>) -> Result<(), String> {
    let s = serde_json::to_string_pretty(m).map_err(|e| e.to_string())?;
    atomic_write(&meta_path(), s.as_bytes())
}

#[tauri::command]
fn load_state() -> serde_json::Value {
    if let Ok(s) = fs::read_to_string(state_path()) {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) { return v; }
    }
    serde_json::json!({ "theme": "auto", "settings": {} })
}

#[tauri::command]
fn save_state(state: serde_json::Value) -> Result<(), String> {
    let s = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
    atomic_write(&state_path(), s.as_bytes())
}

/// El tema del escritorio, preguntado al portal XDG.
///
/// Va **antes** que `kreadconfig6`: esa orden solo sabe de Plasma y lee el
/// `kdeglobals` del usuario, que en una sesión BookOS no lo escribe nadie —el
/// tema se elige en la tarjeta de Apariencia y vive en `panel.conf`—, así que
/// la app se quedaba con el tema con el que se instaló el sistema. El portal
/// lo sirve la sesión que esté corriendo: BookOS desde el propio compositor,
/// y Plasma y GNOME también, de modo que esto funciona en las tres.
///
/// `color-scheme`: 1 oscuro, 2 claro, 0 sin preferencia. `gdbus` viene con
/// GLib, que ya es dependencia de cualquier app Tauri: no añade nada.
fn portal_color_scheme() -> Option<String> {
    let salida = std::process::Command::new("gdbus")
        .args([
            "call",
            "--session",
            "--dest",
            "org.freedesktop.portal.Desktop",
            "--object-path",
            "/org/freedesktop/portal/desktop",
            "--method",
            "org.freedesktop.portal.Settings.ReadOne",
            "org.freedesktop.appearance",
            "color-scheme",
        ])
        .output()
        .ok()?;
    // Contesta «(<uint32 1>,)»; el 0 es «sin preferencia» y no es respuesta.
    let texto = String::from_utf8_lossy(&salida.stdout);
    let n = texto.split("uint32").nth(1)?.trim_start().chars().next()?;
    match n {
        '1' => Some("dark".to_string()),
        '2' => Some("light".to_string()),
        _ => None,
    }
}

#[tauri::command]
fn detect_system_theme() -> String {
    if let Some(tema) = portal_color_scheme() {
        return tema;
    }
    let kde_attempts = [
        ("kreadconfig6", &["--group", "General", "--key", "ColorScheme"][..]),
        ("kreadconfig5", &["--group", "General", "--key", "ColorScheme"][..]),
    ];
    for (bin, args) in kde_attempts {
        if let Ok(out) = Command::new(bin).args(args).output() {
            let s = String::from_utf8_lossy(&out.stdout).to_lowercase();
            if s.contains("dark") { return "dark".into(); }
            if s.contains("light") { return "light".into(); }
        }
    }
    if let Ok(out) = Command::new("gsettings").args(["get", "org.gnome.desktop.interface", "color-scheme"]).output() {
        let s = String::from_utf8_lossy(&out.stdout).to_lowercase();
        if s.contains("dark") { return "dark".into(); }
        if s.contains("light") { return "light".into(); }
    }
    "auto".into()
}

#[tauri::command]
fn get_recordings_dir() -> String { recordings_dir().to_string_lossy().into_owned() }

#[tauri::command]
fn bookos_palette_css() -> String {
    std::env::var("HOME").ok()
        .map(|h| std::path::Path::new(&h).join(".config/bookos/palette.css"))
        .and_then(|p| std::fs::read_to_string(p).ok())
        .unwrap_or_default()
}

#[derive(Serialize)]
struct RecMeta {
    name: String,
    path: String,
    size: u64,
    mtime: u64,
    ext: String,
    favorite: bool,
    tags: Vec<String>,
    has_transcript: bool,
}

#[tauri::command]
fn list_recordings(store: tauri::State<'_, MetaStore>) -> Vec<RecMeta> {
    let dir = recordings_dir();
    let meta = store.0.lock().unwrap();
    let mut out = Vec::new();
    if let Ok(rd) = fs::read_dir(&dir) {
        for e in rd.flatten() {
            let p = e.path();
            if !p.is_file() { continue; }
            let ext = p.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
            if !matches!(ext.as_str(), "webm" | "ogg" | "wav" | "mp3" | "m4a" | "opus") { continue; }
            let m = match e.metadata() { Ok(m) => m, Err(_) => continue };
            let mtime = m.modified().ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs()).unwrap_or(0);
            let key = p.to_string_lossy().into_owned();
            let entry = meta.get(&key).cloned().unwrap_or_default();
            out.push(RecMeta {
                name: p.file_stem().and_then(|s| s.to_str()).unwrap_or("rec").to_string(),
                path: key,
                size: m.len(), mtime, ext,
                favorite: entry.favorite,
                tags: entry.tags,
                has_transcript: !entry.transcript.is_empty(),
            });
        }
    }
    out.sort_by(|a, b| b.mtime.cmp(&a.mtime));
    out
}

#[tauri::command]
fn get_meta(path: String, store: tauri::State<'_, MetaStore>) -> RecMetaEntry {
    store.0.lock().unwrap().get(&path).cloned().unwrap_or_default()
}

#[tauri::command]
fn set_favorite(path: String, value: bool, store: tauri::State<'_, MetaStore>) -> Result<(), String> {
    let mut m = store.0.lock().unwrap();
    let e = m.entry(path).or_default();
    e.favorite = value;
    save_meta_map(&m)
}

#[tauri::command]
fn set_tags(path: String, tags: Vec<String>, store: tauri::State<'_, MetaStore>) -> Result<(), String> {
    let mut m = store.0.lock().unwrap();
    let e = m.entry(path).or_default();
    e.tags = tags.into_iter().map(|t| t.trim().to_string()).filter(|t| !t.is_empty()).collect();
    save_meta_map(&m)
}

#[tauri::command]
fn set_transcript(path: String, text: String, store: tauri::State<'_, MetaStore>) -> Result<(), String> {
    let mut m = store.0.lock().unwrap();
    let e = m.entry(path).or_default();
    e.transcript = text;
    save_meta_map(&m)
}

#[tauri::command]
fn set_notes(path: String, text: String, store: tauri::State<'_, MetaStore>) -> Result<(), String> {
    let mut m = store.0.lock().unwrap();
    let e = m.entry(path).or_default();
    e.notes = text;
    save_meta_map(&m)
}

#[tauri::command]
fn save_recording(name: String, ext: String, data_b64: String) -> Result<String, String> {
    let bytes = general_purpose::STANDARD.decode(&data_b64).map_err(|e| e.to_string())?;
    let safe_name: String = name.chars().map(|c| if "/\\:*?\"<>|".contains(c) { '_' } else { c }).collect();
    let safe_name = if safe_name.trim().is_empty() { "Grabacion".into() } else { safe_name };
    let safe_ext: String = ext.chars().filter(|c| c.is_ascii_alphanumeric()).collect();
    let safe_ext = if safe_ext.is_empty() { "webm".into() } else { safe_ext };
    let mut p = recordings_dir();
    p.push(format!("{}.{}", safe_name, safe_ext));
    let mut i = 1;
    while p.exists() {
        p.pop(); p.push(format!("{} ({}).{}", safe_name, i, safe_ext)); i += 1;
    }
    atomic_write(&p, &bytes)?;
    Ok(p.to_string_lossy().into_owned())
}

#[tauri::command]
fn read_recording_b64(path: String) -> Result<String, String> {
    // Solo se permite leer archivos dentro de la carpeta de grabaciones: `path`
    // viene del frontend y sin esta comprobación sería una lectura arbitraria de
    // archivos (p. ej. ~/.ssh/id_rsa) si el webview llega a comprometerse.
    let canon = check_in_recordings(&PathBuf::from(&path))?;
    let bytes = fs::read(&canon).map_err(|e| e.to_string())?;
    Ok(general_purpose::STANDARD.encode(&bytes))
}

fn check_in_recordings(p: &PathBuf) -> Result<PathBuf, String> {
    let base = recordings_dir();
    let cb = base.canonicalize().unwrap_or(base);
    let c = p.canonicalize().map_err(|e| e.to_string())?;
    if !c.starts_with(&cb) { return Err("Ruta fuera de carpeta de grabaciones".into()); }
    Ok(c)
}

#[tauri::command]
fn delete_recording(path: String, store: tauri::State<'_, MetaStore>) -> Result<(), String> {
    let p = PathBuf::from(&path);
    let canon = check_in_recordings(&p)?;
    fs::remove_file(&canon).map_err(|e| e.to_string())?;
    let mut m = store.0.lock().unwrap();
    m.remove(&path);
    m.remove(&canon.to_string_lossy().into_owned());
    let _ = save_meta_map(&m);
    Ok(())
}

#[tauri::command]
fn rename_recording(path: String, new_name: String, store: tauri::State<'_, MetaStore>) -> Result<String, String> {
    let p = PathBuf::from(&path);
    let canon = check_in_recordings(&p)?;
    let base = recordings_dir();
    let cb = base.canonicalize().unwrap_or(base);
    let ext = canon.extension().and_then(|s| s.to_str()).unwrap_or("webm").to_string();
    let safe_name: String = new_name.chars().map(|c| if "/\\:*?\"<>|".contains(c) { '_' } else { c }).collect();
    let safe_name = if safe_name.trim().is_empty() { "Grabacion".into() } else { safe_name };
    let mut np = canon.parent().unwrap_or(&cb).to_path_buf();
    np.push(format!("{}.{}", safe_name, ext));
    if np == canon { return Ok(canon.to_string_lossy().into_owned()); }
    let mut i = 1;
    while np.exists() {
        np.pop(); np.push(format!("{} ({}).{}", safe_name, i, ext)); i += 1;
    }
    fs::rename(&canon, &np).map_err(|e| e.to_string())?;
    let old_key = canon.to_string_lossy().into_owned();
    let new_key = np.to_string_lossy().into_owned();
    let mut m = store.0.lock().unwrap();
    if let Some(e) = m.remove(&old_key) { m.insert(new_key.clone(), e); let _ = save_meta_map(&m); }
    Ok(new_key)
}

#[tauri::command]
fn reveal_in_files(path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    let dir = if p.is_file() { p.parent().map(|x| x.to_path_buf()).unwrap_or(p) } else { p };
    Command::new("xdg-open").arg(&dir).spawn().map(|_| ()).map_err(|e| e.to_string())
}

// ============ Transcription backends ============
#[derive(Serialize)]
struct EngineInfo { id: String, name: String, available: bool, path: String }

fn which_bin(name: &str) -> String {
    if let Ok(path) = std::env::var("PATH") {
        for dir in path.split(':') {
            let mut p = PathBuf::from(dir);
            p.push(name);
            if p.is_file() { return p.to_string_lossy().into_owned(); }
        }
    }
    String::new()
}

#[tauri::command]
fn list_transcribe_engines() -> Vec<EngineInfo> {
    let candidates: [(&str, &str, &[&str]); 4] = [
        ("whisper", "Whisper.cpp (whisper-cli)", &["whisper-cli"]),
        ("whisper-main", "Whisper.cpp (main)", &["whisper-main", "whisper"]),
        ("vosk", "Vosk (vosk-transcriber)", &["vosk-transcriber"]),
        ("vosk-py", "Vosk (python -m vosk)", &["vosk"]),
    ];
    let mut out = Vec::new();
    for (id, name, bins) in candidates {
        let mut found = String::new();
        for b in bins {
            let p = which_bin(b);
            if !p.is_empty() { found = p; break; }
        }
        out.push(EngineInfo {
            id: id.into(), name: name.into(),
            available: !found.is_empty(),
            path: found,
        });
    }
    out
}

fn convert_to_wav16k(input: &PathBuf) -> Result<PathBuf, String> {
    let mut out = std::env::temp_dir();
    out.push(format!("bookos-rec-{}.wav", std::process::id()));
    let _ = fs::remove_file(&out);
    let status = Command::new("ffmpeg")
        .args(["-y", "-i"]).arg(input)
        .args(["-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le"])
        .arg(&out)
        .output()
        .map_err(|e| format!("ffmpeg requerido para transcribir: {}", e))?;
    if !status.status.success() {
        return Err(format!("ffmpeg fallo: {}", String::from_utf8_lossy(&status.stderr)));
    }
    Ok(out)
}

#[tauri::command]
fn transcribe(path: String, engine: String, model_path: String, language: String) -> Result<String, String> {
    let src = PathBuf::from(&path);
    let _ = check_in_recordings(&src)?;
    let wav = convert_to_wav16k(&src)?;
    let lang = if language.trim().is_empty() { "auto".into() } else { language };

    let text = match engine.as_str() {
        "whisper" | "whisper-main" => {
            let bin = if engine == "whisper" { "whisper-cli" } else { "whisper-main" };
            let mut cmd = Command::new(bin);
            cmd.arg("-f").arg(&wav)
                .args(["-l", &lang, "-otxt", "-of"])
                .arg(wav.with_extension(""));
            if !model_path.trim().is_empty() {
                cmd.args(["-m", &model_path]);
            }
            let out = cmd.output().map_err(|e| format!("Ejecutando {}: {}", bin, e))?;
            if !out.status.success() {
                let err = String::from_utf8_lossy(&out.stderr);
                let hint = if err.contains("model") || err.contains("ggml") {
                    "\n\nSelecciona un modelo .bin en Ajustes → Transcripción → Modelo.\nDescarga uno de https://huggingface.co/ggerganov/whisper.cpp"
                } else { "" };
                return Err(format!("{} fallo: {}{}", bin, err, hint));
            }
            let txt_path = wav.with_extension("txt");
            let s = fs::read_to_string(&txt_path).unwrap_or_else(|_| String::from_utf8_lossy(&out.stdout).into_owned());
            let _ = fs::remove_file(&txt_path);
            s
        }
        "vosk" => {
            let model_arg = if model_path.trim().is_empty() { vec![] } else { vec!["-m".to_string(), model_path] };
            let mut cmd = Command::new("vosk-transcriber");
            cmd.arg("-i").arg(&wav).arg("-o").arg("-");
            for a in &model_arg { cmd.arg(a); }
            let out = cmd.output().map_err(|e| format!("vosk-transcriber: {}", e))?;
            if !out.status.success() {
                return Err(format!("vosk fallo: {}", String::from_utf8_lossy(&out.stderr)));
            }
            String::from_utf8_lossy(&out.stdout).into_owned()
        }
        "vosk-py" => {
            if model_path.trim().is_empty() {
                return Err("Selecciona ruta de modelo Vosk en ajustes".into());
            }
            // Las rutas van por sys.argv y no dentro del código: un nombre de
            // archivo con una comilla ejecutaba Python arbitrario.
            let script =
                "import sys, json, wave\n\
                 from vosk import Model, KaldiRecognizer\n\
                 m = Model(sys.argv[1])\n\
                 wf = wave.open(sys.argv[2],'rb')\n\
                 rec = KaldiRecognizer(m, wf.getframerate())\n\
                 rec.SetWords(False)\n\
                 out=[]\n\
                 while True:\n\
                  d = wf.readframes(4000)\n\
                  if len(d)==0: break\n\
                  if rec.AcceptWaveform(d):\n\
                   out.append(json.loads(rec.Result()).get('text',''))\n\
                 out.append(json.loads(rec.FinalResult()).get('text',''))\n\
                 print('\\n'.join([x for x in out if x]))";
            let out = Command::new("python3").arg("-c").arg(script).arg(&model_path).arg(&wav).output()
                .map_err(|e| format!("python3 -m vosk: {}", e))?;
            if !out.status.success() {
                return Err(format!("vosk-py fallo: {}", String::from_utf8_lossy(&out.stderr)));
            }
            String::from_utf8_lossy(&out.stdout).into_owned()
        }
        _ => return Err(format!("Motor desconocido: {}", engine))
    };

    let _ = fs::remove_file(&wav);
    Ok(text.trim().to_string())
}

#[tauri::command]
fn pick_model_file() -> Option<String> { None } // dialog handled in JS

// ============ WebKit mic permission (Linux) ============
#[cfg(target_os = "linux")]
fn install_media_permission(app: &tauri::App) {
    use tauri::Manager;
    use webkit2gtk::{glib::ObjectExt, PermissionRequestExt, SettingsExt, WebViewExt};
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.with_webview(|webview| {
            let wv: webkit2gtk::WebView = webview.inner();
            if let Some(s) = wv.settings() {
                s.set_enable_media_stream(true);
                s.set_enable_mediasource(true);
                s.set_enable_webaudio(true);
            }
            wv.connect_permission_request(|_, request| {
                if !request.is::<webkit2gtk::UserMediaPermissionRequest>() {
                    return false;
                }
                let request = request.clone();
                gtk::glib::idle_add_local_once(move || request.allow());
                true
            });
        });
    }
}
#[cfg(not(target_os = "linux"))]
fn install_media_permission(_app: &tauri::App) {}

/// Quita el zoom de página que WebKitGTK hace con el pellizco del touchpad.
///
/// No hay ajuste para eso ni en WebKit ni en Tauri, y la página no se entera:
/// el pellizco lo consume un `GtkGestureZoom` de la propia vista y llega como
/// `setMagnification`, no como `wheel` ni `touch*`, así que ningún
/// `preventDefault` lo frena. Se apaga ese gesto y ningún otro: con fase `None`
/// GTK deja de pasarle eventos (gtkeventcontroller.c, 3.24). Va en
/// `on_page_load` para cubrir también las ventanas que se abran después.
fn desactivar_zoom_por_pellizco<R: tauri::Runtime>(
    webview: &tauri::Webview<R>,
    _: &tauri::webview::PageLoadPayload<'_>,
) {
    #[cfg(target_os = "linux")]
    let _ = webview.with_webview(|webview| {
        use gtk::glib::translate::from_glib_none;
        use gtk::prelude::*;

        // WebKitGTK guarda ahí el gesto (WebKitWebViewBase.cpp, 2.52.5). No es
        // API pública: si la clave cambia, no se encuentra y el zoom vuelve.
        // Lo guardado es un puntero C a un GObject, no un tipo de Rust.
        let Some(gesto) = (unsafe { webview.inner().data::<gtk::ffi::GtkGesture>("wk-view-zoom-gesture") }) else {
            return;
        };
        let gesto: gtk::Gesture = unsafe { from_glib_none(gesto.as_ptr()) };
        gesto.set_propagation_phase(gtk::PropagationPhase::None);
    });
}

fn main() {
    let initial_meta = load_meta_map();
    tauri::Builder::default()
        .on_page_load(desactivar_zoom_por_pellizco)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(MetaStore(Mutex::new(initial_meta)))
        .invoke_handler(tauri::generate_handler![
            load_state, save_state, detect_system_theme,
            get_recordings_dir, bookos_palette_css, list_recordings,
            save_recording, read_recording_b64,
            delete_recording, rename_recording, reveal_in_files,
            get_meta, set_favorite, set_tags, set_transcript, set_notes,
            list_transcribe_engines, transcribe, pick_model_file,
            bookos_activity::bookos_activity_publish,
            bookos_activity::bookos_activity_close,
        ])
        .setup(|app| {
            use tauri::Manager;
            bookos_activity::listen(app.handle().clone(), "com.bookos.voicerecorder");
            install_media_permission(app);
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running app");
}
