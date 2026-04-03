/* ============================================================
   LOADER
============================================================ */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 1900);
});

/* ============================================================
   THEME TOGGLE
============================================================ */
const htmlEl = document.documentElement;
const themeBtn = document.getElementById('themeToggle');

function setTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  themeBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

themeBtn.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   NAVBAR SCROLL
============================================================ */
const navbar = document.getElementById('navbar');
const backTop = document.getElementById('back-top');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  navbar.classList.toggle('scrolled', scrollY > 30);
  backTop.classList.toggle('visible', scrollY > 400);
  updateActiveNav();
}, { passive: true });

/* ============================================================
   ACTIVE NAV LINK
============================================================ */
function updateActiveNav() {
  const sections = ['hero', 'about', 'skills', 'projects', 'experience', 'education', 'contact'];
  const scrollY = window.scrollY + 120;
  let active = 'hero';
  for (const id of sections) {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollY) active = id;
  }
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + active);
  });
}

/* ============================================================
   MOBILE MENU
============================================================ */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

function closeMobile() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
}

/* ============================================================
   TYPING ANIMATION
============================================================ */
const phrases = [
  'Cloud Engineer (Aspiring)',
  'DevOps Engineer (Aspiring)',
  'Full Stack Developer',
  'MERN Stack Engineer',
  'AWS Enthusiast'
];
let phraseIdx = 0;
let charIdx = 0;
let isDeleting = false;
const typingEl = document.getElementById('typingText');

function type() {
  const phrase = phrases[phraseIdx];
  if (isDeleting) {
    typingEl.textContent = phrase.substring(0, charIdx - 1);
    charIdx--;
  } else {
    typingEl.textContent = phrase.substring(0, charIdx + 1);
    charIdx++;
  }

  let delay = isDeleting ? 60 : 100;
  if (!isDeleting && charIdx === phrase.length) { delay = 2000; isDeleting = true; }
  else if (isDeleting && charIdx === 0) { isDeleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; delay = 400; }

  setTimeout(type, delay);
}
setTimeout(type, 1200);

/* ============================================================
   SCROLL REVEAL
============================================================ */
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => observer.observe(el));

/* ============================================================
   3D TILT EFFECT ON PROJECT CARDS
============================================================ */
document.querySelectorAll('.tilt').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    card.style.transform = `translateY(-6px) rotateY(${x}deg) rotateX(${y}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ============================================================
   SMOOTH PARALLAX ENGINE  (RAF + lerp)
   - Scroll parallax: bg orbs + section layer elements
   - Mouse parallax:  hero visual, floating cards
============================================================ */

// Lerp helper – smoothly interpolates a → b at speed t
const lerp = (a, b, t) => a + (b - a) * t;

// ── Scroll parallax state ────────────────────────────────
const parallaxItems = [
  { el: document.querySelector('.bg-orbs span:nth-child(1)'), speed:  0.18 },
  { el: document.querySelector('.bg-orbs span:nth-child(2)'), speed: -0.12 },
  { el: document.querySelector('.bg-orbs span:nth-child(3)'), speed:  0.08 },
];
parallaxItems.forEach(({ el }) => { if (el) el.style.willChange = 'transform'; });

let scrollCurrent  = 0;   // smoothed scroll position
let scrollTarget   = 0;   // raw scroll position
let rafId          = null;
let isScrolling    = false;

window.addEventListener('scroll', () => {
  scrollTarget = window.scrollY;
  if (!isScrolling) {
    isScrolling = true;
    rafId = requestAnimationFrame(parallaxLoop);
  }
}, { passive: true });

function parallaxLoop() {
  // Smooth the scroll value (easing factor 0.08 = slow/silky, 0.15 = snappier)
  scrollCurrent = lerp(scrollCurrent, scrollTarget, 0.08);

  parallaxItems.forEach(({ el, speed }) => {
    if (!el) return;
    const y = scrollCurrent * speed;
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  });

  // Keep looping while there's still delta to close
  if (Math.abs(scrollCurrent - scrollTarget) > 0.2) {
    rafId = requestAnimationFrame(parallaxLoop);
  } else {
    // Snap to exact target to avoid floating-point drift
    parallaxItems.forEach(({ el, speed }) => {
      if (!el) return;
      el.style.transform = `translate3d(0, ${scrollTarget * speed}px, 0)`;
    });
    isScrolling = false;
    rafId = null;
  }
}

// ── Mouse parallax on hero section ───────────────────────
const heroSection    = document.getElementById('hero');
const heroVisual     = document.querySelector('.hero-visual');
const floatingCards  = document.querySelectorAll('.floating-card');
const heroCardMain   = document.querySelector('.hero-card-main');

// Current & target mouse-offset values  {x, y}
const mouse = { cx: 0, cy: 0, tx: 0, ty: 0 };
let mouseRafId = null;
let mouseActive = false;

if (heroSection) {
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    // Normalise to -1 … +1
    mouse.tx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    mouse.ty = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    if (!mouseActive) {
      mouseActive = true;
      mouseRafId = requestAnimationFrame(mouseLerpLoop);
    }
  }, { passive: true });

  heroSection.addEventListener('mouseleave', () => {
    // Ease back to centre
    mouse.tx = 0;
    mouse.ty = 0;
  });
}

function mouseLerpLoop() {
  mouse.cx = lerp(mouse.cx, mouse.tx, 0.06);
  mouse.cy = lerp(mouse.cy, mouse.ty, 0.06);

  // Hero visual tilts gently
  if (heroVisual) {
    heroVisual.style.transform =
      `rotateY(${mouse.cx * 6}deg) rotateX(${-mouse.cy * 4}deg)`;
  }

  // Main card moves slightly (depth layer 1)
  if (heroCardMain) {
    heroCardMain.style.transform =
      `translate3d(${mouse.cx * -8}px, ${mouse.cy * -6}px, 0)`;
  }

  // Floating cards move more (depth layer 2, opposite direction for depth cue)
  floatingCards.forEach((card, i) => {
    const sign = i % 2 === 0 ? 1 : -1;
    card.style.transform =
      `translate3d(${mouse.cx * 14 * sign}px, ${mouse.cy * 10 * sign}px, 0)`;
  });

  if (Math.abs(mouse.cx - mouse.tx) > 0.001 || Math.abs(mouse.cy - mouse.ty) > 0.001) {
    mouseRafId = requestAnimationFrame(mouseLerpLoop);
  } else {
    mouseActive = false;
    mouseRafId = null;
  }
}

/* ============================================================
   CONTACT FORM
============================================================ */
function handleSubmit(e) {
  e.preventDefault();
  const form    = e.target;
  const btn     = document.getElementById('submitBtn');
  const text    = document.getElementById('submitText');
  const success = document.getElementById('formSuccess');

  // Basic validation
  const fname   = document.getElementById('fname').value.trim();
  const email   = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!fname || !email || !message) {
    alert('Please fill in your name, email and message.');
    return;
  }

  btn.disabled = true;
  text.textContent = 'Sending… ⏳';

  const data = new FormData(form);

  fetch('https://formspree.io/f/xvzvwgez', {
    method: 'POST',
    body: data,
    headers: { 'Accept': 'application/json' }
  })
  .then(res => {
    if (res.ok) {
      text.textContent = '✅ Sent!';
      success.style.display = 'block';
      form.reset();
      setTimeout(() => {
        btn.disabled = false;
        text.textContent = 'Send Message ✉️';
        success.style.display = 'none';
      }, 5000);
    } else {
      return res.json().then(data => {
        throw new Error(data.errors ? data.errors.map(e => e.message).join(', ') : 'Something went wrong.');
      });
    }
  })
  .catch(err => {
    btn.disabled = false;
    text.textContent = 'Send Message ✉️';
    alert('❌ Failed to send: ' + err.message + '\nPlease try emailing directly.');
  });
}


/* ============================================================
   RESUME DOWNLOAD
============================================================ */
function downloadResume(e) {
  e.preventDefault();
  // Creates a placeholder PDF download
  const link = document.createElement('a');
  link.href = '#';
  // In production: link.href = '/assets/Jeeva_Nandan_Resume.pdf';
  link.download = 'Jeeva_Nandan_Resume.pdf';
  // Show notification instead
  const notification = document.createElement('div');
  notification.style.cssText = `
    position:fixed;bottom:80px;right:28px;
    background:var(--bg-3);border:1px solid var(--border-h);
    border-radius:14px;padding:14px 20px;
    font-size:0.85rem;color:var(--text-0);
    box-shadow:var(--shadow);z-index:1000;
    animation: fadeInUp 0.3s ease;
  `;
  notification.innerHTML = '📄 Resume ready! Add your PDF file and update the link.';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3500);
}

/* ============================================================
   SMOOTH SCROLL FOR ALL ANCHOR LINKS
============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = a.getAttribute('href');
    if (target === '#') return;
    const el = document.querySelector(target);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobile();
    }
  });
});
