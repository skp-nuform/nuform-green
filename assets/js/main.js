/* Nuform Green — interactions. Vanilla JS, no dependencies. */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = () => reduceMQ.matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  const onFontsReady = [];

  /* ---------- Eco mode (dark theme) ---------- */
  const themeMeta = $('meta[name="theme-color"]');
  const ecoBtns = $$('[data-eco]');

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    ecoBtns.forEach(b => b.setAttribute('aria-pressed', String(theme === 'dark')));
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#04130C' : '#067647';
    if (persist) store.set('ng-theme', theme);
  }
  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

  function switchTheme(btn) {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!d.startViewTransition || reduced()) {
      root.classList.add('theme-anim');
      applyTheme(next, true);
      setTimeout(() => root.classList.remove('theme-anim'), 800);
      return;
    }
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = d.startViewTransition(() => applyTheme(next, true));
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  }
  ecoBtns.forEach(b => b.addEventListener('click', () => switchTheme(b)));

  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  if (darkMQ.addEventListener) {
    darkMQ.addEventListener('change', e => { if (!store.get('ng-theme')) applyTheme(e.matches ? 'dark' : 'light'); });
  }

  /* ---------- Navigation: scrollspy pill + mobile menu ---------- */
  const nav = $('#nav');
  const navLinks = $$('.nav__links a');
  const pill = $('.nav__pill');
  let activeLink = null;

  function movePill(a) {
    if (!pill) return;
    if (!a || !a.offsetWidth) { pill.style.opacity = '0'; return; }
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
    pill.style.opacity = '1';
  }
  function setActive(a) {
    if (a === activeLink) return;
    navLinks.forEach(l => {
      l.classList.toggle('is-active', l === a);
      if (l === a) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
    activeLink = a;
    movePill(a);
  }
  const spyTargets = $$('main > section[id]').map(el => ({
    el,
    a: navLinks.find(l => l.getAttribute('href') === '#' + el.id) || null
  }));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const t = spyTargets.find(t => t.el === e.target);
      if (t) setActive(t.a);
    });
  }, { rootMargin: '-45% 0px -54% 0px' });
  spyTargets.forEach(t => spy.observe(t.el));
  addEventListener('resize', () => movePill(activeLink), { passive: true });
  onFontsReady.push(() => movePill(activeLink));

  const burger = $('.burger');
  const mmenu = $('#mmenu');
  function setMenu(open) {
    if (!burger || !mmenu) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mmenu.classList.toggle('is-open', open);
    d.body.classList.toggle('no-scroll', open);
  }
  if (burger && mmenu) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    mmenu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mmenu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    matchMedia('(min-width: 1181px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  /* ---------- Scroll-driven bits (one rAF-throttled handler) ---------- */
  const progress = $('.progress');
  const topBtn = $('.fab--top');
  const ring = topBtn ? $('.fab__ring circle', topBtn) : null;
  const hero = $('#home');
  const sun = $('.sky__sun');
  const steps = $('.steps');
  const stepItems = steps ? $$('.step', steps) : [];
  let stepsNear = false;
  let ticking = false;

  function updateSteps() {
    const r = steps.getBoundingClientRect();
    const vh = innerHeight;
    const start = vh * .8;
    const end = vh * .35;
    const p = Math.min(1, Math.max(0, (start - r.top) / (r.height + start - end)));
    steps.style.setProperty('--p', p.toFixed(3));
    const last = stepItems.length - 1;
    stepItems.forEach((s, i) => s.classList.toggle('is-on', p > .02 && p >= i / last - .02));
  }
  function update() {
    ticking = false;
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    if (progress) progress.style.transform = `scaleX(${p.toFixed(4)})`;
    if (nav) nav.classList.toggle('is-scrolled', y > 16);
    if (topBtn) {
      topBtn.classList.toggle('is-on', y > innerHeight * .9);
      if (ring) ring.style.strokeDashoffset = (100 - p * 100).toFixed(2);
    }
    if (sun && !reduced() && y < innerHeight * 1.2) sun.style.setProperty('--sy', (y * .22).toFixed(1) + 'px');
    if (stepsNear) updateSteps();
  }
  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  if (steps) {
    new IntersectionObserver(es => { stepsNear = es[0].isIntersecting; if (stepsNear) requestTick(); }, { rootMargin: '200px 0px' }).observe(steps);
  }
  addEventListener('scroll', requestTick, { passive: true });
  addEventListener('resize', requestTick, { passive: true });
  update();
  if (topBtn) topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }));

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* ---------- Pause animations that are off-screen ---------- */
  const sceneSvg = $('.scene');
  const zoneIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const on = e.isIntersecting;
      e.target.classList.toggle('is-paused', !on);
      e.target.dispatchEvent(new CustomEvent(on ? 'zone:in' : 'zone:out'));
      if (e.target === hero && sceneSvg && sceneSvg.pauseAnimations) {
        if (on) sceneSvg.unpauseAnimations(); else sceneSvg.pauseAnimations();
      }
    });
  }, { rootMargin: '60px 0px' });
  $$('[data-zone]').forEach(z => zoneIO.observe(z));

  /* ---------- Hero: rotating word ---------- */
  const rotator = $('.rotator');
  if (rotator && hero) {
    const words = $$(':scope > span', rotator);
    let wi = 0;
    let timer = null;
    const next = () => {
      const cur = words[wi];
      wi = (wi + 1) % words.length;
      const nxt = words[wi];
      cur.classList.remove('is-on');
      cur.classList.add('is-off');
      nxt.classList.remove('is-off');
      nxt.classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-off'), 800);
    };
    const start = () => { if (!reduced() && !timer) timer = setInterval(next, 2600); };
    const stop = () => { clearInterval(timer); timer = null; };
    hero.addEventListener('zone:in', start);
    hero.addEventListener('zone:out', stop);
    d.addEventListener('visibilitychange', () => { if (d.hidden) stop(); else if (!hero.classList.contains('is-paused')) start(); });
  }

  /* ---------- Hero: pointer parallax ---------- */
  if (hero && fineMQ.matches && !reduced()) {
    let raf = 0;
    let mx = 0;
    let my = 0;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - .5;
      my = (e.clientY - r.top) / r.height - .5;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          hero.style.setProperty('--mx', mx.toFixed(3));
          hero.style.setProperty('--my', my.toFixed(3));
        });
      }
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--mx', '0');
      hero.style.setProperty('--my', '0');
    });
  }

  /* ---------- Hero: labels pinned to the illustration ---------- */
  const sceneWrap = $('.hero__scene');
  const tags = sceneWrap ? $$('.tag', sceneWrap) : [];
  const vb = sceneSvg ? sceneSvg.viewBox.baseVal : { x: 0, y: 0, width: 1440, height: 600 };
  function placeTags() {
    const W = sceneWrap.clientWidth;
    const H = sceneWrap.clientHeight;
    // mirror preserveAspectRatio="xMidYMax slice" on the scene's viewBox
    const s = Math.max(W / vb.width, H / vb.height);
    const ox = (W - vb.width * s) / 2 - vb.x * s;
    const oy = H - vb.height * s - vb.y * s;
    tags.forEach(t => {
      const x = +t.dataset.x * s + ox;
      const y = +t.dataset.y * s + oy;
      t.style.left = x.toFixed(1) + 'px';
      t.style.top = y.toFixed(1) + 'px';
      t.hidden = W < 760 || x < 90 || x > W - 90;
    });
  }
  if (tags.length) {
    placeTags();
    if ('ResizeObserver' in window) new ResizeObserver(placeTags).observe(sceneWrap);
    else addEventListener('resize', placeTags);
    onFontsReady.push(placeTags);
    tags.forEach((t, i) => setTimeout(() => t.classList.add('is-in'), reduced() ? 0 : 1100 + i * 260));
  }

  /* ---------- "Pick something" transformer ---------- */
  const tf = $('.tf');
  if (tf) {
    const tabList = $('[role="tablist"]', tf);
    const tabs = $$('[role="tab"]', tf);
    const panels = $$('[role="tabpanel"]', tf);
    const bar = $('.tf__bar', tf);
    let idx = 0;
    let auto = !reduced();
    let inView = false;

    const select = (i, byUser) => {
      idx = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => {
        const on = k === idx;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p, k) => p.classList.toggle('is-active', k === idx));
      // on phones the tabs are a swipeable row: keep the active one in view (horizontal only)
      if (tabList.scrollWidth > tabList.clientWidth) {
        tabList.scrollTo({ left: tabs[idx].offsetLeft - 18, behavior: reduced() ? 'auto' : 'smooth' });
      }
      if (byUser && auto) {
        auto = false;
        bar.classList.remove('run');
      }
    };
    const runBar = () => {
      bar.classList.remove('run');
      void bar.offsetWidth; // restart the CSS animation
      if (auto && inView) bar.classList.add('run');
    };
    bar.addEventListener('animationend', () => {
      if (!auto) return;
      select(idx + 1);
      runBar();
    });
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => select(k, true));
      t.addEventListener('keydown', e => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        let n = null;
        if (step) n = idx + step;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        select(n, true);
        tabs[idx].focus();
      });
    });
    tf.addEventListener('zone:in', () => {
      inView = true;
      if (auto && !bar.classList.contains('run')) runBar();
    });
    tf.addEventListener('zone:out', () => { inView = false; });
  }

  /* ---------- Service cards: cursor spotlight + "ask about this" ---------- */
  if (fineMQ.matches) {
    $$('.card').forEach(c => c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--x', Math.round(e.clientX - r.left) + 'px');
      c.style.setProperty('--y', Math.round(e.clientY - r.top) + 'px');
    }));
  }
  const chipInputs = $$('.chip input');
  $$('[data-interest]').forEach(a => a.addEventListener('click', () => {
    const cb = chipInputs.find(i => i.value === a.dataset.interest);
    if (!cb) return;
    cb.checked = true;
    const chip = cb.closest('.chip');
    chip.classList.remove('flash');
    void chip.offsetWidth;
    chip.classList.add('flash');
  }));

  /* ---------- Count-up numbers (final values stay in the HTML) ---------- */
  const nf = new Intl.NumberFormat('en-IN');
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const to = +el.dataset.count;
      if (reduced()) { el.textContent = nf.format(to); return; }
      const dur = 1700;
      const t0 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = nf.format(Math.round(to * (1 - Math.pow(1 - k, 4))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { rootMargin: '0px 0px 12% 0px' });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Burn it / sell it switch ---------- */
  const stub = $('.stubble');
  if (stub) {
    const btns = $$('.switch button', stub);
    const thumb = $('.switch__thumb', stub);
    let touched = false;
    const set = state => {
      stub.dataset.state = state;
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.state === state)));
      const on = btns.find(b => b.dataset.state === state);
      thumb.style.width = on.offsetWidth + 'px';
      thumb.style.transform = `translateX(${on.offsetLeft}px)`;
    };
    btns.forEach(b => b.addEventListener('click', () => { touched = true; set(b.dataset.state); }));
    set(stub.dataset.state || 'burn');
    addEventListener('resize', () => set(stub.dataset.state), { passive: true });
    onFontsReady.push(() => set(stub.dataset.state));
    const sio = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      sio.disconnect();
      setTimeout(() => { if (!touched) set('sell'); }, reduced() ? 0 : 1800);
    }, { threshold: .55 });
    sio.observe(stub);
  }

  /* ---------- Carbon credit journey + gauge ---------- */
  const gauge = $('.gauge');
  const journey = $('.journey');
  if (gauge && journey) {
    const items = $$('li', journey);
    const readout = $('[data-readout]', gauge);
    const angles = [-66, -18, 32, 70];
    const labels = ['Footprint measured', 'Emissions going down', 'Savings verified', 'Credits earned!'];
    let timer = null;
    let userSet = false;
    const setStep = i => {
      items.forEach((li, k) => {
        li.classList.toggle('is-on', k === i);
        li.classList.toggle('is-done', k < i);
        $('button', li).setAttribute('aria-pressed', String(k === i));
      });
      gauge.style.setProperty('--angle', angles[i] + 'deg');
      gauge.dataset.step = String(i);
      const label = d.createElement('span');
      label.textContent = labels[i];
      readout.replaceChildren(`Step ${i + 1} · `, label);
    };
    items.forEach((li, k) => $('button', li).addEventListener('click', () => {
      userSet = true;
      clearInterval(timer);
      setStep(k);
    }));
    setStep(0);
    const gio = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      gio.disconnect();
      if (reduced()) { setStep(3); return; }
      let k = 0;
      timer = setInterval(() => {
        if (userSet || k >= 3) { clearInterval(timer); return; }
        setStep(++k);
      }, 1500);
    }, { threshold: .45 });
    gio.observe(gauge);
  }

  /* ---------- Founder cards: gentle 3D tilt ---------- */
  if (fineMQ.matches && !reduced()) {
    $$('.founder').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        c.style.setProperty('--ry', (x * 12).toFixed(2) + 'deg');
        c.style.setProperty('--rx', (y * -10).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', () => {
        c.style.setProperty('--rx', '0deg');
        c.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$('.qa').forEach(qa => {
    const b = $('.qa__q', qa);
    b.addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      qa.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Toast + leaf burst ---------- */
  const toastEl = $('.toast');
  const toastText = $('[data-toast]');
  let toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastText.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 3200);
  }

  const leafColors = ['#17B26A', '#47CD89', '#A6EF67', '#FDB022', '#75E0A7'];
  function burst(x, y) {
    if (reduced() || !Element.prototype.animate) return;
    for (let i = 0; i < 14; i++) {
      const el = d.createElement('i');
      el.className = 'leaf-bit';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.background = leafColors[i % leafColors.length];
      d.body.appendChild(el);
      const a = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 70;
      const dx = Math.cos(a) * dist;
      const dy = Math.sin(a) * dist - 40;
      const rot = Math.round(Math.random() * 540 - 270);
      el.animate([
        { transform: 'translate(-50%, -50%) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${rot}deg)`, opacity: 1, offset: .7 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 34}px)) scale(.8) rotate(${rot + 40}deg)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => el.remove();
    }
  }
  function burstFrom(el, e) {
    const r = el.getBoundingClientRect();
    const x = e && e.clientX ? e.clientX : r.left + r.width / 2;
    const y = e && e.clientY ? e.clientY : r.top + r.height / 2;
    burst(x, y);
  }
  $$('[data-burst]').forEach(b => b.addEventListener('click', e => burstFrom(b, e)));

  /* ---------- Enquiry form → pre-filled email ---------- */
  const form = $('#enquiry');
  if (form) {
    const f = form.elements;
    const setErr = (input, msg, silent) => {
      const field = input.closest('.field');
      const err = $('.field__err', field);
      field.classList.toggle('is-error', Boolean(msg));
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg && !silent ? msg : '';
    };
    [f.name, f.phone, f.email].forEach(i => i.addEventListener('input', () => setErr(i, '')));

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = f.name.value.trim();
      const phone = f.phone.value.trim();
      const email = f.email.value.trim();
      const msg = f.message.value.trim();
      let ok = true;
      [f.name, f.phone, f.email].forEach(i => setErr(i, ''));
      if (!name) { setErr(f.name, 'Please tell us your name.'); ok = false; }
      if (!phone && !email) {
        setErr(f.phone, 'Add a phone number or an email so we can reply.');
        setErr(f.email, 'missing', true);
        ok = false;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr(f.email, "That email doesn't look right."); ok = false; }
      if (phone && phone.replace(/\D/g, '').length < 8) { setErr(f.phone, 'Please check the phone number.'); ok = false; }
      if (!ok) {
        const bad = $('.field.is-error input', form);
        if (bad) bad.focus();
        toast('Please check the highlighted fields.');
        return;
      }
      const interests = $$('input[name="interest"]:checked', form).map(i => i.value);
      const lines = [`Name: ${name}`];
      if (phone) lines.push(`Phone: ${phone}`);
      if (email) lines.push(`Email: ${email}`);
      if (interests.length) lines.push(`Interested in: ${interests.join(', ')}`);
      if (msg) lines.push('', msg);
      const subject = `Nuform Green enquiry — ${name}`;
      const href = `mailto:info@nuformsocial.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      burstFrom($('button[type="submit"]', form));
      toast('Opening your email app…');
      setTimeout(() => { location.href = href; }, 400);
    });
  }

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const text = b.dataset.copy;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {
      const ta = d.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      d.body.appendChild(ta);
      ta.select();
      try { ok = d.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
    }
    if (!ok) { toast(text); return; }
    b.classList.add('is-copied');
    toast('Email copied');
    setTimeout(() => b.classList.remove('is-copied'), 1800);
  }));

  /* ---------- Magnetic buttons ---------- */
  if (fineMQ.matches && !reduced()) {
    $$('[data-magnetic]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * .2).toFixed(1) + 'px');
        b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', () => {
        b.style.setProperty('--tx', '0px');
        b.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ---------- Misc ---------- */
  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => onFontsReady.forEach(fn => fn()));
})();
