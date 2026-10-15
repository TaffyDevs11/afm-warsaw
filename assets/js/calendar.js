/* =====================================================================
   Hall booking calendar — dialog behaviour
   ---------------------------------------------------------------------
   The month grid, the upcoming list and every save/delete work without
   this file; it only adds click-to-open editing on top.
   ===================================================================== */
(function () {
  'use strict';

  var modal = document.getElementById('booking-modal');
  var form  = document.getElementById('booking-form');
  if (!modal || !form) return;

  var titleEl   = document.getElementById('booking-modal-title');
  var btnDelete = document.getElementById('booking-delete');
  var allDay    = document.getElementById('b-all-day');
  var timesRow  = document.getElementById('b-times');
  var lastFocused = null;

  var fields = {
    id:         document.getElementById('b-id'),
    title:      document.getElementById('b-title'),
    purpose:    document.getElementById('b-purpose'),
    date:       document.getElementById('b-date'),
    end_date:   document.getElementById('b-end-date'),
    start_time: document.getElementById('b-start-time'),
    end_time:   document.getElementById('b-end-time'),
    requester:  document.getElementById('b-requester'),
    contact:    document.getElementById('b-contact'),
    status:     document.getElementById('b-status'),
    notes:      document.getElementById('b-notes')
  };

  function syncAllDay() {
    timesRow.style.display = allDay.checked ? 'none' : '';
  }
  allDay.addEventListener('change', syncAllDay);

  function reset(date) {
    form.reset();
    fields.id.value = '0';
    fields.date.value = date || '';
    fields.end_date.value = date || '';
    fields.start_time.value = '09:00';
    fields.end_time.value = '11:00';
    fields.status.value = 'confirmed';
    allDay.checked = false;
    syncAllDay();
    btnDelete.style.display = 'none';
  }

  function fill(data) {
    fields.id.value         = data.id || 0;
    fields.title.value      = data.title || '';
    fields.purpose.value    = data.purpose || '';
    fields.date.value       = data.date || '';
    fields.end_date.value   = data.end_date || '';
    fields.start_time.value = data.start_time || '09:00';
    fields.end_time.value   = data.end_time || '11:00';
    fields.requester.value  = data.requester || '';
    fields.contact.value    = data.contact || '';
    fields.status.value     = data.status || 'confirmed';
    fields.notes.value      = data.notes || '';
    allDay.checked = String(data.all_day) === '1';
    syncAllDay();
    btnDelete.style.display = Number(data.id) > 0 ? '' : 'none';
  }

  function open(heading) {
    lastFocused = document.activeElement;
    if (heading) titleEl.textContent = heading;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    fields.title.focus();
  }

  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* ---- Opening ------------------------------------------------------- */

  var newBtn = document.getElementById('new-booking');
  if (newBtn) {
    newBtn.addEventListener('click', function () {
      reset(new Date().toISOString().slice(0, 10));
      open('New booking');
    });
  }

  // Clicking an existing booking edits it; clicking empty space in a day
  // starts a new booking on that date.
  document.querySelectorAll('.cal-event').forEach(function (chip) {
    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      var raw = chip.getAttribute('data-booking');
      if (!raw) return;
      try {
        fill(JSON.parse(raw));
        open('Edit booking');
      } catch (err) { /* malformed payload — fall through to the day handler */ }
    });
  });

  document.querySelectorAll('.cal-day').forEach(function (day) {
    day.addEventListener('click', function () {
      reset(day.getAttribute('data-date'));
      open('New booking');
    });
  });

  /* ---- Closing ------------------------------------------------------- */

  document.getElementById('booking-close').addEventListener('click', close);
  document.getElementById('booking-cancel').addEventListener('click', close);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  // Keep Tab inside the dialog while it is open.
  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var focusable = modal.querySelectorAll(
      'input:not([type="hidden"]), select, textarea, button, [href]'
    );
    var visible = Array.prototype.filter.call(focusable, function (el) {
      return el.offsetParent !== null && !el.disabled;
    });
    if (!visible.length) return;
    var first = visible[0];
    var last  = visible[visible.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---- Delete needs its own confirm ---------------------------------- */
  btnDelete.addEventListener('click', function (e) {
    if (!window.confirm(btnDelete.getAttribute('data-confirm') || 'Delete this booking?')) {
      e.preventDefault();
    }
  });

  /* ---- Re-open after a double-booking warning ------------------------- */
  // The server bounces an overlapping booking back with a warning; restore
  // what was typed so the admin only has to tick "Book anyway".
  if (window.__afmBookingRetry) {
    var r = window.__afmBookingRetry;
    fill({
      id: r.id, title: r.title, purpose: r.purpose,
      date: r.date, end_date: r.end_date,
      start_time: r.start_time, end_time: r.end_time,
      all_day: r.all_day ? '1' : '0',
      requester: r.requester, contact: r.contact,
      status: r.status, notes: r.notes
    });
    open(Number(r.id) > 0 ? 'Edit booking' : 'New booking');
    var clash = form.querySelector('[name="confirm_clash"]');
    if (clash) clash.focus();
  }

})();
