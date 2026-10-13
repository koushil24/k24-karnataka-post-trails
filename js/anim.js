/* Motion layer. GSAP + ScrollTrigger (from CDN) enhance the hero/parallax when available;
   everything else is CSS + IntersectionObserver so the site still animates (or simply shows) without them. */
(function () {
  const K = window.K24;
  let cleanups = [];
  const gs = () => window.gsap;
  const st = () => window.ScrollTrigger;

  function onView(els, fn) {
    if (!els.length) return;
    if (K.reduced() || !('IntersectionObserver' in window)) { els.forEach((e) => fn(e, true)); return; }
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); fn(en.target, false); } }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach((e) => io.observe(e)); cleanups.push(() => io.disconnect());
  }
  function countUp(el, instant) {
    const to = Number(el.dataset.count) || 0, fmt = el.dataset.format === 'inr' ? K.inr : (n) => String(Math.round(n));
    if (instant || to === 0) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1100;
    (function tick(t) { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(to); })(t0);
  }
  function whenLoaderDone(fn) {
    let called = false; const go = () => { if (!called) { called = true; fn(); } };
    if (window.__k24LoaderDone) go(); else { window.addEventListener('k24:loaderdone', go, { once: true }); setTimeout(go, 6500); }
  }
  function hero(root) {
    const h = K.$('.hero', root); if (!h) return;
    const useG = !!gs() && !K.reduced(); h.dataset.engine = useG ? 'gsap' : 'css';
    whenLoaderDone(() => {
      h.classList.add('hero-ready');
      if (!useG) return;
      try {
        const g = gs(); g.timeline({ defaults: { ease: 'power3.out' }, onComplete() { g.set(h.querySelectorAll('.word,.hero-sub,.hero-cta,.hero-stamp,.hero-logo,.hero-mark'), { clearProps: 'transform,opacity' }); } })
          .from('.hero-bg', { scale: 1.12, duration: 2.4, ease: 'power2.out' }, 0)
          .from('.hero-logo', { opacity: 0, y: -10, duration: 0.7 }, 0.1)
          .from('.hero .word', { yPercent: 115, opacity: 0, duration: 0.95, stagger: 0.09 }, 0.25)
          .from('.hero-sub, .hero-cta', { y: 18, opacity: 0, duration: 0.8, stagger: 0.15 }, 1)
          .from('.hero-stamp', { rotation: -26, scale: 0.7, opacity: 0, y: -40, duration: 1.3, ease: 'back.out(1.4)' }, 1.1)
          .from('.hero-mark', { opacity: 0, scale: 0.9, duration: 0.8 }, 1.4);
        if (st()) {
          g.registerPlugin(st());
          K.$$('[data-depth]', h).forEach((el) => g.to(el, { yPercent: Number(el.dataset.depth) * -16, ease: 'none', scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: true } }));
        }
      } catch (e) { h.dataset.engine = 'css'; }
    });
  }
  function run(root) {
    root = root || document; const red = K.reduced();
    K.$$('[data-stagger]', root).forEach((p) => Array.from(p.children).forEach((c, i) => c.style.setProperty('--i', Math.min(i, 12))));
    onView(K.$$('[data-reveal]', root), (e) => e.classList.add('in'));
    onView(K.$$('[data-count]', root), (e, instant) => countUp(e, instant));
    onView(K.$$('[data-progress]', root), (e) => { e.style.width = Math.max(0, Math.min(100, Number(e.dataset.progress) || 0)) + '%'; });
    hero(root);
  }
  function listIn(el) { if (!el || K.reduced()) return; el.classList.remove('list-in'); void el.offsetWidth; el.classList.add('list-in'); }
  function cleanup() { cleanups.forEach((f) => { try { f(); } catch (e) {} }); cleanups = []; if (st() && st().getAll) st().getAll().forEach((t) => t.kill()); }
  K.anim = { run, cleanup, listIn, countUp };
})();
(window.K24.mods = window.K24.mods || {})['anim'] = '2026.10.13a';
