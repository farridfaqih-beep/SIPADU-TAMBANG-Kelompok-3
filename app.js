/* =========================================================================
   SIPADU-TAMBANG — data & logika (dummy/simulasi untuk tugas kuliah)
   Data laporan disimpan di memori (variabel JS) selama sesi berjalan.
   Data AKUN (email + sandi) disimpan di localStorage browser, jadi tidak
   hilang saat halaman ditutup/direfresh atau saat sesi berakhir.
   ========================================================================= */

/* ================= AKUN (LOGIN & PENDAFTARAN) ================= */

const ACCOUNTS_STORAGE_KEY = 'sipadutambang.accounts.v1';
const STAFF_SIGNUP_CODE = 'DLH2026';

function loadAccounts(){
  try{
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){
    console.warn('Gagal membaca data akun dari penyimpanan lokal:', e);
    return [];
  }
}

function persistAccounts(){
  try{
    localStorage.setItem(
      ACCOUNTS_STORAGE_KEY,
      JSON.stringify(accounts)
    );
  }catch(e){
    console.warn('Gagal menyimpan data akun ke penyimpanan lokal:', e);
    showToast('Penyimpanan browser penuh atau diblokir — akun mungkin tidak tersimpan permanen.');
  }
}

function normalizeEmail(email){
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- Validasi isi laporan ---------- */
function cleanReportText(value){
  return String(value || '')
    .replace(/\s+/g,' ')
    .trim();
}

function isMeaningfulReportText(value, minWords, minChars){
  const text = cleanReportText(value);
  const words = text.split(' ').filter(Boolean);
  const letters = (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;

  if(text.length < minChars || words.length < minWords || letters < 8){
    return false;
  }

  // Tolak teks yang hanya mengulang satu karakter/kata atau pola placeholder.
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-zà-ÿ0-9]/gi,'')));
  const compact = text.toLowerCase().replace(/\s/g,'');
  if(uniqueWords.size < 2 || /^(.)\1{5,}$/.test(compact)){
    return false;
  }

  const placeholder = /^(test|testing|abc|abcd|asdf|qwerty|aaa+|bbb+|xxx+|contoh|isi saja|coba|satu|a)$/i;
  if(words.length <= 4 && words.every(w => placeholder.test(w.replace(/[.,!?]/g,'')))){
    return false;
  }

  return true;
}

/* Validasi alamat/detail lokasi agar tidak menerima huruf acak atau teks asal. */
function isValidDetailLocation(value){
  const text = cleanReportText(value);
  const words = text.split(' ').filter(Boolean);
  const lower = text.toLowerCase();

  if(text.length < 8 || words.length < 2){
    return false;
  }

  // Minimal mengandung huruf yang cukup dan vokal agar bukan deretan karakter acak.
  const letters = (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
  const vowels = (text.match(/[aiueoà-öø-ÿ]/gi) || []).length;
  if(letters < 5 || vowels < 2){
    return false;
  }

  // Tolak pola karakter berulang dan keyboard smash yang umum.
  const compact = lower.replace(/\s/g,'');
  if(/(.)\1{4,}/.test(compact) || /qwerty|asdfgh|zxcvbn|qazwsx|poiuy|lkjhg/i.test(compact)){
    return false;
  }

  // Alamat yang jelas biasanya mempunyai kata penunjuk lokasi.
  const addressTerms = [
    'jalan','jl','gang','gg','lorong','rt','rw','dusun','desa',
    'kelurahan','kecamatan','dekat','sekitar','samping','depan',
    'belakang','jembatan','pasar','sekolah','masjid','kantor',
    'sungai','pantai','perumahan','komplek','kompleks','blok','km',
    'nomor','no','rumah','lapangan','terminal','pelabuhan'
  ];
  const hasAddressTerm = addressTerms.some(term =>
    new RegExp('(?:^|\\s)' + term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?:$|\\s|[.,/-])','i').test(lower)
  );

  // Tanpa kata penunjuk lokasi, minta keterangan yang lebih lengkap.
  if(!hasAddressTerm && (words.length < 3 || text.length < 15)){
    return false;
  }

  return true;
}

/* Hash sederhana untuk simulasi tugas kuliah.
   CATATAN: ini BUKAN metode enkripsi yang aman untuk aplikasi produksi
   sungguhan — untuk aplikasi nyata, verifikasi sandi harus dilakukan
   di server dengan algoritma hashing yang teruji (mis. bcrypt/argon2). */
function hashSandi(sandi){
  const teks = 'sipadu::' + String(sandi);
  let hash = 0;

  for(let i = 0; i < teks.length; i++){
    hash = (hash * 31 + teks.charCodeAt(i)) | 0;
  }

  return 'h' + Math.abs(hash).toString(36);
}

function findAccountByEmail(email){
  const e = normalizeEmail(email);
  return accounts.find(a => a.email === e) || null;
}

let accounts = loadAccounts();

function seedDemoAccountsIfEmpty(){
  if(accounts.length){
    return;
  }

  accounts = [
    {
      email:'warga@demo.id',
      nama:'Algy Puge',
      role:'warga',
      sandiHash:hashSandi('warga123'),
      createdAt:new Date().toISOString()
    },
    {
      email:'petugas@dlh.palu.go.id',
      nama:'Puge, S.Ling',
      role:'petugas',
      sandiHash:hashSandi('petugas123'),
      createdAt:new Date().toISOString()
    }
  ];

  persistAccounts();
}

seedDemoAccountsIfEmpty();

function showWargaView(mode){

  document
    .getElementById('wargaLoginView')
    .classList.toggle('hidden', mode !== 'login');

  document
    .getElementById('wargaRegisterView')
    .classList.toggle('hidden', mode !== 'register');
}

function showPetugasView(mode){

  document
    .getElementById('petugasLoginView')
    .classList.toggle('hidden', mode !== 'login');

  document
    .getElementById('petugasRegisterView')
    .classList.toggle('hidden', mode !== 'register');
}

function togglePasswordVisibility(inputId, button){
  const input = document.getElementById(inputId);
  if(!input || !button) return;

  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';

  // Tombol mata sengaja tidak pernah disembunyikan.
  button.style.display = 'flex';
  button.style.visibility = 'visible';
  button.style.opacity = '1';

  button.setAttribute(
    'aria-label',
    showing ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'
  );
  button.setAttribute(
    'title',
    showing ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'
  );
}

function registerWarga(){

  const nama =
    (document.getElementById('wargaRegNama').value || '').trim();

  const email =
    normalizeEmail(document.getElementById('wargaRegEmail').value);

  const sandi =
    document.getElementById('wargaRegSandi').value;

  const konfirmasi =
    document.getElementById('wargaRegKonfirmasi').value;

  if(!/^[A-Za-z\s]{3,}$/.test(nama)){
    showToast('Nama harus hanya menggunakan huruf dan minimal 3 karakter.');
    return;
  }

  if(!isValidEmail(email)){
    showToast('Format email tidak valid.');
    return;
  }

  const emailLocalPart = email.split('@')[0];
  if(!/[A-Za-z]/.test(emailLocalPart) || !/[0-9]/.test(emailLocalPart)){
    showToast('Email harus menggunakan kombinasi huruf dan angka, bukan angka saja.');
    return;
  }

  if(sandi.length < 6 || !/[A-Za-z]/.test(sandi) || !/[0-9]/.test(sandi) || !/[^A-Za-z0-9\s]/.test(sandi)){
    showToast('Kata sandi harus minimal 6 karakter dengan kombinasi huruf, angka, dan simbol.');
    return;
  }

  if(sandi !== konfirmasi){
    showToast('Konfirmasi sandi tidak cocok.');
    return;
  }

  if(findAccountByEmail(email)){
    showToast('Email ini sudah terdaftar. Silakan masuk.');
    return;
  }

  accounts.push({
    email:email,
    nama:nama,
    role:'warga',
    sandiHash:hashSandi(sandi),
    createdAt:new Date().toISOString()
  });

  persistAccounts();

  showToast('Akun warga berhasil dibuat. Silakan masuk.');

  document.getElementById('wargaRegNama').value = '';
  document.getElementById('wargaRegEmail').value = '';
  document.getElementById('wargaRegSandi').value = '';
  document.getElementById('wargaRegKonfirmasi').value = '';

  showWargaView('login');

  document.getElementById('wargaLoginEmail').value = email;
}

function registerPetugas(){

  const nama =
    (document.getElementById('petugasRegNama').value || '').trim();

  const email =
    normalizeEmail(document.getElementById('petugasRegEmail').value);

  const sandi =
    document.getElementById('petugasRegSandi').value;

  const konfirmasi =
    document.getElementById('petugasRegKonfirmasi').value;

  const kode =
    (document.getElementById('petugasRegKode').value || '').trim();

  if(!nama){
    showToast('Nama tidak boleh kosong.');
    return;
  }

  if(!isValidEmail(email)){
    showToast('Format email tidak valid.');
    return;
  }

  if(kode !== STAFF_SIGNUP_CODE){
    showToast('Kode akses pendaftaran salah. Gunakan kode demo: ' + STAFF_SIGNUP_CODE);
    return;
  }

  if(sandi.length < 6){
    showToast('Sandi minimal 6 karakter.');
    return;
  }

  if(sandi !== konfirmasi){
    showToast('Konfirmasi sandi tidak cocok.');
    return;
  }

  if(findAccountByEmail(email)){
    showToast('Email ini sudah terdaftar. Silakan masuk.');
    return;
  }

  accounts.push({
    email:email,
    nama:nama,
    role:'petugas',
    sandiHash:hashSandi(sandi),
    createdAt:new Date().toISOString()
  });

  persistAccounts();

  showToast('Akun petugas berhasil dibuat. Silakan masuk.');

  document.getElementById('petugasRegNama').value = '';
  document.getElementById('petugasRegEmail').value = '';
  document.getElementById('petugasRegSandi').value = '';
  document.getElementById('petugasRegKonfirmasi').value = '';
  document.getElementById('petugasRegKode').value = '';

  showPetugasView('login');

  document.getElementById('petugasLoginEmail').value = email;
}

function loginWarga(){

  const email =
    normalizeEmail(document.getElementById('wargaLoginEmail').value);

  const sandi =
    document.getElementById('wargaLoginSandi').value;

  if(!isValidEmail(email)){
    showToast('Format email tidak valid.');
    return;
  }

  const akun = findAccountByEmail(email);

  if(!akun){
    showToast('Akun tidak ditemukan. Silakan daftar dulu.');
    return;
  }

  if(akun.role !== 'warga'){
    showToast('Email ini terdaftar sebagai petugas. Gunakan tab "Saya petugas".');
    return;
  }

  if(akun.sandiHash !== hashSandi(sandi)){
    showToast('Email atau sandi salah.');
    return;
  }

  enterSession('warga', akun);
}

function loginPetugas(){

  const email =
    normalizeEmail(document.getElementById('petugasLoginEmail').value);

  const sandi =
    document.getElementById('petugasLoginSandi').value;

  if(!isValidEmail(email)){
    showToast('Format email tidak valid.');
    return;
  }

  const akun = findAccountByEmail(email);

  if(!akun){
    showToast('Akun tidak ditemukan. Silakan daftar dulu.');
    return;
  }

  if(akun.role !== 'petugas'){
    showToast('Email ini terdaftar sebagai warga. Gunakan tab "Saya warga".');
    return;
  }

  if(akun.sandiHash !== hashSandi(sandi)){
    showToast('Email atau sandi salah.');
    return;
  }

  enterSession('petugas', akun);
}

/* ---------- Data referensi ---------- */
const KECAMATAN = [
  {id:'palu-utara',   nama:'Palu Utara',   col:2, row:1, lat:-0.7708389147161996, lng:119.87031095808732},
  {id:'palu-timur',   nama:'Palu Timur',   col:3, row:1, lat:-0.8835, lng:119.8790},
  {id:'palu-barat',   nama:'Palu Barat',   col:1, row:2, lat:-0.8845, lng:119.8560},
  {id:'palu-tengah',  nama:'Palu Tengah',  col:2, row:2, lat:-0.8995, lng:119.8660},
  {id:'mantikulore',  nama:'Mantikulore',  col:3, row:2, lat:-0.8690, lng:119.8990},
  {id:'ulujadi',      nama:'Ulujadi',      col:1, row:3, lat:-0.9060, lng:119.8270},
  {id:'tatanga',      nama:'Tatanga',      col:2, row:3, lat:-0.9110, lng:119.8460},
  {id:'palu-selatan', nama:'Palu Selatan', col:3, row:3, lat:-0.9270, lng:119.8680},
];

/* Koordinat pusat tiap kecamatan bersifat indikatif */
const PALU_CENTER = [-0.8830, 119.8660];

const KATEGORI = [
  'Penambangan Pasir Sungai',
  'Galian C Bukit/Tebing',
  'Penambangan Tanpa Izin di Lahan Warga',
  'Alat Berat di Area Konservasi',
];

const STATUS_ORDER = [
  'Baru',
  'Diverifikasi',
  'Diproses',
  'Selesai',
  'Ditolak'
];

const STATUS_META = {
  'Baru': {
    color:'#B36A34',
    bg:'#F2E1CD',
    hex:'#B36A34'
  },
  'Diverifikasi': {
    color:'#2B6A8A',
    bg:'#DCEAF0',
    hex:'#2B6A8A'
  },
  'Diproses': {
    color:'#95711B',
    bg:'#F2E7C9',
    hex:'#95711B'
  },
  'Selesai': {
    color:'#204C39',
    bg:'#DEEBE2',
    hex:'#2E6B4F'
  },
  'Ditolak': {
    color:'#6E6A5F',
    bg:'#E7E4D9',
    hex:'#6E6A5F'
  },
};

const SEVERITY_META = {
  'Ringan': {
    hex:'#2B6A8A',
    bg:'#DCEAF0'
  },
  'Sedang': {
    hex:'#95711B',
    bg:'#F2E7C9'
  },
  'Berat': {
    hex:'#A73E37',
    bg:'#F1DBD8'
  },
};

/* ---------- Prioritas ---------- */
const PRIORITY_META = {
  'Rendah': {
    hex:'#2B6A8A',
    bg:'#DCEAF0'
  },
  'Sedang': {
    hex:'#95711B',
    bg:'#F2E7C9'
  },
  'Tinggi': {
    hex:'#B36A34',
    bg:'#F2E1CD'
  },
  'Darurat': {
    hex:'#A73E37',
    bg:'#F1DBD8'
  },
};

function getPriority(r){
  if(r.tingkat === 'Berat' && r.masihBerlangsung){
    return 'Darurat';
  }

  if(r.tingkat === 'Berat'){
    return 'Tinggi';
  }

  if(r.tingkat === 'Sedang'){
    return 'Sedang';
  }

  return 'Rendah';
}

function priorityBadge(r){
  const p = getPriority(r);
  const pm = PRIORITY_META[p];

  return `
    <span class="priority-badge"
      style="color:${pm.hex};background:${pm.bg};">
      <span class="dot"></span>${p}
    </span>
  `;
}

function kecNama(id){
  const k = KECAMATAN.find(k => k.id === id);
  return k ? k.nama : id;
}

/* ---------- Tanggal ---------- */
const TODAY = '2026-09-07';

function addDays(dateOrStr, n){
  const d = new Date(dateOrStr);
  d.setDate(d.getDate() + n);
  return fmtISO(d);
}

function fmtISO(d){
  const dt = new Date(d);
  return dt.toISOString().slice(0,10);
}

function fmtTampil(iso){
  const d = new Date(iso + 'T00:00:00');

  return d.toLocaleDateString('id-ID', {
    day:'numeric',
    month:'short',
    year:'numeric'
  });
}

function bulanLabel(iso){
  const d = new Date(iso + 'T00:00:00');

  return d.toLocaleDateString('id-ID', {
    month:'short',
    year:'2-digit'
  });
}

function diffDays(a,b){
  return Math.round(
    (new Date(b) - new Date(a)) /
    (1000 * 60 * 60 * 24)
  );
}

/* ---------- Escape HTML ---------- */
function esc(str){
  if(str === undefined || str === null){
    return '';
  }

  return String(str).replace(
    /[&<>"']/g,
    s => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[s])
  );
}

/* ---------- Riwayat status otomatis ---------- */
function buildRiwayat(tanggalLapor, status, catatan){
  catatan = catatan || {};

  const chain = [
    {
      tanggal: tanggalLapor,
      status: 'Baru',
      catatan: 'Laporan diterima dan diberi nomor tiket oleh sistem.',
      oleh: 'Sistem'
    }
  ];

  if(status === 'Ditolak'){
    chain.push({
      tanggal:addDays(tanggalLapor,2),
      status:'Ditolak',
      catatan:catatan.tolak ||
        'Laporan tidak dapat diverifikasi (data ganda atau lokasi tidak ditemukan).',
      oleh:'Petugas DLH'
    });

    return chain;
  }

  if(['Diverifikasi','Diproses','Selesai'].includes(status)){
    chain.push({
      tanggal:addDays(tanggalLapor,2),
      status:'Diverifikasi',
      catatan:catatan.verifikasi ||
        'Kelengkapan laporan diperiksa dan lokasi dikonfirmasi oleh petugas.',
      oleh:'Petugas DLH'
    });
  }

  if(['Diproses','Selesai'].includes(status)){
    chain.push({
      tanggal:addDays(tanggalLapor,6),
      status:'Diproses',
      catatan:catatan.proses ||
        'Tim turun ke lokasi untuk peninjauan dan koordinasi penghentian aktivitas.',
      oleh:'Petugas DLH'
    });
  }

  if(status === 'Selesai'){
    chain.push({
      tanggal:addDays(tanggalLapor,13),
      status:'Selesai',
      catatan:catatan.selesai ||
        'Aktivitas dihentikan dan lokasi ditindaklanjuti sesuai prosedur.',
      oleh:'Petugas DLH'
    });
  }

  return chain;
}

/* ---------- Data contoh ---------- */
const SEED = [
  {
    judul:'Penambangan pasir liar di bantaran sungai dekat permukiman',
    kec:'ulujadi',
    kat:0,
    tingkat:'Berat',
    tgl:'2026-04-03',
    status:'Selesai',
    pelapor:'Warga RT 04'
  },
  {
    judul:'Galian C di lereng bukit pinggir jalan poros',
    kec:'tatanga',
    kat:1,
    tingkat:'Sedang',
    tgl:'2026-04-10',
    status:'Selesai',
    pelapor:'Anonim'
  },
  {
    judul:'Penggalian tanah urug tanpa izin di lahan kosong warga',
    kec:'mantikulore',
    kat:2,
    tingkat:'Ringan',
    tgl:'2026-04-15',
    status:'Selesai',
    pelapor:'Fadli R.'
  },
  {
    judul:'Truk pasir keluar-masuk lokasi tanpa dokumen jelas',
    kec:'palu-barat',
    kat:0,
    tingkat:'Sedang',
    tgl:'2026-04-22',
    status:'Ditolak',
    pelapor:'Anonim',
    catatan:{
      tolak:'Lokasi yang dilaporkan berada di luar wilayah administrasi Kota Palu.'
    }
  },
  {
    judul:'Alur sungai melebar akibat pengerukan pasir manual',
    kec:'ulujadi',
    kat:0,
    tingkat:'Berat',
    tgl:'2026-05-02',
    status:'Selesai',
    pelapor:'Sari W.'
  },
  {
    judul:'Alat berat beroperasi di dekat area konservasi',
    kec:'mantikulore',
    kat:3,
    tingkat:'Berat',
    tgl:'2026-05-09',
    status:'Selesai',
    pelapor:'Anonim'
  },
  {
    judul:'Tebing bukit longsor kecil pasca penggalian material',
    kec:'tatanga',
    kat:1,
    tingkat:'Sedang',
    tgl:'2026-05-14',
    status:'Diproses',
    pelapor:'Yusuf A.'
  },
  {
    judul:'Lahan kebun warga digali untuk dijual sebagai tanah urug',
    kec:'palu-tengah',
    kat:2,
    tingkat:'Ringan',
    tgl:'2026-05-20',
    status:'Selesai',
    pelapor:'Anonim'
  },
  {
    judul:'Aktivitas keruk pasir malam hari di tepi sungai',
    kec:'ulujadi',
    kat:0,
    tingkat:'Sedang',
    tgl:'2026-06-01',
    status:'Diverifikasi',
    pelapor:'Anonim'
  },
  {
    judul:'Pembukaan lahan tanpa izin mendekati kawasan lindung',
    kec:'mantikulore',
    kat:2,
    tingkat:'Berat',
    tgl:'2026-06-06',
    status:'Diproses',
    pelapor:'Rina K.'
  },
  {
    judul:'Penambangan pasir dekat jembatan, dikhawatirkan mengikis pondasi',
    kec:'palu-barat',
    kat:0,
    tingkat:'Sedang',
    tgl:'2026-06-12',
    status:'Diverifikasi',
    pelapor:'Anonim'
  },
  {
    judul:'Galian bukit kecil untuk material bangunan pribadi',
    kec:'palu-utara',
    kat:1,
    tingkat:'Ringan',
    tgl:'2026-06-19',
    status:'Selesai',
    pelapor:'Anonim'
  },
  {
    judul:'Volume pengerukan pasir meningkat pasca musim hujan',
    kec:'tatanga',
    kat:0,
    tingkat:'Berat',
    tgl:'2026-07-03',
    status:'Diproses',
    pelapor:'Anonim'
  },
  {
    judul:'Alat berat masuk area penyangga tanpa pengawasan',
    kec:'ulujadi',
    kat:3,
    tingkat:'Berat',
    tgl:'2026-07-11',
    status:'Diverifikasi',
    pelapor:'Anonim'
  },
  {
    judul:'Pasir sungai dijual dalam jumlah besar tanpa izin',
    kec:'mantikulore',
    kat:0,
    tingkat:'Sedang',
    tgl:'2026-07-18',
    status:'Diverifikasi',
    pelapor:'Anonim'
  },
  {
    judul:'Lahan kosong digali untuk dijadikan kolam tanpa izin lingkungan',
    kec:'palu-selatan',
    kat:2,
    tingkat:'Ringan',
    tgl:'2026-07-25',
    status:'Selesai',
    pelapor:'Anonim'
  },
  {
    judul:'Tebing di pinggir jalan mulai retak akibat galian',
    kec:'tatanga',
    kat:1,
    tingkat:'Sedang',
    tgl:'2026-08-05',
    status:'Baru',
    pelapor:'Anonim'
  },
  {
    judul:'Pengerukan pasir sungai meluas mendekati permukiman',
    kec:'ulujadi',
    kat:0,
    tingkat:'Berat',
    tgl:'2026-08-14',
    status:'Baru',
    pelapor:'Anonim'
  },
  {
    judul:'Alat berat beroperasi tanpa henti di area konservasi',
    kec:'mantikulore',
    kat:3,
    tingkat:'Berat',
    tgl:'2026-08-27',
    status:'Diproses',
    pelapor:'Anonim'
  },
  {
    judul:'Lahan warga digali pihak lain tanpa persetujuan pemilik',
    kec:'palu-timur',
    kat:2,
    tingkat:'Ringan',
    tgl:'2026-09-02',
    status:'Baru',
    pelapor:'Anonim'
  },
  {
    judul:'Truk pengangkut pasir merusak jalan lingkungan warga',
    kec:'palu-barat',
    kat:0,
    tingkat:'Sedang',
    tgl:'2026-09-05',
    status:'Baru',
    pelapor:'Anonim'
  },
];

let reports = SEED.map((s,i) => ({
  id:i+1,
  ticket:'SPT-2026-' + String(i+1).padStart(4,'0'),
  judul:s.judul,
  kategori:KATEGORI[s.kat],
  kecamatan:s.kec,
  lokasiDetail:'',
  deskripsi:
    s.judul +
    '. Warga meminta agar aktivitas ini diperiksa dan ditindaklanjuti oleh petugas berwenang.',
  tingkat:s.tingkat,
  masihBerlangsung:
    s.status !== 'Selesai' &&
    s.status !== 'Ditolak',
  pelapor:s.pelapor,
  anonim:s.pelapor === 'Anonim',
  tanggalLapor:s.tgl,
  status:s.status,
  riwayat:buildRiwayat(s.tgl,s.status,s.catatan),
  sessionCreated:false
}));

reports.forEach(r => {
  r.prioritas = getPriority(r);
  r.fotos = r.foto ? [r.foto] : [];
  r.koordinat = r.koordinat || null;
});

let nextId = reports.length + 1;

/* ---------- State aplikasi ---------- */
const state = {
  role:null,

  warga:{
    nama:'',
    email:'',
    myTicketIds:[]
  },

  petugas:{
    nama:'Petugas DLH',
    email:''
  },

  page:null,

  mapActiveZone:null,
  mapOnlyOpen:false,

  manage:{
    q:'',
    kec:'',
    kat:'',
    status:''
  },

  formSeverity:'Sedang',
  formAnonim:false,

  editingId:null,

  notifications:[],
  notificationOpen:false,

  formPhotos:[],
  formLocation:null
};

/* ================= NOTIFIKASI ================= */

function addNotification(title, message, ticket, unread=true){

  state.notifications.unshift({
    id:Date.now() + Math.random(),
    title,
    message,
    ticket:ticket || '',
    date:TODAY,
    unread
  });

  state.notifications =
    state.notifications.slice(0,20);

  updateNotificationUI();
}

function updateNotificationUI(){

  const countEl =
    document.getElementById('notifCount');

  const panel =
    document.getElementById('notificationPanel');

  if(!countEl || !panel){
    return;
  }

  const unread =
    state.notifications.filter(n => n.unread).length;

  countEl.textContent =
    unread > 9 ? '9+' : unread;

  countEl.classList.toggle(
    'hidden',
    unread === 0
  );

  panel.innerHTML =
    `
    <div class="notif-head">
      <strong style="font-size:13px;">
        Notifikasi
      </strong>

      <button
        class="btn btn-ghost btn-sm"
        onclick="markNotificationsRead(); event.stopPropagation();">
        Tandai dibaca
      </button>
    </div>
    ` +

    (
      state.notifications.length

      ?

      state.notifications.map(n => `
        <div
          class="notif-item ${n.unread ? 'unread' : ''}"
          onclick="readNotification('${n.id}')">

          <b>${esc(n.title)}</b>

          <p>${esc(n.message)}</p>

          <span>
            ${esc(n.ticket || '')} · ${fmtTampil(n.date)}
          </span>

        </div>
      `).join('')

      :

      `
      <div
        class="empty"
        style="padding:28px 16px;">

        ${icon('bell')}

        <p style="margin:8px 0 0;">
          Belum ada notifikasi.
        </p>

      </div>
      `
    );

  panel.classList.toggle(
    'active',
    state.notificationOpen
  );
}

function toggleNotifications(){
  state.notificationOpen =
    !state.notificationOpen;

  updateNotificationUI();
}

function markNotificationsRead(){
  state.notifications.forEach(
    n => n.unread = false
  );

  updateNotificationUI();
}

function readNotification(id){

  const n =
    state.notifications.find(
      x => String(x.id) === String(id)
    );

  if(n){
    n.unread = false;
  }

  updateNotificationUI();
}

/* ================= GATE ================= */

function switchGateTab(which){

  document
    .getElementById('tabWarga')
    .classList.toggle(
      'active',
      which === 'warga'
    );

  document
    .getElementById('tabPetugas')
    .classList.toggle(
      'active',
      which === 'petugas'
    );

  document
    .getElementById('formWarga')
    .classList.toggle(
      'hidden',
      which !== 'warga'
    );

  document
    .getElementById('formPetugas')
    .classList.toggle(
      'hidden',
      which !== 'petugas'
    );

  showWargaView('login');
  showPetugasView('login');
}

function refreshGateStats(){

  const total =
    reports.length;

  const done =
    reports.filter(
      r => r.status === 'Selesai'
    ).length;

  const zones =
    new Set(
      reports.map(r => r.kecamatan)
    ).size;

  const totalEl =
    document.getElementById('gateStatTotal');

  const doneEl =
    document.getElementById('gateStatDone');

  const zonesEl =
    document.getElementById('gateStatZones');

  if(totalEl){
    totalEl.textContent = total;
  }

  if(doneEl){
    doneEl.textContent = done;
  }

  if(zonesEl){
    zonesEl.textContent = zones;
  }
}

function enterSession(role, akun){

  if(role === 'warga'){

    state.warga.nama = akun.nama || 'Warga';
    state.warga.email = akun.email;

    state.role = 'warga';
    state.page = 'beranda';

  }else{

    state.petugas.nama = akun.nama || 'Petugas DLH';
    state.petugas.email = akun.email;

    state.role = 'petugas';
    state.page = 'dashboard';
  }

  document
    .getElementById('gate')
    .style.display = 'none';

  document
    .getElementById('app-shell')
    .classList.add('active');

  document
    .getElementById('rolePill')
    .textContent =
      role === 'warga'
        ? 'Warga'
        : 'Petugas';

  document
    .getElementById('rolePill')
    .classList.toggle(
      'petugas',
      role === 'petugas'
    );

  document
    .getElementById('whoName')
    .textContent =
      role === 'warga'
        ? state.warga.nama
        : state.petugas.nama;

  buildNav();
  updateNotificationUI();
  render();
}

function logout(){

  state.role = null;

  if(leafletMapInstance){
    leafletMapInstance.remove();
    leafletMapInstance = null;
  }

  if(leafletDashInstance){
    leafletDashInstance.remove();
    leafletDashInstance = null;
  }

  if(reportLocationMapInstance){
    reportLocationMapInstance.remove();
    reportLocationMapInstance = null;
    reportLocationMarker = null;
  }

  document
    .getElementById('app-shell')
    .classList.remove('active');

  document
    .getElementById('gate')
    .style.display = 'flex';

  document.getElementById('wargaLoginSandi').value = '';
  document.getElementById('petugasLoginSandi').value = '';

  showWargaView('login');
  showPetugasView('login');

  refreshGateStats();
}

/* ================= NAV ================= */

const ICONS = {

  home:
    '<path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-6h5v6"/>',

  edit:
    '<path d="M4 20h4l10.5-10.5a2 2 0 0 0-3-3L5 17v3z"/><path d="M13 6l3 3"/>',

  list:
    '<path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/>',

  map:
    '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/>',

  grid:
    '<rect x="3" y="3" width="7.5" height="7.5"/><rect x="13.5" y="3" width="7.5" height="7.5"/><rect x="3" y="13.5" width="7.5" height="7.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5"/>',

  inbox:
    '<path d="M3 12h5l2 3h4l2-3h5"/><path d="M5.5 5h13l2.5 7v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',

  chart:
    '<path d="M4 20V10"/><path d="M11 20V4"/><path d="M18 20v-7"/><path d="M3 20h18"/>',

  leaf:
    '<path d="M20 4C11 4 5 10 5 17c0 1.5.3 2.5.3 2.5S6 20 7.5 20C15 20 20 13 20 4z"/><path d="M6 18C11 13 15 9 20 4"/>',

  info:
    '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5h.01"/>',

  close:
    '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',

  plus:
    '<path d="M12 5v14"/><path d="M5 12h14"/>',

  bell:
    '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9z"/><path d="M10 21h4"/>'
};

function icon(name){

  return `
    <svg
      class="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round">

      ${ICONS[name] || ''}

    </svg>
  `;
}

const NAV = {

  warga:[
    {
      key:'beranda',
      label:'Beranda',
      ic:'home'
    },
    {
      key:'lapor',
      label:'Buat Laporan',
      ic:'edit'
    },
    {
      key:'laporan-saya',
      label:'Laporan Saya',
      ic:'list'
    },
    {
      key:'peta',
      label:'Peta Sebaran',
      ic:'map'
    },
  ],

  petugas:[
    {
      key:'dashboard',
      label:'Dashboard',
      ic:'grid'
    },
    {
      key:'kelola',
      label:'Kelola Laporan',
      ic:'inbox'
    },
    {
      key:'analisis',
      label:'Analisis & Evaluasi',
      ic:'chart'
    },
    {
      key:'indikator',
      label:'Indikator Lingkungan',
      ic:'leaf'
    },
    {
      key:'tentang',
      label:'Tentang Sistem',
      ic:'info'
    },
  ]
};

function buildNav(){

  const items =
    NAV[state.role];

  const html =
    items.map(it => `
      <button
        class="navitem"
        data-key="${it.key}"
        onclick="goTo('${it.key}')">

        ${icon(it.ic)}

        <span>${it.label}</span>

      </button>
    `).join('');

  document
    .getElementById('sidenav')
    .innerHTML = html;

  document
    .getElementById('bottomnav')
    .innerHTML = html;
}

function goTo(page){

  state.page = page;

  state.notificationOpen = false;

  render();

  window.scrollTo({
    top:0,
    behavior:'instant' in window
      ? 'instant'
      : 'auto'
  });
}

function markActiveNav(){

  document
    .querySelectorAll('.navitem')
    .forEach(b => {

      b.classList.toggle(
        'active',
        b.getAttribute('data-key') === state.page
      );

    });
}

/* ================= RENDER ================= */

function render(){

  const c =
    document.getElementById('content');

  let html = '';

  if(state.role === 'warga'){

    if(state.page === 'beranda'){
      html = pageBerandaWarga();
    }

    else if(state.page === 'lapor'){
      html = pageLapor();
    }

    else if(state.page === 'laporan-saya'){
      html = pageLaporanSaya();
    }

    else if(state.page === 'peta'){
      html = pagePeta();
    }

  }else if(state.role === 'petugas'){

    if(state.page === 'dashboard'){
      html = pageDashboard();
    }

    else if(state.page === 'kelola'){
      html = pageKelola();
    }

    else if(state.page === 'analisis'){
      html = pageAnalisis();
    }

    else if(state.page === 'indikator'){
      html = pageIndikator();
    }

    else if(state.page === 'tentang'){
      html = pageTentang();
    }
  }

  c.innerHTML = html;

  c.classList.remove('enter');

  void c.offsetWidth;

  c.classList.add('enter');

  markActiveNav();

  if(state.page === 'dashboard'){
    drawDashboardCharts();
    initDashboardMap();
  }

  if(state.page === 'lapor'){
    initFormInteractions();
  }

  updateNotificationUI();

  if(state.page === 'peta'){
    initPetaMap();
  }

  attachTiltEffects();
}

/* ---------- Efek tilt ---------- */

const PREFERS_REDUCED_MOTION =
  window.matchMedia &&
  window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

function attachTiltEffects(){

  if(PREFERS_REDUCED_MOTION){
    return;
  }

  document
    .querySelectorAll('.tilt-3d')
    .forEach(el => {

      el.style.perspective = '';

      el.addEventListener(
        'mousemove',
        onTiltMove
      );

      el.addEventListener(
        'mouseleave',
        onTiltLeave
      );
    });
}

function onTiltMove(e){

  const el = e.currentTarget;

  const r =
    el.getBoundingClientRect();

  const px =
    (e.clientX - r.left) / r.width;

  const py =
    (e.clientY - r.top) / r.height;

  const rx =
    (0.5 - py) * 8;

  const ry =
    (px - 0.5) * 10;

  el.style.transform =
    `perspective(600px)
     rotateX(${rx.toFixed(2)}deg)
     rotateY(${ry.toFixed(2)}deg)
     translateZ(2px)`;
}

function onTiltLeave(e){
  e.currentTarget.style.transform = '';
}

/* ================= STATISTIK ================= */

function computeStats(){

  const total =
    reports.length;

  const byStatus = {};

  STATUS_ORDER.forEach(
    s => byStatus[s] = 0
  );

  reports.forEach(
    r => byStatus[r.status]++
  );

  const belumSelesai =
    total -
    byStatus['Selesai'] -
    byStatus['Ditolak'];

  const respons =
    reports
      .map(r => {

        const v =
          r.riwayat.find(
            x => x.status === 'Diverifikasi'
          );

        return v
          ? diffDays(
              r.tanggalLapor,
              v.tanggal
            )
          : null;
      })
      .filter(x => x !== null);

  const avgRespons =
    respons.length
      ? respons.reduce((a,b) => a+b,0)
        / respons.length
      : 0;

  const selesai =
    reports
      .filter(
        r => r.status === 'Selesai'
      )
      .map(r => {

        const v =
          r.riwayat.find(
            x => x.status === 'Selesai'
          );

        return diffDays(
          r.tanggalLapor,
          v.tanggal
        );
      });

  const avgSelesai =
    selesai.length
      ? selesai.reduce((a,b) => a+b,0)
        / selesai.length
      : 0;

  const rasioSelesai =
    total
      ? Math.round(
          (
            byStatus['Selesai'] /
            (
              total -
              byStatus['Ditolak'] ||
              1
            )
          ) * 100
        )
      : 0;

  const perKec =
    KECAMATAN.map(k => ({
      id:k.id,
      nama:k.nama,

      total:
        reports.filter(
          r => r.kecamatan === k.id
        ).length,

      aktif:
        reports.filter(
          r =>
            r.kecamatan === k.id &&
            !['Selesai','Ditolak']
              .includes(r.status)
        ).length
    }));

  const hotspot =
    [...perKec]
      .sort((a,b) => b.aktif - a.aktif)[0];

  const perKategori =
    KATEGORI.map(k => ({
      nama:k,
      total:
        reports.filter(
          r => r.kategori === k
        ).length
    }));

  const kategoriTop =
    [...perKategori]
      .sort((a,b) => b.total - a.total)[0];

  return {
    total,
    byStatus,
    belumSelesai,
    avgRespons,
    avgSelesai,
    rasioSelesai,
    perKec,
    hotspot,
    perKategori,
    kategoriTop
  };
}

/* ================= WARGA: BERANDA ================= */

function pageBerandaWarga(){

  const s = computeStats();

  return `
    <div class="page-head">
      <div>

        <h1>
          Laporkan tambang ilegal
          di lingkungan Anda
        </h1>

        <p class="desc">
          Penambangan pasir dan galian C tanpa izin
          di sekitar Kota Palu mempercepat erosi tepi
          sungai, merusak lereng bukit, dan menaikkan
          risiko banjir serta longsor. Sering kali
          aktivitas ini baru diketahui petugas setelah
          kerusakan meluas. Laporan Anda membantu tim
          lingkungan hidup bertindak lebih awal.
        </p>

      </div>

      <button
        class="btn btn-primary"
        onclick="goTo('lapor')">

        ${icon('plus')}
        Buat laporan baru

      </button>
    </div>

    <div
      class="grid grid-3"
      style="margin-bottom:30px;">

      <div class="card stat-card tilt-3d clay">
        <b>${s.byStatus['Baru']}</b>
        <span>Menunggu diverifikasi</span>
      </div>

      <div class="card stat-card tilt-3d amber">
        <b>
          ${
            s.byStatus['Diproses'] +
            s.byStatus['Diverifikasi']
          }
        </b>

        <span>Sedang ditangani</span>
      </div>

      <div class="card stat-card tilt-3d brand">
        <b>${s.byStatus['Selesai']}</b>
        <span>Selesai ditindaklanjuti</span>
      </div>

    </div>

    <div class="section-block">

      <h2>Alur laporan Anda</h2>

      <div class="flow-steps">

        <div class="flow-step">
          <b>1. Anda melapor</b>
          <span>
            Isi lokasi, kategori, dan tingkat
            kerusakan yang terlihat.
          </span>
        </div>

        <div class="flow-step">
          <b>2. Tim memverifikasi</b>
          <span>
            Petugas memeriksa kelengkapan
            dan kevalidan laporan.
          </span>
        </div>

        <div class="flow-step">
          <b>3. Tim turun lokasi</b>
          <span>
            Peninjauan lapangan dan koordinasi
            penghentian aktivitas.
          </span>
        </div>

        <div class="flow-step">
          <b>4. Status diperbarui</b>
          <span>
            Anda bisa memantau perkembangan
            hingga selesai.
          </span>
        </div>

      </div>

    </div>

    <div class="card pad-l">

      <h3 style="margin-bottom:10px;">
        Sebelum melapor, siapkan informasi berikut
      </h3>

      <div class="grid grid-2">

        <ul>

          <li>
            Lokasi sedetail mungkin
            (nama jalan, dusun, atau titik
            acuan terdekat)
          </li>

          <li>
            Jenis aktivitas yang Anda lihat
            (pasir sungai, galian bukit,
            alat berat, dll.)
          </li>

        </ul>

        <ul>

          <li>
            Perkiraan tingkat kerusakan
            yang tampak di lokasi
          </li>

          <li>
            Foto sebagai bukti pendukung,
            jika memungkinkan dan aman
            untuk diambil
          </li>

        </ul>

      </div>

    </div>

    ${disclaimerBlock()}
  `;
}

function disclaimerBlock(){

  return `
    <p class="disclaimer">
      Catatan: seluruh data laporan pada prototipe
      ini adalah data dummy/simulasi untuk keperluan
      tugas mata kuliah Kajian Lingkungan Hidup,
      bukan laporan kejadian nyata.
    </p>
  `;
}

/* ================= WARGA: BUAT LAPORAN ================= */

let reportLocationMapInstance = null;
let reportLocationMarker = null;

function pageLapor(){

  const kecOptions =
    KECAMATAN.map(
      k =>
        `<option value="${k.id}">
          ${k.nama}
        </option>`
    ).join('');

  const katOptions =
    KATEGORI.map(
      k =>
        `<option value="${esc(k)}">
          ${esc(k)}
        </option>`
    ).join('');

  return `
    <div class="page-head">

      <div>

        <h1>Buat laporan baru</h1>

        <p class="desc">
          Semakin lengkap detail yang Anda berikan,
          semakin cepat petugas dapat memverifikasi
          dan menindaklanjuti laporan.
        </p>

      </div>

    </div>

    <div
      class="card pad-l"
      style="max-width:900px;">

      <div class="formgrid">

        <div class="field full">

          <label for="fJudul">
            Judul laporan
          </label>

          <input
            type="text"
            id="fJudul"
            placeholder="Contoh: Penambangan pasir liar di bantaran sungai belakang permukiman">

          <span class="hint">
            Gunakan judul yang jelas dan spesifik, minimal 3 kata. Hindari judul seperti “A”, “abc”, atau kata yang tidak menjelaskan kejadian.
          </span>

        </div>

        <div class="field">

          <label for="fKategori">
            Kategori aktivitas
          </label>

          <select id="fKategori">

            <option value="">
              Pilih kategori
            </option>

            ${katOptions}

          </select>

        </div>

        <div class="field">

          <label for="fKecamatan">
            Kecamatan
          </label>

          <select id="fKecamatan">

            <option value="">
              Pilih kecamatan
            </option>

            ${kecOptions}

          </select>

        </div>

        <div class="field full">

          <label for="fLokasi">
            Detail lokasi
          </label>

          <input
            type="text"
            id="fLokasi"
            placeholder="Contoh: Jalan Domba, RT 04 RW 02, dekat jembatan">

          <span class="hint">
            Isi alamat atau titik acuan yang jelas, minimal 2 kata. Jangan hanya mengisi satu huruf atau teks yang tidak bermakna.
          </span>

        </div>

        <div class="field full">

          <label>
            Lokasi pada peta
          </label>

          <div
            class="card"
            style="padding:10px;">

            <div
              id="reportLocationMap"
              class="leaflet-holder small">
            </div>

            <div
              style="
                display:flex;
                gap:8px;
                flex-wrap:wrap;
                margin-top:10px;
              ">

              <button
                type="button"
                class="btn btn-outline btn-sm"
                onclick="useMyLocation()">

                Gunakan lokasi saya

              </button>

              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onclick="clearReportLocation()">

                Hapus titik

              </button>

            </div>

            <div
              id="locationInfo"
              style="
                font-size:12px;
                color:var(--ink-soft);
                margin-top:8px;
              ">

              Klik pada peta untuk menentukan
              lokasi kejadian.

            </div>

          </div>

        </div>

        <div class="field full">

          <label>
            Tingkat kerusakan yang terlihat
          </label>

          <div
            class="severity-pick"
            id="sevPick">

            <div
              class="sev-opt"
              data-v="Ringan"
              onclick="pickSeverity('Ringan')">

              <b>Ringan</b>

              <span>
                Baru terlihat, dampak masih kecil
              </span>

            </div>

            <div
              class="sev-opt selected"
              data-v="Sedang"
              onclick="pickSeverity('Sedang')">

              <b>Sedang</b>

              <span>
                Sudah mengubah bentuk lahan/aliran
              </span>

            </div>

            <div
              class="sev-opt"
              data-v="Berat"
              onclick="pickSeverity('Berat')">

              <b>Berat</b>

              <span>
                Dampak besar atau berisiko bagi warga
              </span>

            </div>

          </div>

        </div>

        <div class="field full">

          <label>
            Prioritas awal
          </label>

          <div
            id="priorityPreview"
            style="display:inline-flex;">
          </div>

          <div
            class="hint"
            style="margin-top:6px;">

            Prioritas dihitung otomatis berdasarkan
            tingkat kerusakan dan apakah aktivitas
            masih berlangsung.

          </div>

        </div>

        <div class="field full">

          <label>
            Aktivitas masih berlangsung?
          </label>

          <label class="checkline">

            <input
              type="checkbox"
              id="fBerlangsung"
              checked>

            Ya, aktivitas masih terlihat berlangsung

          </label>

        </div>

        <div class="field full">

          <label for="fDeskripsi">
            Deskripsi kejadian
          </label>

          <textarea
            id="fDeskripsi"
            aria-describedby="fDeskripsiHint"
            placeholder="Contoh: Pada pagi hari terlihat aktivitas penambangan pasir di sekitar sungai yang menyebabkan air menjadi keruh."></textarea>

          <span class="hint report-description-hint" id="fDeskripsiHint">
            <strong>Petunjuk:</strong> Jelaskan kejadian secara nyata dan jelas.
            <br>Gunakan minimal 8 kata, serta jelaskan aktivitas, waktu, kondisi, lokasi, atau dampak yang Anda lihat.
          </span>

        </div>

        <div class="field">

          <label for="fKontak">
            Kontak
          </label>

          <div id="wrapKontak">

            <input
              type="tel"
              id="fKontak"
              placeholder="Nomor HP / WhatsApp">

          </div>

        </div>

        <div class="field full">

          <label class="checkline">

            <input
              type="checkbox"
              id="fAnonim"
              onchange="toggleAnonim()">

            Kirim laporan secara anonim

          </label>

          <span class="hint">
            Nama dan kontak tidak akan dicatat
            pada laporan jika opsi ini dipilih.
          </span>

        </div>

        <div class="field full">

          <label for="fFoto">
            Foto bukti
          </label>

          <div class="foto-input-row">

            <input
              type="file"
              id="fFoto"
              accept="image/*"
              multiple
              onchange="previewFoto(event)">

            <button
              type="button"
              class="btn-camera"
              onclick="openCamera()">

              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 8a2 2 0 0 1 2-2h1.2l1-1.6A1.6 1.6 0 0 1 9.6 3.6h4.8a1.6 1.6 0 0 1 1.4.8L17 6h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>
                <circle cx="12" cy="13" r="3.4"/>
              </svg>

              Buka kamera

            </button>

          </div>

          <span class="hint">
            Maksimal 5 foto. Pilih file dari perangkat atau
            jepret langsung dari kamera. Foto membantu petugas
            memverifikasi kondisi di lapangan.
          </span>

          <div
            id="fotoPreviewWrap"
            class="photo-grid"
            style="margin-top:10px;">
          </div>

        </div>

      </div>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:10px;
          margin-top:20px;
        ">

        <button
          class="btn btn-outline"
          onclick="goTo('beranda')">

          Batal

        </button>

        <button
          class="btn btn-primary"
          id="submitReportBtn"
          onclick="submitLaporan()">

          Kirim laporan

        </button>

      </div>

    </div>
  `;
}

function initFormInteractions(){

  state.formSeverity = 'Sedang';
  state.formAnonim = false;
  state.formPhotos = [];
  state.formLocation = null;

  const mapEl =
    document.getElementById(
      'reportLocationMap'
    );

  if(mapEl && typeof L !== 'undefined'){

    if(reportLocationMapInstance){
      reportLocationMapInstance.remove();
    }

    reportLocationMapInstance =
      L.map(mapEl, {
        scrollWheelZoom:false
      }).setView(
        PALU_CENTER,
        12
      );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom:18,
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(
      reportLocationMapInstance
    );

    reportLocationMapInstance.on(
      'click',
      function(e){
        setReportLocation(
          e.latlng.lat,
          e.latlng.lng
        );
      }
    );

    setTimeout(
      () => reportLocationMapInstance.invalidateSize(),
      60
    );
  }

  pickSeverity('Sedang');
  updatePriorityPreview(
    'Sedang',
    true
  );
}

function setReportLocation(lat,lng){

  state.formLocation = {
    lat:Number(lat),
    lng:Number(lng)
  };

  if(!reportLocationMapInstance){
    return;
  }

  if(reportLocationMarker){
    reportLocationMapInstance.removeLayer(
      reportLocationMarker
    );
  }

  reportLocationMarker =
    L.marker([lat,lng], {
      draggable:true
    }).addTo(
      reportLocationMapInstance
    );

  reportLocationMarker.bindPopup(
    'Lokasi laporan'
  ).openPopup();

  reportLocationMarker.on(
    'dragend',
    function(e){

      const p =
        e.target.getLatLng();

      setReportLocation(
        p.lat,
        p.lng
      );
    }
  );

  const info =
    document.getElementById(
      'locationInfo'
    );

  if(info){

    info.innerHTML =
      `<strong>Koordinat:</strong>
       ${lat.toFixed(6)},
       ${lng.toFixed(6)}`;
  }
}

function clearReportLocation(){

  state.formLocation = null;

  if(reportLocationMapInstance &&
     reportLocationMarker){

    reportLocationMapInstance.removeLayer(
      reportLocationMarker
    );

    reportLocationMarker = null;
  }

  const info =
    document.getElementById(
      'locationInfo'
    );

  if(info){

    info.textContent =
      'Klik pada peta untuk menentukan lokasi kejadian.';
  }
}

function useMyLocation(){

  if(!navigator.geolocation){

    showToast(
      'Browser tidak mendukung lokasi GPS.'
    );

    return;
  }

  showToast(
    'Meminta lokasi perangkat...'
  );

  navigator.geolocation.getCurrentPosition(

    pos => {

      const lat =
        pos.coords.latitude;

      const lng =
        pos.coords.longitude;

      setReportLocation(
        lat,
        lng
      );

      if(reportLocationMapInstance){

        reportLocationMapInstance.setView(
          [lat,lng],
          14
        );
      }

    },

    () => {

      showToast(
        'Lokasi tidak dapat diakses. Silakan pilih titik pada peta.'
      );

    },

    {
      enableHighAccuracy:true,
      timeout:10000
    }
  );
}

function pickSeverity(v){

  state.formSeverity = v;

  document
    .querySelectorAll('.sev-opt')
    .forEach(el => {

      el.classList.toggle(
        'selected',
        el.getAttribute('data-v') === v
      );

    });

  const live =
    document.getElementById(
      'fBerlangsung'
    );

  updatePriorityPreview(
    v,
    live ? live.checked : true
  );
}

function updatePriorityPreview(
  level,
  ongoing
){

  const box =
    document.getElementById(
      'priorityPreview'
    );

  if(!box){
    return;
  }

  box.innerHTML =
    priorityBadge({
      tingkat:level,
      masihBerlangsung:ongoing
    });
}

/* Perubahan checkbox aktivitas */
document.addEventListener(
  'change',
  function(e){

    if(
      e.target &&
      e.target.id === 'fBerlangsung'
    ){

      updatePriorityPreview(
        state.formSeverity,
        e.target.checked
      );
    }

  }
);

function toggleAnonim(){

  state.formAnonim =
    document.getElementById(
      'fAnonim'
    ).checked;

  const wrapKontak =
    document.getElementById('wrapKontak');

  if(wrapKontak){
    wrapKontak.classList.toggle(
      'hidden',
      state.formAnonim
    );
  }
}

/* ---------- Upload foto ---------- */

function previewFoto(e){

  const sisaSlot =
    5 - state.formPhotos.length;

  const files =
    [...e.target.files]
      .slice(0, Math.max(sisaSlot,0));

  if(e.target.files.length > sisaSlot){

    showToast(
      'Maksimal 5 foto. Hanya sebagian foto yang ditambahkan agar tidak melebihi batas.'
    );
  }

  if(!files.length){
    e.target.value = '';
    return;
  }

  Promise.all(

    files.map(
      f =>
        new Promise(
          (resolve,reject) => {

            const reader =
              new FileReader();

            reader.onload =
              ev => resolve(
                ev.target.result
              );

            reader.onerror =
              reject;

            reader.readAsDataURL(f);
          }
        )
    )

  )
  .then(arr => {

    state.formPhotos =
      state.formPhotos.concat(arr);

    renderPhotoPreviews();

    e.target.value = '';
  })

  .catch(() => {

    showToast(
      'Sebagian foto tidak dapat diproses.'
    );
  });
}

function renderPhotoPreviews(){

  const wrap =
    document.getElementById(
      'fotoPreviewWrap'
    );

  if(!wrap){
    return;
  }

  wrap.innerHTML =
    state.formPhotos
      .map(
        (src,i) => `
          <div class="photo-thumb">

            <img
              src="${src}"
              alt="Bukti ${i+1}">

            <button
              type="button"
              onclick="removePhoto(${i})">

              ×

            </button>

          </div>
        `
      )
      .join('');
}

function removePhoto(i){

  state.formPhotos.splice(
    i,
    1
  );

  renderPhotoPreviews();
}

/* ---------- Submit laporan ---------- */

async function submitLaporan(){

  const btn =
    document.getElementById(
      'submitReportBtn'
    );

  const judul =
    document
      .getElementById('fJudul')
      .value
      .trim();

  const kategori =
    document
      .getElementById('fKategori')
      .value;

  const kecamatan =
    document
      .getElementById('fKecamatan')
      .value;

  const lokasiDetail =
    cleanReportText(
      document
        .getElementById('fLokasi')
        .value
    );

  const deskripsi =
    cleanReportText(
      document
        .getElementById('fDeskripsi')
        .value
    );

  if(!judul || !kategori || !kecamatan || !lokasiDetail || !deskripsi){
    showToast(
      'Lengkapi judul, kategori, kecamatan, detail lokasi, dan deskripsi terlebih dahulu.'
    );
    return;
  }

  if(!isMeaningfulReportText(judul, 3, 12)){
    showToast(
      'Judul harus berupa kalimat yang jelas, minimal 3 kata, bukan satu huruf atau teks abstrak.'
    );
    return;
  }

  if(!isValidDetailLocation(lokasiDetail)){
    showToast(
      'Detail lokasi harus berupa alamat yang jelas dan benar. Contoh: Jalan Domba, RT 04 RW 02 atau dekat Jembatan Palu.'
    );
    return;
  }

  if(!isMeaningfulReportText(deskripsi, 8, 30)){
    showToast(
      'Deskripsi harus berupa penjelasan kejadian yang jelas, minimal 8 kata dan bukan teks abstrak.'
    );
    return;
  }

  const anonim =
    document
      .getElementById('fAnonim')
      .checked;

  // Nama otomatis mengikuti nama akun warga yang sedang login.
  // Jika anonim dipilih, identitas pelapor disembunyikan.
  const nama =
    anonim
      ? 'Anonim'
      : (state.warga.nama || 'Warga');

  const kontak =
    anonim
      ? ''
      :
        document
          .getElementById('fKontak')
          .value
          .trim();

  const today =
    TODAY;

  if(btn){

    btn.disabled = true;
    btn.textContent = 'Mengirim...';
  }

  const rep = {

    id:nextId++,

    ticket:
      'SPT-2026-' +
      String(
        reports.length + 1
      ).padStart(4,'0'),

    judul,

    kategori,

    kecamatan,

    lokasiDetail,

    deskripsi,

    tingkat:
      state.formSeverity,

    masihBerlangsung:
      document
        .getElementById('fBerlangsung')
        .checked,

    pelapor:nama,

    anonim,

    kontak,

    foto:
      state.formPhotos[0] || null,

    fotos:
      [...state.formPhotos],

    koordinat:
      state.formLocation
        ? {...state.formLocation}
        : null,

    prioritas:null,

    tanggalLapor:today,

    status:'Baru',

    riwayat:[
      {
        tanggal:today,
        status:'Baru',
        catatan:
          'Laporan diterima dan diberi nomor tiket oleh sistem.',
        oleh:'Sistem'
      }
    ],

    sessionCreated:true
  };

  rep.prioritas =
    getPriority(rep);

  reports.push(rep);

  state.warga.myTicketIds.push(
    rep.id
  );

  addNotification(
    'Laporan berhasil dikirim',
    `Laporan ${rep.ticket} telah diterima dan menunggu verifikasi petugas.`,
    rep.ticket,
    true
  );

  showToast(
    'Laporan terkirim. Nomor tiket: ' +
    rep.ticket
  );

  goTo('laporan-saya');
}

/* ================= WARGA: LAPORAN SAYA ================= */

function pageLaporanSaya(){

  const mine =
    reports.filter(
      r =>
        state.warga.myTicketIds
          .includes(r.id)
    );

  let list;

  if(mine.length === 0){

    list = `
      <div class="card empty">

        ${icon('list')}

        <h3 style="margin-bottom:6px;">
          Anda belum membuat laporan pada sesi ini
        </h3>

        <p style="margin-bottom:16px;">
          Laporan yang Anda kirim akan muncul
          di sini beserta status penanganannya.
        </p>

        <button
          class="btn btn-primary"
          onclick="goTo('lapor')">

          Buat laporan pertama Anda

        </button>

      </div>
    `;

  }else{

    list =
      mine
        .slice()
        .reverse()
        .map(r => reportCard(r,true))
        .join('');
  }

  return `
    <div class="page-head">

      <div>

        <h1>Laporan saya</h1>

        <p class="desc">
          Daftar laporan yang Anda kirim
          pada sesi ini, beserta status
          penanganannya.
        </p>

      </div>

    </div>

    ${list}
  `;
}

/* ---------- Card laporan ---------- */

function reportCard(r, clickable){

  const sm =
    STATUS_META[r.status];

  const click =
    clickable
      ? `onclick="openDetail(${r.id})"`
      : '';

  return `
    <div
      class="report-card"
      ${click}>

      <div
        class="spine"
        style="background:${sm.hex}">
      </div>

      <div class="body">

        <div class="row1">

          <div>

            <div class="ticket">
              ${r.ticket}
            </div>

            <h4>
              ${esc(r.judul)}
            </h4>

          </div>

          <div
            style="
              display:flex;
              gap:6px;
              flex-wrap:wrap;
              justify-content:flex-end;
            ">

            <span
              class="badge"
              style="
                color:${sm.color};
                background:${sm.bg};
              ">

              <span class="dot"></span>
              ${r.status}

            </span>

            ${priorityBadge(r)}

          </div>

        </div>

        <div class="meta">

          <span>
            ${kecNama(r.kecamatan)}
          </span>

          <span>
            ${esc(r.kategori)}
          </span>

          <span>
            Tingkat: ${r.tingkat}
          </span>

          <span>
            ${fmtTampil(r.tanggalLapor)}
          </span>

          ${
            r.koordinat
              ? '<span>📍 Lokasi GPS</span>'
              : ''
          }

          ${
            r.fotos && r.fotos.length
              ? `<span>📷 ${r.fotos.length} foto</span>`
              : ''
          }

        </div>

      </div>

    </div>
  `;
}

/* ================= DETAIL LAPORAN ================= */

/* ================= DETAIL PETA LAPORAN ================= */
let detailReportMapInstance = null;

function getPaluMapEmbedUrl(r){
  const hasCoords = !!(r && r.koordinat &&
    Number.isFinite(Number(r.koordinat.lat)) &&
    Number.isFinite(Number(r.koordinat.lng)));

  const lat = hasCoords ? Number(r.koordinat.lat) : PALU_CENTER[0];
  const lng = hasCoords ? Number(r.koordinat.lng) : PALU_CENTER[1];

  // Tampilan OSM langsung di dalam iframe sebagai fallback yang
  // tidak bergantung pada library Leaflet/CDN JavaScript.
  const span = hasCoords ? 0.008 : 0.055;
  const minLon = lng - span;
  const maxLon = lng + span;
  const minLat = lat - span;
  const maxLat = lat + span;

  let url = 'https://www.openstreetmap.org/export/embed.html' +
    '?bbox=' + encodeURIComponent(
      minLon + ',' + minLat + ',' + maxLon + ',' + maxLat
    ) +
    '&layer=mapnik';

  if(hasCoords){
    url += '&marker=' + encodeURIComponent(lat + ',' + lng);
  }

  return url;
}

function initDetailReportMap(r){
  const el = document.getElementById('reportDetailMap');
  if(!el) return;

  if(detailReportMapInstance){
    try{ detailReportMapInstance.remove(); }catch(e){}
    detailReportMapInstance = null;
  }

  // Gunakan peta OSM langsung agar peta bukti laporan tetap tampil
  // walaupun Leaflet/CDN tidak berhasil dimuat di browser.
  const iframe = document.createElement('iframe');
  iframe.src = getPaluMapEmbedUrl(r);
  iframe.title = 'Peta lokasi laporan Kota Palu';
  iframe.loading = 'eager';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.minHeight = '320px';
  iframe.style.border = '0';
  iframe.style.display = 'block';
  iframe.setAttribute('allowfullscreen', '');

  el.innerHTML = '';
  el.appendChild(iframe);

  // Jika Leaflet tersedia, tetap siapkan objek map di background state
  // untuk kompatibilitas dengan fitur peta lain, tetapi detail laporan
  // menggunakan iframe agar selalu terlihat di modal.
}

function openDetail(id){

  const r =
    reports.find(
      x => x.id === id
    );

  if(!r){
    return;
  }

  const sm =
    STATUS_META[r.status];

  document
    .getElementById('modalTicket')
    .textContent =
      r.ticket +
      ' · ' +
      kecNama(r.kecamatan);

  document
    .getElementById('modalTitle')
    .textContent =
      r.judul;

  document
    .getElementById('modalBody')
    .innerHTML = `

      <div
        style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-bottom:14px;
        ">

        <span
          class="badge"
          style="
            color:${sm.color};
            background:${sm.bg};
          ">

          <span class="dot"></span>
          ${r.status}

        </span>

        <span
          class="badge"
          style="
            color:${SEVERITY_META[r.tingkat].hex};
            background:${SEVERITY_META[r.tingkat].bg};
          ">

          Tingkat ${r.tingkat}

        </span>

        ${priorityBadge(r)}

      </div>


      <h4
        style="
          font-size:13.5px;
          margin-top:18px;
        ">

        Peta lokasi laporan

      </h4>

      <div class="location-box">
        <div
          id="reportDetailMap"
          class="report-map"
          aria-label="Peta lokasi laporan di Kota Palu">
        </div>
        <div class="location-toolbar">
          <span class="location-coords">
            ${r.koordinat
              ? `Lokasi laporan: ${r.koordinat.lat.toFixed(6)}, ${r.koordinat.lng.toFixed(6)}`
              : 'Peta Kota Palu ditampilkan; koordinat laporan belum tersedia.'}
          </span>
        </div>
      </div>

      <p
        style="
          font-size:13.5px;
          color:var(--ink-soft);
        ">

        ${esc(r.deskripsi)}

      </p>

      ${
        r.lokasiDetail
          ?
          `
          <p style="font-size:13px;">

            <strong>Lokasi:</strong>
            ${esc(r.lokasiDetail)}

          </p>
          `
          :
          ''
      }

      ${
        r.koordinat
          ?
          `
          <p
            style="
              font-size:12.5px;
              color:var(--ink-soft);
            ">

            <strong>Koordinat:</strong>
            ${r.koordinat.lat.toFixed(6)},
            ${r.koordinat.lng.toFixed(6)}

          </p>
          `
          :
          ''
      }

      ${
        r.fotos && r.fotos.length

          ?

          `
          <div
            class="photo-grid"
            style="margin-top:10px;">

            ${
              r.fotos
                .map(
                  (f,i) => `
                    <div class="photo-thumb">

                      <img
                        src="${f}"
                        alt="Bukti ${i+1}">

                    </div>
                  `
                )
                .join('')
            }

          </div>
          `

          :

          (
            r.foto
              ?

              `
              <img
                src="${r.foto}"
                alt="Foto bukti"
                style="
                  max-width:100%;
                  border-radius:6px;
                  border:1px solid var(--line);
                  margin-top:8px;
                ">
              `

              :

              ''
          )
      }

      <h4
        style="
          font-size:13.5px;
          margin-top:18px;
        ">

        Riwayat penanganan

      </h4>

      <ul class="timeline">

        ${
          r.riwayat
            .map(
              t => `

                <li>

                  <span
                    class="tdot"
                    style="
                      background:${STATUS_META[t.status].hex};
                    ">
                  </span>

                  <div class="tbody">

                    <b>
                      ${t.status}
                    </b>

                    <span class="tdate">

                      ${fmtTampil(t.tanggal)}
                      ·
                      ${esc(t.oleh)}

                    </span>

                    <p>
                      ${esc(t.catatan)}
                    </p>

                  </div>

                </li>

              `
            )
            .join('')
        }

      </ul>
  `;

  document
    .getElementById('modalFoot')
    .innerHTML = `
      <button
        class="btn btn-outline"
        onclick="closeModal()">

        Tutup

      </button>
    `;

  document
    .getElementById('modalVeil')
    .classList.add('active');

  setTimeout(() => initDetailReportMap(r), 50);
}

function closeModal(){

  if(detailReportMapInstance){
    try{ detailReportMapInstance.remove(); }catch(e){}
    detailReportMapInstance = null;
  }

  const detailMapEl = document.getElementById('reportDetailMap');
  if(detailMapEl){
    detailMapEl.innerHTML = '';
  }

  document
    .getElementById('modalVeil')
    .classList.remove('active');
}


/* ================= PETA SEBARAN ================= */

function pagePeta(){

  let filtered =
    reports;

  if(state.mapActiveZone){

    filtered =
      filtered.filter(
        r =>
          r.kecamatan ===
          state.mapActiveZone
      );
  }

  if(state.mapOnlyOpen){

    filtered =
      filtered.filter(
        r =>
          !['Selesai','Ditolak']
            .includes(r.status)
      );
  }

  filtered =
    filtered
      .slice()
      .sort(
        (a,b) =>
          a.tanggalLapor <
          b.tanggalLapor
            ? 1
            : -1
      )
      .slice(0,10);

  return `
    <div class="page-head">

      <div>

        <h1>Peta sebaran laporan</h1>

        <p class="desc">
          Peta Kota Palu dengan penanda di tiap
          kecamatan. Ukuran lingkaran menunjukkan
          jumlah laporan, warna menunjukkan tingkat
          kerusakan yang paling sering dilaporkan
          di kecamatan tersebut.
        </p>

      </div>

    </div>

    <div class="map-wrap" style="align-items: start;">

      <div class="realmap" style="position: sticky; top: 20px; align-self: start;">

        <div
          id="leafletMap"
          class="leaflet-holder">
        </div>

        <div class="map-caption">

          <div
            class="legend"
            style="margin-top:0;">

            <span>
              <span
                class="sw"
                style="
                  background:${SEVERITY_META.Ringan.hex}
                ">
              </span>
              Didominasi ringan
            </span>

            <span>
              <span
                class="sw"
                style="
                  background:${SEVERITY_META.Sedang.hex}
                ">
              </span>
              Didominasi sedang
            </span>

            <span>
              <span
                class="sw"
                style="
                  background:${SEVERITY_META.Berat.hex}
                ">
              </span>
              Didominasi berat
            </span>

          </div>

          <span>
            © OpenStreetMap · titik kecamatan bersifat indikatif
          </span>

        </div>

      </div>

      <div class="card pad-m" style="max-height: calc(100vh - 120px); overflow-y: auto;">

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:10px;
          ">

          <h3
            style="
              font-size:14.5px;
              margin:0;
            ">

            ${
              state.mapActiveZone
                ? kecNama(state.mapActiveZone)
                : 'Semua kecamatan'
            }

          </h3>

          ${
            state.mapActiveZone
              ?
              `
              <button
                class="btn btn-ghost btn-sm"
                onclick="selectZone(null)">

                Reset

              </button>
              `
              :
              ''
          }

        </div>

        <label
          class="checkline"
          style="margin-bottom:10px;">

          <input
            type="checkbox"
            ${state.mapOnlyOpen ? 'checked' : ''}
            onchange="toggleOnlyOpen(this)">

          Tampilkan yang belum tuntas saja

        </label>

        ${
          filtered.length
            ?
            filtered
              .map(
                r => reportCard(r,false)
              )
              .join('')

            :
            `
            <p
              style="
                color:var(--ink-faint);
                font-size:13px;
              ">

              Tidak ada laporan untuk filter ini.

            </p>
            `
        }

      </div>

    </div>
  `;
}

function dominantSeverity(kecId){

  const list =
    reports.filter(
      r => r.kecamatan === kecId
    );

  if(!list.length){
    return null;
  }

  const count = {
    Ringan:0,
    Sedang:0,
    Berat:0
  };

  list.forEach(
    r => count[r.tingkat]++
  );

  return Object.entries(count)
    .sort(
      (a,b) => b[1] - a[1]
    )[0][0];
}

function selectZone(id){

  state.mapActiveZone = id;

  render();
}

function toggleOnlyOpen(el){

  state.mapOnlyOpen =
    el.checked;

  render();
}

/* ---------- Leaflet ---------- */

let leafletMapInstance = null;
let leafletDashInstance = null;

function buildPaluMap(
  elId,
  opts
){

  opts = opts || {};

  const el =
    document.getElementById(elId);

  if(
    !el ||
    typeof L === 'undefined'
  ){
    return null;
  }

  const map =
    L.map(
      el,
      {
        scrollWheelZoom:false
      }
    ).setView(
      PALU_CENTER,
      opts.zoom || 12
    );

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom:18,
      attribution:
        '&copy; OpenStreetMap contributors'
    }
  ).addTo(map);

  const s =
    computeStats();

  KECAMATAN.forEach(k => {

    const data =
      s.perKec.find(
        p => p.id === k.id
      );

    const dominantSev =
      dominantSeverity(k.id);

    const color =
      dominantSev
        ? SEVERITY_META[
            dominantSev
          ].hex
        : '#8A9285';

    const size =
      data.total === 0

        ?

        (
          opts.compact
            ? 18
            : 26
        )

        :

        Math.min(
          opts.compact
            ? 42
            : 60,

          (
            opts.compact
              ? 22
              : 30
          )
          +
          data.total *
          (
            opts.compact
              ? 3
              : 4
          )
        );

    const pulseClass =
      (
        dominantSev === 'Berat' &&
        data.aktif > 0
      )
      ? ' pulse'
      : '';

    const html = `
      <div
        class="map-marker${pulseClass}"
        style="
          width:${size}px;
          height:${size}px;
          background:${color};
          font-size:${size > 44 ? 13 : 11}px;
          position:relative;
        ">

        ${data.total || '—'}

      </div>
    `;

    const markerIcon =
      L.divIcon({
        className:'map-marker-wrap',
        html,
        iconSize:[
          size,
          size
        ],
        iconAnchor:[
          size/2,
          size/2
        ]
      });

    const marker =
      L.marker(
        [k.lat,k.lng],
        {
          icon:markerIcon
        }
      ).addTo(map);

    marker.bindPopup(
      `<b>${esc(k.nama)}</b>
       <br>${data.total} laporan tercatat
       <br>${data.aktif} belum tuntas`
      +

      (
        dominantSev
          ?
          `<br>Didominasi tingkat
           <strong>
             ${dominantSev.toLowerCase()}
           </strong>`
          :
          ''
      )
    );

    if(opts.onSelect){

      marker.on(
        'click',
        () => opts.onSelect(k.id)
      );

    }
  });

  setTimeout(
    () => map.invalidateSize(),
    60
  );

  return map;
}

function initPetaMap(){

  if(leafletMapInstance){

    leafletMapInstance.remove();

    leafletMapInstance = null;
  }

  const activeZone =
    state.mapActiveZone
      ? KECAMATAN.find(
          k =>
            k.id ===
            state.mapActiveZone
        )
      : null;

  leafletMapInstance =
    buildPaluMap(
      'leafletMap',
      {
        zoom:
          activeZone
            ? 13
            : 12,

        onSelect:
          selectZone
      }
    );

  if(
    activeZone &&
    leafletMapInstance
  ){

    leafletMapInstance.setView(
      [
        activeZone.lat,
        activeZone.lng
      ],
      13
    );
  }
}

function initDashboardMap(){

  if(leafletDashInstance){

    leafletDashInstance.remove();

    leafletDashInstance = null;
  }

  leafletDashInstance =
    buildPaluMap(
      'leafletMapDash',
      {
        zoom:11.5,
        compact:true,

        onSelect:(id) => {

          state.manage.kec = id;

          goTo('kelola');
        }
      }
    );
}

/* ================= PETUGAS: DASHBOARD ================= */

function pageDashboard(){

  const s =
    computeStats();

  const rank = {
    Darurat:0,
    Tinggi:1,
    Sedang:2,
    Rendah:3
  };

  const urgent =
    reports
      .filter(
        r => r.status === 'Baru'
      )
      .sort(
        (a,b) =>
          (
            rank[getPriority(a)] -
            rank[getPriority(b)]
          )
          ||
          (
            a.tanggalLapor <
            b.tanggalLapor
              ? -1
              : 1
          )
      )
      .slice(0,5);

  const daruratCount =
    reports.filter(
      r =>
        getPriority(r) === 'Darurat' &&
        !['Selesai','Ditolak']
          .includes(r.status)
    ).length;

  return `
    <div class="page-head">

      <div>

        <h1>Dashboard</h1>

        <p class="desc">
          Ringkasan seluruh laporan aktivitas
          tambang ilegal yang tercatat di sistem.
        </p>

      </div>

    </div>

    <div
      class="grid grid-4"
      style="margin-bottom:22px;">

      <div class="card stat-card tilt-3d clay">

        <b>
          ${s.byStatus['Baru']}
        </b>

        <span>
          Menunggu verifikasi
        </span>

      </div>

      <div class="card stat-card tilt-3d amber">

        <b>
          ${
            s.byStatus['Diverifikasi'] +
            s.byStatus['Diproses']
          }
        </b>

        <span>
          Dalam penanganan
        </span>

      </div>

      <div class="card stat-card tilt-3d brand">

        <b>
          ${s.byStatus['Selesai']}
        </b>

        <span>
          Selesai ditangani
        </span>

      </div>

      <div class="card stat-card tilt-3d water">

        <b>
          ${s.avgRespons.toFixed(1)} hari
        </b>

        <span>
          Rata-rata waktu respons
        </span>

      </div>

    </div>

    <div
      class="card pad-m"
      style="
        margin-bottom:22px;
        border-left:3px solid var(--danger);
      ">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
        ">

        <div>

          <strong style="font-size:13.5px;">
            Prioritas darurat
          </strong>

          <div
            style="
              font-size:12px;
              color:var(--ink-soft);
              margin-top:3px;
            ">

            Laporan tingkat berat yang
            masih berlangsung.

          </div>

        </div>

        ${priorityBadge({
          tingkat:'Berat',
          masihBerlangsung:true
        })}

        <b
          style="
            font-family:var(--font-head);
            font-size:24px;
          ">

          ${daruratCount}

        </b>

      </div>

    </div>

    <div
      class="grid grid-2"
      style="
        margin-bottom:22px;
        align-items:stretch;
      ">

      <div
        class="card pad-l chart-card">

        <h3>
          Laporan per kecamatan
        </h3>

        <div class="sub">
          Total laporan yang tercatat
          di setiap kecamatan
        </div>

        <div id="chartKec"></div>

      </div>

      <div
        class="card pad-l chart-card">

        <h3>
          Distribusi status
        </h3>

        <div class="sub">
          Proporsi laporan berdasarkan
          status penanganan saat ini
        </div>

        <div id="chartStatus"></div>

      </div>

    </div>

    <div
      class="grid grid-2"
      style="
        margin-bottom:22px;
        align-items:start;
      ">

      <div
        class="card pad-l chart-card">

        <h3>
          Tren laporan masuk
        </h3>

        <div class="sub">
          Jumlah laporan baru per bulan,
          April–September 2026
        </div>

        <div id="chartTren"></div>

      </div>

      <div class="realmap">

        <div
          id="leafletMapDash"
          class="leaflet-holder small">
        </div>

        <div class="map-caption">

          <span>
            Peta titik rawan Kota Palu
          </span>

          <span>
            © OpenStreetMap
          </span>

        </div>

      </div>

    </div>

    <div class="card pad-l">

      <h3 style="margin-bottom:4px;">
        Perlu tindakan segera
      </h3>

      <div
        class="sub"
        style="margin-bottom:14px;">

        Laporan berstatus "Baru",
        diprioritaskan berdasarkan tingkat
        risiko dan lama menunggu

      </div>

      ${
        urgent.length

        ?

        urgent
          .map(r => reportCard(r,true))
          .join('')

        :

        `
        <p
          style="
            color:var(--ink-faint);
            font-size:13px;
          ">

          Tidak ada laporan yang menunggu
          verifikasi.

        </p>
        `
      }

    </div>
  `;
}

/* ================= CHART BAR ================= */

function svgBar(
  data,
  opts
){

  opts = opts || {};

  if(!data.length){

    return `
      <p
        style="
          color:var(--ink-faint);
          font-size:13px;
          padding:10px 0;
        ">

        Belum ada data untuk ditampilkan.

      </p>
    `;
  }

  const w = 460;
  const h = data.length * 34 + 10;
  const labelW = 140;

  const max =
    Math.max(
      1,
      ...data.map(
        d => d.value
      )
    );

  const barMax =
    w - labelW - 46;

  const bars =
    data.map(
      (d,i) => {

        const y =
          i * 34 + 6;

        const bw =
          Math.max(
            2,
            (
              d.value /
              max
            ) *
            barMax
          );

        return `
          <text
            x="0"
            y="${y+15}"
            font-size="12"
            fill="var(--ink-soft)"
            font-family="IBM Plex Sans">

            ${esc(d.label)}

          </text>

          <rect
            x="${labelW}"
            y="${y}"
            width="${bw}"
            height="18"
            rx="3"
            fill="${d.color || '#2E6B4F'}">
          </rect>

          <text
            x="${labelW + bw + 8}"
            y="${y+14}"
            font-size="12"
            fill="var(--ink)"
            font-family="IBM Plex Sans"
            font-weight="600">

            ${d.value}

          </text>
        `;
      }
    ).join('');

  return `
    <svg
      viewBox="0 0 ${w} ${h}"
      style="
        width:100%;
        height:${h}px;
      ">

      ${bars}

    </svg>
  `;
}

/* ================= DONUT ================= */

function svgDonut(data, opts){

  const total =
    data.reduce(
      (a,b) => a + b.value,
      0
    ) || 1;

  const cx = 90;
  const cy = 90;
  const r = 64;
  const sw = 26;

  let angle = -90;
  let segs = '';

  data.forEach(d => {

    const frac =
      d.value /
      total;

    const a2 =
      angle +
      frac * 360;

    segs +=
      arcSeg(
        cx,
        cy,
        r,
        angle,
        a2,
        d.color,
        sw
      );

    angle = a2;
  });

  const legend =
    data.map(
      d => `
        <div
          style="
            display:flex;
            align-items:center;
            gap:7px;
            font-size:12.5px;
            margin-bottom:6px;
          ">

          <span
            style="
              width:9px;
              height:9px;
              border-radius:50%;
              background:${d.color};
              display:inline-block;
            ">
          </span>

          <span
            style="
              color:var(--ink-soft);
              flex:1;
            ">

            ${d.label}

          </span>

          <b>
            ${d.value}
          </b>

        </div>
      `
    ).join('');

  return `
    <div
      style="
        display:flex;
        gap:22px;
        align-items:center;
        flex-wrap:wrap;
      ">

      <svg
        viewBox="0 0 180 180"
        style="
          width:150px;
          height:150px;
          flex:none;
        ">

        ${segs}

        <text
          x="90"
          y="86"
          text-anchor="middle"
          font-size="22"
          font-family="Fraunces"
          fill="var(--ink)">

          ${total}

        </text>

        <text
          x="90"
          y="103"
          text-anchor="middle"
          font-size="10.5"
          font-family="IBM Plex Sans"
          fill="var(--ink-faint)">

          laporan

        </text>

      </svg>

      <div
        style="
          min-width:140px;
          flex:1;
        ">

        ${legend}

      </div>

    </div>
  `;
}

function arcSeg(
  cx,
  cy,
  r,
  a1,
  a2,
  color,
  sw
){

  if(a2 - a1 >= 359.999){
    a2 = a1 + 359.999;
  }

  const p1 =
    polar(
      cx,
      cy,
      r,
      a1
    );

  const p2 =
    polar(
      cx,
      cy,
      r,
      a2
    );

  const large =
    (a2 - a1) > 180
      ? 1
      : 0;

  return `
    <path
      d="
        M ${p1.x} ${p1.y}
        A ${r} ${r} 0
        ${large} 1
        ${p2.x} ${p2.y}
      "
      stroke="${color}"
      stroke-width="${sw}"
      fill="none"
      stroke-linecap="butt">
    </path>
  `;
}

function polar(
  cx,
  cy,
  r,
  deg
){

  const rad =
    (deg * Math.PI) / 180;

  return {
    x:
      cx +
      r *
      Math.cos(rad),

    y:
      cy +
      r *
      Math.sin(rad)
  };
}

/* ================= LINE CHART ================= */

function svgLine(
  data,
  opts
){

  const w = 880;
  const h = 190;
  const padL = 30;
  const padB = 26;
  const padT = 14;
  const padR = 14;

  const max =
    Math.max(
      2,
      ...data.map(
        d => d.value
      )
    );

  const stepX =
    (
      w -
      padL -
      padR
    ) /
    (
      data.length - 1 || 1
    );

  const pts =
    data.map(
      (d,i) => {

        const x =
          padL +
          i *
          stepX;

        const y =
          padT +
          (
            1 -
            (
              d.value /
              max
            )
          ) *
          (
            h -
            padT -
            padB
          );

        return {
          x,
          y,
          ...d
        };
      }
    );

  const linePath =
    pts.map(
      (p,i) =>
        (
          i === 0
            ? 'M'
            : 'L'
        ) +
        p.x.toFixed(1) +
        ' ' +
        p.y.toFixed(1)
    ).join(' ');

  const areaPath =
    linePath +
    `
      L
      ${pts[pts.length-1].x}
      ${h-padB}

      L
      ${pts[0].x}
      ${h-padB}

      Z
    `;

  const dots =
    pts.map(
      p => `
        <circle
          cx="${p.x}"
          cy="${p.y}"
          r="3.5"
          fill="#2E6B4F">
        </circle>

        <text
          x="${p.x}"
          y="${p.y-10}"
          text-anchor="middle"
          font-size="11"
          font-family="IBM Plex Sans"
          fill="var(--ink-soft)">

          ${p.value}

        </text>
      `
    ).join('');

  const labels =
    pts.map(
      p => `
        <text
          x="${p.x}"
          y="${h-8}"
          text-anchor="middle"
          font-size="11"
          font-family="IBM Plex Sans"
          fill="var(--ink-faint)">

          ${p.label}

        </text>
      `
    ).join('');

  return `
    <svg
      viewBox="0 0 ${w} ${h}"
      style="
        width:100%;
        height:190px;
      ">

      <path
        d="${areaPath}"
        fill="#2E6B4F"
        opacity="0.08">
      </path>

      <path
        d="${linePath}"
        fill="none"
        stroke="#2E6B4F"
        stroke-width="2.2">
      </path>

      ${dots}
      ${labels}

    </svg>
  `;
}

/* ================= DASHBOARD CHART ================= */

function drawDashboardCharts(){

  const s =
    computeStats();

  const kecData =
    s.perKec
      .filter(
        k => k.total > 0
      )
      .sort(
        (a,b) => b.total - a.total
      )
      .map(
        k => ({
          label:k.nama,
          value:k.total,
          color:'#2E6B4F'
        })
      );

  const chartKec =
    document.getElementById(
      'chartKec'
    );

  if(chartKec){
    chartKec.innerHTML =
      svgBar(kecData);
  }

  const statusData =
    STATUS_ORDER
      .map(
        status => ({
          label:status,
          value:s.byStatus[status],
          color:
            STATUS_META[status].hex
        })
      )
      .filter(
        d => d.value > 0
      );

  const chartStatus =
    document.getElementById(
      'chartStatus'
    );

  if(chartStatus){
    chartStatus.innerHTML =
      svgDonut(statusData);
  }

  const months = [
    '2026-04-01',
    '2026-05-01',
    '2026-06-01',
    '2026-07-01',
    '2026-08-01',
    '2026-09-01'
  ];

  const trendData =
    months.map(
      m => ({

        label:
          bulanLabel(m),

        value:
          reports.filter(
            r =>
              r.tanggalLapor
                .slice(0,7) ===
              m.slice(0,7)
          ).length

      })
    );

  const chartTren =
    document.getElementById(
      'chartTren'
    );

  if(chartTren){
    chartTren.innerHTML =
      svgLine(trendData);
  }
}

/* ================= PETUGAS: KELOLA LAPORAN ================= */

function pageKelola(){

  let filtered =
    reports.slice();

  if(state.manage.q){

    const q =
      state.manage.q
        .toLowerCase();

    filtered =
      filtered.filter(
        r =>
          r.judul
            .toLowerCase()
            .includes(q)
          ||
          r.ticket
            .toLowerCase()
            .includes(q)
          ||
          r.deskripsi
            .toLowerCase()
            .includes(q)
      );
  }

  if(state.manage.kec){

    filtered =
      filtered.filter(
        r =>
          r.kecamatan ===
          state.manage.kec
      );
  }

  if(state.manage.kat){

    filtered =
      filtered.filter(
        r =>
          r.kategori ===
          state.manage.kat
      );
  }

  if(state.manage.status){

    filtered =
      filtered.filter(
        r =>
          r.status ===
          state.manage.status
      );
  }

  return `
    <div class="page-head">

      <div>

        <h1>Kelola laporan</h1>

        <p class="desc">
          Verifikasi laporan masyarakat,
          perbarui status, dan catat tindak lanjut.
        </p>

      </div>

      <button
        class="btn btn-outline"
        onclick="exportReportsCSV()">

        Export CSV

      </button>

    </div>

    <div class="card pad-m">

      <div
        class="filters">

        <input
          type="text"
          placeholder="Cari tiket atau judul..."
          value="${esc(state.manage.q)}"
          oninput="state.manage.q=this.value; render()">

        <select
          onchange="state.manage.kec=this.value; render()">

          <option value="">
            Semua kecamatan
          </option>

          ${
            KECAMATAN.map(
              k => `
                <option
                  value="${k.id}"
                  ${state.manage.kec === k.id ? 'selected' : ''}>

                  ${k.nama}

                </option>
              `
            ).join('')
          }

        </select>

        <select
          onchange="state.manage.kat=this.value; render()">

          <option value="">
            Semua kategori
          </option>

          ${
            KATEGORI.map(
              k => `
                <option
                  value="${esc(k)}"
                  ${state.manage.kat === k ? 'selected' : ''}>

                  ${esc(k)}

                </option>
              `
            ).join('')
          }

        </select>

        <select
          onchange="state.manage.status=this.value; render()">

          <option value="">
            Semua status
          </option>

          ${
            STATUS_ORDER.map(
              s => `
                <option
                  value="${s}"
                  ${state.manage.status === s ? 'selected' : ''}>

                  ${s}

                </option>
              `
            ).join('')
          }

        </select>

      </div>

      ${
        filtered.length

          ?

          filtered
            .slice()
            .sort(
              (a,b) =>
                a.tanggalLapor >
                b.tanggalLapor
                  ? -1
                  : 1
            )
            .map(
              r =>
                `
                <div
                  class="report-card"
                  onclick="openManageModal(${r.id})">

                  <div
                    class="spine"
                    style="
                      background:${STATUS_META[r.status].hex}
                    ">
                  </div>

                  <div class="body">

                    <div class="row1">

                      <div>

                        <div class="ticket">
                          ${r.ticket}
                        </div>

                        <h4>
                          ${esc(r.judul)}
                        </h4>

                      </div>

                      <div
                        style="
                          display:flex;
                          gap:6px;
                          flex-wrap:wrap;
                          justify-content:flex-end;
                        ">

                        <span
                          class="badge"
                          style="
                            color:${STATUS_META[r.status].color};
                            background:${STATUS_META[r.status].bg};
                          ">

                          <span class="dot"></span>
                          ${r.status}

                        </span>

                        ${priorityBadge(r)}

                      </div>

                    </div>

                    <div class="meta">

                      <span>
                        ${kecNama(r.kecamatan)}
                      </span>

                      <span>
                        ${esc(r.kategori)}
                      </span>

                      <span>
                        ${fmtTampil(r.tanggalLapor)}
                      </span>

                      ${
                        r.fotos &&
                        r.fotos.length
                          ?
                          `<span>
                            📷 ${r.fotos.length} foto
                           </span>`
                          :
                          ''
                      }

                      ${
                        r.koordinat
                          ?
                          '<span>📍 GPS</span>'
                          :
                          ''
                      }

                    </div>

                  </div>

                </div>
                `
            )
            .join('')

          :

          `
          <div class="empty">

            ${icon('inbox')}

            <h3>
              Tidak ada laporan
            </h3>

            <p>
              Coba ubah filter pencarian.
            </p>

          </div>
          `
      }

    </div>
  `;
}

/* ---------- Modal kelola ---------- */

function openManageModal(id){

  state.editingId = id;

  renderKelolaModal();

  document
    .getElementById('modalVeil')
    .classList.add('active');

  // Inisialisasi peta SETELAH modal tampil.
  // Leaflet tidak dapat menghitung ukuran container dengan benar
  // jika peta dibuat saat modal masih tersembunyi.
  const report = reports.find(x => x.id === id);
  setTimeout(() => {
    if(report){
      initDetailReportMap(report);
    }
  }, 80);
}

function renderKelolaModal(){

  const r =
    reports.find(
      x =>
        x.id ===
        state.editingId
    );

  if(!r){
    return;
  }

  const sm =
    STATUS_META[r.status];

  document
    .getElementById('modalTicket')
    .textContent =
      r.ticket +
      ' · ' +
      kecNama(r.kecamatan);

  document
    .getElementById('modalTitle')
    .textContent =
      r.judul;

  const nextButtons = [];

  if(r.status === 'Baru'){

    nextButtons.push(`
      <button
        class="btn btn-primary"
        onclick="advanceStatus(${r.id},'Diverifikasi')">

        Verifikasi laporan

      </button>
    `);

    nextButtons.push(`
      <button
        class="btn btn-outline"
        onclick="rejectReport(${r.id})">

        Tolak laporan

      </button>
    `);
  }

  else if(r.status === 'Diverifikasi'){

    nextButtons.push(`
      <button
        class="btn btn-primary"
        onclick="advanceStatus(${r.id},'Diproses')">

        Mulai proses

      </button>
    `);
  }

  else if(r.status === 'Diproses'){

    nextButtons.push(`
      <button
        class="btn btn-primary"
        onclick="advanceStatus(${r.id},'Selesai')">

        Tandai selesai

      </button>
    `);
  }

  document
    .getElementById('modalBody')
    .innerHTML = `

      <div
        style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-bottom:14px;
        ">

        <span
          class="badge"
          style="
            color:${sm.color};
            background:${sm.bg};
          ">

          <span class="dot"></span>
          ${r.status}

        </span>

        ${priorityBadge(r)}

        <span
          class="badge"
          style="
            color:${SEVERITY_META[r.tingkat].hex};
            background:${SEVERITY_META[r.tingkat].bg};
          ">

          Tingkat ${r.tingkat}

        </span>

      </div>

      <div class="grid grid-2">

        <div>

          <p>
            <strong>Kategori:</strong>
            ${esc(r.kategori)}
          </p>

          <p>
            <strong>Kecamatan:</strong>
            ${kecNama(r.kecamatan)}
          </p>

          <p>
            <strong>Pelapor:</strong>
            ${esc(r.pelapor)}
          </p>

          <p>
            <strong>Tanggal:</strong>
            ${fmtTampil(r.tanggalLapor)}
          </p>

        </div>

        <div>

          ${
            r.koordinat
              ?
              `
              <p>

                <strong>Koordinat:</strong><br>

                ${r.koordinat.lat.toFixed(6)},
                ${r.koordinat.lng.toFixed(6)}

              </p>
              `
              :
              '<p><strong>Koordinat:</strong> Belum tersedia.</p>'
          }

          ${
            r.lokasiDetail
              ?
              `
              <p>

                <strong>Detail lokasi:</strong><br>
                ${esc(r.lokasiDetail)}

              </p>
              `
              :
              ''
          }

        </div>

      </div>


      <h4
        style="
          font-size:13.5px;
          margin-top:18px;
        ">

        Peta lokasi laporan

      </h4>

      <div class="location-box">
        <div
          id="reportDetailMap"
          class="report-map"
          aria-label="Peta lokasi laporan di Kota Palu">
        </div>
        <div class="location-toolbar">
          <span class="location-coords">
            ${r.koordinat
              ? `Lokasi laporan: ${r.koordinat.lat.toFixed(6)}, ${r.koordinat.lng.toFixed(6)}`
              : 'Peta Kota Palu ditampilkan; koordinat laporan belum tersedia.'}
          </span>
        </div>
      </div>

      <p
        style="
          font-size:13.5px;
          color:var(--ink-soft);
        ">

        ${esc(r.deskripsi)}

      </p>

      ${
        r.fotos &&
        r.fotos.length

          ?

          `
          <h4
            style="
              font-size:13.5px;
              margin-top:18px;
            ">

            Bukti foto

          </h4>

          <div
            class="photo-grid">

            ${
              r.fotos.map(
                (f,i) =>
                  `
                  <div class="photo-thumb">

                    <img
                      src="${f}"
                      alt="Bukti ${i+1}">

                  </div>
                  `
              ).join('')
            }

          </div>
          `

          :
          ''
      }

      <h4
        style="
          font-size:13.5px;
          margin-top:18px;
        ">

        Catatan tindak lanjut

      </h4>

      <textarea
        id="catatanAksi"
        style="min-height:90px;"
        placeholder="Contoh: Tim melakukan pemeriksaan lapangan dan menemukan alat berat masih beroperasi.">
      </textarea>

      <h4
        style="
          font-size:13.5px;
          margin-top:18px;
        ">

        Riwayat

      </h4>

      <ul class="timeline">

        ${
          r.riwayat
            .map(
              t => `
                <li>

                  <span
                    class="tdot"
                    style="
                      background:${STATUS_META[t.status].hex};
                    ">
                  </span>

                  <div class="tbody">

                    <b>
                      ${t.status}
                    </b>

                    <span class="tdate">

                      ${fmtTampil(t.tanggal)}
                      ·
                      ${esc(t.oleh)}

                    </span>

                    <p>
                      ${esc(t.catatan)}
                    </p>

                  </div>

                </li>
              `
            ).join('')
        }

      </ul>
  `;

  document
    .getElementById('modalFoot')
    .innerHTML = `

      <button
        class="btn btn-outline"
        onclick="closeModal()">

        Tutup

      </button>

      ${nextButtons.join('')}

      <button
        class="btn btn-danger"
        onclick="deleteReport(${r.id})">

        Hapus laporan

      </button>

    `;
}

function deleteReport(id){

  const r = reports.find(x => x.id === id);

  if(!r){
    return;
  }

  const yakin = window.confirm(
    'Hapus laporan ' + r.ticket + '?\n\nData laporan akan dihapus dari daftar petugas dan tidak dapat dikembalikan selama sesi ini.'
  );

  if(!yakin){
    return;
  }

  reports = reports.filter(x => x.id !== id);

  state.warga.myTicketIds = state.warga.myTicketIds.filter(
    ticketId => ticketId !== id
  );

  if(detailReportMapInstance){
    detailReportMapInstance.remove();
    detailReportMapInstance = null;
  }

  state.editingId = null;

  document
    .getElementById('modalVeil')
    .classList.remove('active');

  showToast(
    'Laporan ' + r.ticket + ' berhasil dihapus.'
  );

  render();
}

function advanceStatus(
  id,
  next
){

  const r =
    reports.find(
      x => x.id === id
    );

  if(!r){
    return;
  }

  const catatan =
    (
      document
        .getElementById(
          'catatanAksi'
        )
        ?.value
        .trim()
    )
    ||
    (
      'Status diperbarui menjadi ' +
      next +
      '.'
    );

  r.status = next;

  r.prioritas =
    getPriority(r);

  r.riwayat.push({
    tanggal:TODAY,
    status:next,
    catatan,
    oleh:state.petugas.nama
  });

  addNotification(
    'Status laporan diperbarui',
    `Laporan ${r.ticket} berubah menjadi "${next}".`,
    r.ticket,
    true
  );

  showToast(
    'Status laporan diperbarui menjadi "' +
    next +
    '".'
  );

  renderKelolaModal();
  render();
}

function rejectReport(id){

  const r =
    reports.find(
      x => x.id === id
    );

  if(!r){
    return;
  }

  const catatan =
    (
      document
        .getElementById(
          'catatanAksi'
        )
        ?.value
        .trim()
    )
    ||
    'Laporan tidak dapat diverifikasi.';

  r.status = 'Ditolak';

  r.prioritas =
    getPriority(r);

  r.riwayat.push({
    tanggal:TODAY,
    status:'Ditolak',
    catatan,
    oleh:state.petugas.nama
  });

  addNotification(
    'Laporan ditolak',
    `Laporan ${r.ticket} ditolak setelah proses verifikasi.`,
    r.ticket,
    true
  );

  showToast(
    'Laporan ditandai ditolak.'
  );

  renderKelolaModal();
  render();
}

/* ================= ANALISIS & EVALUASI ================= */

function pageAnalisis(){

  const s =
    computeStats();

  const hotspotAktif =
    [...s.perKec]
      .sort(
        (a,b) =>
          b.aktif -
          a.aktif
      )[0];

  return `
    <div class="page-head">

      <div>

        <h1>
          Analisis & evaluasi
        </h1>

        <p class="desc">
          Angka-angka berikut dihitung
          otomatis dari seluruh laporan
          yang tercatat di sistem.
        </p>

      </div>

    </div>

    <div
      class="grid grid-4"
      style="margin-bottom:26px;">

      <div class="card ind-card tilt-3d">

        <span class="def">
          Rata-rata waktu respons
        </span>

        <div class="val">
          ${s.avgRespons.toFixed(1)} hari
        </div>

        <span class="def">
          dari laporan masuk sampai diverifikasi
        </span>

      </div>

      <div class="card ind-card tilt-3d">

        <span class="def">
          Rata-rata waktu penyelesaian
        </span>

        <div class="val">
          ${s.avgSelesai.toFixed(1)} hari
        </div>

        <span class="def">
          dari laporan masuk sampai selesai
        </span>

      </div>

      <div class="card ind-card tilt-3d">

        <span class="def">
          Tingkat penyelesaian
        </span>

        <div class="val">
          ${s.rasioSelesai}%
        </div>

        <span class="def">
          dari laporan yang valid (bukan ditolak)
        </span>

      </div>

      <div class="card ind-card tilt-3d">

        <span class="def">
          Titik paling rawan
        </span>

        <div
          class="val"
          style="font-size:19px;">

          ${hotspotAktif.nama}

        </div>

        <span class="def">
          ${hotspotAktif.aktif}
          laporan belum tuntas
        </span>

      </div>

    </div>

    <div class="section-block">

      <h2>
        Menjawab pertanyaan utama
      </h2>

      <div class="narrative">

        <h4>
          Cepat diketahui
        </h4>

        <p>
          Warga dapat melapor langsung
          dari lokasi kejadian tanpa menunggu
          jadwal patroli. Saat ini rata-rata
          laporan diverifikasi dalam
          ${s.avgRespons.toFixed(1)}
          hari sejak diterima.
        </p>

      </div>

      <div
        class="narrative"
        style="
          border-color:#95711B;
          background:#F2E7C9;
        ">

        <h4
          style="color:#7A5B15;">

          Berbasis data

        </h4>

        <p>

          Setiap laporan tercatat lengkap
          dengan kecamatan, kategori, tingkat
          kerusakan, lokasi, dan prioritas,
          sehingga kecamatan
          ${hotspotAktif.nama}
          dapat diidentifikasi sebagai
          titik rawan berdasarkan data.

        </p>

      </div>

      <div
        class="narrative"
        style="
          border-color:#2E6B4F;
          background:#DEEBE2;
        ">

        <h4
          style="color:#204C39;">

          Tepat ditindaklanjuti

        </h4>

        <p>

          Setiap laporan memiliki riwayat
          status dan catatan tindak lanjut
          yang tersimpan, sehingga penanganan
          dapat dipantau sampai tuntas.

        </p>

      </div>

    </div>

    <div class="grid grid-2">

      <div class="card pad-l">

        <h3
          style="font-size:14.5px;">

          Kategori paling sering dilaporkan

        </h3>

        <div style="margin-top:10px;">

          ${
            svgBar(
              s.perKategori
                .filter(
                  k => k.total > 0
                )
                .sort(
                  (a,b) =>
                    b.total -
                    a.total
                )
                .map(
                  k => ({
                    label:k.nama,
                    value:k.total,
                    color:'#2B6A8A'
                  })
                )
            )
          }

        </div>

      </div>

      <div class="card pad-l">

        <h3
          style="font-size:14.5px;">

          Laporan aktif per kecamatan

        </h3>

        <div style="margin-top:10px;">

          ${
            svgBar(
              s.perKec
                .filter(
                  k => k.aktif > 0
                )
                .sort(
                  (a,b) =>
                    b.aktif -
                    a.aktif
                )
                .map(
                  k => ({
                    label:k.nama,
                    value:k.aktif,
                    color:'#B36A34'
                  })
                )
            )
          }

        </div>

      </div>

    </div>
  `;
}

/* ================= INDIKATOR LINGKUNGAN ================= */

function pageIndikator(){

  const s =
    computeStats();

  const titikAktif =
    s.perKec.filter(
      k => k.aktif > 0
    ).length;

  const beratAktif =
    reports.filter(
      r =>
        r.tingkat === 'Berat' &&
        !['Selesai','Ditolak']
          .includes(r.status)
    ).length;

  const berulang =
    s.perKec.filter(
      k => k.total >= 3
    ).length;

  const lvlTitik =
    titikAktif >= 6
      ? {
          hex:'#A73E37',
          bg:'#F1DBD8',
          label:'Tinggi'
        }
      : titikAktif >= 3
        ? {
            hex:'#95711B',
            bg:'#F2E7C9',
            label:'Sedang'
          }
        : {
            hex:'#2B6A8A',
            bg:'#DCEAF0',
            label:'Rendah'
          };

  const lvlBerat =
    beratAktif >= 5
      ? {
          hex:'#A73E37',
          bg:'#F1DBD8',
          label:'Kritis'
        }
      : beratAktif >= 2
        ? {
            hex:'#95711B',
            bg:'#F2E7C9',
            label:'Waspada'
          }
        : {
            hex:'#2B6A8A',
            bg:'#DCEAF0',
            label:'Terkendali'
          };

  const lvlSelesai =
    s.rasioSelesai >= 75
      ? {
          hex:'#2E6B4F',
          bg:'#DEEBE2',
          label:'Baik'
        }
      : s.rasioSelesai >= 50
        ? {
            hex:'#95711B',
            bg:'#F2E7C9',
            label:'Perlu perhatian'
          }
        : {
            hex:'#A73E37',
            bg:'#F1DBD8',
            label:'Rendah'
          };

  const lvlRespons =
    s.avgRespons <= 2
      ? {
          hex:'#2E6B4F',
          bg:'#DEEBE2',
          label:'Cepat'
        }
      : s.avgRespons <= 4
        ? {
            hex:'#95711B',
            bg:'#F2E7C9',
            label:'Sedang'
          }
        : {
            hex:'#A73E37',
            bg:'#F1DBD8',
            label:'Lambat'
          };

  function indCard(
    judul,
    def,
    val,
    lvl
  ){

    return `
      <div
        class="card ind-card tilt-3d">

        <span class="def">
          ${judul}
        </span>

        <div class="val">
          ${val}
        </div>

        <span class="def">
          ${def}
        </span>

        <span
          class="badge"
          style="
            color:${lvl.hex};
            background:${lvl.bg};
            align-self:flex-start;
          ">

          <span class="dot"></span>
          ${lvl.label}

        </span>

      </div>
    `;
  }

  return `
    <div class="page-head">

      <div>

        <h1>
          Indikator lingkungan
        </h1>

        <p class="desc">
          Indikator ini diturunkan dari
          data laporan untuk menggambarkan
          kondisi lingkungan di lapangan,
          bukan sekadar jumlah tiket administratif.
        </p>

      </div>

    </div>

    <div
      class="grid grid-4"
      style="margin-bottom:26px;">

      ${indCard(
        'Titik aktif',
        'Kecamatan dengan minimal satu laporan belum tuntas',
        titikAktif + ' kecamatan',
        lvlTitik
      )}

      ${indCard(
        'Kerusakan berat aktif',
        'Laporan tingkat berat yang belum selesai ditangani',
        beratAktif + ' laporan',
        lvlBerat
      )}

      ${indCard(
        'Tingkat penyelesaian',
        'Persentase laporan valid yang telah selesai',
        s.rasioSelesai + '%',
        lvlSelesai
      )}

      ${indCard(
        'Kecepatan respons',
        'Rata-rata hari dari laporan masuk sampai diverifikasi',
        s.avgRespons.toFixed(1) + ' hari',
        lvlRespons
      )}

    </div>

    <div class="card pad-l">

      <h3
        style="margin-bottom:6px;">

        Indikasi aktivitas berulang

      </h3>

      <p
        class="desc"
        style="margin-bottom:14px;">

        Kecamatan dengan tiga atau lebih laporan
        menunjukkan kemungkinan aktivitas tambang
        ilegal yang berlangsung terus-menerus,
        bukan kejadian sesaat.

      </p>

      <div class="grid grid-4">

        ${
          s.perKec
            .map(
              k => `
                <div
                  class="card pad-m"
                  style="
                    border-left:3px solid
                    ${
                      k.total >= 3
                        ? '#B36A34'
                        : 'var(--line-strong)'
                    };
                  ">

                  <b
                    style="
                      display:block;
                      font-family:var(--font-head);
                      font-size:20px;
                    ">

                    ${k.total}

                  </b>

                  <span
                    style="
                      font-size:12px;
                      color:var(--ink-soft);
                    ">

                    ${k.nama}

                  </span>

                </div>
              `
            )
            .join('')
        }

      </div>

      <p
        style="
          font-size:12.5px;
          color:var(--ink-faint);
          margin-top:12px;
        ">

        ${berulang}
        dari 8 kecamatan menunjukkan pola
        laporan berulang pada rentang data ini.

      </p>

    </div>
  `;
}

/* ================= TENTANG SISTEM ================= */

function pageTentang(){

  return `
    <div class="page-head">

      <div>

        <h1>
          Tentang sistem
        </h1>

        <p class="desc">
          Dokumentasi rancangan SIPADU-TAMBANG:
          masalah yang diselesaikan, pengguna,
          data, proses bisnis, dan struktur
          basis data.
        </p>

      </div>

    </div>

    <div class="section-block">

      <h2>
        Identifikasi masalah
      </h2>

      <div class="card pad-l">

        <p>
          Penambangan pasir sungai dan galian C
          tanpa izin masih terjadi di beberapa titik
          Kota Palu. Aktivitas ini mempercepat erosi
          tepi sungai, mengubah aliran air, memicu
          longsor pada lereng bukit, dan meningkatkan
          risiko banjir di permukiman sekitarnya.
        </p>

        <p style="margin:0;">

          Selama ini laporan masyarakat sering
          disampaikan secara lisan atau berpencar
          di berbagai saluran, sehingga sulit
          dipantau, mudah hilang, dan tidak menghasilkan
          data yang bisa dianalisis untuk menentukan
          wilayah prioritas penanganan.

        </p>

      </div>

    </div>

    <div class="section-block">

      <h2>
        Tujuan sistem
      </h2>

      <div class="card pad-l">

        <ul>

          <li>
            Menyediakan satu saluran pelaporan
            yang mudah diakses warga.
          </li>

          <li>
            Memberi setiap laporan nomor tiket
            dan status yang dapat dipantau.
          </li>

          <li>
            Mengumpulkan data lokasi, kategori,
            tingkat kerusakan, prioritas dan
            bukti foto.
          </li>

          <li>
            Menyediakan dashboard dan analisis
            untuk mengevaluasi kecepatan dan
            efektivitas penanganan.
          </li>

        </ul>

      </div>

    </div>

    <div class="section-block">

      <h2>
        Pengguna & hak akses
      </h2>

      <div class="grid grid-2">

        <div
          class="card rolecard"
          style="
            border-top:3px solid var(--brand);
          ">

          <h4>
            Masyarakat
          </h4>

          <ul>

            <li>
              Membuat laporan,
              termasuk secara anonim
            </li>

            <li>
              Melihat status dan riwayat
              laporan miliknya sendiri
            </li>

            <li>
              Mengirim lokasi GPS dan
              bukti foto
            </li>

            <li>
              Menerima notifikasi perubahan status
            </li>

            <li>
              Melihat peta sebaran laporan
            </li>

          </ul>

        </div>

        <div
          class="card rolecard"
          style="
            border-top:3px solid var(--water);
          ">

          <h4>
            Petugas / Admin lingkungan hidup
          </h4>

          <ul>

            <li>
              Memverifikasi laporan
            </li>

            <li>
              Menolak laporan tidak valid
            </li>

            <li>
              Mengubah status penanganan
            </li>

            <li>
              Mencatat tindak lanjut
            </li>

            <li>
              Melihat dashboard,
              analisis dan indikator lingkungan
            </li>

            <li>
              Export laporan
            </li>

          </ul>

        </div>

      </div>

    </div>

    <div class="section-block">

      <h2>
        Data yang dikelola
      </h2>

      <div class="card pad-l">

        <div class="grid grid-2">

          <ul>

            <li>
              Data laporan:
              judul, kategori, deskripsi,
              tanggal dan status
            </li>

            <li>
              Data lokasi:
              kecamatan, detail lokasi,
              latitude dan longitude
            </li>

            <li>
              Tingkat kerusakan:
              ringan, sedang, berat
            </li>

            <li>
              Prioritas:
              rendah, sedang, tinggi, darurat
            </li>

          </ul>

          <ul>

            <li>
              Riwayat status dan catatan
              tindak lanjut
            </li>

            <li>
              Data pelapor:
              nama dan kontak
            </li>

            <li>
              Data bukti pendukung
              berupa beberapa foto
            </li>

            <li>
              Data notifikasi pembaruan
              status laporan
            </li>

          </ul>

        </div>

      </div>

    </div>

    <div class="section-block">

      <h2>
        Proses bisnis
      </h2>

      <div class="flow-steps">

        <div class="flow-step">

          <b>1. Warga</b>

          <span>
            Mengisi laporan, memilih titik
            lokasi dan melampirkan foto.
          </span>

        </div>

        <div class="flow-step">

          <b>2. Sistem</b>

          <span>
            Memberi nomor tiket dan
            menghitung prioritas awal.
          </span>

        </div>

        <div class="flow-step">

          <b>3. Petugas</b>

          <span>
            Memeriksa kelengkapan lalu
            memverifikasi laporan.
          </span>

        </div>

        <div class="flow-step">

          <b>4. Petugas</b>

          <span>
            Turun ke lokasi dan mencatat
            tindak lanjut.
          </span>

        </div>

        <div class="flow-step">

          <b>5. Sistem</b>

          <span>
            Memperbarui status hingga
            "Selesai" dan menyimpan
            data untuk analisis.
          </span>

        </div>

      </div>

    </div>

    <div class="section-block">

      <h2>
        Struktur data (ERD sederhana)
      </h2>

      <div class="card pad-l erd-wrap">

        ${erdSvg()}

      </div>

    </div>

    <div class="section-block">

      <h2>
        Rancangan sistem menjawab
        pertanyaan utama
      </h2>

      <div class="narrative">

        <h4>
          Cepat diketahui
        </h4>

        <p>
          Formulir pelaporan yang singkat,
          lokasi GPS, dan foto bukti membantu
          mempercepat penyampaian informasi
          dari warga kepada petugas.
        </p>

      </div>

      <div
        class="narrative"
        style="
          border-color:#95711B;
          background:#F2E7C9;
        ">

        <h4
          style="
            color:#7A5B15;
          ">

          Berbasis data

        </h4>

        <p>
          Struktur data yang seragam
          memungkinkan dashboard menghitung
          indikator dan titik rawan secara
          konsisten.
        </p>

      </div>

      <div
        class="narrative"
        style="
          border-color:#2E6B4F;
          background:#DEEBE2;
        ">

        <h4
          style="
            color:#204C39;
          ">

          Tepat ditindaklanjuti

        </h4>

        <p>
          Alur status yang bertahap
          memastikan setiap laporan memiliki
          jejak tindak lanjut yang dapat
          dievaluasi.
        </p>

      </div>

    </div>

    ${disclaimerBlock()}
  `;
}

/* ================= ERD ================= */

function erdSvg(){

  const boxes = [

    {
      x:20,
      y:20,
      w:150,
      h:74,
      title:'PENGGUNA',
      fields:'id, nama, peran, kontak'
    },

    {
      x:250,
      y:110,
      w:190,
      h:96,
      title:'LAPORAN',
      fields:
        'id, judul, tingkat, deskripsi, tanggal, status'
    },

    {
      x:250,
      y:20,
      w:190,
      h:60,
      title:'KATEGORI',
      fields:'id, nama_kategori'
    },

    {
      x:530,
      y:20,
      w:170,
      h:60,
      title:'KECAMATAN',
      fields:'id, nama_kecamatan'
    },

    {
      x:530,
      y:130,
      w:200,
      h:76,
      title:'RIWAYAT_STATUS',
      fields:
        'id, laporan_id, tanggal, status, catatan'
    },

    {
      x:20,
      y:130,
      w:150,
      h:76,
      title:'BUKTI_FOTO',
      fields:
        'id, laporan_id, file_foto, keterangan'
    },

    {
      x:250,
      y:220,
      w:190,
      h:60,
      title:'LOKASI_LAPORAN',
      fields:
        'id, laporan_id, latitude, longitude'
    }

  ];

  function box(b){

    return `
      <rect
        x="${b.x}"
        y="${b.y}"
        width="${b.w}"
        height="${b.h}"
        rx="4"
        fill="#fff"
        stroke="#C3CCB9">
      </rect>

      <rect
        x="${b.x}"
        y="${b.y}"
        width="${b.w}"
        height="24"
        rx="4"
        fill="#DEEBE2">
      </rect>

      <text
        x="${b.x+10}"
        y="${b.y+16}"
        font-size="12"
        font-weight="700"
        font-family="IBM Plex Sans"
        fill="#204C39">

        ${b.title}

      </text>

      ${
        wrapText(
          b.fields,
          26
        )
        .map(
          (line,i) =>
            `
            <text
              x="${b.x+10}"
              y="${b.y+40+(i*14)}"
              font-size="10.5"
              font-family="IBM Plex Sans"
              fill="#525C4E">

              ${line}

            </text>
            `
        )
        .join('')
      }
    `;
  }

  function wrapText(str,n){

    const words =
      str.split(', ');

    const lines = [];
    let cur = '';

    words.forEach(w => {

      const candidate =
        cur
          ? cur + ', ' + w
          : w;

      if(
        candidate.length > n &&
        cur
      ){

        lines.push(cur);
        cur = w;

      }else{

        cur = candidate;
      }
    });

    if(cur){
      lines.push(cur);
    }

    return lines;
  }

  const lines = `

    <line
      x1="170"
      y1="57"
      x2="250"
      y2="150"
      stroke="#8A9285"
      stroke-width="1.2">
    </line>

    <text
      x="180"
      y="95"
      font-size="9.5"
      fill="#8A9285"
      font-family="IBM Plex Sans">

      1..N

    </text>

    <line
      x1="345"
      y1="80"
      x2="345"
      y2="110"
      stroke="#8A9285"
      stroke-width="1.2">
    </line>

    <text
      x="350"
      y="98"
      font-size="9.5"
      fill="#8A9285"
      font-family="IBM Plex Sans">

      1..N

    </text>

    <line
      x1="440"
      y1="150"
      x2="530"
      y2="60"
      stroke="#8A9285"
      stroke-width="1.2">
    </line>

    <text
      x="450"
      y="100"
      font-size="9.5"
      fill="#8A9285"
      font-family="IBM Plex Sans">

      N..1

    </text>

    <line
      x1="440"
      y1="165"
      x2="530"
      y2="168"
      stroke="#8A9285"
      stroke-width="1.2">
    </line>

    <text
      x="460"
      y="160"
      font-size="9.5"
      fill="#8A9285"
      font-family="IBM Plex Sans">

      1..N

    </text>

    <line
      x1="170"
      y1="168"
      x2="250"
      y2="165"
      stroke="#8A9285"
      stroke-width="1.2">
    </line>

    <text
      x="185"
      y="158"
      font-size="9.5"
      fill="#8A9285"
      font-family="IBM Plex Sans">

      1..N

    </text>

    <line
      x1="345"
      y1="206"
      x2="345"
      y2="220"
      stroke="#8A9285"
      stroke-width="1.2">
    </line>

    <text
      x="350"
      y="218"
      font-size="9.5"
      fill="#8A9285"
      font-family="IBM Plex Sans">

      1..1

    </text>

  `;

  return `
    <svg
      viewBox="0 0 760 310"
      style="
        width:100%;
        min-width:640px;
        height:auto;
      ">

      ${lines}

      ${boxes
        .map(box)
        .join('')}

    </svg>
  `;
}

/* ================= EXPORT CSV ================= */

function exportReportsCSV(){

  if(!reports.length){

    showToast(
      'Tidak ada laporan yang dapat diekspor.'
    );

    return;
  }

  const headers = [
    'Ticket',
    'Judul',
    'Kategori',
    'Kecamatan',
    'Detail Lokasi',
    'Latitude',
    'Longitude',
    'Tingkat',
    'Prioritas',
    'Aktivitas Berlangsung',
    'Pelapor',
    'Status',
    'Tanggal Laporan'
  ];

  const rows =
    reports.map(
      r => [

        r.ticket,

        r.judul,

        r.kategori,

        kecNama(r.kecamatan),

        r.lokasiDetail || '',

        r.koordinat
          ? r.koordinat.lat
          : '',

        r.koordinat
          ? r.koordinat.lng
          : '',

        r.tingkat,

        getPriority(r),

        r.masihBerlangsung
          ? 'Ya'
          : 'Tidak',

        r.pelapor,

        r.status,

        r.tanggalLapor

      ]
    );

  const csvData = [
    headers,
    ...rows
  ]
    .map(
      row =>
        row
          .map(
            value =>
              `"${String(value)
                .replace(/"/g,'""')}"`
          )
          .join(',')
    )
    .join('\n');

  const blob =
    new Blob(
      [csvData],
      {
        type:'text/csv;charset=utf-8;'
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;

  a.download =
    `sipadu-tambang-${TODAY}.csv`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);

  showToast(
    'Data laporan berhasil diekspor ke CSV.'
  );
}

/* ================= TOAST ================= */

/* ================= FITUR KAMERA (camera.js digabung) =================
   Modal kamera markup ada langsung di sipadu_tambang.html (#cameraVeil).
   Bergantung pada: state.formPhotos, renderPhotoPreviews(), showToast().
   ======================================================================= */

const MAX_PHOTOS = 5;

let cameraStream = null;
let cameraFacingMode = 'environment'; // kamera belakang secara default
let lastShotDataUrl = null;

function cameraSupported(){
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function openCamera(){

  if(!cameraSupported()){
    showToast('Perangkat/browser ini tidak mendukung akses kamera. Gunakan tombol "Pilih file" sebagai gantinya.');
    return;
  }

  if(state.formPhotos.length >= MAX_PHOTOS){
    showToast('Sudah mencapai batas maksimal ' + MAX_PHOTOS + ' foto.');
    return;
  }

  document.getElementById('cameraVeil').classList.add('open');
  updateCameraCount();
  startCameraStream();
}

function startCameraStream(){

  const video = document.getElementById('cameraVideo');
  const shotImg = document.getElementById('cameraShotImg');

  setCameraStatus(true, 'Membuka kamera…');
  document.getElementById('cameraFootLive').style.display = 'flex';
  document.getElementById('cameraFootReview').style.display = 'none';
  video.style.display = 'block';
  shotImg.style.display = 'none';

  stopCameraStream();

  const constraints = {
    audio:false,
    video:{
      facingMode:{ ideal: cameraFacingMode },
      width:{ ideal: 1280 },
      height:{ ideal: 960 }
    }
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(s => {
      cameraStream = s;
      video.srcObject = s;
      setCameraStatus(false);
    })
    .catch(err => {

      // Jika kamera "environment" tidak tersedia (mis. di laptop), coba kamera default
      if(cameraFacingMode === 'environment'){
        navigator.mediaDevices.getUserMedia({ audio:false, video:true })
          .then(s => {
            cameraStream = s;
            video.srcObject = s;
            setCameraStatus(false);
          })
          .catch(() => handleCameraError(err));
        return;
      }

      handleCameraError(err);
    });
}

function handleCameraError(err){

  let msg = 'Tidak bisa mengakses kamera. Periksa izin kamera pada browser Anda.';

  if(err && err.name === 'NotAllowedError'){
    msg = 'Izin kamera ditolak. Aktifkan izin kamera untuk situs ini lalu coba lagi.';
  } else if(err && err.name === 'NotFoundError'){
    msg = 'Tidak ditemukan kamera pada perangkat ini.';
  }

  setCameraStatus(true, msg);
  showToast(msg);
}

function setCameraStatus(visible, text){

  const status = document.getElementById('cameraStatus');
  const statusText = document.getElementById('cameraStatusText');

  if(!status) return;

  if(visible){
    status.classList.remove('hidden');
    statusText.textContent = text || '';
  } else {
    status.classList.add('hidden');
  }
}

function switchCamera(){
  cameraFacingMode = (cameraFacingMode === 'environment') ? 'user' : 'environment';
  startCameraStream();
}

function capturePhoto(){

  if(!cameraStream) return;

  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const shotImg = document.getElementById('cameraShotImg');

  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 960;

  canvas.width = w;
  canvas.height = h;

  canvas.getContext('2d').drawImage(video, 0, 0, w, h);

  lastShotDataUrl = canvas.toDataURL('image/jpeg', 0.88);

  shotImg.src = lastShotDataUrl;
  shotImg.style.display = 'block';
  video.style.display = 'none';

  document.getElementById('cameraFootLive').style.display = 'none';
  document.getElementById('cameraFootReview').style.display = 'flex';
}

function retakePhoto(){

  lastShotDataUrl = null;

  document.getElementById('cameraShotImg').style.display = 'none';
  document.getElementById('cameraVideo').style.display = 'block';
  document.getElementById('cameraFootLive').style.display = 'flex';
  document.getElementById('cameraFootReview').style.display = 'none';
}

function useCapturedPhoto(){

  if(!lastShotDataUrl) return;

  if(state.formPhotos.length >= MAX_PHOTOS){
    showToast('Maksimal ' + MAX_PHOTOS + ' foto tercapai. Hapus salah satu foto sebelumnya untuk menambah lagi.');
    closeCameraModal();
    return;
  }

  state.formPhotos.push(lastShotDataUrl);
  renderPhotoPreviews();
  showToast('Foto dari kamera berhasil ditambahkan.');

  lastShotDataUrl = null;

  if(state.formPhotos.length >= MAX_PHOTOS){
    closeCameraModal();
  } else {
    updateCameraCount();
    document.getElementById('cameraShotImg').style.display = 'none';
    document.getElementById('cameraVideo').style.display = 'block';
    document.getElementById('cameraFootLive').style.display = 'flex';
    document.getElementById('cameraFootReview').style.display = 'none';
  }
}

function updateCameraCount(){

  const count = document.getElementById('cameraCount');
  if(!count) return;

  count.textContent = state.formPhotos.length + '/' + MAX_PHOTOS + ' foto';
}

function stopCameraStream(){
  if(cameraStream){
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
}

function closeCameraModal(){
  stopCameraStream();
  lastShotDataUrl = null;

  const veil = document.getElementById('cameraVeil');
  if(veil) veil.classList.remove('open');
}

function showToast(msg){

  const host =
    document.getElementById(
      'toastHost'
    );

  if(!host){
    return;
  }

  const el =
    document.createElement('div');

  el.className =
    'toast';

  el.textContent =
    msg;

  host.innerHTML = '';

  host.appendChild(el);

  setTimeout(
    () => {
      if(el.parentNode){
        el.remove();
      }
    },
    3200
  );
}

/* ================= INIT ================= */

refreshGateStats();

const modalVeil =
  document.getElementById(
    'modalVeil'
  );

if(modalVeil){

  modalVeil.addEventListener(
    'click',
    function(e){

      if(e.target === this){
        closeModal();
      }

    }
  );
}

const cameraVeil =
  document.getElementById(
    'cameraVeil'
  );

if(cameraVeil){

  cameraVeil.addEventListener(
    'click',
    function(e){

      if(e.target === this){
        closeCameraModal();
      }

    }
  );
}

document.addEventListener(
  'click',
  function(e){

    const wrap =
      document.querySelector(
        '.notification-wrap'
      );

    if(
      wrap &&
      !wrap.contains(e.target) &&
      state.notificationOpen
    ){

      state.notificationOpen =
        false;

      updateNotificationUI();
    }

  }
);