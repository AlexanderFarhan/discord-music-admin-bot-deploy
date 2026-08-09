# Bot Discord Musik & Moderasi

Bot Discord siap pakai berbahasa Indonesia untuk memutar musik di voice channel dan mengelola server melalui slash command.

## Fitur

- Musik: putar dari judul atau tautan, jeda, lanjut, lewati, berhenti, antrean, lagu saat ini, dan volume.
- Moderasi: bersihkan pesan, kick, ban, timeout, hapus timeout, slowmode, kunci, dan buka kanal.
- Informasi server dan anggota.
- Pemeriksaan izin pengguna, izin bot, role hierarchy, dan voice channel.
- Log moderasi opsional ke kanal khusus.
- Tidak memerlukan **Message Content Intent**.
- Siap dijalankan langsung atau melalui Docker.

## 1. Membuat aplikasi Discord

1. Buka [Discord Developer Portal](https://discord.com/developers/applications), lalu pilih **New Application**.
2. Buka menu **Bot**, buat bot, lalu salin tokennya. Jangan pernah membagikan atau memasukkan token ke Git.
3. Di **OAuth2 → URL Generator**, centang scope `bot` dan `applications.commands`.
4. Pilih izin bot berikut:
   - View Channels, Send Messages, Embed Links, Read Message History
   - Connect, Speak
   - Manage Messages, Manage Channels
   - Kick Members, Ban Members, Moderate Members
5. Buka URL hasil generator dan undang bot ke server.
6. Pastikan role bot berada di atas role anggota yang akan dimoderasi.

## 2. Konfigurasi

Salin `.env.example` menjadi `.env`, lalu isi:

```env
DISCORD_TOKEN=token_bot_anda
CLIENT_ID=application_id_anda
GUILD_ID=server_id_anda
MOD_LOG_CHANNEL_ID=id_kanal_log_opsional
DEFAULT_VOLUME=50
LOG_LEVEL=info
```

Aktifkan **Developer Mode** di Discord melalui **User Settings → Advanced** agar menu **Copy ID** tersedia. Saat `GUILD_ID` diisi, slash command hanya didaftarkan ke satu server dan biasanya muncul segera. Jika dikosongkan, command menjadi global dan penyebarannya dapat memerlukan waktu.

## 3A. Menjalankan dengan Docker (disarankan)

Docker otomatis menyediakan FFmpeg:

```bash
docker compose up -d --build
```

Melihat log:

```bash
docker compose logs -f bot
```

## 3B. Menjalankan langsung

Persyaratan: Node.js 24+ dan FFmpeg yang dapat dipanggil dari terminal.

```bash
npm install
npm run check
npm test
npm start
```

Untuk pengembangan dengan restart otomatis:

```bash
npm run dev
```

## Daftar command

### Musik

- `/musik putar lagu:<judul atau tautan>`
- `/musik jeda`
- `/musik lanjut`
- `/musik lewati`
- `/musik berhenti`
- `/musik antrean`
- `/musik sekarang`
- `/musik volume persen:<1-100>`

Pencarian judul memakai SoundCloud. Tautan HTTPS dibatasi ke SoundCloud, Spotify, Apple Music, Vimeo, dan ReverbNation. Spotify dan Apple Music hanya menyediakan metadata, sehingga pemutaran dapat dijembatani ke sumber streaming lain dan tidak selalu menemukan kecocokan.

### Moderasi

- `/moderasi bersihkan jumlah:<1-100>`
- `/moderasi kick anggota:<user> alasan:<opsional>`
- `/moderasi ban anggota:<user> hapus_hari:<0-7> alasan:<opsional>`
- `/moderasi timeout anggota:<user> menit:<1-40320> alasan:<opsional>`
- `/moderasi untimeout anggota:<user> alasan:<opsional>`
- `/moderasi slowmode detik:<0-21600>`
- `/moderasi kunci`
- `/moderasi buka`

Discord hanya mengizinkan bulk delete untuk pesan yang berusia kurang dari 14 hari. Membuka kanal mengembalikan overwrite `Send Messages` milik `@everyone` ke keadaan bawaan (`null`).

### Informasi

- `/info server`
- `/info anggota pengguna:<opsional>`
- `/bantuan`

## Pemecahan masalah

- **Slash command tidak muncul:** isi `GUILD_ID`, restart bot, dan pastikan scope `applications.commands` dipilih saat mengundang bot.
- **Bot tidak bisa masuk atau bersuara:** periksa izin Connect/Speak pada voice channel.
- **Tidak bisa kick/ban/timeout:** naikkan role bot di atas role target dan periksa izin moderasinya.
- **Musik gagal:** pastikan FFmpeg terpasang, sumber didukung, dan bot dapat mengakses internet.
- **Pencarian tertentu tidak menemukan lagu:** coba judul yang lebih spesifik atau gunakan tautan SoundCloud langsung.

## Keamanan

- Jangan pernah commit file `.env`.
- Jika token pernah bocor, segera gunakan **Reset Token** di Developer Portal.
- Berikan izin hanya yang benar-benar dipakai bot; izin Administrator tidak diperlukan.
- Gunakan akun sistem non-root atau container untuk deployment produksi.

### Catatan audit dependensi

Versi `@discord-player/extractor` saat proyek ini dibuat masih membawa `file-type@16` yang memiliki advisori denial-of-service pada parser berkas ASF. Bot ini tidak memuat `AttachmentExtractor`, tidak menerima path berkas lokal, dan membatasi URL ke lima layanan HTTPS yang didukung, sehingga jalur parser tersebut tidak digunakan. Jangan menjalankan `npm audit fix --force` karena npm akan menurunkan Discord Player ke versi mayor lama yang tidak kompatibel; perbarui ke rilis v7 terbaru ketika perbaikannya tersedia.
