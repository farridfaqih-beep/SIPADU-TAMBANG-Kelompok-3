# SIPADU-TAMBANG

**Sistem Informasi Pelaporan Aktivitas Tambang Ilegal Kota Palu**

SIPADU-TAMBANG adalah aplikasi web untuk membantu warga melaporkan aktivitas tambang pasir dan galian C ilegal di Kota Palu, serta membantu petugas memverifikasi, menindaklanjuti, dan memantau laporan tersebut.

> **Catatan:** Projek ini adalah **simulasi/prototipe untuk tugas kuliah (KLH Kelompok 3)**. Data laporan bersifat dummy dan akun disimpan di `localStorage` browser, tanpa server atau database.

## Fitur

**Warga**
- Daftar dan masuk dengan akun warga
- Buat laporan (kategori, tingkat keparahan, lokasi di peta, foto dari galeri atau kamera, opsi anonim)
- Lihat riwayat dan status laporan sendiri
- Notifikasi perkembangan laporan
- Peta sebaran dan dashboard ringkasan

**Petugas**
- Daftar dan masuk dengan akun petugas (memakai kode akses)
- Kelola laporan: verifikasi, proses, selesaikan, atau tolak
- Dashboard dengan grafik, serta analisis dan evaluasi
- Indikator lingkungan

**Umum**
- Peta interaktif 8 kecamatan di Kota Palu (Leaflet + OpenStreetMap)
- Alur status laporan: Baru → Diverifikasi → Diproses → Selesai (atau Ditolak)
- Prioritas laporan dihitung dari tingkat keparahan

## Cara Menjalankan

Tidak perlu instalasi. Cukup buka `index.html` di browser.

Atau gunakan ekstensi **Live Server** di VS Code (port 5501).

Butuh koneksi internet untuk memuat peta, library Leaflet, dan font.

## Akun Demo

| Peran   | Email                    | Sandi        |
|---------|--------------------------|--------------|
| Warga   | `warga@demo.id`          | `warga123`   |
| Petugas | `petugas@dlh.palu.go.id` | `petugas123` |

Kode akses pendaftaran petugas: `DLH2026`

Akun dan kode di atas hanya untuk demo. Jangan memakai sandi asli Anda di aplikasi ini.

## Teknologi

- HTML, CSS, dan JavaScript (tanpa framework)
- [Leaflet](https://leafletjs.com/) dan [OpenStreetMap](https://www.openstreetmap.org/) untuk peta
- Google Fonts (Fraunces dan IBM Plex Sans)

## Struktur Berkas

```
├── index.html   # Halaman utama
├── app.js       # Logika aplikasi, data dummy, dan tampilan
├── style.css    # Gaya tampilan
└── README.md
```

## Tim

Kelompok 3 — Mata kuliah KLH

| No | Nama                        | NIM          |
|----|-----------------------------|--------------|
| 1  | Orlicon Yaleswira Widodo    | F5512510004  |
| 2  | Muhammad Fariid Faqih       | F5512510007  |
| 3  | Muhamad Algifahri           | F5512510008  |
| 4  | Bagus Aldy Putra            | F5512510009  |
| 5  | Muhammad Fahrul             | F5512510018  |
