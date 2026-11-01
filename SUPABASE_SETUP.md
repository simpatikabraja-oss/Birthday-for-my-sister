# Menyiapkan penyimpanan dan Cloudflare Turnstile

Kartu dapat dibuat tanpa mengirim data. Nama dan umur hanya dicatat di Supabase jika pengunjung memilih persetujuan dan lolos verifikasi Turnstile. Foto, pilihan gaya, hubungan, dan tema tidak dikirim.

## A. Buat widget Turnstile di Cloudflare

1. Masuk atau buat akun di [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Dari menu, buka **Turnstile**, lalu pilih **Add widget**.
3. Isi nama widget, misalnya `Kartu Ulang Tahun`.
4. Di **Widget Mode**, pilih **Managed**.
5. Pada **Hostname Management**, masukkan hostname situs:
   - Saat memakai VS Code Live Server, tambahkan `127.0.0.1` dan `localhost`.
   - Saat web sudah dipasang online, tambahkan hostname domain sebenarnya, misalnya `kartu.example.com`. Masukkan hostname saja—tanpa `https://`, path, atau port.
   - `file://` bukan hostname web yang dapat digunakan untuk pengujian. Buka situs lewat Live Server atau hosting.
6. Pilih **Create**. Cloudflare akan menunjukkan dua nilai:
   - **Site Key**: kunci publik untuk widget di browser.
   - **Secret Key**: rahasia untuk memverifikasi token di server.
7. Salin keduanya, tetapi jangan pernah mengirim atau memublikasikan Secret Key.

## B. Masukkan Site Key ke situs

1. Buka [`assets/js/supabase-config.js`](./assets/js/supabase-config.js).
2. Tempel **Site Key** ke `turnstileSiteKey`, lalu simpan:

   ```js
   turnstileSiteKey: "SITE_KEY_DARI_CLOUDFLARE",
   ```

`supabaseUrl` harus berbentuk `https://<project-ref>.supabase.co`. Publishable/anon key boleh ada di browser; jangan masukkan Cloudflare Secret Key atau Supabase `service_role`/secret key ke file frontend.

## C. Pasang Supabase CLI dan tautkan proyek

Jika Supabase CLI belum terpasang, ikuti [panduan instalasi resmi](https://supabase.com/docs/guides/cli/getting-started). Buka terminal di folder proyek ini, lalu jalankan:

```powershell
supabase login
supabase link --project-ref runoofkaidmweujjpddm
```

`supabase login` akan meminta token akses akun Supabase. Jangan menaruh token itu di file proyek atau membagikannya.

## D. Simpan Secret Key sebagai secret server

Di terminal PowerShell yang sama, isi secret Turnstile dan hostname yang diizinkan. Ganti teks contoh dengan **Secret Key** milik widget dan hostname situsmu:

```powershell
supabase secrets set "TURNSTILE_SECRET_KEY=SECRET_KEY_DARI_CLOUDFLARE"
supabase secrets set "TURNSTILE_ALLOWED_HOSTNAMES=127.0.0.1,localhost,domainkamu.com"
```

Untuk produksi, batasi `TURNSTILE_ALLOWED_HOSTNAMES` ke hostname situs yang benar-benar digunakan. Nama hostname harus sama dengan hostname pada token Turnstile. Jangan menambahkan `https://` atau path.

Jika ingin membatasi permintaan agar hanya berasal dari situsmu, set origin lengkap (termasuk protokol dan port jika ada). Contoh produksi:

```powershell
supabase secrets set "ALLOWED_ORIGIN=https://domainkamu.com"
```

Contoh pengujian Live Server jika alamat browser adalah `http://127.0.0.1:5500`:

```powershell
supabase secrets set "ALLOWED_ORIGIN=http://127.0.0.1:5500"
```

Jangan set origin produksi ke alamat lokal. Jika `ALLOWED_ORIGIN` belum diset, function menerima berbagai origin; gunakan hanya saat pengembangan lokal, lalu set origin produksi sebelum web dipublikasikan.

## E. Terapkan database dan deploy Edge Function

1. Di Supabase Dashboard → **SQL Editor**, jalankan [`supabase/schema.sql`](./supabase/schema.sql). Ini mencabut insert langsung dari browser.
2. Dari terminal di folder proyek, deploy function:

   ```powershell
   supabase functions deploy birthday-submit
   ```

Function memvalidasi nama, umur, persetujuan, Turnstile token, action, dan hostname sebelum menyimpan data. Secret Supabase hanya digunakan di sisi server.

## F. Uji alur

1. Jalankan web di Live Server atau HTTPS hosting, bukan dengan membuka file HTML sebagai `file://`.
2. Isi nama dan umur, lalu pilih **Lihat Pratinjau**.
3. Tanpa mencentang persetujuan, tekan **Tampilkan Kejutan**. Kartu tetap berfungsi dan data tidak dikirim.
4. Untuk menguji penyimpanan, centang persetujuan, selesaikan widget Turnstile, lalu tekan **Tampilkan Kejutan**.
5. Pastikan ucapan tampil dan lihat Supabase → **Table Editor → `birthday_uses`** untuk memeriksa baris terbaru.
6. Jika gagal, lihat pesan di bawah formulir, lalu cek Supabase → **Edge Functions → `birthday-submit` → Logs**. Jangan kirim Site Key rahasia, Secret Key, token, atau screenshot yang memperlihatkannya saat meminta bantuan.

Turnstile harus diverifikasi server-side; widget saja tidak cukup menghambat bot. Untuk referensi, lihat [Cloudflare: Get started](https://developers.cloudflare.com/turnstile/get-started/) dan [Cloudflare: Validate the token](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Privasi

Pengumpulan nama dan umur opsional. Foto diproses di browser dan tidak diunggah. Data hanya dapat dilihat pemilik proyek lewat Supabase Dashboard, bukan oleh pengunjung. Hapus data dari Table Editor bila tidak lagi diperlukan.
