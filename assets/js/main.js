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
    // Reset when the drawer breakpoint is left behind.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1280) setNav(false);
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

})();
