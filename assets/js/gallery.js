/* =====================================================================
   Gallery lightbox
   ---------------------------------------------------------------------
   Keyboard: arrows move, Escape closes, Tab is trapped inside the dialog.
   Without JavaScript the grid still renders as a plain list of photos.
   ===================================================================== */
(function () {
  'use strict';

  var box = document.getElementById('lightbox');
  if (!box) return;

  // Any .gallery-item on the page opts into the lightbox — the gallery grid
  // uses it for photos, the announcements page for posters and flyers.
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  if (!items.length) return;
  var img      = document.getElementById('lb-image');
  var caption  = document.getElementById('lb-caption');
  var counter  = document.getElementById('lb-counter');
  var btnClose = document.getElementById('lb-close');
  var btnPrev  = document.getElementById('lb-prev');
  var btnNext  = document.getElementById('lb-next');

  var current = 0;
  var lastFocused = null;

  // "Photo %d of %d" comes from the translation files via a data attribute.
  var counterTemplate = box.getAttribute('data-counter') || 'Photo %d of %d';

  function show(index) {
    if (!items.length) return;
    // Wrap around at both ends.
    current = (index + items.length) % items.length;

    var item = items[current];
    var full = item.getAttribute('data-full');
    var cap  = item.getAttribute('data-caption') || '';
    var thumb = item.querySelector('img');

    // Show the already-cached thumbnail immediately, then swap in the large
    // version once it has loaded — so there is never an empty frame.
    if (thumb) img.src = thumb.currentSrc || thumb.src;
    img.alt = cap;

    var big = new Image();
    big.onload = function () {
      if (items[current].getAttribute('data-full') === full) img.src = full;
    };
    big.src = full;

    caption.textContent = cap;
    caption.style.display = cap ? '' : 'none';
    counter.textContent = counterTemplate
      .replace('%d', String(current + 1))
      .replace('%d', String(items.length));

    // One photo needs no navigation arrows.
    var many = items.length > 1;
    btnPrev.style.display = many ? '' : 'none';
    btnNext.style.display = many ? '' : 'none';
    counter.style.display = many ? '' : 'none';
  }

  function open(index) {
    lastFocused = document.activeElement;
    box.hidden = false;
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    show(index);
    btnClose.focus();
  }

  function close() {
    box.classList.remove('is-open');
    box.hidden = true;
    document.body.style.overflow = '';
    img.src = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  items.forEach(function (item, i) {
    item.addEventListener('click', function () { open(i); });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function () { show(current - 1); });
  btnNext.addEventListener('click', function () { show(current + 1); });

  // Click the backdrop (but not the photo or a button) to dismiss.
  box.addEventListener('click', function (e) {
    if (e.target === box) close();
  });

  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape')     { e.preventDefault(); close(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }

    // Keep Tab inside the dialog while it is open.
    if (e.key === 'Tab') {
      var focusables = [btnClose, btnPrev, btnNext].filter(function (el) {
        return el && el.style.display !== 'none';
      });
      if (!focusables.length) return;
      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  /* ---- Touch swipe --------------------------------------------------- */
  var touchX = null;
  box.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });

  box.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

})();
