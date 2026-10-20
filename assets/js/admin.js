/* =====================================================================
   Admin panel behaviour
   ---------------------------------------------------------------------
   Progressive enhancement only. Every form here still submits and every
   destructive action still works with JavaScript disabled — the confirm
   prompt is a guard rail, not the security boundary (the server checks
   the session and the CSRF token regardless).
   ===================================================================== */
(function () {
  'use strict';

  /* ---- Confirm before destructive submits ---------------------------- */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    var message = form.getAttribute('data-confirm');
    if (message && !window.confirm(message)) {
      e.preventDefault();
    }
  });

  /* ---- Live preview of a chosen image before upload ------------------ */
  document.querySelectorAll('input[type="file"][accept^="image"]').forEach(function (input) {
    input.addEventListener('change', function () {
      // Multiple-file inputs get a strip of previews, one per chosen file.
      if (input.multiple) {
        var strip = input.parentElement.querySelector('.preview-strip');
        if (!strip) {
          strip = document.createElement('div');
          strip.className = 'preview-strip';
          input.parentElement.insertBefore(strip, input.nextSibling);
        }
        strip.innerHTML = '';
        Array.prototype.forEach.call(input.files || [], function (f) {
          if (!/^image\//.test(f.type)) return;
          var img = document.createElement('img');
          img.alt = '';
          img.src = URL.createObjectURL(f);
          img.onload = function () { URL.revokeObjectURL(img.src); };
          strip.appendChild(img);
        });
        return;
      }

      var file = input.files && input.files[0];
      if (!file) return;

      var preview = input.parentElement.querySelector('.image-preview');
      if (!preview) {
        preview = document.createElement('img');
        preview.className = 'image-preview';
        preview.alt = '';
        input.parentElement.insertBefore(preview, input);
      }
      var reader = new FileReader();
      reader.onload = function (ev) { preview.src = ev.target.result; };
      reader.readAsDataURL(file);
    });
  });

  /* ---- Auto-grow textareas ------------------------------------------- */
  document.querySelectorAll('textarea').forEach(function (ta) {
    var grow = function () {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight + 2, 600) + 'px';
    };
    ta.addEventListener('input', grow);
    if (ta.value) grow();
  });

  /* ---- Warn before leaving a form with unsaved edits ------------------ */
  document.querySelectorAll('form[data-dirty-guard]').forEach(function (form) {
    var dirty = false;
    form.addEventListener('input',  function () { dirty = true; });
    form.addEventListener('submit', function () { dirty = false; });
    window.addEventListener('beforeunload', function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  });

})();
