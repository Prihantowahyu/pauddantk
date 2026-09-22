# 🚀 Panduan Membuat TWA & APK Android: Petualangan bersama Harsha

Dokumen ini berisi panduan langkah demi langkah untuk mengonversi Web PWA ini menjadi aplikasi Android mandiri (**TWA / Trusted Web Activity**) berformat **APK** (untuk pasang langsung di HP) dan **AAB** (untuk rilis di Google Play Store).

---

## ⚡ Opsi 1: Menggunakan PWABuilder (Paling Mudah, Cukup 2 Menit)

Metode ini tidak membutuhkan instalasi Android Studio maupun Java di komputer Anda:

1. **Pastikan GitHub Pages Anda Aktif**  
   Buka peramban dan pastikan tautan ini bisa diakses:  
   👉 `https://prihantowahyu.github.io/pauddantk/`

2. **Kunjungi PWABuilder**  
   Buka situs [https://www.pwabuilder.com/](https://www.pwabuilder.com/) di browser.

3. **Masukkan URL Web**  
   - Ketik: `https://prihantowahyu.github.io/pauddantk/`
   - Klik **Start**. PWABuilder akan memvalidasi Manifest dan Service Worker (semua sudah disiapkan dan berstatus centang hijau).

4. **Package untuk Android**  
   - Klik tombol **Package for Store** di bagian Android.
   - Pada konfigurasi:
     - **Package ID**: `io.github.prihantowahyu.pauddantk`
     - **App Name**: `Petualangan bersama Harsha`
     - **Short Name**: `Harsha Edu`
     - **Signing Key**: Pilih *Generate new* jika belum memiliki keystore, atau unggah keystore Anda.
   - Klik **Generate** / **Download Package**.

5. **Ekstrak & Pasang di Folder Proyek**  
   - Di dalam file `.zip` yang diunduh, Anda akan menemukan file berekstensi `.apk` (signed/unsigned).
   - Ubah nama file APK tersebut menjadi: `harsha-edu.apk`.
   - Pindahkan file tersebut ke folder: `apk/harsha-edu.apk` di proyek ini.
   - Commit & push ke GitHub:
     ```bash
     git add apk/harsha-edu.apk
     git commit -m "feat: tambahkan file apk android"
     git push origin main
     ```
   - Sekarang, saat orang tua/guru menekan tombol **"🤖 Unduh APK"** di aplikasi web, file APK akan otomatis terunduh!

---

## 🛠️ Opsi 2: Menggunakan Google Bubblewrap CLI

Jika di komputer Anda sudah terpasang Node.js, JDK 11+, dan Android SDK:

1. **Install Bubblewrap CLI** (jika belum):
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Build TWA menggunakan konfigurasi `twa-manifest.json` yang sudah disediakan**:
   ```bash
   bubblewrap build
   ```

3. File APK dan AAB siap digunakan akan dihasilkan di direktori build.

---

## 🔐 Menghilangkan URL Bar Chrome (Digital Asset Links)

Agar aplikasi Android TWA berjalan **100% Layar Penuh (Full Screen)** tanpa bilah alamat URL browser di bagian atas:

1. Dapatkan **SHA-256 Fingerprint** dari keystore yang Anda gunakan saat membuat APK:
   ```bash
   keytool -list -v -keystore android.keystore
   ```
2. Buka file [`.well-known/assetlinks.json`](.well-known/assetlinks.json).
3. Ganti kode SHA-256 di dalamnya dengan fingerprint asli Anda:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "io.github.prihantowahyu.pauddantk",
         "sha256_cert_fingerprints": [
           "PASTE_FINGERPRINT_SHA256_DISINI"
         ]
       }
     }
   ]
   ```
4. Push ke GitHub repository. Android akan memvalidasi otomatis domain tersebut dalam beberapa jam.

---

## 📱 Letak Tombol Unduh di Aplikasi
Tombol unduh APK telah ditambahkan pada:
1. **Banner Pasang Bawah**: Tombol hijau **"🤖 Unduh APK"** berdampingan dengan tombol "Pasang Sekarang".
2. **Buku Panduan Guru & Orang Tua (`📘`)**: Bagian *4. Cara Main Offline di HP (PWA & APK Android)* menyediakan kartu unduh langsung file APK.
3. **Bilah Navigasi Atas**: Tombol icon **📘** untuk membuka panduan dan unduh kapan saja.
