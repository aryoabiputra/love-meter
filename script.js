// ===== Latar Belakang Partikel =====
tsParticles.load({
  id: 'tsparticles',
  options: {
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      number: { value: (innerWidth < 480 ? 18 : (innerWidth < 768 ? 24 : 30)), density: { enable: true, area: 800 } },
      color: { value: ['#ff9bc6', '#f472b6', '#a78bfa', '#fbbf24', '#2dd4bf'] },
      shape: { type: 'circle' },
      opacity: { value: 0.35 },
      size: { value: { min: 2, max: (innerWidth < 520 ? 4 : 6) } },
      move: { enable: true, speed: 1.1, direction: 'none', random: true, outModes: 'out' },
      links: { enable: true, distance: 110, color: '#ffbcd6', opacity: 0.4, width: 1 }
    },
    detectRetina: true
  }
});

// ===== Efek Kilau Saat Hover pada Kartu =====
const kilau = document.getElementById('shine');
document.getElementById('card').addEventListener('pointermove', (e) => {
  const batas = e.currentTarget.getBoundingClientRect();
  const posisiX = (e.clientX - batas.left) / batas.width * 100;
  kilau.style.setProperty('--mx', `${posisiX}%`);
});

// ===== Elemen DOM =====
const tombolPeriksa = document.getElementById('cek');
const inputNamaPria = document.getElementById('inputCo');
const inputNamaWanita = document.getElementById('inputCe');
const kotakHasil = document.getElementById('result');
const barisNama = document.getElementById('nameLine');
const pengukur = document.getElementById('meter');
const legenda = document.getElementById('legend');
const pesan = document.getElementById('msg');
const petunjuk = document.getElementById('hint');

// Overlay pemuat (spinner + teks tengah sejajar)
const pemuat = document.createElement('div');
pemuat.className = 'loader';
pemuat.innerHTML = `<div class="box"><div class="spinner"></div><div class="loading-text">Nyocokin vibes kalian dulu.. ✨</div></div>`;
document.body.appendChild(pemuat);

// Membuat chip legenda 1..10
for (let i = 1; i <= 10; i++) {
  const elemenChip = document.createElement('div');
  elemenChip.className = 'chip';
  elemenChip.textContent = i;
  legenda.appendChild(elemenChip);
}

// Animasi masuk
gsap.from('h1', { y: 10, opacity: 0, duration: .6, ease: 'power2.out' });
gsap.from('.sub', { y: 8, opacity: 0, duration: .6, delay: .05 });
gsap.from('.row > *', { y: 12, opacity: 0, stagger: .07, duration: .5, ease: 'power2.out', delay: .1 });

// Penanganan klik tombol periksa
tombolPeriksa.addEventListener('click', () => {
  const namaPria = inputNamaPria.value.trim();
  const namaWanita = inputNamaWanita.value.trim();

  if (!namaPria || !namaWanita) {
    gsap.fromTo([inputNamaPria, inputNamaWanita], { x: -6 }, { x: 0, duration: .35, ease: 'elastic.out(1,.4)' });
    alert('Isi kedua nama dulu ya!');
    return;
  }

  // Tampilkan pemuat + efek tombol berdenyut halus
  tombolPeriksa.disabled = true;
  pemuat.classList.add('show');
  gsap.timeline({ repeat: 1, yoyo: true })
    .to(tombolPeriksa, { duration: .35, scale: 1.03, ease: 'power2.out' })
    .to(tombolPeriksa, { duration: .35, scale: 1, ease: 'power2.out' });

  setTimeout(() => {
    const skor = hitungKecocokan(namaWanita, namaPria); // 0..100
    const skala10 = keSkala10(skor);
    const info = labelUntuk(skala10);

    kotakHasil.hidden = false;
    barisNama.innerHTML = `${escapeHTML(namaWanita)} ❤️ ${escapeHTML(namaPria)} <span class="badge">${skala10}/10</span>`;

    // Meter progres
    pengukur.style.width = '0%';
    pengukur.style.background = `linear-gradient(90deg, ${info.color}, ${info.color})`;
    gsap.to(pengukur, { width: (skala10 * 10) + '%', duration: .8, ease: 'power2.out' });

    // Aktifkan chip legenda
    const chips = legenda.children;
    for (let i = 0; i < chips.length; i++) {
      const aktif = i < skala10;
      chips[i].style.background = aktif ? '#ffe9f6' : '#fff';
      chips[i].style.color = aktif ? '#a81c72' : '#64748b';
      if (aktif) gsap.fromTo(chips[i], { scale: .9 }, { scale: 1, duration: .25, ease: 'back.out(2)' });
    }

    pesan.textContent = `${info.emoji} ${info.text}`;
    petunjuk.textContent = `Skor detail: ${skor}/100 (di-mapping ke ${skala10}/10). Ini hiburan ya—yang penting saling sayang & komunikasi. 💬`;

    gsap.fromTo('#card', { y: 0 }, { y: -4, duration: .25, yoyo: true, repeat: 1, ease: 'power1.out' });

    if (skala10 === 10) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#ff77b7', '#a78bfa', '#fbbf24', '#2dd4bf', '#38bdf8'] });
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } });
    }

    pemuat.classList.remove('show');
    tombolPeriksa.disabled = false;
  }, 1100);
});

/* ===== Algoritma (for-fun) ===== */
// Huruf vokal yang digunakan dalam perhitungan
const HURUF_VOKAL = new Set(['a', 'i', 'u', 'e', 'o']);
// Bobot untuk berbagai metode perhitungan kecocokan
const bobot = { jw: 0.40, jac: 0.25, num: 0.20, vokal: 0.10, awal: 0.05 };

// Normalisasi nama: ubah ke huruf kecil dan hapus karakter non-alfabet
function normalisasiNama(s) { return String(s).toLowerCase().replace(/[^a-z]/g, ''); }
// Membuat bigram (pasangan dua huruf berurutan)
function bigram(s) { const arr = []; for (let i = 0; i < s.length - 1; i++) arr.push(s.slice(i, i + 2)); return arr; }
// Menghitung indeks Jaccard antara dua array
function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  let irisan = 0;
  for (const x of A) if (B.has(x)) irisan++;
  const gabungan = A.size + B.size - irisan;
  return gabungan === 0 ? 1 : irisan / gabungan;
}
// Rasio huruf vokal dalam string
function rasioVokal(s) {
  if (!s.length) return 0;
  let v = 0;
  for (const ch of s) if (HURUF_VOKAL.has(ch)) v++;
  return v / s.length;
}
// Jumlah nilai huruf (a=1, b=2, ..., z=26)
function jumlahNilaiHuruf(s) {
  let jumlah = 0;
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 97 && c <= 122) jumlah += (c - 96);
  }
  return jumlah;
}
// Mengurangi angka menjadi 1 sampai 9 (numerologi)
function kurangi1sampai9(n) {
  return n === 0 ? 0 : ((n - 1) % 9) + 1;
}
// Menghitung panjang awalan yang sama antara dua string
function panjangAwalanSama(a, b, m) {
  let n = 0;
  while (n < Math.min(m, a.length, b.length) && a[n] === b[n]) n++;
  return n;
}
// Menghitung karakter yang cocok dan transposisi untuk algoritma Jaro-Winkler
function karakterCocok(s1, s2) {
  const jarakMaks = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Terpilih = new Array(s1.length).fill(false);
  const s2Terpilih = new Array(s2.length).fill(false);
  let cocok = 0;
  for (let i = 0; i < s1.length; i++) {
    const mulai = Math.max(0, i - jarakMaks);
    const akhir = Math.min(i + jarakMaks + 1, s2.length);
    for (let j = mulai; j < akhir; j++) {
      if (s2Terpilih[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Terpilih[i] = true; s2Terpilih[j] = true; cocok++; break;
    }
  }
  let transposisi = 0, k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Terpilih[i]) continue;
    while (!s2Terpilih[k]) k++;
    if (s1[i] !== s2[k]) transposisi++;
    k++;
  }
  return { cocok, transposisi };
}
// Algoritma Jaro-Winkler untuk menghitung kemiripan string
function jaroWinkler(a, b) {
  if (!a.length || !b.length) return 0;
  const m = karakterCocok(a, b);
  if (m.cocok === 0) return 0;
  const jaro = (m.cocok / a.length + m.cocok / b.length + (m.cocok - m.transposisi / 2) / m.cocok) / 3;
  const awalan = panjangAwalanSama(a, b, 4);
  return jaro + 0.1 * awalan * (1 - jaro);
}

// Menghitung skor kecocokan antara dua nama (0..100)
function hitungKecocokan(namaA, namaB) {
  const A = normalisasiNama(namaA), B = normalisasiNama(namaB);
  if (!A || !B) return 0;
  const jw = jaroWinkler(A, B);
  const jac = jaccard(bigram(A), bigram(B));
  const numA = kurangi1sampai9(jumlahNilaiHuruf(A));
  const numB = kurangi1sampai9(jumlahNilaiHuruf(B));
  const numSim = 1 - Math.abs(numA - numB) / 8;
  const vrA = rasioVokal(A), vrB = rasioVokal(B);
  const vokalSim = 1 - Math.abs(vrA - vrB);
  const bonusAwal = A[0] === B[0] ? 1 : 0;

  let skor = jw * bobot.jw + jac * bobot.jac + numSim * bobot.num + vokalSim * bobot.vokal + bonusAwal * bobot.awal;
  return Math.round(skor * 100);
}

// Mengubah skor 0..100 menjadi skala 1..10
function keSkala10(skor100) {
  return Math.max(1, Math.min(10, Math.round(skor100 / 10)));
}
// Memberikan label, emoji, dan warna berdasarkan skala 1..10
function labelUntuk(skala10) {
  if (skala10 <= 3) return { emoji: '💔', text: 'Aduh… energi kalian kayak sinyal 1 bar. Pelan-pelan ya, jangan maksa. 😅', color: '#ef4444' };
  if (skala10 <= 5) return { emoji: '🧩', text: 'Masih butuh puzzle piece yang pas. Kenalan lebih dalam dulu kuy! 😉', color: '#f59e0b' };
  if (skala10 <= 7) return { emoji: '💫', text: 'Udah mulai nyambung nih. Tinggal sering quality time biar makin klop. ✨', color: '#84cc16' };
  if (skala10 <= 9) return { emoji: '💖', text: 'Wuih cocok pol! Tinggal jaga vibes & komunikasi. Gaskeun! 🔥', color: '#22c55e' };
  return { emoji: '💍', text: '10/10 PERFECT! Buruan, siap-siap lamaran—jangan kebanyakan mikir! 😎', color: 'linear-gradient(90deg,#fbbf24,#f472b6,#a78bfa)' };
}

// Utilitas untuk menghindari XSS dengan escape karakter HTML
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[m]));
}
