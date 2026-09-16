const images = [
  "images/IMG_20260916_225216_222.jpg",
  "images/IMG_20260916_225227_214.jpg",
  "images/IMG_20260916_225231_370.jpg",
  "images/IMG_20260916_225234_990.jpg",
  "images/IMG_20260916_225242_172.jpg",
  "images/IMG_20260916_225242_339.jpg",
  "images/IMG_20260916_225242_447.jpg",
  "images/IMG_20260916_225247_384.jpg",
  "images/IMG_20260916_225247_453.jpg",
  "images/IMG_20260916_225247_848.jpg",
  "images/IMG_20260916_225252_281.jpg",
  "images/IMG_20260916_225256_372.jpg",
  "images/IMG_20260916_225304_617.jpg",
  "images/IMG_20260916_225304_764.jpg",
  "images/IMG_20260916_225316_870.jpg",
  "images/IMG_20260916_225317_257.jpg",
  "images/IMG_20260916_225317_300.jpg",
  "images/IMG_20260916_225317_382.jpg",
  "images/IMG_20260916_225317_396.jpg",
  "images/IMG_20260916_225317_693.JPG",
];

const slideImg      = document.getElementById('slide-img');
const slideshow     = document.getElementById('slideshow');
const heartbeatScreen = document.getElementById('heartbeat-screen');
const heartIcon     = document.getElementById('heart-icon');
const ecgLine       = document.getElementById('ecg-line');
const homepage      = document.getElementById('homepage');
const loadingScreen = document.getElementById('loading-screen');

let currentIndex = 0;

function showSlide(index) {
  slideImg.classList.remove('visible');
  setTimeout(() => {
    slideImg.src = images[index];
    slideImg.onload = () => slideImg.classList.add('visible');
    // fallback if already cached
    if (slideImg.complete) slideImg.classList.add('visible');
  }, 200);
}

function runSlideshow() {
  showSlide(currentIndex);

  const interval = setInterval(() => {
    currentIndex++;
    if (currentIndex < images.length) {
      showSlide(currentIndex);
    } else {
      clearInterval(interval);
      // fade out slideshow, show heartbeat
      slideImg.classList.remove('visible');
      setTimeout(startHeartbeat, 400);
    }
  }, 3000);
}

// ── ECG / HEARTBEAT ANIMATION ──
// Build a realistic ECG path as a polyline
function buildECGPoints(width, height) {
  const cx = width / 2;
  const mid = height / 2;
  const points = [];

  // flat lead-in
  for (let x = 0; x <= cx - 120; x += 10) points.push([x, mid]);

  // P wave (small bump)
  const pw = 18, ph = 12;
  for (let i = 0; i <= pw; i++) {
    const t = (i / pw) * Math.PI;
    points.push([cx - 120 + i, mid - Math.sin(t) * ph]);
  }

  // PR segment
  points.push([cx - 100, mid]);
  points.push([cx - 70,  mid]);

  // Q dip
  points.push([cx - 40,  mid]);
  points.push([cx - 20,  mid + 18]);

  // R spike (tall)
  points.push([cx,       mid - height * 0.75]);

  // S dip
  points.push([cx + 20,  mid + 22]);
  points.push([cx + 40,  mid]);

  // ST segment
  points.push([cx + 60,  mid]);

  // T wave (rounded)
  const tw = 50, th = 28;
  for (let i = 0; i <= tw; i++) {
    const t = (i / tw) * Math.PI;
    points.push([cx + 60 + i, mid - Math.sin(t) * th]);
  }

  // flat tail
  points.push([cx + 110, mid]);
  for (let x = cx + 120; x <= width; x += 10) points.push([x, mid]);

  return points.map(p => p.join(',')).join(' ');
}

function animateECG() {
  const svg = document.getElementById('heartbeat-svg');
  const W = svg.viewBox.baseVal.width;
  const H = svg.viewBox.baseVal.height;
  ecgLine.setAttribute('points', buildECGPoints(W, H));

  // Use stroke-dasharray trick to animate the draw
  const length = ecgLine.getTotalLength ? ecgLine.getTotalLength() : 1200;
  ecgLine.style.strokeDasharray  = length;
  ecgLine.style.strokeDashoffset = length;
  ecgLine.style.transition = 'stroke-dashoffset 1.2s ease-out';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ecgLine.style.strokeDashoffset = '0';
    });
  });
}

function startHeartbeat() {
  slideshow.style.display = 'none';
  heartbeatScreen.classList.add('active');
  animateECG();

  // after ECG draws (~1.2s), start heart beating
  setTimeout(() => {
    heartIcon.classList.add('beating');
  }, 1200);

  // after 7s total, transition to homepage
  setTimeout(goToHomepage, 7000);
}

function goToHomepage() {
  heartbeatScreen.style.transition = 'opacity 0.8s ease';
  heartbeatScreen.style.opacity = '0';
  homepage.classList.add('visible');

  // play audio track
  const audioVideo = document.getElementById('audio-video');
  audioVideo.play().catch(() => {
    // browsers may block autoplay with sound — wait for first interaction
    document.addEventListener('click', () => audioVideo.play(), { once: true });
    document.addEventListener('touchstart', () => audioVideo.play(), { once: true });
  });

  setTimeout(() => {
    loadingScreen.style.display = 'none';
    startConfetti();
  }, 1000);
}

// kick off
runSlideshow();

// ── CONFETTI ──
const COLORS = ['#ff2255','#ff6b8a','#ffb3c6','#ff85a1','#fff0f3','#ff4477','#ffccd5','#c9184a'];
const SHAPES = ['circle','heart','rect'];

class Particle {
  constructor(x, y, fromCursor) {
    this.x = x;
    this.y = y;
    this.fromCursor = fromCursor;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    this.size = fromCursor
      ? 6 + Math.random() * 8
      : 7 + Math.random() * 10;
    const angle = fromCursor
      ? Math.random() * Math.PI * 2
      : (Math.random() * Math.PI) + Math.PI; // upward spread
    const speed = fromCursor
      ? 1 + Math.random() * 3
      : 2 + Math.random() * 5;
    this.vx = Math.cos(angle) * speed;
    this.vy = fromCursor
      ? Math.sin(angle) * speed
      : -Math.abs(Math.sin(angle) * speed);
    this.gravity = 0.08 + Math.random() * 0.06;
    this.alpha = 1;
    this.decay = fromCursor ? 0.025 + Math.random() * 0.02 : 0.012 + Math.random() * 0.01;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.15;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.99;
    this.alpha -= this.decay;
    this.rotation += this.rotSpeed;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else {
      // heart
      const s = this.size * 0.045;
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 0.15);
      ctx.bezierCurveTo( this.size * 0.5, -this.size * 0.55,  this.size * 0.9,  this.size * 0.1, 0,  this.size * 0.55);
      ctx.bezierCurveTo(-this.size * 0.9,  this.size * 0.1, -this.size * 0.5, -this.size * 0.55, 0, -this.size * 0.15);
      ctx.fill();
    }
    ctx.restore();
  }

  isDead() { return this.alpha <= 0; }
}

let particles = [];
let confettiCanvas, confettiCtx, animId;
let burstInterval;

function spawnBurst(x, y, count, fromCursor) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, fromCursor));
  }
}

function confettiLoop() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  particles = particles.filter(p => !p.isDead());
  particles.forEach(p => { p.update(); p.draw(confettiCtx); });
  animId = requestAnimationFrame(confettiLoop);
}

function startConfetti() {
  confettiCanvas = document.getElementById('confetti-canvas');
  confettiCtx = confettiCanvas.getContext('2d');

  function resize() {
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // initial burst — scatter across screen
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const x = Math.random() * confettiCanvas.width;
      const y = confettiCanvas.height * 0.4 + Math.random() * confettiCanvas.height * 0.3;
      spawnBurst(x, y, 18, false);
    }, i * 120);
  }

  // ongoing random bursts every 1.8s
  burstInterval = setInterval(() => {
    const x = Math.random() * confettiCanvas.width;
    const y = confettiCanvas.height * 0.3 + Math.random() * confettiCanvas.height * 0.4;
    spawnBurst(x, y, 14, false);
  }, 1800);

  // cursor trail
  let lastMouseX = -1, lastMouseY = -1;
  document.addEventListener('mousemove', (e) => {
    if (!homepage.classList.contains('visible')) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 12) {
      spawnBurst(e.clientX, e.clientY, 4, true);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });

  // touch trail for mobile
  document.addEventListener('touchmove', (e) => {
    if (!homepage.classList.contains('visible')) return;
    const t = e.touches[0];
    spawnBurst(t.clientX, t.clientY, 4, true);
  }, { passive: true });

  confettiLoop();
}
