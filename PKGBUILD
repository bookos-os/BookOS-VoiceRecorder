pkgname=bookos-voicerecorder
pkgver=0.6.1
pkgrel=1
pkgdesc="Grabador de voz para BookOS"
arch=('x86_64')
url="https://github.com/bookos-os/bookos-voicerecorder"
license=('LicenseRef-BookOS')
depends=('webkit2gtk-4.1' 'gtk3' 'libayatana-appindicator' 'librsvg' 'libsoup3')
makedepends=('rust' 'cargo' 'pkgconf' 'base-devel')
source=()
options=('!strip' '!debug')

build() {
  cd "$startdir/src-tauri"
  cargo build --release --locked
}

package() {
  install -Dm755 "$startdir/src-tauri/target/release/bookos-voicerecorder" \
    "$pkgdir/usr/bin/bookos-voicerecorder"

  install -Dm644 /dev/stdin "$pkgdir/usr/share/applications/bookos-voicerecorder.desktop" <<EOF
[Desktop Entry]
Name=Voice Recorder
Name[es]=Grabadora
Comment=Grabador de voz BookOS
Exec=bookos-voicerecorder
Icon=bookos-voicerecorder
Type=Application
Categories=AudioVideo;Audio;Recorder;
StartupNotify=true
StartupWMClass=bookos-voicerecorder
EOF

  [ -f "$startdir/src-tauri/icons/icon.png" ] && install -Dm644 "$startdir/src-tauri/icons/icon.png" \
    "$pkgdir/usr/share/icons/hicolor/512x512/apps/bookos-voicerecorder.png"
  [ -f "$startdir/src-tauri/icons/icon.svg" ] && install -Dm644 "$startdir/src-tauri/icons/icon.svg" \
    "$pkgdir/usr/share/icons/hicolor/scalable/apps/bookos-voicerecorder.svg"
}
