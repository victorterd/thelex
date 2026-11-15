/* The Lex Bakehouse — v5 · motion minimal
   Puțin, lent, precis. Fără JS sau cu reduced-motion pagina e completă. */
(function () {
  "use strict";
  var html = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var ok = !reduce && window.gsap && window.ScrollTrigger && window.SplitText && window.Lenis;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function navScroll(getY) {
    var nav = $(".nav"), last = 0;
    return function () {
      var y = getY();
      nav.classList.toggle("is-solid", y > 40);
      if (y > 300 && y > last + 4) nav.classList.add("is-hidden");
      else if (y < last - 4 || y < 300) nav.classList.remove("is-hidden");
      last = y;
    };
  }

  function lite() {
    html.classList.add("ready");
    var f = navScroll(function () { return window.scrollY; });
    window.addEventListener("scroll", f, { passive: true });
  }

  function full() {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    gsap.defaults({ ease: "expo.out", duration: 1.2 });

    /* ---- scroll lin ---- */
    var lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    var y = 0, onNav = navScroll(function () { return y; });
    lenis.on("scroll", function (e) { y = e.scroll; onNav(); });
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var id = a.getAttribute("href");
        var t = id === "#top" ? 0 : $(id);
        if (t === null) return;
        ev.preventDefault();
        lenis.scrollTo(t, { duration: 1.6, offset: id === "#top" ? 0 : -20, easing: function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; } });
      });
    });

    /* ---- intrare ---- */
    var lines = $$(".hero__title .line > span");
    gsap.set(lines, { yPercent: 105 });
    gsap.set(".hero__pic", { scale: 0, rotation: -20 });
    gsap.set(".hero__meta p, .hero__foot > *", { autoAlpha: 0, y: 14 });
    gsap.set(".nav", { autoAlpha: 0 });

    var tl = gsap.timeline({ onComplete: function () { lenis.start(); } });
    tl.fromTo(".curtain img", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .8 })
      .to(".curtain img", { autoAlpha: 0, y: -10, duration: .5, ease: "power2.in" }, "+=.25")
      .to(".curtain", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=.15")
      .add(function () { html.classList.add("ready"); })
      .to(lines, { yPercent: 0, duration: 1.4, stagger: .09 }, "-=.55")
      .to(".hero__pic", { scale: 1, rotation: 0, duration: 1.4 }, "-=1.05")
      .to(".hero__meta p, .hero__foot > *", { autoAlpha: 1, y: 0, duration: 1, stagger: .06 }, "-=1.1")
      .to(".nav", { autoAlpha: 1, duration: .8 }, "-=1");

    /* poza din titlu se rotește lent cu scroll-ul */
    gsap.to(".hero__pic img", { rotation: 25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__title", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    /* ---- titluri de secțiune: litere dintr-o mască ---- */
    $$("[data-reveal]").forEach(function (el) {
      var s = SplitText.create(el, { type: "chars", mask: "chars" });
      gsap.from(s.chars, { yPercent: 110, stagger: .025, scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$(".sec-head__no, .sec-head__note").forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 12, scrollTrigger: { trigger: el, start: "top 90%" } });
    });

    /* ---- text atelier: cuvinte din măști ---- */
    $$("[data-words]").forEach(function (el) {
      var s = SplitText.create(el, { type: "lines", mask: "lines" });
      gsap.from(s.lines, { yPercent: 105, stagger: .08, duration: 1.3, scrollTrigger: { trigger: el, start: "top 80%" } });
    });

    /* ---- rândurile vitrinei ---- */
    $$(".row").forEach(function (row) {
      var parts = [$(".row__no", row), $(".row__thumb", row), $(".row__main", row), $(".row__price", row), $(".row__go", row)];
      gsap.from(parts.filter(Boolean), { autoAlpha: 0, y: 30, stagger: .04, duration: 1.1, scrollTrigger: { trigger: row, start: "top 90%" } });
    });

    /* ---- previzualizare care urmărește cursorul ---- */
    var pv = $(".preview");
    if (fine && pv) {
      var inner = $(".preview__inner", pv), imgs = $$("img", pv), cur = -1;
      var px = gsap.quickTo(pv, "x", { duration: .7, ease: "power3.out" });
      var py = gsap.quickTo(pv, "y", { duration: .7, ease: "power3.out" });
      var pr = gsap.quickTo(pv, "rotation", { duration: .9, ease: "power3.out" });
      var lastX = 0;
      gsap.set(pv, { autoAlpha: 1 });
      window.addEventListener("mousemove", function (e) {
        px(e.clientX); py(e.clientY);
        pr(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * .4));
        lastX = e.clientX;
      }, { passive: true });
      $$(".row").forEach(function (row) {
        row.addEventListener("mouseenter", function () {
          var k = +row.dataset.img;
          if (k !== cur) {
            imgs.forEach(function (im, j) { im.classList.toggle("is-on", j === k); });
            if (cur !== -1) gsap.fromTo(imgs[k], { scale: 1.15 }, { scale: 1, duration: .8 });
            cur = k;
          }
          gsap.to(inner, { clipPath: "inset(0% 0% 0% 0%)", duration: .8, ease: "expo.out", overwrite: true });
        });
      });
      $(".rows").addEventListener("mouseleave", function () {
        gsap.to(inner, { clipPath: "inset(50% 50% 50% 50%)", duration: .6, ease: "expo.inOut", overwrite: true });
        cur = -1;
      });
    }

    /* ---- parallax atelier ---- */
    $$("[data-par]").forEach(function (fig) {
      var v = +fig.dataset.par;
      gsap.fromTo(fig, { yPercent: v }, { yPercent: -v, ease: "none", scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from(fig, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: fig, start: "top 85%" } });
      gsap.fromTo($("img", fig), { scale: 1.25 }, { scale: 1, duration: 2, scrollTrigger: { trigger: fig, start: "top 85%" } });
    });

    /* ---- pași ---- */
    gsap.from(".steps li", { autoAlpha: 0, y: 40, stagger: .12, scrollTrigger: { trigger: ".steps", start: "top 85%" } });

    /* ---- CTA ---- */
    gsap.from(".cta__line > span", { yPercent: 105, stagger: .12, duration: 1.4, scrollTrigger: { trigger: ".cta__big", start: "top 85%" } });
    gsap.from(".cta__kicker, .cta__tel", { autoAlpha: 0, y: 16, scrollTrigger: { trigger: ".cta", start: "top 70%" } });

    /* ---- footer: logo-ul crește din linie ---- */
    gsap.fromTo(".footer__logo", { yPercent: 40, clipPath: "inset(0% 0% 100% 0%)" }, {
      yPercent: 0, clipPath: "inset(0% 0% 0% 0%)", ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true }
    });

    /* ---- nav activ ---- */
    ["vitrina", "atelier", "comanda"].forEach(function (id) {
      var s = document.getElementById(id), l = $('.nav__links a[href="#' + id + '"]');
      if (s && l) ScrollTrigger.create({ trigger: s, start: "top 50%", end: "bottom 50%", onToggle: function (st) { l.classList.toggle("is-active", st.isActive); } });
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  function init() {
    var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
    if (!ok) return lite();
    try { full(); } catch (err) { console.error(err); gsap.globalTimeline.clear(); gsap.set("*", { clearProps: "all" }); lite(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
