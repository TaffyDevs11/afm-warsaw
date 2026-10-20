/* =====================================================================
   AFM Warsaw — site behaviour
   ---------------------------------------------------------------------
   Everything here is progressive enhancement. With JavaScript disabled the
   site still renders, navigates and submits forms; only the conveniences
   below are lost.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---- Theme toggle ------------------------------------------------- */
  // The initial value is applied by the inline script in <head> so the page
  // never flashes the wrong theme. This only handles later changes.
  var themeBtn = document.getElementById('theme-toggle');

  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function paintThemeIcon() {
    if (!themeBtn) return;
    var dark = currentTheme() === 'dark';
    var sun  = themeBtn.querySelector('.icon-sun');
    var moon = themeBtn.querySelector('.icon-moon');
    // Show the icon for the theme you would switch *to*.
    if (sun)  sun.style.display  = dark ? 'block' : 'none';
    if (moon) moon.style.display = dark ? 'none'  : 'block';
    themeBtn.setAttribute('aria-pressed', String(dark));
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('afm-theme', next); } catch (e) {}
      paintThemeIcon();
    });
    paintThemeIcon();
  }

  // Follow the OS while the visitor has not made an explicit choice.
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onSchemeChange = function () {
    var stored = null;
    try { stored = localStorage.getItem('afm-theme'); } catch (e) {}
    if (stored !== 'light' && stored !== 'dark') paintThemeIcon();
  };
  if (mq.addEventListener) mq.addEventListener('change', onSchemeChange);
  else if (mq.addListener) mq.addListener(onSchemeChange);

  /* ---- Mobile navigation -------------------------------------------- */
  var navBtn = document.getElementById('nav-toggle');
  var nav    = document.getElementById('main-nav');

  function setNav(open) {
    if (!nav || !navBtn) return;
    nav.classList.toggle('is-open', open);
    navBtn.setAttribute('aria-expanded', String(open));
    var o = navBtn.querySelector('.icon-open');
    var c = navBtn.querySelector('.icon-close');
    if (o) o.style.display = open ? 'none'  : 'block';
    if (c) c.style.display = open ? 'block' : 'none';
  }

  if (navBtn && nav) {
    navBtn.addEventListener('click', function () {
      setNav(!nav.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        navBtn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(e.target) && !navBtn.contains(e.target)) setNav(false);
    });
    // Close the drawer when the header widens enough to show the links again
    // (the header script measures this and announces it with afm:navfit).
    document.addEventListener('afm:navfit', function () {
      var hdr = document.getElementById('site-header');
      if (hdr && !hdr.classList.contains('is-collapsed')) setNav(false);
    });
  }

  /* ---- Sticky header state ------------------------------------------ */
  var header = document.getElementById('site-header');
  var toTop  = document.getElementById('to-top');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-stuck', y > 8);
    if (toTop)  toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Scroll reveal ------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (!('IntersectionObserver' in window)) {
      // No observer support: show everything rather than hiding content.
      revealables.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      revealables.forEach(function (el, i) {
        // A small stagger so grids arrive in sequence rather than all at once.
        el.style.transitionDelay = (Math.min(i % 6, 5) * 55) + 'ms';
        io.observe(el);
      });
    }
  }

  /* ---- Tab groups (announcements, blog/sermons) ---------------------- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs   = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        select(i, false);
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft')  next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home')       next = 0;
        if (e.key === 'End')        next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        select(next, true);
      });
    });
  });


  /* =================================================================
     Motion layer: intro screen, smooth scrolling, scroll effects.
     ================================================================= */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Intro screen (once per visit) ---------------------------------- */
  var intro = document.getElementById('intro');
  var lenis = null;
  if (intro && root.classList.contains('show-intro')) {
    var started = Date.now();
    var minShow = reduceMotion ? 600 : 2300;   // long enough to read the verse once
    var maxShow = 4500;                         // never hold a slow page hostage
    var gone = false;

    var finish = function () {
      if (gone) return;
      gone = true;
      try { sessionStorage.setItem('afm-intro-seen', '1'); } catch (e) {}
      intro.classList.add('is-leaving');
      root.classList.add('intro-done');
      setTimeout(function () {
        root.classList.remove('show-intro');
        intro.remove();
        if (lenis) lenis.start();
      }, reduceMotion ? 320 : 720);
    };
    var whenReady = function () {
      setTimeout(finish, Math.max(0, minShow - (Date.now() - started)));
    };
    if (document.readyState === 'complete') whenReady();
    else window.addEventListener('load', whenReady);
    setTimeout(finish, maxShow);

    // Any intent to use the page skips it: click, key, or the skip button.
    var skip = document.getElementById('intro-skip');
    if (skip) skip.addEventListener('click', finish);
    intro.addEventListener('click', finish);
    document.addEventListener('keydown', function onKey() {
      finish();
      document.removeEventListener('keydown', onKey);
    });
  } else if (intro) {
    intro.remove();
  }

  /* ---- Smooth scrolling ------------------------------------------------ */
  // Eased wheel/trackpad scrolling via Lenis (touch keeps the native feel).
  // Skipped for reduced motion, or if the library did not load.
  function headerOffset() {
    var h = document.getElementById('site-header');
    return h ? -(h.getBoundingClientRect().height + 16) : 0;
  }
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95 });
    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (root.classList.contains('show-intro')) lenis.stop();
  }

  // In-page links ("#join", "#a12", skip link) glide to their target and
  // land below the sticky header, then move keyboard focus there.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || a.target === '_blank') return;
    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || url.search !== location.search || url.hash.length < 2) return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: headerOffset() });
    } else {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset + headerOffset(),
                        behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    history.pushState(null, '', url.hash);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  // "Back to top" goes through the same easing.
  if (toTop && lenis) {
    toTop.addEventListener('click', function (e) {
      e.stopImmediatePropagation();
      lenis.scrollTo(0);
    }, true);
  }

  /* ---- Reading progress + parallax ------------------------------------- */
  var bar   = document.getElementById('scroll-progress');
  var blobs = reduceMotion ? [] : Array.prototype.slice.call(document.querySelectorAll('.blob'));
  var ticking = false;
  function paintScroll() {
    ticking = false;
    var y   = window.pageYOffset || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    for (var i = 0; i < blobs.length; i++) {
      // Each shape drifts at its own gentle rate, opposite to the scroll.
      var speed = 0.04 + (i % 4) * 0.025;
      blobs[i].style.setProperty('--parallax', (-y * speed).toFixed(1) + 'px');
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(paintScroll); }
  }, { passive: true });
  paintScroll();

  /* ---- More scroll reveals ---------------------------------------------- */
  // Section headings, page heroes and feature photos join the existing
  // .reveal system without every template having to be edited.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var extra = [];
    document.querySelectorAll('.section__head, .page-hero__inner, .detail-head > div:first-child, .empty, .form-panel, .map-frame')
      .forEach(function (el) { if (!el.classList.contains('reveal')) { el.classList.add('reveal'); extra.push(el); } });
    document.querySelectorAll('.portrait, .detail-head__media, .article__cover')
      .forEach(function (el) { el.classList.add('reveal-photo'); extra.push(el); });
    document.querySelectorAll('.split > .reveal:first-child').forEach(function (el) { el.classList.add('reveal--left'); });
    document.querySelectorAll('.split > .reveal:last-child').forEach(function (el) { el.classList.add('reveal--right'); });

    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io2.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    extra.forEach(function (el) { io2.observe(el); });
  }
})();
