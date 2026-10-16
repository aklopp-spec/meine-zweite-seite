/* =========================================================
   FUNKENWERK – Interaktionen
   ========================================================= */
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Startanimation der Überschrift
  requestAnimationFrame(() => {
    $$('.hero-title .word').forEach((w, i) => (w.style.transitionDelay = `${0.1 + i * 0.09}s`));
    document.body.classList.add('loaded');
  });

  /* ---------- Funken im Hero ---------- */
  const canvas = $('.sparks');
  const ctx = canvas.getContext('2d');
  const hero = $('.hero');
  let w, h, dpr, sparks = [], heroVisible = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y, burst = false) {
    const angle = burst ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
    const speed = burst ? 1.5 + Math.random() * 4 : 0.6 + Math.random() * 2.2;
    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: burst ? 0.012 + Math.random() * 0.02 : 0.003 + Math.random() * 0.006,
      size: 0.6 + Math.random() * 2,
      hue: 18 + Math.random() * 25,
    });
  }

  function tick() {
    if (heroVisible) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      const rate = w < 600 ? 2 : 4;
      for (let i = 0; i < rate; i++) spawn(w * (0.15 + Math.random() * 0.7), h + 10);

      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.vx += (Math.random() - 0.5) * 0.12;
        p.vy -= 0.008;
        p.x += p.vx; p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -20) { sparks.splice(i, 1); continue; }

        const a = p.life;
        ctx.strokeStyle = `hsla(${p.hue}, 100%, ${55 + a * 20}%, ${a})`;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.stroke();

        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${a * 0.15})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(tick);
  }

  if (!reduceMotion) {
    resize();
    addEventListener('resize', resize);
    new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe(hero);
    // Funkenregen beim Bewegen und Klicken
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      if (Math.random() < 0.5) spawn(e.clientX - r.left, e.clientY - r.top, true);
    });
    hero.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      for (let i = 0; i < 60; i++) spawn(e.clientX - r.left, e.clientY - r.top, true);
    });
    tick();
  }

  /* ---------- Header, Fortschritt, Zeitleiste ---------- */
  const header = $('.header');
  const progress = $('.progress');
  const timeline = $('.timeline');
  const steps = $$('.step');
  let lastY = 0;

  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hidden', y > lastY && y > 500 && !nav.classList.contains('open'));
    lastY = y;

    // Zeitleiste füllt sich beim Scrollen
    const r = timeline.getBoundingClientRect();
    const fill = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
    timeline.style.setProperty('--fill', fill.toFixed(3));
    steps.forEach((s, i) => s.classList.toggle('lit', fill >= i / (steps.length - 1) - 0.02));
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobiles Menü ---------- */
  const burger = $('.burger');
  const nav = $('#nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    document.body.classList.toggle('no-scroll', open);
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  // Aktiven Menüpunkt markieren
  const links = $$('.nav a:not(.btn)');
  const navObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('current', l.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['leistungen', 'referenzen', 'ablauf', 'kontakt'].forEach((id) => navObs.observe(document.getElementById(id)));

  /* ---------- Scroll-Reveal ---------- */
  // Geschwister nacheinander einblenden
  $$('.service-grid, .project-grid, .stats, .timeline').forEach((group) =>
    $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', `${i * 0.1}s`)));

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el) => revealObs.observe(el));

  /* ---------- Hochzählende Zahlen ---------- */
  const fmt = new Intl.NumberFormat('de-DE');
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      const dur = 1800, t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt.format(Math.round(end * eased)) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      reduceMotion ? (el.textContent = fmt.format(end) + suffix) : requestAnimationFrame(step);
      countObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countObs.observe(el));

  /* ---------- Maus-Effekte (nur Desktop) ---------- */
  if (finePointer && !reduceMotion) {
    const glow = $('.cursor-glow');
    addEventListener('pointermove', (e) => (glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`));

    // Lichtkegel auf den Leistungskarten
    $$('.spotlight').forEach((card) => card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));

    // 3D-Neigung der Referenzkarten
    $$('.project').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', `${x * 8}deg`);
        card.style.setProperty('--rx', `${-y * 8}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    // Magnetische Buttons
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
        btn.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--bx', '0px');
        btn.style.setProperty('--by', '0px');
      });
    });
  }

  /* ---------- Referenzen filtern ---------- */
  const filters = $$('.filter');
  const projects = $$('.project');
  filters.forEach((btn) => btn.addEventListener('click', () => {
    filters.forEach((b) => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    const cat = btn.dataset.filter;
    projects.forEach((p) => {
      const show = cat === 'alle' || p.dataset.cat === cat;
      p.classList.toggle('is-hidden', !show);
      p.classList.remove('pop');
      if (show) { void p.offsetWidth; p.classList.add('pop', 'in'); }
    });
  }));

  /* ---------- Projekt-Detailfenster ---------- */
  const modal = $('.modal');
  const set = (sel, val) => ($(sel, modal).textContent = val);
  projects.forEach((p) => p.addEventListener('click', () => {
    const d = p.dataset;
    const art = $('.project-art', p);
    $('.modal-art', modal).className = `modal-art ${[...art.classList].find((c) => c.startsWith('art-'))}`;
    $('.modal-art', modal).innerHTML = art.innerHTML;
    set('.modal-tag', $('.tag', p).textContent);
    set('#modal-title', d.title);
    set('.modal-place', d.place);
    set('.modal-desc', d.desc);
    set('.modal-material', d.material);
    set('.modal-time', d.time);
    set('.modal-year', d.year);
    modal.showModal();
    document.body.classList.add('no-scroll');
  }));
  const closeModal = () => modal.close();
  $('.modal-close').addEventListener('click', closeModal);
  $('.modal-cta').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => e.target === modal && closeModal());
  modal.addEventListener('close', () => document.body.classList.remove('no-scroll'));

  /* ---------- Kundenstimmen ---------- */
  const quotes = $$('.quote');
  const dots = $$('.quote-dots button');
  let qi = 0, qTimer;
  function showQuote(i) {
    qi = (i + quotes.length) % quotes.length;
    quotes.forEach((q, k) => q.classList.toggle('active', k === qi));
    dots.forEach((d, k) => d.classList.toggle('active', k === qi));
    clearInterval(qTimer);
    qTimer = setInterval(() => showQuote(qi + 1), 6000);
  }
  dots.forEach((d, i) => d.addEventListener('click', () => showQuote(i)));
  showQuote(0);

  /* ---------- Kontaktformular ---------- */
  const form = $('.form');
  const success = $('.success', form);
  const submit = $('button[type="submit"]', form);
  const privacy = $('#privacy');
  const checkError = $('.check-error');

  function validateField(input) {
    const ok = input.checkValidity() && input.value.trim().length >= (input.minLength > 0 ? input.minLength : 1);
    input.closest('.field').classList.toggle('invalid', !ok);
    return ok;
  }
  $$('.field input[required], .field textarea[required]', form).forEach((input) => {
    input.addEventListener('blur', () => input.value && validateField(input));
    input.addEventListener('input', () => input.closest('.field').classList.contains('invalid') && validateField(input));
  });
  privacy.addEventListener('change', () => checkError.classList.toggle('show', !privacy.checked));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = $$('.field input[required], .field textarea[required]', form);
    const results = fields.map(validateField);
    checkError.classList.toggle('show', !privacy.checked);
    if (results.includes(false) || !privacy.checked) {
      const firstBad = fields[results.indexOf(false)] || privacy;
      firstBad.focus();
      return;
    }
    // Demo: Versand nur simulieren
    submit.classList.add('loading');
    setTimeout(() => {
      submit.classList.remove('loading');
      $('.success-name', form).textContent = $('#name').value.trim().split(' ')[0];
      success.hidden = false;
      $('.reset', success).focus();
    }, 1400);
  });

  $('.reset', success).addEventListener('click', () => {
    form.reset();
    success.hidden = true;
    $('#name').focus();
  });

  onScroll();
})();
