/* The Lex Bakehouse — v4 interactions
   GSAP (ScrollTrigger, SplitText, Flip) + Lenis.
   Fără JS sau cu reduced-motion: pagina e completă și statică,
   caruselul și filtrele funcționează fără animație. */
(function () {
  "use strict";

  var html = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var full = !reduce && typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined" &&
             typeof window.Lenis !== "undefined" && typeof window.SplitText !== "undefined";

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ============================================================
     Componente comune (merg și fără GSAP)
     ============================================================ */

  /* ---- carusel hero ---- */
  function initShow(animate) {
    var show = $("[data-show]");
    if (!show) return null;
    var imgs = $$(".show__img", show);
    var countEl = $(".show__count b", show);
    var nameEl = $(".show__name", show);
    var priceEl = $(".show__price", show);
    var bar = $(".show__progress i", show);
    var i = 0, busy = false, timer = null, prog = null, paused = false;
    var DUR = 4.6;

    function caption(k) {
      var d = imgs[k].dataset;
      var set = function () {
        countEl.textContent = String(k + 1).padStart(2, "0");
        nameEl.textContent = d.name;
        nameEl.href = d.href;
        priceEl.textContent = d.price;
      };
      if (!animate) return set();
      gsap.timeline()
        .to([nameEl, priceEl, countEl], { yPercent: -60, autoAlpha: 0, duration: 0.22, ease: "power2.in", stagger: 0.03 })
        .add(set)
        .fromTo([nameEl, priceEl, countEl], { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out", stagger: 0.04 });
    }

    function go(dir, to) {
      if (busy) return;
      var next = typeof to === "number" ? to : (i + dir + imgs.length) % imgs.length;
      if (next === i) return;
      var out = imgs[i], inn = imgs[next];
      i = next;
      caption(next);
      if (!animate) {
        out.classList.remove("is-active");
        inn.classList.add("is-active");
        return;
      }
      busy = true;
      gsap.set(inn, { autoAlpha: 1 });
      inn.classList.add("is-active");
      gsap.timeline({ onComplete: function () { out.classList.remove("is-active"); busy = false; } })
        .to(out, { xPercent: -55 * dir, rotation: -14 * dir, scale: 0.78, autoAlpha: 0, duration: 0.75, ease: "power3.inOut" })
        .fromTo(inn, { xPercent: 55 * dir, rotation: 14 * dir, scale: 0.78, autoAlpha: 0 },
                     { xPercent: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.95, ease: "expo.out" }, 0.18);
      restart();
    }

    function restart() {
      if (!animate) return;
      if (prog) prog.kill();
      gsap.set(bar, { scaleX: 0 });
      prog = gsap.to(bar, { scaleX: 1, duration: DUR, ease: "none", paused: paused, onComplete: function () { go(1); } });
    }

    $$(".show__btn", show).forEach(function (b) {
      b.addEventListener("click", function () { go(parseInt(b.dataset.dir, 10)); });
    });
    show.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    });

    if (animate) {
      var pause = function () { paused = true; if (prog) prog.pause(); };
      var play = function () { paused = false; if (prog) prog.play(); };
      show.addEventListener("mouseenter", pause);
      show.addEventListener("mouseleave", play);
      show.addEventListener("focusin", pause);
      show.addEventListener("focusout", play);
      document.addEventListener("visibilitychange", function () { document.hidden ? pause() : play(); });

      /* swipe pe mobil */
      var sx = null;
      show.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
      show.addEventListener("touchend", function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        sx = null;
      });
    }
    return { start: restart };
  }

  /* ---- filtre vitrină ---- */
  function initTabs(animate) {
    var tabs = $(".tabs");
    if (!tabs) return;
    var pill = $(".tabs__pill", tabs);
    var btns = $$(".tabs__btn", tabs);
    var items = $$(".item");

    function placePill(btn) {
      pill.style.left = btn.offsetLeft + "px";
      pill.style.width = btn.offsetWidth + "px";
    }
    var active = $(".tabs__btn.is-active", tabs);
    placePill(active);
    window.addEventListener("resize", function () { placePill($(".tabs__btn.is-active", tabs)); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placePill($(".tabs__btn.is-active", tabs)); });

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("is-active")) return;
        btns.forEach(function (b) { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        placePill(btn);
        var f = btn.dataset.filter;
        var state = animate && window.Flip ? Flip.getState(items) : null;
        items.forEach(function (it) { it.classList.toggle("is-hidden", f !== "all" && it.dataset.cat !== f); });
        if (state) {
          Flip.from(state, {
            duration: 0.75, ease: "expo.inOut", absolute: true, scale: true,
            onEnter: function (els) { return gsap.fromTo(els, { autoAlpha: 0, scale: 0.9, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: "expo.out", delay: 0.15 }); },
            onLeave: function (els) { return gsap.to(els, { autoAlpha: 0, scale: 0.9, duration: 0.35, ease: "power2.in" }); },
            onComplete: function () { ScrollTrigger.refresh(); }
          });
        }
      });
    });
  }

  /* ---- dock mobil ---- */
  function initDock(getY) {
    var dock = $(".dock");
    var hero = $(".hero");
    var cta = $(".cta");
    var footer = $(".footer");
    if (!dock || !hero) return function () {};
    return function () {
      var y = getY();
      var heroEnd = hero.offsetTop + hero.offsetHeight - 80;
      var vh = window.innerHeight;
      var ctaTop = cta ? cta.getBoundingClientRect().top : Infinity;
      var footTop = footer ? footer.getBoundingClientRect().top : Infinity;
      var nearEnd = ctaTop < vh * 0.75 && footTop > -1e9;
      dock.classList.toggle("is-on", y > heroEnd && !nearEnd);
    };
  }

  /* ============================================================
     Varianta statică
     ============================================================ */
  function initLite() {
    html.classList.add("loaded");
    initShow(false);
    initTabs(false);
    var progress = $(".progress i");
    var nav = $(".nav");
    var dock = initDock(function () { return window.scrollY; });
    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);
      dock();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     Experiența completă
     ============================================================ */
  function initFull() {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    if (window.Flip) gsap.registerPlugin(Flip);
    gsap.defaults({ ease: "expo.out", duration: 0.9 });

    /* ---- Lenis ---- */
    var lenis = new Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var t = $(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(id === "#top" ? 0 : t, { offset: -70, duration: 1.4, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
      });
    });

    /* ---- scroll: progres, nav, dock ---- */
    var setProg = gsap.quickSetter(".progress i", "scaleX");
    var nav = $(".nav");
    var topbarH = ($(".topbar") || { offsetHeight: 0 }).offsetHeight;
    var lastY = 0;
    var currentY = 0;
    var dock = initDock(function () { return currentY; });
    lenis.on("scroll", function (e) {
      var y = e.scroll;
      currentY = y;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      setProg(max > 0 ? y / max : 0);
      nav.classList.toggle("scrolled", y > topbarH + 4);
      if (y > 260 && y > lastY + 3) nav.classList.add("nav--hidden");
      else if (y < lastY - 3 || y < 260) nav.classList.remove("nav--hidden");
      lastY = y;
      dock();
    });

    /* ---- componente ---- */
    var show = initShow(true);
    initTabs(true);

    /* ---- stări inițiale hero ---- */
    var h1 = $(".hero__title");
    var h1Split = SplitText.create(h1, { type: "words", mask: "words" });
    gsap.set(h1Split.words, { yPercent: 110 });
    gsap.set(".hero__eyebrow,.hero__lead,.hero__cta,.hero__facts", { autoAlpha: 0, y: 24 });
    gsap.set(".show__arch", { clipPath: "inset(100% 0% 0% 0% round 999px 999px 34px 34px)" });
    gsap.set(".show__img.is-active", { scale: 0.7, yPercent: 18, autoAlpha: 0 });
    gsap.set(".show__caption", { autoAlpha: 0, y: 20 });
    gsap.set(".badge", { autoAlpha: 0, scale: 0.5, rotation: -40 });

    function heroIntro() {
      return gsap.timeline()
        .to(".hero__eyebrow", { autoAlpha: 1, y: 0, duration: 0.8 })
        .to(h1Split.words, { yPercent: 0, duration: 1.15, stagger: 0.055 }, 0.05)
        .to(".show__arch", { clipPath: "inset(0% 0% 0% 0% round 999px 999px 34px 34px)", duration: 1.35, ease: "expo.inOut" }, 0.1)
        .to(".show__img.is-active", { scale: 1, yPercent: 0, autoAlpha: 1, duration: 1.2 }, 0.75)
        .to(".hero__lead", { autoAlpha: 1, y: 0 }, 0.6)
        .to(".hero__cta", { autoAlpha: 1, y: 0 }, 0.72)
        .to(".hero__facts", { autoAlpha: 1, y: 0 }, 0.84)
        .to(".show__caption", { autoAlpha: 1, y: 0 }, 1.05)
        .to(".badge", { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.1, ease: "back.out(1.6)" }, 1.1)
        .add(function () { if (show) show.start(); });
    }

    /* ---- loader ---- */
    var loader = $(".loader");
    var seen = false;
    try { seen = sessionStorage.getItem("lex-seen") === "1"; } catch (e) {}
    var intro = gsap.timeline({
      onComplete: function () { lenis.start(); try { sessionStorage.setItem("lex-seen", "1"); } catch (e) {} }
    });
    if (loader && !seen) {
      intro.fromTo(".loader__logo", { autoAlpha: 0, y: 12, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 })
           .to(".loader__bar i", { scaleX: 1, duration: 0.85, ease: "power2.inOut" }, 0.1)
           .to(".loader__inner", { autoAlpha: 0, y: -16, duration: 0.4, ease: "power2.in" }, "+=0.1")
           .to(loader, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.85, ease: "expo.inOut" }, "-=0.1")
           .add(function () { html.classList.add("loaded"); })
           .add(heroIntro(), "-=0.45");
    } else {
      if (loader) intro.to(loader, { autoAlpha: 0, duration: 0.35, ease: "power2.out" });
      intro.add(function () { html.classList.add("loaded"); }).add(heroIntro(), "-=0.15");
    }

    /* ---- hero: parallax + înclinare la mouse ---- */
    var heroST = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to(".show", { yPercent: 10, scrollTrigger: heroST });
    gsap.to(".hero__copy", { yPercent: -6, autoAlpha: 0.35, scrollTrigger: heroST });
    if (fine) {
      var stage = $(".show__stage");
      var arch = $(".show__arch");
      var sx = gsap.quickTo(stage, "x", { duration: 0.8, ease: "power3.out" });
      var sy = gsap.quickTo(stage, "y", { duration: 0.8, ease: "power3.out" });
      var sr = gsap.quickTo(stage, "rotation", { duration: 0.8, ease: "power3.out" });
      arch.addEventListener("mousemove", function (e) {
        var r = arch.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        sx(px * 26); sy(py * 18); sr(px * 5);
      });
      arch.addEventListener("mouseleave", function () { sx(0); sy(0); sr(0); });
    }

    /* ---- marquee reactiv la viteza scroll-ului ---- */
    var mq = $(".mq");
    if (mq) {
      mq.classList.add("is-gsap");
      var loop = gsap.to(".mq__track", { xPercent: -50, duration: 46, ease: "none", repeat: -1 });
      var speed = { v: 1 };
      ScrollTrigger.create({
        trigger: mq, start: "top bottom", end: "bottom top",
        onUpdate: function (self) {
          var v = Math.min(Math.abs(self.getVelocity()) / 260, 6);
          var dir = self.direction;
          gsap.to(speed, { v: (1 + v) * dir, duration: 0.25, overwrite: true,
            onUpdate: function () { loop.timeScale(speed.v); } });
          gsap.to(speed, { v: dir, duration: 1.4, delay: 0.25, ease: "power2.out", overwrite: false,
            onUpdate: function () { loop.timeScale(speed.v); } });
        }
      });
    }

    /* ---- reveal-uri ---- */
    $$(".reveal").forEach(function (el) {
      if (el.hasAttribute("data-words")) return;
      gsap.fromTo(el, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    $$("[data-words]").forEach(function (el) {
      var s = SplitText.create(el, { type: "words", mask: "words" });
      gsap.set(el, { autoAlpha: 1, y: 0 });
      gsap.from(s.words, { yPercent: 115, duration: 1.05, stagger: 0.06, scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    /* ---- vitrina: carduri ---- */
    gsap.set(".item", { autoAlpha: 0, y: 60 });
    ScrollTrigger.batch(".item", {
      start: "top 92%",
      onEnter: function (b) {
        gsap.to(b, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, overwrite: true });
        b.forEach(function (it) {
          var img = $("img", $(".item__media", it));
          gsap.fromTo(img, { scale: 0.82, rotation: 6 }, { scale: 1, rotation: 0, duration: 1.4, clearProps: "transform" });
        });
      }
    });

    /* ---- panou navy ---- */
    gsap.fromTo(".how__panel", { clipPath: "inset(8% 4% 8% 4% round 40px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 40px)", ease: "none",
      scrollTrigger: { trigger: ".how", start: "top 95%", end: "top 35%", scrub: true }
    });
    $$(".how__step").forEach(function (st, k) {
      gsap.fromTo(st, { autoAlpha: 0, y: 40 }, {
        autoAlpha: 1, y: 0, delay: k * 0.08,
        scrollTrigger: { trigger: ".how__steps", start: "top 82%", onEnter: function () { setTimeout(function () { st.classList.add("is-in"); }, 300 + k * 160); } }
      });
    });
    gsap.fromTo(".how__seal", { rotation: -30, scale: 0.6, autoAlpha: 0 }, {
      rotation: 12, scale: 1, autoAlpha: 1, duration: 1.2, ease: "back.out(1.8)",
      scrollTrigger: { trigger: ".how__panel", start: "top 60%" }
    });

    /* ---- manifest: cuvintele se aprind la scroll ---- */
    var man = $("[data-scrub]");
    if (man) {
      var ms = SplitText.create(man, { type: "words" });
      var tokens = ms.words.concat($$(".pimg", man));
      tokens.sort(function (a, b) { return a.compareDocumentPosition(b) & 2 ? 1 : -1; });
      gsap.set(tokens, { opacity: 0.14 });
      gsap.set($$(".pimg", man), { scale: 0.6 });
      gsap.timeline({ scrollTrigger: { trigger: man, start: "top 78%", end: "bottom 42%", scrub: 0.6 } })
        .to(tokens, { opacity: 1, stagger: 0.12, ease: "none", duration: 0.5 })
        .to($$(".pimg", man), { scale: 1, stagger: 0.5, ease: "back.out(2)", duration: 0.6 }, 0);
    }

    /* ---- CTA ---- */
    gsap.fromTo(".orb", { scale: 0.6, autoAlpha: 0, rotation: -60 }, {
      scale: 1, autoAlpha: 1, rotation: 0, duration: 1.4, ease: "back.out(1.4)",
      scrollTrigger: { trigger: ".orb", start: "top 92%" }
    });
    gsap.to(".cta__sticker--seal", { yPercent: -60, rotation: 8, ease: "none", scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.to(".cta__sticker--kiss", { yPercent: -110, rotation: -6, ease: "none", scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true } });

    /* ---- footer ---- */
    gsap.fromTo(".footer__giant", { yPercent: 40 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
    gsap.fromTo(".footer__top > *", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.08, scrollTrigger: { trigger: ".footer", start: "top 85%" } });

    /* ---- nav activ ---- */
    ["vitrina", "comanda", "contact"].forEach(function (id) {
      var sec = document.getElementById(id);
      var link = $('.nav__links a[href="#' + id + '"]');
      if (!sec || !link) return;
      ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: function (s) { link.classList.toggle("is-active", s.isActive); } });
    });

    /* ---- butoane magnetice ---- */
    if (fine) {
      $$(".btn, .item__order, .badge, .show__btn, .orb").forEach(function (el) {
        var strength = el.classList.contains("orb") ? 0.35 : 0.22;
        var max = el.classList.contains("orb") ? 26 : 10;
        var qx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
        var qy = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
        el.addEventListener("mousemove", function (e) {
          var r = el.getBoundingClientRect();
          qx(gsap.utils.clamp(-max, max, (e.clientX - r.left - r.width / 2) * strength));
          qy(gsap.utils.clamp(-max, max, (e.clientY - r.top - r.height / 2) * strength));
        });
        el.addEventListener("mouseleave", function () { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.4)" }); });
      });
    }

    /* ---- cursor ---- */
    var cursor = $(".cursor");
    if (cursor && fine) {
      var dot = $(".cursor__dot", cursor), ring = $(".cursor__ring", cursor), label = $(".cursor__label", cursor);
      gsap.set([dot, ring], { autoAlpha: 0 });
      var dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
      var rx = gsap.quickTo(ring, "x", { duration: 0.38, ease: "power3.out" }), ry = gsap.quickTo(ring, "y", { duration: 0.38, ease: "power3.out" });
      var on = false;
      window.addEventListener("mousemove", function (e) {
        if (!on) { on = true; gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 }); }
        dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      }, { passive: true });
      document.addEventListener("mouseover", function (e) {
        var lab = e.target.closest("[data-cursor]");
        cursor.classList.toggle("is-label", !!lab);
        if (lab) label.textContent = lab.dataset.cursor;
        cursor.classList.toggle("is-on", !lab && !!e.target.closest("a,button"));
      });
      document.addEventListener("mousedown", function () { cursor.classList.add("is-down"); });
      document.addEventListener("mouseup", function () { cursor.classList.remove("is-down"); });
      document.documentElement.addEventListener("mouseleave", function () { gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 }); on = false; });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  function init() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
    if (!full) return initLite();
    try { initFull(); } catch (err) {
      if (window.console) console.error(err);
      if (window.gsap) gsap.set("*", { clearProps: "opacity,visibility,transform,clipPath" });
      initLite();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
