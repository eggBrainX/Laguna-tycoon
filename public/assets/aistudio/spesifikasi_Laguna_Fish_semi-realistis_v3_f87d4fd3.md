# LAGUNA FISH — Spesifikasi Game & MVP v2 (Kotlin + Jetpack Compose) — GAYA SEMI-REALISTIS
### Dokumen ini siap ditempel (copy-paste) ke Google AI Studio sebagai prompt

> **Instruksi untuk AI:** Buatkan aplikasi game **Android native dengan Kotlin + Jetpack Compose** bernama **Laguna Fish** persis mengikuti spesifikasi di bawah. Semua angka, peluang, dan aturan WAJIB diikuti persis. Gunakan gaya visual **SEMI-REALISTIS** (lihat §0 — arah seni), orientasi **landscape**. Ikan tampil sebagai gambar semi-realistis berwarna memakai Compose `Image` dari aset WebP/PNG transparan (bukan emoji, bukan pixel art). Simpan progres pemain secara lokal (DataStore + JSON). Jangan pakai nama "Fish Tycoon", jangan meniru teks/aset game lain — semua nama dan teks original sesuai dokumen ini.
>
> **Struktur proyek yang diminta:**
> - Satu modul `:app`, `MainActivity` tunggal, Compose Material 3, tanpa library game engine.
> - Navigasi antar-layar dengan state di `GameViewModel` (tanpa Navigation Component juga boleh, cukup `when (screen)`).
> - Model data: `data class Fish(...)`, `enum class BodyPart, Fin, Rarity, Stage`, `data class Buyer(...)`, `data class GameState(...)`.
> - Logika game murni di file terpisah (`GameRules.kt`): tabel harga, peluang rarity, negosiasi — agar mudah diuji.
> - **[BARU v2]** Semua angka di dokumen ini dikumpulkan di satu file `GameConfig.kt` (lihat Lampiran A) — jangan menulis angka "ajaib" di tengah kode. Waktu game memakai **timestamp nyata** (`System.currentTimeMillis()`) + satu tick 1 Hz, bukan hitungan frame, supaya progres offline & Mode Real Time akurat.
> - Penyimpanan: 4 slot save sebagai file JSON terpisah di internal storage + satu file pengaturan global (bahasa, mode waktu, suara).
> - Gambar ikan: sistem **berlapis** — satu gambar badan per spesies (6) + satu gambar sirip ekor per jenis (5) yang ditumpuk/dikomposit saat runtime, sehingga 30 spesies tidak perlu 30 gambar terpisah. Sediakan daftar aset yang dibutuhkan (§0) dan kode placeholder berwarna bila aset belum ada.
> - Sertakan `build.gradle.kts`, `AndroidManifest.xml` (landscape, fullscreen), dan instruksi singkat cara build APK di Android Studio.

## Catatan Revisi v2 — apa yang dikembangkan
Versi ini memperdalam dokumen asli dengan mekanik yang dipelajari dari gameplay referensi (game akuarium J2ME lawas: bagian menu, tutorial, teks bantuan, daftar item, dan alur layar di dalam file `.jar`). Yang **diambil hanya mekaniknya**, bukan nama/teks/aset — semua nama, angka, dan teks di sini tetap original Laguna Fish.

- Bagian yang **ditandai [BARU]** adalah tambahan v2. Angka bertanda [BARU] adalah **usulan awal** yang bisa dituning; angka tanpa tanda adalah angka asli dokumen v1 dan **tidak berubah**.
- Tambahan utama: Tank Isolasi & alur perjodohan klasik (§4, §10) · Tank penuh & kondisi air / "hibrida rapuh" (§4, §5, §7) · tabel nama + nilai dasar 30 spesies (§5) · reaksi/komentar pembeli & Meter Popularitas Toko (§8) · sistem dosis obat + pakan (§12) · durasi & efek riset (§13) · Tanaman Laguna (§14) · efek pasif 7 Ikan Ajaib + Trofi (§15) · tutorial kontekstual berbasis pemicu, statistik lengkap, notifikasi (§16) · peta jalan versi & Lampiran A–C.
- Tidak ada fitur berbayar, tidak ada game over: ikan hanya mati bila diabaikan lama.
## 0. Arah Seni — Semi-Realistis (PENGGANTI pixel retro)
- **Ikan**: proporsi tubuh mendekati ikan asli (tidak chibi), pewarnaan gradasi halus mengikuti palet §5, sisik berkilau lembut, sirip semi-transparan dengan urat sirip halus, mata realistis dengan highlight. Bayi tetap **putih polos semi-transparan**; dari fase Anak-anak, warna & motif **identik** dengan Dewasa (hanya ukuran & sirip yang tumbuh) — aset yang sama diskalakan, jangan gambar ulang per fase.
- **Animasi**: gerakan renang halus 60fps — badan bergelombang sinus lembut, ekor mengayun mengikuti kecepatan, sesekali ikan berbalik arah dengan membalik gambar secara horizontal secara mulus. Tidak ada animasi patah-patah ala pixel.
- **Latar tank**: suasana bawah air semi-realistis — gradasi biru kedalaman, sinar matahari menembus permukaan (god rays), partikel melayang, pasir & batu alami, tanaman air bergoyang pelan, gelembung naik. Boleh satu gambar latar besar WebP + lapisan tanaman/gelembung terpisah yang dianimasikan.
- **UI**: panel kaca (glassmorphism) lembut di atas air, sudut membulat, bayangan halus, font bersih modern; tombol besar ramah sentuh. Ikon digambar vektor halus, bukan pixel.
- **Karakter pembeli & toko**: ilustrasi semi-realistis bergaya lukisan digital lembut (bukan foto, bukan pixel), proporsi manusia wajar, pakaian sesuai §9. Adegan negosiasi: pembeli besar di satu sisi, akuarium pajangan berisi ikan semi-realistis di sisi lain, balon ucapan membulat.
- **Aset yang perlu dibuat** (di luar kode, pakai generator gambar lalu potong latar transparan): badan ikan 6 spesies (tampak samping, menghadap kanan, pose renang netral), sirip ekor 5 jenis mengikuti warna motif spesies, bayi putih 1, telur roe 3 warna, latar tank 1 + tanaman 2–3, karakter pembeli: anak SD, remaja, dewasa batik, dewasa daster, lansia, adat — masing-masing 1 pose berdiri. Minta AI menuliskan **prompt gambar yang konsisten** untuk tiap aset (gaya, sudut, pencahayaan sama) sebagai lampiran.
- **Konsekuensi teknis**: ukuran APK lebih besar (aset gambar), jadi kompres WebP kualitas 80, resolusi ikan ±512px sisi terpanjang, dan gambar dimuat malas (lazy) per layar. Performa target tetap ringan di HP kelas bawah: batasi ikan tampil bersamaan sesuai kapasitas tank (21), hindari efek blur berat di banyak lapisan.

---

## 1. Ringkasan Game
Game simulasi toko ikan hias: pemain membeli telur ikan, menetaskannya di akuarium (tank), merawat dan membesarkan ikan, menjualnya ke pembeli lewat **negosiasi interaktif**, mengawinkan (breeding) ikan dewasa untuk menemukan spesies baru, dan mengumpulkan **7 Ikan Ajaib Laguna**. Cerita: laguna tropis bernama Laguna kehilangan keseimbangannya; menemukan ketujuh Ikan Ajaib memulihkannya (layar kemenangan saat lengkap).

**Tanpa paywall** — tidak ada pembelian uang asli; semua dibuka dengan mata uang dalam game.
**Loop inti [BARU]** (satu putaran ±10–15 menit di Mode Cepat): beli telur → tetaskan → rawat (makan/obat) → tumbuh → **jual** (negosiasi) *atau* **kawinkan** → temukan spesies baru → modal naik → beli tank/riset/dekor → ulangi, makin dekat ke 7 Ikan Ajaib.

**Pilar desain [BARU]:** (1) Santai & berjalan dalam waktu nyata — tanpa tekanan, tanpa game over. (2) Satu keputusan bermakna per menit: kawinkan apa, jual apa, riset apa. (3) Penemuan lebih penting daripada grinding: spesies baru & Ikan Ajaib adalah hadiah utama. (4) Sesi singkat, ramah HP kelas bawah.

## 2. Bahasa & Mata Uang
- Saat pertama buka: pilih **Bahasa Indonesia (Rp)** atau **English ($)**. Bisa diganti di Pengaturan.
- Saldo disimpan internal dalam Rupiah. Kurs tetap: **$1 = Rp15.000** (tampilan English = Rp ÷ 15.000).
- Uang awal: **Rp50.000**.
- Semua teks UI dua bahasa lewat fungsi terjemahan `t(key)` / string map di `Strings.kt`.

## 3. Alur Layar
1. **Pilih Bahasa** (hanya pertama kali)
2. **Menu Utama**: judul "LAGUNA FISH", satu gambar, dua tombol utama: **New Game** dan **Continue/Lanjutkan**. **[BARU]** Tombol sekunder (ikon kecil): **Trofi, Statistik, Opsi, Bantuan, Tentang, Keluar** (Keluar minta konfirmasi).
3. **Pilih Slot**: ada **4 slot toko**. Slot kosong → mulai baru. Slot isi → Lanjutkan, atau Hapus (dengan konfirmasi). New Game di slot isi → konfirmasi timpa.
4. **Tank (layar utama)**: HUD — koin di kiri atas; tombol Tank 1–4 & Pengaturan di kanan atas; tombol bawah: Feed/Makan, Eggs/Telur, Supplies, Research, Magic Fish, Species/Findex, Store/Toko, Breeding.
5. **Store/Toko**: daftar ikan siap jual + antrean pembeli + tombol Decorate, Upgrade Toko, Staff, SALE.
6. **Negosiasi**: adegan tatap muka (lihat §8).
7. **Pengaturan**: ganti bahasa, Mode Waktu, suara on/off. (Tidak ada tombol Reset.) **[BARU]** Tambahan: Musik on/off + pilih lagu latar (**Akuatik, Samudra, Ceria, Ajaib** — 4 loop pendek `.ogg`), Pesan Bantuan on/off (§16), Notifikasi on/off (§16).
8. **[BARU] Trofi**: rak trofi 7 bola/piala Ikan Ajaib; yang belum ditemukan berupa siluet gelap, yang sudah ditemukan menyala + tanggal ditemukan (§15).
9. **[BARU] Statistik, Bantuan, Tentang**: Statistik = daftar penuh §16; Bantuan = ringkasan tujuan, kontrol, dan tips (teks statis dua bahasa); Tentang = versi, kredit, email dukungan.

## 4. Tank
- 4 tank, kapasitas **21 ikan per tank**. Tank 1 gratis; Tank 2 = **Rp800.000**, Tank 3 = **Rp1.200.000**, Tank 4 = **Rp1.500.000**.
- Ikan berenang bebas di tank; ketuk ikan untuk memilih (maks 2, untuk breeding) dan melihat detail: spesies, fase, rarity, bar Health & Fed, harga.
- Label **HEALTHY / SICK / PREGNANT** hanya muncul **sebentar (±3 detik)** saat pindah tank, fase berubah, atau ikan dipilih — tidak tampil permanen.
- Ikan bisa dipindah antar-tank.
### 4.1 Info & bar aksi ikan [BARU]
Ketuk ikan → muncul **bar info** (nama spesies, umur/fase, bar Fed, bar Health, ikon Hamil/Sakit, harga) dan **bar aksi** berisi ikon. Aksi yang tidak berlaku tampil abu-abu; ketuk untuk melihat alasannya (toast singkat).

| Aksi | Fungsi |
|---|---|
| Harga | Atur markup 1–10% untuk ikan ini (default ikut markup spesies, §6) |
| Pindah | Pindah ke Tank 1–4 (ditolak bila tank tujuan penuh) |
| Siap Jual | Tandai ikan untuk muncul di Store (hanya Remaja ke atas, tidak sakit) |
| Silsilah | Lihat generasi & induk (§10.5) |
| Isolasi / Lepas | Masukkan ke / keluarkan dari Tank Isolasi (§4.2) |
| Jodohkan | Aktif bila ada ikan Dewasa di Isolasi dan ikan terpilih juga Dewasa (§10) |
| Obat / Vitamin / Instagrow | Hanya tampil bila stok dosis > 0, dengan angka sisa dosis (§12) |
| Buang | Buang ikan (tempat sampah) — selalu minta konfirmasi; Ikan Ajaib tidak bisa dibuang |

### 4.2 Tank Isolasi [BARU]
- Tank kecil di bagian bawah layar Tank, **gratis sejak awal**, **satu untuk seluruh toko**, kapasitas **2 ikan**.
- Tiga fungsi: (a) karantina ikan sakit supaya tidak menular (§11); (b) tempat perjodohan klasik (§10.1); (c) memisahkan ikan dari tank utama.
- Ikan di Isolasi **tidak dihitung** dalam kapasitas 21, tidak bisa dijual, dan tetap lapar — tombol Feed otomatis ikut mengisi Isolasi.

### 4.3 Tank penuh [BARU]
- Tank berisi 21 ikan = penuh: telur tidak bisa dijatuhkan ("Tank penuh — jual ikan atau beli tank"), pindah ke tank itu ditolak.
- Bayi yang lahir saat tank penuh **langsung dimakan ikan lain**: hanya bayi yang muat di sisa slot yang hidup, sisanya hilang dengan notifikasi.

## 5. Spesies: Badan × Sirip
Spesies = kombinasi **6 badan × 5 sirip = 30 spesies**:

| Badan | Warna utama | Warna motif |
|---|---|---|
| Discus | oranye | biru |
| Tetra | kuning | merah |
| Angelfish | ungu muda | ungu tua |
| Guppy | hijau | kuning |
| Koi | putih | merah |
| Betta | merah | ungu tua |

Sirip: **Round, Fan, Spiky, Long, Twin** (bentuk ekor berbeda-beda).
Spesies yang belum ditemukan tampil sebagai siluet/"???" di **Findex**.
### 5.1 Penamaan spesies [BARU]
Nama = **[Badan] [Sirip]**, mis. "Guppy Ganda" (ID) / "Twin Guppy" (EN). Kamus sirip: Round = **Bulat**, Fan = **Kipas**, Spiky = **Duri**, Long = **Panjang**, Twin = **Ganda**.

### 5.2 Nilai dasar tetap 30 spesies [BARU]
Nilai dasar "acak tetap" dari v1 kini ditetapkan sebagai tabel (Rp), agar angka bisa diuji dan konsisten antar-save. ★ = kombinasi **Ikan Ajaib** (§15).

| Badan | Round | Fan | Spiky | Long | Twin |
|---|---|---|---|---|---|
| Discus | 1.200.000 | 1.850.000 | 2.400.000 | 3.600.000 ★ | 2.900.000 |
| Tetra | 650.000 | 900.000 | 3.300.000 ★ | 1.450.000 | 1.100.000 |
| Angelfish | 1.700.000 | 2.100.000 | 3.900.000 ★ | 2.650.000 | 3.100.000 |
| Guppy | 500.000 | 750.000 | 1.000.000 | 1.300.000 | 3.500.000 ★ |
| Koi | 3.800.000 ★ | 5.000.000 ★ | 2.250.000 | 3.000.000 | 4.200.000 |
| Betta | 1.550.000 | 4.000.000 ★ | 2.000.000 | 2.800.000 | 3.400.000 |

### 5.3 Ketahanan lingkungan (K) & "Hibrida Rapuh" [BARU]
Tiap spesies punya **K** dari nilai dasarnya: < Rp1.500.000 → **K0** · Rp1.500.000–2.750.000 → **K1** · Rp2.750.001–4.000.000 → **K2** · > Rp4.000.000 → **K3**. Level riset **Environment** (§13) harus ≥ K agar spesies itu nyaman.
- Bila Environment < K: ikan diberi label **"Hibrida Rapuh"** saat lahir/ditemukan; Health turun **2× lebih cepat**; peluang bayi mati saat lahir **+25% per level kekurangan**.
- Pesan petunjuk muncul sekali: "Spesies ini rapuh untuk kondisi air tankmu — tingkatkan riset Environment."

### 5.4 Pool spesies dari telur [BARU]
Spesies bayi dari telur toko diundi acak (seragam) dari pool; **7 kombinasi Ikan Ajaib tidak pernah keluar dari telur** — hanya lewat breeding.
- Telur **Common**: spesies K0 (9 spesies). · Telur **Premium**: K0–K1. · Telur **Exclusive**: K0–K2.
- Spesies **K3** (mis. Koi Ganda) hanya bisa didapat lewat breeding — hadiah bagi pemain yang sudah riset jauh.

## 6. Rarity & Harga
- Rarity: **Common, Uncommon, Rare, Epic, Legend, Mythic, Holy**. Semua spesies bisa jadi rarity apa pun (diundi per ikan).
- Nilai dasar tiap spesies: acak tetap per spesies antara **Rp500.000 – Rp5.000.000**.
- **Harga ikan = persentase DARI nilai dasar spesies** (bukan markup):
  Common **4%** · Uncommon **6%** · Rare **9%** · Epic **12%** · Legend **18%** · Mythic **22%** · Holy **45%**.
- Pengali fase: Bayi & Anak-anak = tidak bisa dijual · Remaja = **×0,4** · Dewasa = **×1** · Tua = **×1,8**.
- Pemain boleh menaikkan harga jual **1–10%** (markup, diatur per ikan).
### 6.1 Rumus & contoh [BARU]
`harga_minta = bulatkan_ke_Rp500( nilai_dasar × %rarity × pengali_fase × (1 + markup) × (1 + bonus_Golden_Seahorse) )`
- **Markup default per spesies** diatur di layar Spesies (bawaan **5%**, 1–10%); tiap ikan boleh menimpa dengan markup sendiri. Bonus Golden Seahorse = +5% bila ada di tank ikan itu.
- Bonus Rak Merchandise (+3%) dan Kasir Bambang (+2%) dihitung pada **pendapatan** setelah DEAL, bukan pada harga pajang.

| Contoh | Perhitungan | Harga minta |
|---|---|---|
| Guppy Round, Common, Dewasa, markup 5% | 500.000 × 4% × 1 × 1,05 | Rp21.000 |
| Betta Fan, Rare, Dewasa, markup 5% | 4.000.000 × 9% × 1 × 1,05 | Rp378.000 |
| Discus Long, Epic, Remaja, markup 5% | 3.600.000 × 12% × 0,4 × 1,05 = 181.440 | Rp181.500 |
| Koi Fan, Holy, Tua, markup 10% | 5.000.000 × 45% × 1,8 × 1,10 | Rp4.455.000 |

### 6.2 Rarity ikan dari telur [BARU]
Dari telur toko: ikan = **Common** dengan peluang (100 − p)%, atau **mutasi** (p = 1/2/3% menurut jenis telur). Rarity mutasi diundi berbobot **Uncommon 25 : Rare 12 : Epic 5 : Legend 2 : Mythic 0,9 : Holy 0,1** (bobot dinormalkan).

## 7. Telur, Menetas & Fase Tumbuh
- Toko telur (visual: **butiran bulat kecil banyak / roe**, BUKAN telur ayam; Common = pink, Premium = emas, Exclusive = ungu):

| Jenis | Harga | Peluang mutasi langka* |
|---|---|---|
| Common | Rp5.000 | 1% |
| Premium | Rp15.000 | 2% (butuh Environment Research Lv1) |
| Exclusive | Rp40.000 | 3% (butuh Environment Research Lv2) |

\*Mutasi: rarity diundi acak dari Uncommon–Holy. Sekali beli menetas **2–5 ekor**.
- Telur yang dibeli **langsung menetas** saat dimasukkan ke tank — tanpa cangkang/residu.
- Fase: **Bayi** (putih polos, spesies belum kelihatan) → **Anak-anak** (warna & motif **sama persis** dengan bentuk dewasa, hanya lebih kecil) → **Remaja** (bisa dijual, murah) → **Dewasa** (harga normal, bisa breeding) → **Tua** (sangat mahal).
- Waktu tumbuh **Mode Cepat** (standar): Bayi→Remaja **60 detik** (Bayi 30 + Anak 30), Remaja→Dewasa **120 detik**, Dewasa→Tua **360 detik** (total 9 menit).
- **Mode Real Time** (di Pengaturan): Bayi→Remaja **1 jam**, Remaja→Dewasa **3 jam**, Dewasa→Tua **24 jam**; ikan tetap tumbuh saat game ditutup (progres offline, maks 7 hari).
### 7.1 Interaksi & aturan tambahan [BARU]
- **Cara menetaskan**: pilih jenis telur → pilih tank tujuan → butiran roe jatuh ke air dan menetas (animasi singkat). Tank penuh menolak (§4.3).
- **Mode Cepat** hanya berjalan saat aplikasi terbuka (dijeda saat ditutup). **Mode Real Time** terus berjalan (maks 7 hari offline) — ganti mode tidak mereset umur ikan.
- Menatap ikan tidak mempercepat tumbuh; pemain bebas meninggalkan game lalu kembali. Saat kembali, tampilkan **ringkasan "Selama kamu pergi"** (ikan tumbuh, lahir, sakit, mati, riset selesai).
- **Hadiah awal**: setelah tutorial selesai, pemain dapat **3 ikan Remaja Common** gratis (spesies K0 acak) agar punya modal jual pertama.
- Bayi yang mati karena air tidak cocok (§5.3) menampilkan pesan khusus yang menyebut riset Environment.

## 8. Penjualan & Negosiasi (fitur inti)
- Ikan Remaja ke atas dijual di Store. Pembeli datang otomatis ke antrean (maks 3; tiap ±12 detik), digambar sebagai **karakter lokal Indonesia** (lihat §9).
- Pemain memilih pembeli + ikan, lalu masuk adegan negosiasi tatap muka: **pembeli dengan balon ucapan, ikan di akuarium pajangan dengan label harga, tombol Tawar/Jual di bawah**.
- Mekanik berbasis peluang, serealistis mungkin:
  - Harga ≤ batas kesediaan pembeli & peluang acak berhasil → **DEAL**.
  - Gagal → pembeli **menawar balik** (82–95% dari harga minta, minimal 45% nilai dasar); pemain bisa terima atau tahan harga.
  - Atau pembeli **ragu**: pemain bisa naik/turunkan harga 1–2% per ronde.
  - Tiap ronde kesabaran pembeli −1; kesabaran habis atau acak pergi → **pembeli batal/pergi**.
  - Peluang DEAL naik bila: ikan langka & pembeli Kolektor (+20%), Penghobi (+25%), dekorasi toko, event SALE (+10%), ronde pertama pembeli Buru-buru (+10%); turun bila pembeli Hemat (−15%) dan markup tinggi.
### 8.1 Syarat ikan boleh dijual [BARU]
Remaja ke atas · tidak sakit · tidak di Isolasi · bukan Ikan Ajaib (§15) · sudah ditandai **Siap Jual**. Bayi/Anak yang ditandai tetap tinggal di Store dengan label "terlalu muda" sampai Remaja. Ikan sakit di etalase memancing komentar negatif dan menurunkan popularitas (§8.3).

### 8.2 Komentar pembeli berdasarkan kondisi [BARU]
Balon ucapan dipilih dari kondisi nyata, bukan acak murni (teks tinjauan — tulis ulang dua bahasa di `Strings.kt`):

| Kondisi | Contoh komentar ID | Efek |
|---|---|---|
| Harga ≤ 90% harga wajar | "Wah, harga bagus!" | Peluang DEAL naik |
| Harga > batas kesediaan | "Kemahalan nih…" / "Bisa kurang?" | Mulai tawar-menawar |
| Harga sangat tinggi (> 130% wajar) | "Mahal banget!" | Kesabaran −1 ekstra |
| Ikan sakit di etalase | "Ikannya kok sakit?" | Popularitas turun |
| Ikan Remaja belum layak | "Masih terlalu kecil." | Tidak bisa deal |
| Koleksi beragam / dekor bagus | "Tempatnya bagus!" | Popularitas naik |
| Spesies sangat langka di etalase | "Ikan apa ini, aneh banget!" | Kolektor/Penghobi tertarik |
| Etalase kosong | "Lho, nggak ada ikan?" | Pembeli pergi |
| DEAL | "Oke, aku beli ini!" | Uang masuk + suara |

### 8.3 Meter Popularitas Toko (0–100) [BARU]
Angka yang menentukan seberapa sering pembeli datang. Antar-kedatangan = **12 detik ÷ (1 + Popularitas/100)** — jadi pada Popularitas 0 tetap ±12 detik (sesuai v1), pada 100 jadi ±6 detik. Antrean tetap maks 3 (4 dengan Papan Nama).
- Awal: 0. Tambahan: Advertising **+10/+20/+30** (Lv1/2/3) · tiap dekorasi **+3** · tiap upgrade toko **+5** · Sales Sinta **+5** · variasi spesies di etalase **+1 per 3 spesies berbeda** (maks +10) · event SALE **+25** sementara.
- Pengurang: tiap ikan sakit di etalase **−10** (maks −30) · harga rata-rata etalase > 130% harga wajar **−15**.
- Tampilkan sebagai bar kecil di layar Store.

### 8.4 Event SALE — detail [BARU]
Tombol SALE (aturan dasar §14 tetap: 30 detik, antrean +2, DEAL +10%, cooldown 2 menit) menampilkan **grafik garis popularitas** real-time dan hitungan mundur 30 detik; pemain harus tetap di layar Store, tombol **STOP** mengakhiri lebih awal. Akhir SALE → ringkasan: pembeli datang, ikan terjual, total pendapatan.

## 9. Pembeli (karakter lokal Indonesia)
Diundi acak: **Anak 6–12 th (25%)** seragam SD putih-merah · **Remaja 13–19 (30%)** seragam SMP/SMA/hoodie/topi · **Dewasa 20–55 (35%)** batik, daster, baju koko, jaket ojol · **Lansia 56+ (10%)** peci/kopiah, uban, tongkat. ±10% pembeli spesial berbusana adat (kebaya, beskap+blangkon, ulos, dll), digambar sopan tanpa karikatur.
Sifat (trait) memengaruhi tawar-menawar:
- **HEMAT**: mau bayar maks **85%** nilai ikan.
- **BOROS/KOLEKTOR**: sampai **130%** untuk ikan langka.
- **ANAK KECIL**: suka ikan warna-warni, uang terbatas, lebih sabar.
- **PENGHOBI**: mencari spesies tertentu, bayar tinggi bila cocok.
- **BURU-BURU**: kesabaran pendek (2 hati).
Contoh komentar — ID: "BANG, MURAHIN DONG", "WAH, IKANNYA CANTIK!"; EN: "CAN YOU LOWER THE PRICE?", "WOW, SO PRETTY!".
**[BARU] Penghobi & anggaran:** pembeli Penghobi membawa 1 spesies incaran yang tampil sebagai siluet kecil di balon ("Cari: Koi Kipas"); bila pemain memilih ikan spesies itu, bonus DEAL +25% (§8) berlaku, dan spesies yang **belum ditemukan** pemain tidak pernah dipilih sebagai incaran. Pembeli Anak punya batas anggaran maks **60%** dari harga wajar ikan termahal di etalase.

## 10. Breeding
- Pilih tepat **2 ikan Dewasa** → tombol Breeding. Anak mewarisi badan salah satu induk + sirip induk lainnya; kombinasi baru = **spesies baru** tercatat di Findex.
- Rarity anak hasil breeding: **Common 55% · Uncommon 25% · Rare 12% · Epic 5% · Legend 2% · Mythic 0,9% · Holy 0,1%**.
- Induk bisa jadi **hamil** (peluang 30%): melahirkan sendiri 2–4 bayi setelah **60 detik** (Mode Cepat) / **1 jam** (Real Time), atau langsung dengan item Instabirth.
### 10.1 Dua jalur perjodohan [BARU]
- **Jalur cepat** (v1): pilih 2 ikan Dewasa → tombol Breeding. Ikan yang dipilih pertama menjadi induk yang bisa hamil.
- **Jalur klasik**: Isolasikan 1 ikan Dewasa (§4.2) → pilih ikan Dewasa lain di tank → **Jodohkan**. Ikan di Isolasi adalah induk yang bisa hamil. Hasilnya identik; jalur klasik hanya cara main yang lebih "pelihara".

### 10.2 Percobaan & kelahiran [BARU]
- Tiap percobaan: peluang hamil **30%**. Gagal → "Belum cocok", cooldown pasangan yang sama **20 detik (Cepat) / 10 menit (Real)**.
- Hamil → ikon butir telur kecil. Lahir **2–4 bayi** (+1 bila Tanaman Subur atau Ikan Ajaib Kesuburan ada di tank, §14–15). Aturan tank penuh & kondisi air berlaku (§4.3, §5.3).

### 10.3 Pewarisan, mutasi, Discovery Potion [BARU]
- Tiap bayi: 50% (badan induk A + sirip induk B), 50% (badan B + sirip A). Induk sama spesies → bayi sama spesies.
- **Mutasi**: bila Ikan Ajaib Mutasi ada di tank, **10%** bayi adalah kombinasi badan & sirip acak (tidak terkait induk).
- **Discovery Potion**: bayi pertama dijamin kombinasi yang belum ditemukan (acak, abaikan induk) — jika 30/30 sudah ditemukan, jaminan menjadi rarity minimal **Rare**.

### 10.4 Penemuan spesies baru [BARU]
Kombinasi baru → notifikasi "Spesies baru!" (juga bila Hibrida Rapuh), Findex terisi lengkap dengan tanggal dan "pertama dari [induk A] × [induk B]". Siluet "???" berubah jadi kartu penuh.

### 10.5 Silsilah [BARU]
Tiap ikan menyimpan: generasi (G0 = dari telur, G1+ = hasil breeding), spesies kedua induk, tanggal lahir. Layar Silsilah menampilkan 2 generasi ke atas dalam kartu sederhana.

## 11. Kesehatan, Sakit & Kematian
- Bar **Fed** turun seiring waktu; beri makan untuk mengisi. Fed rendah → Health turun; ikan bisa **sakit** secara acak (jamur / bintik putih), disembuhkan dengan obat di Supplies.
- **Health 0 dibiarkan ±80 detik → ikan mati** (dihapus + notifikasi). Memberi makan/mengobati sebelum 80 detik menyelamatkannya.
### 11.1 Laju & aturan angka [BARU]
| Hal | Mode Cepat | Mode Real Time |
|---|---|---|
| Fed 100 → 0 | 10 menit | 12 jam |
| Fed = 0 → Health 100 → 0 | 120 detik | 3 jam |
| Health 0 dibiarkan → mati | ±80 detik | ±80 menit |
| Peluang sakit acak per ikan | 1% per menit | 1% per jam |
| Pemulihan Health (Fed > 50%, tidak sakit) | +1% per 10 detik | +1% per 10 menit |
| Penularan dari ikan sakit di tank yang sama | 5% per menit per ikan sakit | 5% per jam per ikan sakit |

- Pengurang peluang sakit & lapar: riset Food Lv1/2/3 **−20/35/50%** · Dr. Maya **×0,5** · Ikan Ajaib Kesehatan **−40%** (dikalikan, bukan dijumlah).
- **Gejala**: Jamur = bercak hijau berbulu; Bintik Putih = titik putih di sirip. Obat yang salah → toast "Obat tidak cocok", dosis **tidak terpakai**.
- Ikan di Isolasi tidak menularkan.
- Kematian menampilkan penyebab ("kelaparan / sakit / air tidak cocok") dan tercatat di Statistik.

## 12. Supplies (toko perlengkapan)
| Item | Harga | Efek |
|---|---|---|
| Obat Jamur | Rp3.000 | Sembuhkan sakit |
| Obat Bintik Putih | Rp3.000 | Sembuhkan sakit |
| Vitamin | Rp2.500 | +Health/Fed ikan dipilih |
| Instagrow | Rp8.000 | +1 fase tumbuh |
| Instabirth | Rp10.000 | Ikan hamil langsung melahirkan |
| Discovery Potion | Rp15.000 | Breeding berikutnya dijamin mutasi langka/spesies baru |
### 12.1 Dosis & stok [BARU]
- Satu botol **Obat Jamur, Obat Bintik Putih, Vitamin, Instagrow** berisi **3 dosis**; **Instabirth** dan **Discovery Potion** berisi **1 dosis**. Harga di tabel tetap harga per botol.
- Stok dosis tampil sebagai ikon di bar aksi ikan (§4.1) dengan angka sisa; pemain memilih ikan, lalu mengetuk ikon untuk memakai 1 dosis.
- Efek angka: Vitamin = Health +40 & Fed +20 · Instagrow = ikan maju 1 fase penuh (progres fase di-reset ke awal fase berikutnya).

### 12.2 Pakan [BARU]
Tombol Feed membuka daftar pakan; pilih lalu **ketuk permukaan air** untuk menjatuhkan butiran (ikan berebut, animasi).

| Pakan | Harga | Efek per tank |
|---|---|---|
| Pakan Biasa | Rp1.000 | Fed +50% semua ikan di tank |
| Pakan Premium | Rp2.500 | Fed +100% & Health +10 |

Stok pakan menyimpan hingga 99 porsi. **Auto-Feeder** (§14) memakai stok ini.

## 13. Research (riset) — harga mulai Rp300.000
| Jalur | Lv1 | Lv2 | Lv3 | Efek |
|---|---|---|---|---|
| Food | 300rb | 600rb | 900rb | Ikan lebih lambat lapar & jarang sakit |
| Environment | 400rb | 800rb | 1,2jt | Lv1 buka telur Premium, Lv2 buka Exclusive |
| Advertising | 500rb | 1jt | 1,5jt | Pembeli datang lebih sering |
### 13.1 Durasi & efek angka [BARU]
- Riset **berjalan sambil bermain** dengan bar progres; **satu riset pada satu waktu**; biaya dibayar di awal. Durasi: **Lv1 60 detik, Lv2 120 detik, Lv3 180 detik** (Mode Cepat) / **1, 3, 6 jam** (Real Time). Selesai → popup "Riset selesai" + notifikasi (§16).
- **Food** Lv1/2/3: lapar & peluang sakit **−20 / −35 / −50%**.
- **Environment** Lv1/2/3: toleransi K1 / K2 / K3 (§5.3); Lv1 buka telur Premium, Lv2 buka Exclusive.
- **Advertising** Lv1/2/3: Popularitas **+10 / +20 / +30** (§8.3).

## 14. Upgrade Tank, Dekorasi, Upgrade Toko, Staff
- **Upgrade tank**: Cleaning Snail Rp4.000 · Temperature Regulator Rp5.000 · Aeration Rp16.000 · Auto-Feeder Rp20.000 · Power Filter Rp25.000 · Golden Seahorse Rp50.000 (harga jual +5%).
- **Dekorasi Sell Tank** (tiap dekor +2% peluang DEAL, maks +10%): Batu 5rb · Kerang 10rb · Koral 25rb · Jangkar 30rb · Pagoda 40rb · Lentera 60rb.
- **Upgrade toko**: Rak Merchandise Rp60.000 (pendapatan +3%) · Papan Nama Rp75.000 (antrean maks 4) · Area Duduk Rp90.000 (kesabaran pembeli +1) · Pilar & Terrain Rp110.000 (peluang DEAL +5%).
- **Staff**: Sales Sinta Rp150.000 (DEAL +5%) · Kasir Bambang Rp200.000 (pendapatan +2%) · Perawat Ikan Dr. Maya Rp175.000 (peluang sakit separuhnya).
- **Event SALE**: tombol SALE → 30 detik antrean +2 & peluang DEAL +10%; cooldown 2 menit.
### 14.1 Efek upgrade tank [BARU]
| Upgrade | Efek |
|---|---|
| Cleaning Snail | Peluang sakit −10% |
| Temperature Regulator | Pemulihan Health +25% |
| Aeration | Health turun −25% lebih lambat saat lapar/air tidak cocok |
| Auto-Feeder | Otomatis memberi 1 Pakan Biasa dari stok saat rata-rata Fed tank < 40% |
| Power Filter | Peluang sakit −20% & penularan −50% |
| Golden Seahorse | Harga jual +5% (v1) |

Tiap upgrade 1× per tank; pengurang dikalikan.

### 14.2 Tanaman Laguna (upgrade tank khusus) [BARU]
1 buah per jenis per tank; tanaman air animasi di latar tank.
| Tanaman | Harga | Efek |
|---|---|---|
| Tanaman Nutrisi | Rp35.000 | Fed turun −25% lebih lambat |
| Tanaman Inkubasi | Rp40.000 | Bayi mati karena air −50%; telur menetas minimal 3 |
| Tanaman Obat | Rp45.000 | Peluang sakit −30% |
| Tanaman Subur | Rp55.000 | Peluang hamil 30% → 40%; +1 bayi saat lahir |

### 14.3 Dekorasi tambahan [BARU]
Penyelam Rp45.000 · Pilar Tenggelam Rp50.000 · Kapal Karam Rp80.000. Efek sama dengan dekor lain (+2% DEAL, batas total tetap +10%) plus **+3 Popularitas** tiap dekor (§8.3).

## 15. Tujuh Ikan Ajaib (koleksi akhir)
| Kombinasi | Nama |
|---|---|
| Guppy + Twin | Ikan Ajaib Kesuburan |
| Koi + Round | Ikan Ajaib Pangan |
| Betta + Fan | Ikan Ajaib Penyembuh |
| Discus + Long | Ikan Ajaib Pertumbuhan |
| Tetra + Spiky | Ikan Ajaib Kesehatan |
| Angelfish + Spiky | Ikan Ajaib Mutasi |
| Koi + Fan | Ikan Ajaib Emas Laguna |

Siluet sampai ditemukan; notifikasi khusus saat dapat; **layar kemenangan** saat ketujuh lengkap.
### 15.1 Efek pasif Ikan Ajaib [BARU]
Efek berlaku untuk **tank tempat Ikan Ajaib berada** (aura); efek jenis sama tidak menumpuk.

| Ikan Ajaib | Efek |
|---|---|
| Kesuburan | Kelahiran +1 bayi (maks 5) |
| Pangan | Fed turun −40% lebih lambat |
| Penyembuh | Peluang obat berhasil +25% & sakit sembuh sendiri 1% per menit |
| Pertumbuhan | Fase tumbuh Bayi→Dewasa 30% lebih cepat |
| Kesehatan | Peluang sakit −40% & pemulihan Health +50% |
| Mutasi | 10% bayi mutasi acak (§10.3) |
| Emas Laguna | Harga jual **semua ikan** di toko +10% |

### 15.2 Aturan [BARU]
- Ikan **pertama** tiap kombinasi Ajaib yang ditemukan berstatus **Ikan Ajaib** (aura emas, tidak bisa dijual/dibuang, boleh dipindah). Keturunan berikutnya spesies sama adalah ikan biasa yang bisa dijual.
- Setiap penemuan: layar penemuan + bola di **Trofi** menyala (§3.8).
- **Epilog**: ketujuh lengkap → layar kemenangan + cerita pemulihan Laguna; game lanjut sebagai **Mode Bebas** tanpa tujuan baru.

## 16. Lain-lain
- **Tutorial & petunjuk kontekstual [BARU]**: tutorial 4 langkah v1 dipertahankan sebagai pembuka, lalu **pesan bantuan kontekstual** muncul sekali saat pemicunya pertama kali terjadi (bisa dimatikan di Pengaturan):

| Pemicu | Isi pesan (ringkas) |
|---|---|
| Pertama masuk tank | Kenali bar atas & tombol bawah |
| Telur dibeli / bayi lahir | Cara menjatuhkan telur & pakan |
| Fed pertama kali < 50% | Beri makan; ikan lapar → Health turun |
| Ikan pertama sakit | Kenali gejala, beli obat di Supplies |
| Ikan pertama Dewasa | Dewasa bisa dijodohkan & dijual penuh |
| Pertama membuka Isolasi | Fungsi karantina & perjodohan |
| Ikan hamil | Ikon telur kecil, kelahiran bisa ≤ 1 jam (Real) |
| Tank penuh pertama kali | Jual ikan atau beli tank baru |
| Ikan hasil breeding rapuh | Tingkatkan riset Environment |
| Bayi mati karena air | Penyebab & solusi |
| Pembeli pertama datang | Cara masuk adegan negosiasi |
| Riset pertama selesai | Efek yang kini aktif |
| Ikan Ajaib pertama | Efek aura & cara melihat di Trofi |
- **Statistik** (layar Species & menu utama): ikan terjual, total pendapatan, total pengeluaran, rata-rata harga jual per ikan, harga ikan termahal terjual, disembuhkan, mati, dibuang, lahir (total ternak), pakan diberikan, jam bermain, spesies ditemukan (x/30), Ikan Ajaib ditemukan (x/7).
- **Autosave** lokal (JSON/DataStore) setiap ada perubahan + saat aplikasi ditutup; progres offline dihitung dari selisih waktu simpan terakhir.
- Efek suara sederhana (`ToneGenerator` / file `.ogg` pendek) untuk jual/beli/spesies baru, bisa dimatikan di Pengaturan.
- Kecepatan renang ikan pelan & santai; ikan tidak boleh terlalu cepat lapar.
- **[BARU] Notifikasi Android** (opsional, Mode Real Time): ikan lapar kritis (Fed < 15%), ikan sakit, bayi lahir, ikan menjadi Dewasa, riset selesai. Gunakan `WorkManager`/`AlarmManager` dari timestamp tersimpan; maks 1 notifikasi per 30 menit agar tidak mengganggu.
- **[BARU] Log aktivitas**: layar kecil berisi 30 kejadian terakhir (terjual, lahir, mati, sembuh, riset).

---

## 17. MVP — yang WAJIB jadi di versi pertama
Bangun **MVP dulu** dengan urutan ini, pastikan semuanya berfungsi sebelum fitur tambahan:

1. **Kerangka**: `MainActivity` + Compose: pilih bahasa → menu New Game/Continue → 4 slot save (lanjut/hapus) → tank. Autosave JSON per slot di internal storage.
2. **Loop inti tank**: beli 3 jenis telur → menetas 2–5 bayi putih → tumbuh per fase & waktu Mode Cepat → beri makan → detail ikan (Health/Fed/harga).
3. **Ekonomi**: harga % rarity dari nilai dasar spesies + markup 1–10% per ikan.
4. **Jual & negosiasi**: antrean pembeli lokal + trait → adegan negosiasi (DEAL / tawar balik / ragu / pergi, kesabaran).
5. **Breeding**: 2 dewasa → anak kombinasi badan×sirip, rarity sesuai tabel §10, spesies baru masuk Findex (siluet untuk yang belum ditemukan).
6. **Kesehatan**: sakit acak, obat menyembuhkan, mati bila Health 0 dibiarkan ±80 detik.
7. **Tank 2–4** bisa dibeli; pindah ikan antar-tank; label status hanya muncul sebentar.

**Setelah MVP stabil (versi berikutnya)**: Research, Supplies lengkap, Upgrade tank/toko, Dekorasi, Staff, event SALE, Mode Real Time + progres offline, kehamilan & Instabirth, 7 Ikan Ajaib + kemenangan, statistik, tutorial, suara.
### Peta jalan versi [BARU]
- **v0.1 (MVP)**: butir 1–7 di atas.
- **v0.2**: Supplies lengkap + dosis (§12), Pakan, Tank Isolasi & jalur klasik (§4.2, §10), hint kontekstual, tank penuh.
- **v0.3**: Research + Meter Popularitas + SALE (§8.3–8.4, §13), upgrade tank & Tanaman Laguna, dekor, Staff.
- **v0.4**: Ketahanan K & Hibrida Rapuh (§5.3), Mode Real Time + offline + ringkasan "Selama kamu pergi", notifikasi.
- **v1.0**: 7 Ikan Ajaib + Trofi + epilog, statistik penuh, suara/musik 4 lagu, polesan animasi.

### Kriteria MVP diterima
- [ ] Project bisa di-build di Android Studio dan APK terinstal di HP Android.
- [ ] Bisa main dari slot baru sampai menjual ikan pertama tanpa error/crash.
- [ ] Angka harga & peluang sama persis dengan tabel di dokumen ini.
- [ ] Bayi selalu putih; dari Anak-anak warna/motif sama dengan Dewasa.
- [ ] Negosiasi benar-benar interaktif (bukan jual sekali klik).
- [ ] Progres tersimpan dan berlanjut setelah aplikasi ditutup-dibuka.
- [ ] **[BARU]** Tank penuh menolak telur & memakan bayi berlebih; bayi mati karena air hanya saat Environment < K.
- [ ] **[BARU]** Contoh harga di §6.1 menghasilkan angka persis sama di game.
- [ ] **[BARU]** Ikan di Isolasi tidak menularkan, tidak dihitung kapasitas, tidak bisa dijual.
- [ ] **[BARU]** Telur tidak pernah menetaskan spesies Ikan Ajaib; Discovery Potion menjamin kombinasi baru.



---

## Lampiran A — `GameConfig.kt` (konstanta terpusat) [BARU]
| Grup | Konstanta | Nilai |
|---|---|---|
| Ekonomi | `START_MONEY`, `USD_RATE` | 50.000, 15.000 |
| Tank | `TANK_CAPACITY`, `ISOLATION_CAPACITY` | 21, 2 |
| Harga | `RARITY_PCT` | 4/6/9/12/18/22/45 % |
| Harga | `PHASE_MULT` | Remaja 0,4 · Dewasa 1 · Tua 1,8 |
| Harga | `MARKUP_RANGE`, `MARKUP_DEFAULT` | 1–10 %, 5 % |
| Waktu Cepat | `GROW_FAST` | 60 / 120 / 360 detik |
| Waktu Real | `GROW_REAL` | 1 / 3 / 24 jam |
| Fed | `FED_EMPTY_FAST`, `FED_EMPTY_REAL` | 10 menit, 12 jam |
| Sakit | `SICK_CHANCE_FAST`, `SICK_CHANCE_REAL` | 1 %/menit, 1 %/jam |
| Mati | `DEATH_DELAY_FAST`, `DEATH_DELAY_REAL` | 80 detik, 80 menit |
| Breeding | `PREGNANCY_CHANCE`, `BIRTH_COUNT` | 30 %, 2–4 |
| Breeding | `RARITY_WEIGHTS_BREEDING` | 55/25/12/5/2/0,9/0,1 |
| Pembeli | `BUYER_INTERVAL`, `QUEUE_MAX` | 12 detik, 3 |
| SALE | `SALE_DURATION`, `SALE_COOLDOWN` | 30 detik, 120 detik |
| Popularitas | `POP_*` | sesuai §8.3 |

## Lampiran B — Model data (sketsa) [BARU]
```kotlin
enum class Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGEND, MYTHIC, HOLY }
enum class Stage { BABY, CHILD, TEEN, ADULT, OLD }
data class Fish(
    val id: String, val body: BodyPart, val fin: Fin, val rarity: Rarity,
    val stage: Stage, val stageStartedAt: Long,        // timestamp nyata
    val fed: Float, val health: Float, val sick: SickType?, val pregnantUntil: Long?,
    val markup: Int?, val isMagic: Boolean, val fragile: Boolean,
    val generation: Int, val parentA: String?, val parentB: String?,
    val tank: Int, val inIsolation: Boolean, val forSale: Boolean
)
data class GameState(
    val money: Long, val fish: List<Fish>, val tanksOwned: Set<Int>,
    val discovered: Set<Pair<BodyPart, Fin>>, val magicFound: Set<Int>,
    val research: Map<ResearchPath, Int>, val researchEndsAt: Long?,
    val inventory: Map<ItemId, Int>, val upgrades: Map<Int, Set<UpgradeId>>,
    val stats: Stats, val lastSavedAt: Long, val timeMode: TimeMode
)
```

## Lampiran C — Pemetaan mekanik referensi → Laguna Fish [BARU]
| Mekanik di game referensi | Padanan di Laguna Fish | Status |
|---|---|---|
| Berjalan waktu nyata walau perangkat mati | Mode Real Time + progres offline | Sudah ada (v1), diperkuat §7, §16 |
| Tangki isolasi untuk perjodohan | Tank Isolasi (§4.2, §10.1) | **Baru** |
| Tangki jual & event penjualan dengan grafik popularitas | Siap Jual + Store + Meter Popularitas + SALE (§8) | **Baru**, negosiasi tetap inti |
| Tank penuh → bayi dimakan | §4.3 | **Baru** |
| Hibrida rapuh / kondisi air untuk spesies langka | Ketahanan K (§5.3) | **Baru** |
| Obat dengan dosis (3 dosis/botol) | §12.1 | **Baru** |
| 3 jalur riset (Makanan, Lingkungan, Iklan) | §13 + durasi & angka | Sudah ada, diperdalam |
| Tanaman khusus (nutrisi, inkubasi, obat, subur) | Tanaman Laguna §14.2 | **Baru** |
| 7 ikan ajaib dengan efek pasif | §15 + efek §15.1 | Nama sudah ada, **efek baru** |
| Pesan bantuan kontekstual yang bisa dimatikan | §16 | **Baru** |
| Layar statistik panjang & trofi | Statistik §16, Trofi §3.8 | Diperluas |
| 4 pilihan lagu latar | Pengaturan §3.7 | **Baru** |

**Sengaja TIDAK ditiru:** nama game & nama spesies asli, teks dialog/bantuan asli, sprite, musik, dan layout piksel. Semua teks & aset Laguna Fish dibuat ulang secara original.


---

## Lampiran D — Prompt gambar aset (konsisten) [BARU]
Pakai generator gambar apa pun, lalu hapus latar jadi transparan dan kompres ke WebP kualitas 80. Selalu tempel **blok gaya** di bawah di awal setiap prompt agar semua aset seragam.

**Blok gaya (wajib di setiap prompt):**
`semi-realistic digital painting, soft natural lighting from top-left, subtle rim light, gentle gradients, fine detail, clean edges, single subject, plain solid light-gray background (to be removed), no text, no watermark, no logo, no frame`

### D.1 Badan ikan — 6 file (`body_<nama>.webp`, ±512px sisi terpanjang)
Tambahan semua prompt badan: `side view, facing right, neutral swimming pose, NO tail fin (body only, tail area cut cleanly), realistic proportions, soft glossy scales, realistic eye with small highlight`.

| File | Warna utama → motif | Prompt inti |
|---|---|---|
| `body_discus` | oranye → biru | round disc-shaped discus fish body, orange base with blue wavy stripe pattern |
| `body_tetra` | kuning → merah | slim tetra fish body, yellow base with red stripe along the flank |
| `body_angelfish` | ungu muda → ungu tua | tall triangular angelfish body, light purple base with dark purple vertical bands |
| `body_guppy` | hijau → kuning | small slender guppy body, green base with yellow speckles |
| `body_koi` | putih → merah | elongated koi carp body, white base with red patches |
| `body_betta` | merah → ungu tua | betta fish body, red base with dark purple shading near the fins |

### D.2 Sirip ekor — 5 file (`tail_<jenis>.webp`)
Tambahan: `tail fin only, side view, attachment point on the left edge, semi-transparent with fine fin rays, colour matched to a neutral light tone (tinted at runtime)`. Karena warna mengikuti motif spesies, buat versi **netral keputihan** lalu tint lewat Compose `ColorFilter`.
- `tail_round`: rounded paddle-shaped tail · `tail_fan`: wide fan-shaped tail · `tail_spiky`: pointed spiky tail with sharp rays · `tail_long`: long flowing veil tail · `tail_twin`: two-lobed tail with two separate tips.

### D.3 Bayi & telur
- `baby_white`: tiny translucent white baby fish, side view facing right, no pattern, soft glow.
- `roe_pink`, `roe_gold`, `roe_purple`: small cluster of many tiny round fish eggs (roe), translucent beads, in pink / gold / purple — **bukan telur ayam**.

### D.4 Latar tank & tanaman
- `tank_bg`: underwater aquarium background, deep blue gradient, soft sun rays from above, natural sand and smooth stones at bottom, landscape 16:9, no fish, no plants. Pakai rasio lebar (mis. 2400×1080) agar menyesuaikan layar Android.
- `plant_a`, `plant_b`, `plant_c`: single aquatic plant (tall green / bushy green / red-leaf), side view, transparent background, base at bottom edge.
- Opsional: `bubble_set` (gelembung berbagai ukuran).

### D.5 Karakter pembeli — 6 file (`buyer_<tipe>.webp`)
Tambahan: `semi-realistic digital painting, soft illustration style, respectful (no caricature), full body standing front-facing, friendly expression, Indonesian setting, plain background`.
- `buyer_anak`: elementary school boy/girl in white-and-red school uniform, backpack.
- `buyer_remaja`: teenager in hoodie and cap (or junior high uniform).
- `buyer_batik`: adult in modern batik shirt, relaxed pose.
- `buyer_daster`: adult in a casual home dress (daster), carrying a shopping bag.
- `buyer_lansia`: elderly person with grey hair, peci/kopiah, walking stick.
- `buyer_adat`: person in respectful traditional Indonesian formal wear (kebaya or beskap with blangkon), dignified pose.

### D.6 Prompt tambahan lain
- `shop_counter` (meja toko + akuarium pajangan di sisi kanan), `ui_glass_panel` (panel kaca lembut), ikon vektor dibuat di kode (bukan gambar).
- **Konsistensi**: gunakan seed/gambar referensi yang sama bila generatornya mendukung, dan generate satu aset lalu minta variasi, jangan prompt dari nol tiap kali.

---

## Lampiran E — Prompt bertahap per versi (untuk AI Studio) [BARU]
Model biasanya lebih akurat bila dibangun bertahap. Tempel **seluruh dokumen** sebagai konteks, lalu kirim satu prompt per tahap dan uji APK sebelum lanjut.

**Prompt 0 — pembuka (sekali saja):**
`Baca spesifikasi Laguna Fish v2 di atas sebagai sumber kebenaran. Kita akan membangun bertahap. Pada setiap tahap: kerjakan HANYA tahap yang kuminta, pakai angka persis dari dokumen (simpan di GameConfig.kt), jangan menghapus fitur tahap sebelumnya, dan tampilkan daftar file yang berubah. Jawab "siap" bila paham.`

| Tahap | Prompt (ringkas) |
|---|---|
| v0.1 | `Kerjakan MVP butir 1–7 di §17 (Kotlin + Compose, landscape, 4 slot save JSON). Gunakan placeholder berwarna untuk gambar bila aset belum ada. Sertakan build.gradle.kts, AndroidManifest, dan cara build APK.` |
| v0.2 | `Tambahkan §12 (dosis & pakan), Tank Isolasi (§4.2) + jalur klasik breeding (§10.1), tank penuh (§4.3), dan hint kontekstual (§16). Jangan ubah angka v0.1.` |
| v0.3 | `Tambahkan Research (§13), Meter Popularitas & SALE (§8.3–8.4), upgrade tank & Tanaman Laguna (§14), dekorasi, Staff.` |
| v0.4 | `Tambahkan Ketahanan K & Hibrida Rapuh (§5.3), Mode Real Time + progres offline + ringkasan "Selama kamu pergi", dan notifikasi Android (§16).` |
| v1.0 | `Tambahkan 7 Ikan Ajaib beserta efek (§15), Trofi, epilog, statistik penuh, 4 lagu latar & efek suara, lalu ganti placeholder dengan aset gambar dari Lampiran D (WebP, lazy load).` |

**Prompt perbaikan (dipakai berulang):** `Ada bug: <gejala>. Langkah reproduksi: <langkah>. Perbaiki tanpa mengubah angka di GameConfig.kt dan tanpa mengubah fitur lain; jelaskan akar masalahnya singkat.`

**Prompt uji logika:** `Buat unit test untuk GameRules.kt: contoh harga di §6.1, peluang rarity §6.2/§10, pool telur §5.4, dan syarat jual §8.1. Semua hasil harus sama persis dengan dokumen.`

---

## Lampiran F — Panduan tuning angka [BARU]
Semua angka [BARU] bisa diubah di `GameConfig.kt` tanpa menyentuh logika.

### F.1 Cek ekonomi awal (hitungan cepat)
- Telur Common Rp5.000 menetas 2–5 ekor (rata-rata 3,5). Rata-rata nilai dasar spesies K0 ≈ Rp984.000 → ikan Common Dewasa (markup 5%) ≈ **Rp41.000**, Remaja ≈ **Rp16.500**.
- Satu telur Common ≈ 3,5 ikan ≈ **±Rp144.000** bila dijual Dewasa → keuntungan jauh di atas biaya telur. Pembatas sebenarnya adalah **waktu tumbuh, kapasitas tank, dan laju pembeli**, bukan uang telur.
- Target kecepatan (Mode Cepat) usulan: Tank 2 (Rp800.000) tercapai dalam **±15–20 menit** main; Research Lv1 pertama dalam ±10 menit; spesies Ajaib pertama dalam ±1–2 jam.

### F.2 Tuas bila terlalu mudah / terlalu sulit
| Gejala | Tuas yang diubah |
|---|---|
| Uang menumpuk terlalu cepat | Turunkan `RARITY_PCT` Common/Uncommon, perpanjang waktu tumbuh, kecilkan kapasitas antrean |
| Terasa lambat/membosankan | Naikkan peluang DEAL dasar, kurangi `BUYER_INTERVAL`, perpendek fase Remaja |
| Ikan terlalu sering sakit | Kurangi `SICK_CHANCE`, naikkan efek Food |
| Ikan Ajaib terlalu cepat ditemukan | Turunkan peluang hamil, perbesar cooldown breeding, hapus Discovery Potion dari awal |
| Riset tidak terasa penting | Naikkan penalti Hibrida Rapuh, perpanjang durasi riset |

### F.3 Cara menguji (balance)
1. Catat waktu sampai tiap milestone (jual pertama, Tank 2, riset Lv1, spesies baru pertama, Ikan Ajaib pertama).
2. Mainkan dua gaya: **agresif** (jual terus) dan **santai** (cek tiap 5 menit). Keduanya harus tetap maju tanpa game over.
3. Ubah **satu** konstanta per percobaan dan catat hasilnya.
