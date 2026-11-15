/* The Lex Bakehouse — v3 motion engine
   Lenis smooth scroll + GSAP (ScrollTrigger, SplitText)
   Totul cade elegant înapoi: fără JS sau cu reduced-motion,
   conținutul e complet vizibil și static. */
(function () {
  "use strict";

  var html = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined";

  function showEverything() {
    html.classList.add("loaded");
    if (hasGsap) {
      gsap.set(".reveal,[data-words],.card,.cta__panel,.statement__kiss,.hero__eyebrow,.hero__logo,.hero__bakehouse,.hero__lead,.hero__cta,.hero__float,.badge,.hero__scroll", { clearProps: "all", autoAlpha: 1 });
    }
    var act = document.querySelector(".steps__media img");
    if (act) act.classList.add("is-active");
  }

  /* ------------------------------------------------------------
     Fallback total: fără GSAP sau cu reduced-motion
     ------------------------------------------------------------ */
  function initLite() {
    showEverything();
    var progress = document.querySelector(".progress i");
    var nav = document.querySelector(".nav");
    window.addEventListener("scroll", function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 30);
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     Experiența completă
     ------------------------------------------------------------ */
  function initFull() {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    gsap.defaults({ ease: "power3.out" });

    /* ---- Lenis smooth scroll ---- */
    var lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    /* ---- ancore interne prin Lenis ---- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72, duration: 1.3, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
      });
    });

    /* ---- bara de progres + nav retractabil + stingerea scroll-cue ---- */
    var progressEl = document.querySelector(".progress i");
    var setProgress = progressEl ? gsap.quickSetter(progressEl, "scaleX") : null;
    var nav = document.querySelector(".nav");
    var cue = document.querySelector(".hero__scroll");
    var lastY = 0;
    function onScrollFrame(y) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (setProgress) setProgress(max > 0 ? y / max : 0);
      if (nav) {
        nav.classList.toggle("scrolled", y > 30);
        if (y > 140 && y > lastY + 4) nav.classList.add("nav--hidden");
        else if (y < lastY - 4 || y < 140) nav.classList.remove("nav--hidden");
      }
      if (cue) cue.style.opacity = y > 80 ? 0 : 1;
      lastY = y;
    }
    lenis.on("scroll", function (e) { onScrollFrame(e.scroll); });

    /* ---- stări inițiale (loader-ul acoperă primul cadru) ---- */
    gsap.set(".hero__eyebrow,.hero__bakehouse,.hero__lead,.hero__cta,.hero__scroll", { autoAlpha: 0, y: 22 });
    gsap.set(".hero__logo", { autoAlpha: 0, y: 34, scale: 0.985, clipPath: "inset(0% 0% 100% 0%)" });
    gsap.set(".hero__float", { autoAlpha: 0, scale: 0.72 });
    gsap.set(".badge", { autoAlpha: 0, scale: 0.6 });

    /* ---- preloader ---- */
    var loader = document.querySelector(".loader");
    var seen = false;
    try { seen = sessionStorage.getItem("lex-seen") === "1"; } catch (e) {}
    function heroIntro() {
      var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.to(".hero__eyebrow", { autoAlpha: 1, y: 0, duration: 0.7 })
        .to(".hero__logo", { autoAlpha: 1, y: 0, scale: 1, clipPath: "inset(0% 0% -8% 0%)", duration: 1.15 }, 0.08)
        .set(".hero__logo", { clearProps: "clipPath" })
        .fromTo(".hero__bakehouse", { autoAlpha: 0, letterSpacing: "0.95em" }, { autoAlpha: 1, letterSpacing: "0.55em", duration: 1.05, clearProps: "letterSpacing" }, 0.5)
        .to(".hero__lead", { autoAlpha: 1, y: 0, duration: 0.8 }, 0.72)
        .to(".hero__cta", { autoAlpha: 1, y: 0, duration: 0.8 }, 0.84)
        .to(".hero__float", { autoAlpha: 1, scale: 1, duration: 0.9, ease: "back.out(1.5)", stagger: 0.12 }, 0.55)
        .to(".badge", { autoAlpha: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" }, 1.0)
        .to(".hero__scroll", { autoAlpha: 1, y: 0, duration: 0.7 }, 1.15);
      return tl;
    }
    function dismissLoader() {
      var tl = gsap.timeline({
        onComplete: function () {
          html.classList.add("loaded");
          lenis.start();
          try { sessionStorage.setItem("lex-seen", "1"); } catch (e) {}
        }
      });
      if (!loader) return tl;
      if (seen) {
        tl.to(loader, { autoAlpha: 0, duration: 0.4, ease: "power2.out" });
      } else {
        tl.fromTo(".loader__logo", { autoAlpha: 0, scale: 0.9, y: 10 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "expo.out" })
          .to(".loader__bar i", { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 0.1)
          .to(loader, { yPercent: -100, duration: 0.75, ease: "expo.inOut" }, "+=0.12");
      }
      return tl;
    }
    gsap.timeline().add(dismissLoader()).add(heroIntro(), seen ? "-=0.1" : "-=0.35");

    /* ---- parallax în hero ---- */
    var heroST = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to(".hero__float--1", { yPercent: -16, scrollTrigger: heroST });
    gsap.to(".hero__float--2", { yPercent: -26, scrollTrigger: heroST });
    gsap.to(".hero__float--3", { yPercent: -12, scrollTrigger: heroST });
    gsap.to(".hero__logo", { yPercent: 9, scale: 0.975, transformOrigin: "50% 0%", scrollTrigger: heroST });
    gsap.to(".hero__eyebrow,.hero__lead", { autoAlpha: 0.25, scrollTrigger: { trigger: ".hero", start: "20% top", end: "bottom top", scrub: true } });

    /* ---- reveal generic (fără titlurile cu data-words) ---- */
    gsap.utils.toArray(".reveal:not([data-words])").forEach(function (el) {
      gsap.fromTo(el, { autoAlpha: 0, y: 36 }, {
        autoAlpha: 1, y: 0, duration: 0.9,
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });

    /* ---- titluri: cuvinte mascate ---- */
    document.querySelectorAll("[data-words]").forEach(function (el) {
      var split = SplitText.create(el, { type: "words", mask: "words" });
      gsap.set(el, { autoAlpha: 1 });
      gsap.from(split.words, {
        yPercent: 125, duration: 0.9, ease: "expo.out", stagger: 0.045,
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });

    /* ---- vitrina: carduri în cascadă ---- */
    gsap.set(".card", { autoAlpha: 0, y: 44 });
    ScrollTrigger.batch(".card", {
      start: "top 90%",
      onEnter: function (batch) {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.95, ease: "expo.out", stagger: 0.09, overwrite: true });
      }
    });

    /* ---- statement: cuvinte + sărutul ---- */
    var st = document.querySelector(".statement__text");
    if (st) {
      var stSplit = SplitText.create(st, { type: "words", mask: "words" });
      var kiss = document.querySelector(".statement__kiss");
      if (kiss) gsap.set(kiss, { autoAlpha: 0, scale: 0.2, rotation: 28 });
      var stTl = gsap.timeline({ scrollTrigger: { trigger: st, start: "top 80%" } });
      stTl.from(stSplit.words, { yPercent: 125, duration: 0.85, ease: "expo.out", stagger: 0.032 });
      if (kiss) stTl.to(kiss, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.7, ease: "back.out(2.4)" }, "-=0.25");
    }

    /* ---- CTA panel ---- */
    var panel = document.querySelector(".cta__panel");
    if (panel) {
      gsap.set(panel, { autoAlpha: 0, y: 64, scale: 0.985 });
      gsap.to(panel, {
        autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: "expo.out",
        scrollTrigger: { trigger: ".cta", start: "top 82%" }
      });
    }

    /* ---- footer: logo-ul gigant urcă ușor ---- */
    var giant = document.querySelector(".footer__giant");
    if (giant) {
      gsap.fromTo(giant, { yPercent: 30 }, {
        yPercent: 4, ease: "none",
        scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true }
      });
    }

    /* ---- Cum comanzi: pin + scrub pe desktop ---- */
    var steps = document.querySelector(".steps");
    if (steps) {
      var items = gsap.utils.toArray(".step");
      var photos = gsap.utils.toArray(".steps__media img");
      var bar = document.querySelector(".steps__bar i");
      var setBar = bar ? gsap.quickSetter(bar, "scaleX") : null;
      var current = -1;
      function setActive(i) {
        if (i === current) return;
        current = i;
        items.forEach(function (el, k) { el.classList.toggle("is-active", k === i); });
        photos.forEach(function (el, k) {
          gsap.to(el, { autoAlpha: k === i ? 1 : 0, scale: k === i ? 1 : 1.04, duration: 0.5, ease: "power2.out", overwrite: true });
        });
      }
      ScrollTrigger.matchMedia({
        "(min-width: 900px)": function () {
          setActive(0);
          ScrollTrigger.create({
            trigger: steps,
            start: "top top",
            end: "+=170%",
            pin: ".steps__pin",
            onUpdate: function (self) {
              if (setBar) setBar(self.progress);
              setActive(self.progress < 1 / 3 ? 0 : self.progress < 2 / 3 ? 1 : 2);
            }
          });
        },
        "(max-width: 899px)": function () {
          items.forEach(function (el) {
            gsap.fromTo(el, { autoAlpha: 0, y: 30 }, {
              autoAlpha: 1, y: 0, duration: 0.8,
              scrollTrigger: { trigger: el, start: "top 90%" }
            });
          });
        }
      });
    }

    /* ---- link activ în nav ---- */
    [["#vitrina", 'a[href="#vitrina"]'], ["#comanda", 'a[href="#comanda"]'], ["#contact", 'a[href="#contact"]']].forEach(function (pair) {
      var sec = document.querySelector(pair[0]);
      var link = document.querySelector(".nav__links " + pair[1]);
      if (!sec || !link) return;
      ScrollTrigger.create({
        trigger: sec, start: "top 45%", end: "bottom 45%",
        onToggle: function (self) { link.classList.toggle("is-active", self.isActive); }
      });
    });

    /* ---- butoane magnetice ---- */
    if (fine) {
      document.querySelectorAll(".btn, .card__order, .badge").forEach(function (el) {
        var qx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        var qy = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
        el.addEventListener("mousemove", function (e) {
          var r = el.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2);
          var dy = e.clientY - (r.top + r.height / 2);
          qx(Math.max(-10, Math.min(10, dx * 0.22)));
          qy(Math.max(-8, Math.min(8, dy * 0.22)));
        });
        el.addEventListener("mouseleave", function () {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.45)" });
        });
      });
    }

    /* ---- cursor follower ---- */
    var cursor = document.querySelector(".cursor");
    if (cursor && fine) {
      var dot = cursor.querySelector(".cursor__dot");
      var ring = cursor.querySelector(".cursor__ring");
      gsap.set([dot, ring], { xPercent: 0, yPercent: 0, autoAlpha: 0 });
      var dx = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
      var dy = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
      var rx = gsap.quickTo(ring, "x", { duration: 0.32, ease: "power3.out" });
      var ry = gsap.quickTo(ring, "y", { duration: 0.32, ease: "power3.out" });
      var shown = false;
      window.addEventListener("mousemove", function (e) {
        if (!shown) { shown = true; gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 }); }
        dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      }, { passive: true });
      document.addEventListener("mouseover", function (e) {
        cursor.classList.toggle("is-on", !!e.target.closest("a,button,[role=button]"));
      });
      document.addEventListener("mousedown", function () { cursor.classList.add("is-down"); });
      document.addEventListener("mouseup", function () { cursor.classList.remove("is-down"); });
      document.addEventListener("mouseleave", function () { gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 }); shown = false; });
    }
  }

  /* ------------------------------------------------------------ */
  function init() {
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
    if (!hasGsap || typeof ScrollTrigger === "undefined" || typeof Lenis === "undefined" || reduce) {
      initLite();
      return;
    }
    try { initFull(); } catch (err) { initLite(); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
