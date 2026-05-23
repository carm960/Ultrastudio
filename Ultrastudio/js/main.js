/* ---------------------------------------------------
   HEADER SCROLL
--------------------------------------------------- */
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (window.scrollY > 50) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
});

/* ---------------------------------------------------
   PARALLAX HERO
--------------------------------------------------- */
window.addEventListener("scroll", () => {
  const bg = document.querySelector(".hero-bg");
  if (!bg) return;
  const offset = window.scrollY * 0.15;
  bg.style.transform = `translateY(${offset}px)`;
});

/* ---------------------------------------------------
   REVEAL ON SCROLL
--------------------------------------------------- */
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  const trigger = window.innerHeight * 0.85;
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < trigger) el.classList.add("visible");
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

// Simplex Noise 2D – versione completa e stabile
const grad3 = [
  [1,1], [-1,1], [1,-1], [-1,-1],
  [1,0], [-1,0], [1,0], [-1,0],
  [0,1], [0,-1], [0,1], [0,-1]
];

const p = [];
for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
const perm = [];
for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

function simplex2D(xin, yin) {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  let n0, n1, n2;

  const s = (xin + yin) * F2;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);

  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = xin - X0;
  const y0 = yin - Y0;

  let i1, j1;
  if (x0 > y0) { i1 = 1; j1 = 0; }
  else { i1 = 0; j1 = 1; }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;

  const gi0 = perm[ii + perm[jj]] % 12;
  const gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
  const gi2 = perm[ii + 1 + perm[jj + 1]] % 12;

  let t0 = 0.5 - x0*x0 - y0*y0;
  if (t0 < 0) n0 = 0;
  else {
    t0 *= t0;
    n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0);
  }

  let t1 = 0.5 - x1*x1 - y1*y1;
  if (t1 < 0) n1 = 0;
  else {
    t1 *= t1;
    n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1);
  }

  let t2 = 0.5 - x2*x2 - y2*y2;
  if (t2 < 0) n2 = 0;
  else {
    t2 *= t2;
    n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2);
  }

  return 70 * (n0 + n1 + n2);
}


/* ---------------------------------------------------
   FBM (Fractal Brownian Motion)
--------------------------------------------------- */
function fbm(x, y, t) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1.0;

  for (let i = 0; i < 4; i++) {
    value += amplitude * simplex2D(x * frequency + t, y * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

/* ---------------------------------------------------
   ONDE ORO PROCEDURALI + TOGGLE BTN
--------------------------------------------------- */
const canvas = document.getElementById("gradientCanvas");
const toggleBtn = document.getElementById("toggleBtn");
let paused = false;

if (canvas) {
  const ctx = canvas.getContext("2d");
  let t = 0;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height || 200;
  }

  window.addEventListener("resize", resize);
  resize();

function draw() {
  if (paused) return;

  const w = canvas.width;
  const h = canvas.height;

  const out = ctx.createImageData(w, h);
  const dst = out.data;

  // Scroll principale (più veloce)
  const scroll = [
    t * 0.085,   // prima 0.070
    -t * 0.085,  // centrale invertita
    t * 0.065    // prima 0.055
  ];

  // Micro‑scroll più forte → più movimento
  const microScroll = Math.sin(t * 1.2) * 0.020;

  // Warp più tondeggiante → macchie più corte e rotonde
  const warpStrength = [0.16, 0.20, 0.14];

  // Frequenze leggermente più alte → macchie più corte
  const freq = [2.0, 2.4, 1.8];

  for (let y = 0; y < h; y++) {
    const ny = y / h;

    // Fade nero in alto
    const fadeTop = Math.min(1, ny * 2.0);

    for (let x = 0; x < w; x++) {
      const nx = x / w;

      let combined = 0;

      for (let i = 0; i < 3; i++) {

        // Warp 2D più dinamico e più tondeggiante
        const warpX = Math.sin(ny * (3 + i) + t * (0.40 + i * 0.15)) * warpStrength[i];
        const warpY = Math.sin(nx * (3 + i) + t * (0.35 + i * 0.12)) * warpStrength[i];

        // Noise con scroll + micro‑scroll
        const n = simplex2D(
          (nx + scroll[i] + microScroll + warpX) * freq[i],
          (ny + warpY) * freq[i]
        );

        let shade = (n + 1) * 0.5;

        // contrasto leggero → macchie definite
        shade = Math.pow(shade, 1.22);

        // inversione → macchie nere
        shade = 1 - shade;

        // dissolvenza moderata
        shade *= 0.60;

        combined += shade;
      }

      combined /= 3;

      // GIALLO PIÙ GIALLO (più luminoso e saturo)
      const goldR = 255;
      const goldG = 225;  // prima 210
      const goldB = 80;   // prima 60

      // Applico fade nero in alto
      const finalShade = combined * fadeTop;

      const i = (y * w + x) * 4;
      dst[i]     = goldR * finalShade;
      dst[i + 1] = goldG * finalShade;
      dst[i + 2] = goldB * finalShade;
      dst[i + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);

  // tempo più rapido → più movimento
  t += 0.024;

  requestAnimationFrame(draw);
}




  draw();

  /* ---------------------------------------------------
     TOGGLE BUTTON (play/pause)
  --------------------------------------------------- */
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      paused = !paused;
      toggleBtn.textContent = paused ? "▶" : "❚❚";
      if (!paused) draw();
    });
  }
}
