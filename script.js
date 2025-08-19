// ===== Particles background =====
tsParticles.load({
  id: 'tsparticles',
  options: {
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      number: { value: (innerWidth < 480 ? 18 : (innerWidth < 768 ? 24 : 30)), density: { enable: true, area: 800 }},
      color: { value: ['#ff9bc6','#f472b6','#a78bfa','#fbbf24','#2dd4bf'] },
      shape: { type: 'circle' },
      opacity: { value: 0.35 },
      size: { value: { min: 2, max: (innerWidth < 520 ? 4 : 6) } },
      move: { enable: true, speed: 1.1, direction: 'none', random: true, outModes: 'out' },
      links: { enable: true, distance: 110, color: '#ffbcd6', opacity: 0.4, width: 1 }
    },
    detectRetina: true
  }
});

// ===== Hover shine on card =====
const shine = document.getElementById('shine');
document.getElementById('card').addEventListener('pointermove', (e)=>{
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left)/r.width*100;
  shine.style.setProperty('--mx', `${x}%`);
});

// ===== Elements =====
const tombolCek = document.getElementById('cek');
const inputCo   = document.getElementById('inputCo');
const inputCe   = document.getElementById('inputCe');
const box    = document.getElementById('result');
const nameLine = document.getElementById('nameLine');
const meter  = document.getElementById('meter');
const legend = document.getElementById('legend');
const msg    = document.getElementById('msg');
const hint   = document.getElementById('hint');

// Loader overlay (spinner + text center sejajar)
const loader = document.createElement('div');
loader.className = 'loader';
loader.innerHTML = `<div class="box"><div class="spinner"></div><div class="loading-text">Nyocokin vibes kalian dulu.. ✨</div></div>`;
document.body.appendChild(loader);

// Legend chips 1..10
for (let i=1;i<=10;i++){
  const el = document.createElement('div');
  el.className = 'chip';
  el.textContent = i;
  legend.appendChild(el);
}

// Entry animations
gsap.from('h1', {y:10, opacity:0, duration:.6, ease:'power2.out'});
gsap.from('.sub', {y:8, opacity:0, duration:.6, delay:.05});
gsap.from('.row > *', {y:12, opacity:0, stagger:.07, duration:.5, ease:'power2.out', delay:.1});

// Click handler
tombolCek.addEventListener('click', ()=>{
  const namaCo = inputCo.value.trim();
  const namaCe = inputCe.value.trim();

  if(!namaCo || !namaCe){
    gsap.fromTo([inputCo, inputCe], {x:-6}, {x:0, duration:.35, ease:'elastic.out(1,.4)'});
    alert('Isi kedua nama dulu ya!');
    return;
  }

  // Show loader + subtle button pulse
  tombolCek.disabled = true;
  loader.classList.add('show');
  gsap.timeline({repeat:1, yoyo:true})
    .to(tombolCek, {duration:.35, scale:1.03, ease:'power2.out'})
    .to(tombolCek, {duration:.35, scale:1, ease:'power2.out'});

  setTimeout(()=>{
    const score = compatibilityScore(namaCe, namaCo); // 0..100
    const s10   = toScale10(score);
    const info  = labelFor(s10);

    box.hidden = false;
    nameLine.innerHTML = `${escapeHTML(namaCe)} ❤️ ${escapeHTML(namaCo)} <span class="badge">${s10}/10</span>`;

    // Progress meter
    meter.style.width = '0%';
    meter.style.background = `linear-gradient(90deg, ${info.color}, ${info.color})`;
    gsap.to(meter, {width: (s10*10)+'%', duration:.8, ease:'power2.out'});

    // Activate chips
    const chips = legend.children;
    for (let i=0;i<chips.length;i++){
      const active = i < s10;
      chips[i].style.background = active ? '#ffe9f6' : '#fff';
      chips[i].style.color      = active ? '#a81c72' : '#64748b';
      if(active) gsap.fromTo(chips[i], {scale:.9}, {scale:1, duration:.25, ease:'back.out(2)'});
    }

    msg.textContent  = `${info.emoji} ${info.text}`;
    hint.textContent = `Skor detail: ${score}/100 (di-mapping ke ${s10}/10). Ini hiburan ya—yang penting saling sayang & komunikasi. 💬`;

    gsap.fromTo('#card', {y:0}, {y:-4, duration:.25, yoyo:true, repeat:1, ease:'power1.out'});

    if (s10 === 10){
      confetti({particleCount:120, spread:70, origin:{y:0.6}, colors:['#ff77b7','#a78bfa','#fbbf24','#2dd4bf','#38bdf8']});
      confetti({particleCount:80, angle:60, spread:55, origin:{x:0}});
      confetti({particleCount:80, angle:120, spread:55, origin:{x:1}});
    }

    loader.classList.remove('show');
    tombolCek.disabled = false;
  }, 1100);
});

/* ===== Algoritma (for-fun) ===== */
const VOWELS = new Set(['a','i','u','e','o']);
const weights = { jw: 0.40, jac: 0.25, num: 0.20, vowel: 0.10, init: 0.05 };

function normalizeName(s){ return String(s).toLowerCase().replace(/[^a-z]/g,''); }
function bigrams(s){ const a=[]; for(let i=0;i<s.length-1;i++) a.push(s.slice(i,i+2)); return a; }
function jaccard(a,b){ const A=new Set(a),B=new Set(b); let inter=0; for(const x of A) if(B.has(x)) inter++; const uni=A.size+B.size-inter; return uni===0?1:inter/uni; }
function vowelRatio(s){ if(!s.length) return 0; let v=0; for(const ch of s) if(VOWELS.has(ch)) v++; return v/s.length; }
function letterValueSum(s){ let sum=0; for(const ch of s){ const c=ch.charCodeAt(0); if(c>=97&&c<=122) sum+=(c-96); } return sum; }
function reduce1to9(n){ return n===0?0:((n-1)%9)+1; }
function commonPrefixLen(a,b,m){ let n=0; while(n<Math.min(m,a.length,b.length)&&a[n]===b[n]) n++; return n; }
function matchingChars(s1,s2){
  const maxDist=Math.floor(Math.max(s1.length,s2.length)/2)-1;
  const s1M=new Array(s1.length).fill(false);
  const s2M=new Array(s2.length).fill(false);
  let matches=0;
  for(let i=0;i<s1.length;i++){
    const st=Math.max(0,i-maxDist), ed=Math.min(i+maxDist+1,s2.length);
    for(let j=st;j<ed;j++){
      if(s2M[j]) continue;
      if(s1[i]!==s2[j]) continue;
      s1M[i]=true; s2M[j]=true; matches++; break;
    }
  }
  let trans=0,k=0;
  for(let i=0;i<s1.length;i++){
    if(!s1M[i]) continue;
    while(!s2M[k]) k++;
    if(s1[i]!==s2[k]) trans++;
    k++;
  }
  return {matches, transpositions:trans};
}
function jaroWinkler(a,b){
  if(!a.length||!b.length) return 0;
  const m=matchingChars(a,b);
  if(m.matches===0) return 0;
  const jaro=(m.matches/a.length + m.matches/b.length + (m.matches - m.transpositions/2)/m.matches)/3;
  const prefix=commonPrefixLen(a,b,4);
  return jaro + 0.1*prefix*(1-jaro);
}

function compatibilityScore(nameA,nameB){
  const A=normalizeName(nameA), B=normalizeName(nameB);
  if(!A||!B) return 0;
  const jw=jaroWinkler(A,B);
  const jac=jaccard(bigrams(A), bigrams(B));
  const numA=reduce1to9(letterValueSum(A));
  const numB=reduce1to9(letterValueSum(B));
  const numSim=1 - Math.abs(numA-numB)/8;
  const vrA=vowelRatio(A), vrB=vowelRatio(B);
  const vowelSim=1 - Math.abs(vrA-vrB);
  const initialBonus=A[0]===B[0]?1:0;

  let score= jw*weights.jw + jac*weights.jac + numSim*weights.num + vowelSim*weights.vowel + initialBonus*weights.init;
  return Math.round(score*100);
}

function toScale10(score100){ return Math.max(1, Math.min(10, Math.round(score100/10))); }
function labelFor(s10){
  if (s10 <= 3)  return {emoji:'💔', text:'Aduh… energi kalian kayak sinyal 1 bar. Pelan-pelan ya, jangan maksa. 😅', color:'#ef4444'};
  if (s10 <= 5)  return {emoji:'🧩', text:'Masih butuh puzzle piece yang pas. Kenalan lebih dalam dulu kuy! 😉', color:'#f59e0b'};
  if (s10 <= 7)  return {emoji:'💫', text:'Udah mulai nyambung nih. Tinggal sering quality time biar makin klop. ✨', color:'#84cc16'};
  if (s10 <= 9)  return {emoji:'💖', text:'Wuih cocok pol! Tinggal jaga vibes & komunikasi. Gaskeun! 🔥', color:'#22c55e'};
  return            {emoji:'💍', text:'10/10 PERFECT! Buruan, siap-siap lamaran—jangan kebanyakan mikir! 😎', color:'linear-gradient(90deg,#fbbf24,#f472b6,#a78bfa)'};
}

// Utils
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
