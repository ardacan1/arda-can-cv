/* Arda Can — etkileşim & animasyonlar (GSAP + ScrollTrigger + SplitText + Lenis) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined";

  /* ---------- Her durumda çalışanlar ---------- */
  $("#year").textContent = new Date().getFullYear();

  const clockEl = $("#clock");
  const fmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Istanbul" });
  const tick = () => { clockEl.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 1000);

  // Yaş: doğum tarihinden otomatik
  const birth = new Date(2006, 11, 15), now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  const ageEl = $("#age");
  ageEl.dataset.to = age; ageEl.textContent = age;

  // E-posta kopyala
  const copyBtn = $(".copy");
  copyBtn.addEventListener("click", async () => {
    const label = $(".copy__label", copyBtn);
    try { await navigator.clipboard.writeText(copyBtn.dataset.copy); label.textContent = "Kopyalandı!"; }
    catch { label.textContent = copyBtn.dataset.copy; }
    setTimeout(() => { label.textContent = "Adresi kopyala"; }, 2000);
  });

  // Mobil menü
  const menuBtn = $(".menu-btn");
  const menu = $("#mobile-menu");
  const menuHooks = { open: () => {}, close: () => {} };
  const setMenu = open => {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    open ? menuHooks.open() : menuHooks.close();
  };
  const closeMenu = () => { if (!menu.hidden) setMenu(false); };
  menuBtn.addEventListener("click", () => setMenu(menu.hidden));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  window.matchMedia("(min-width: 761px)").addEventListener("change", e => e.matches && closeMenu());

  if (!hasGsap) {
    $(".intro")?.remove();
    $$("#mobile-menu a").forEach(a => a.addEventListener("click", closeMenu));
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  menuHooks.open = () => {
    lenis?.stop();
    if (!reduce) gsap.from("#mobile-menu .mmenu__list li, #mobile-menu .mmenu__mail", { y: 40, opacity: 0, duration: .6, stagger: .05, ease: "expo.out" });
  };
  menuHooks.close = () => { lenis?.start(); };

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const target = $(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      history.replaceState(null, "", a.getAttribute("href"));
    });
  });

  /* ---------- Kat göstergesi ---------- */
  const floorVal = $(".floor__val");
  const floorName = $(".floor__name");
  const dots = $$(".floor__dots li");
  const navLinks = $$(".nav__links a");
  let currentFloor = 0;
  const setFloor = (n, name, id) => {
    if (n === currentFloor) return;
    const dir = n > currentFloor ? 1 : -1;
    currentFloor = n;
    floorName.textContent = name;
    dots.forEach(d => d.classList.toggle("is-on", +d.dataset.i <= n));
    navLinks.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id));
    if (reduce) { floorVal.textContent = n; return; }
    gsap.timeline()
      .to(floorVal, { yPercent: -100 * dir, opacity: 0, duration: .18, ease: "power2.in" })
      .add(() => { floorVal.textContent = n; })
      .fromTo(floorVal, { yPercent: 100 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .3, ease: "back.out(2)" });
  };
  dots[0].classList.add("is-on");
  $$("[data-floor]").forEach(sec => {
    ScrollTrigger.create({
      trigger: sec, start: "top 55%", end: "bottom 55%",
      onToggle: self => self.isActive && setFloor(+sec.dataset.floor, sec.dataset.floorName, sec.id),
    });
  });

  /* ---------- Nav gizle / göster ---------- */
  const nav = $(".nav");
  var introDone = false;
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (introDone || reduce) nav.classList.toggle("is-hidden", y > lastY && y > 400);
    lastY = y;
  }, { passive: true });

  /* ---------- Scroll ilerleme çubuğu ---------- */
  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

  if (reduce) { $(".intro")?.remove(); document.body.classList.remove("is-loading"); return; }

  /* ================= Animasyonlar (reduced motion dışında) ================= */

  /* ---------- Intro: asansör yukarı çıkıp kapı açılıyor ---------- */
  document.body.classList.add("is-loading");
  nav.classList.add("is-hidden");
  const introFloor = $(".intro__floor");
  const counter = { v: -3 };
  const intro = gsap.timeline({ defaults: { ease: "expo.inOut" } });
  intro
    .to(counter, {
      v: 0, duration: 1.1, ease: "steps(3)",
      onUpdate: () => { introFloor.textContent = Math.round(counter.v) === 0 ? "0" : Math.round(counter.v); },
    })
    .to(".intro__panel", { scale: 1.08, duration: .15, yoyo: true, repeat: 1, ease: "power1.inOut" })
    .to(".intro__panel", { opacity: 0, y: -10, duration: .3, ease: "power2.in" }, "+=.1")
    .to(".intro__door--l", { xPercent: -100, duration: 1.1 }, "<.1")
    .to(".intro__door--r", { xPercent: 100, duration: 1.1 }, "<")
    .add(() => { $(".intro").remove(); document.body.classList.remove("is-loading"); });

  /* ---------- Hero girişi ---------- */
  const heroLines = $$(".hero .split");
  gsap.set(heroLines, { yPercent: 110 });
  intro
    .to(heroLines, { yPercent: 0, duration: 1.1, stagger: .12, ease: "expo.out" }, "-=.75")
    .from(".hero__eyebrow", { y: 16, opacity: 0, duration: .6, ease: "power3.out" }, "<.1")
    .from(".hero__lead", { y: 20, opacity: 0, duration: .7, ease: "power3.out" }, "<.15")
    .from(".hero__ctas .btn", { y: 20, opacity: 0, duration: .6, stagger: .08, ease: "power3.out" }, "<.1")
    .from(".photo", { y: 60, rotate: -4, opacity: 0, duration: 1.2, ease: "expo.out" }, "<-.5")
    .from(".chip", { scale: .4, opacity: 0, duration: .7, stagger: .1, ease: "back.out(2)" }, "<.4")
    .add(() => { introDone = true; nav.classList.remove("is-hidden"); }, "<")
    .from(".floor", { x: 80, opacity: 0, duration: .8, ease: "expo.out" }, "<");

  // Fotoğraf parlama efekti
  gsap.to(".photo__shine", { backgroundPosition: "-120% 0", duration: 2.4, ease: "power2.inOut", repeat: -1, repeatDelay: 3, delay: 3 });

  // Yüzen chip'ler
  $$(".chip").forEach((c, i) => {
    gsap.to(c, { y: i % 2 ? 10 : -10, duration: 2.4 + i * .4, ease: "sine.inOut", yoyo: true, repeat: -1 });
  });

  // Hero scroll'da hafif uzaklaşma
  const desktop = window.matchMedia("(min-width: 861px)").matches;
  if (desktop) gsap.to(".hero__text", { yPercent: -18, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  if (desktop) gsap.to(".photo", { yPercent: 12, rotate: 3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Fotoğraf 3D tilt ---------- */
  if (finePointer) {
    const photo = $(".photo");
    const rx = gsap.quickTo(photo, "rotationX", { duration: .6, ease: "power3.out" });
    const ry = gsap.quickTo(photo, "rotationY", { duration: .6, ease: "power3.out" });
    const area = $(".hero__visual");
    area.addEventListener("pointermove", e => {
      const r = area.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      ry(px * 18); rx(-py * 18);
    });
    area.addEventListener("pointerleave", () => { rx(0); ry(0); });
  }

  /* ---------- Arka plan blob parallax ---------- */
  const blobs = $$(".blob");
  if (desktop) blobs.forEach((b, i) => {
    gsap.to(b, { x: (i % 2 ? -1 : 1) * 60, y: (i - 1) * 50, scale: 1.1, duration: 8 + i * 2, ease: "sine.inOut", yoyo: true, repeat: -1 });
  });
  if (finePointer) {
    const movers = blobs.map((b, i) => ({
      x: gsap.quickTo(b, "xPercent", { duration: 2, ease: "power3.out" }),
      y: gsap.quickTo(b, "yPercent", { duration: 2, ease: "power3.out" }),
      f: (i + 1) * 4,
    }));
    window.addEventListener("pointermove", e => {
      const px = e.clientX / innerWidth - .5, py = e.clientY / innerHeight - .5;
      movers.forEach(m => { m.x(px * m.f); m.y(py * m.f); });
    });
  }

  /* ---------- Özel imleç ---------- */
  if (finePointer) {
    const cursor = $(".cursor");
    const cx = gsap.quickTo(cursor, "x", { duration: .25, ease: "power3.out" });
    const cy = gsap.quickTo(cursor, "y", { duration: .25, ease: "power3.out" });
    window.addEventListener("pointermove", e => { cx(e.clientX); cy(e.clientY); gsap.to(cursor, { opacity: 1, duration: .3 }); }, { passive: true });
    document.addEventListener("pointerleave", () => gsap.to(cursor, { opacity: 0, duration: .3 }));
    $$("a, button, .ability").forEach(el => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Manyetik butonlar ---------- */
  if (finePointer) {
    $$(".magnetic").forEach(el => {
      const mx = gsap.quickTo(el, "x", { duration: .5, ease: "elastic.out(1, .4)" });
      const my = gsap.quickTo(el, "y", { duration: .5, ease: "elastic.out(1, .4)" });
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3);
        my((e.clientY - r.top - r.height / 2) * .4);
      });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  }

  /* ---------- Bölüm başlıkları: harf harf ---------- */
  document.fonts.ready.then(() => {
    $$(".split-words").forEach(h => {
      const split = SplitText.create(h, { type: "chars,words", mask: "words" });
      gsap.from(split.chars, {
        yPercent: 110, rotate: 8, duration: .9, stagger: .025, ease: "expo.out",
        scrollTrigger: { trigger: h, start: "top 85%" },
      });
    });

    const contactLines = $$(".contact .split");
    gsap.set(contactLines, { yPercent: 110 });
    gsap.to(contactLines, {
      yPercent: 0, duration: 1.1, stagger: .14, ease: "expo.out",
      scrollTrigger: { trigger: ".contact", start: "top 70%" },
    });
    ScrollTrigger.refresh();
  });

  /* ---------- Genel reveal ---------- */
  gsap.set(".reveal", { y: 50, opacity: 0 });
  ScrollTrigger.batch(".reveal", {
    start: "top 90%",
    once: true,
    onEnter: els => gsap.to(els, { y: 0, opacity: 1, duration: .9, stagger: .09, ease: "expo.out", overwrite: true }),
  });

  /* ---------- Sayaçlar ---------- */
  $$(".count").forEach(el => {
    const to = +el.dataset.to;
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 1.6, ease: "power3.out",
      onUpdate: () => { el.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  // Vurgu çizgisi ve ilerleme çubuğu
  gsap.fromTo(".hl", { "--hl": 0 }, { "--hl": 1, duration: 1, ease: "expo.out", delay: .4, scrollTrigger: { trigger: ".hl", start: "top 85%", once: true } });
  gsap.from(".steps li span", { scaleX: 0, duration: .8, stagger: .12, ease: "expo.out", scrollTrigger: { trigger: ".steps", start: "top 92%", once: true } });

  /* ---------- Dil seviyeleri ---------- */
  $$(".cefr").forEach(c => {
    gsap.from($$("li.on", c), {
      scale: .5, opacity: 0, duration: .5, stagger: .07, ease: "back.out(2.2)",
      scrollTrigger: { trigger: c, start: "top 90%", once: true },
    });
  });

  /* ---------- Yetkinlik ikonları ---------- */
  $$(".ability__icon").forEach((ic, i) => {
    gsap.from(ic, { rotate: -90, scale: 0, duration: .8, delay: i * .08, ease: "back.out(1.8)", scrollTrigger: { trigger: ".abilities", start: "top 85%", once: true } });
  });

  /* ---------- Timeline çizgisi ---------- */
  gsap.to(".timeline__line span", {
    scaleY: 1, ease: "none",
    scrollTrigger: { trigger: ".timeline", start: "top 70%", end: "bottom 60%", scrub: .4 },
  });

  /* ---------- Marquee hız/eğim tepkisi ---------- */
  const track = $(".marquee__track");
  const skew = gsap.quickTo(track, "skewX", { duration: .4, ease: "power3.out" });
  const unskew = gsap.delayedCall(.15, () => skew(0)).pause();
  ScrollTrigger.create({
    onUpdate: self => { skew(gsap.utils.clamp(-12, 12, self.getVelocity() / -250)); unskew.restart(true); },
  });
})();
