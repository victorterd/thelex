/* The Lex Bakehouse — motion & interactions */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = "";
    var i = 0;
    Array.prototype.forEach.call(text, function (ch) {
      var s = document.createElement("span");
      s.className = "ch";
      s.style.setProperty("--i", i++);
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
    });
    el.classList.add("split");
  }

  /* wraps each word in .w > span, preserving child elements (em etc.) */
  function splitWords(root) {
    var delay = { v: 0 };
    function wrap(node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "w";
          var inner = document.createElement("span");
          inner.style.setProperty("--d", delay.v + "ms");
          delay.v += 45;
          inner.textContent = part;
          w.appendChild(inner);
          frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.prototype.slice.call(node.childNodes).forEach(wrap);
      }
    }
    Array.prototype.slice.call(root.childNodes).forEach(wrap);
  }

  /* fit nowrap display text to its container width */
  function fitText(el, ratio, maxPx) {
    if (!el) return;
    el.style.fontSize = "";
    var avail = (el.parentElement.clientWidth || window.innerWidth) * ratio;
    var w = el.scrollWidth;
    if (w > 0 && avail > 0) {
      var cur = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = Math.min(cur * avail / w, maxPx) + "px";
    }
  }
  function fitAll() {
    fitText(document.querySelector(".hero__thelex"), 0.99, 250);
    fitText(document.querySelector(".footer__giant"), 0.99, 300);
  }

  /* ---------- init on DOM ready ---------- */
  function init() {
    var thelex = document.querySelector(".hero__thelex");
    var wordEls = document.querySelectorAll("[data-words]");
    var revealEls = document.querySelectorAll(".reveal");

    if (reduce) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
      wordEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      if (thelex) splitChars(thelex);
      wordEls.forEach(splitWords);

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

      revealEls.forEach(function (el) { io.observe(el); });
      wordEls.forEach(function (el) { io.observe(el); });
    }

    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    window.addEventListener("resize", fitAll, { passive: true });

    /* ---------- scroll-driven bits ---------- */
    var progress = document.querySelector(".progress i");
    var nav = document.querySelector(".nav");
    var steps = document.querySelector(".steps");
    var stepItems = steps ? steps.querySelectorAll(".step") : [];
    var stepImgs = steps ? steps.querySelectorAll(".steps__media img") : [];
    var stepsBar = steps ? steps.querySelector(".steps__bar i") : null;
    var desktopSteps = window.matchMedia("(min-width: 900px)");
    var ticking = false;

    function setActiveStep(idx) {
      stepItems.forEach(function (el, i) { el.classList.toggle("is-active", i === idx); });
      stepImgs.forEach(function (el, i) { el.classList.toggle("is-active", i === idx); });
    }

    function onScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 30);

      if (steps && desktopSteps.matches) {
        var rect = steps.getBoundingClientRect();
        var total = rect.height - window.innerHeight;
        var t = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        setActiveStep(t < 1 / 3 ? 0 : t < 2 / 3 ? 1 : 2);
        if (stepsBar && !reduce) stepsBar.style.transform = "scaleX(" + t + ")";
      }
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
