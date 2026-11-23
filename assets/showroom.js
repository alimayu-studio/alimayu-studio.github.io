/* About header: the role tabs switch which facts show. Arrow keys move between tabs. */
(function () {
  var room = document.querySelector('[data-showroom]');
  if (!room) return;
  var tabs = room.querySelectorAll('[data-role]'), specs = room.querySelectorAll('[data-spec]'), cur = 0;
  function show(i) {
    cur = i;
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; });
    specs.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = (cur + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      show(n); tabs[n].focus(); e.preventDefault();
    });
  });
  show(0);
})();
