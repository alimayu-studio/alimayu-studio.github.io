/* About page showroom: lights come up when it is on screen, then the room cycles through her four roles.
   Tabs switch roles directly; hovering or focusing the panel pauses the cycle. */
(function () {
  var room = document.querySelector('[data-showroom]');
  if (!room) return;
  var tabs = room.querySelectorAll('[data-role]'), specs = room.querySelectorAll('[data-spec]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timer = null, paused = false, EVERY = 5200;
  tabs.forEach(function (t) { var s = document.createElement('span'); s.className = 'sr-timer'; t.appendChild(s); });

  function show(i) {
    cur = i;
    room.setAttribute('data-role', i);
    tabs.forEach(function (t, j) {
      t.setAttribute('aria-selected', j === i ? 'true' : 'false');
      t.tabIndex = j === i ? 0 : -1;
      var bar = t.querySelector('.sr-timer'); bar.style.transition = 'none'; bar.style.width = '0';
    });
    specs.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (reduce || paused) return;
    var bar = tabs[cur].querySelector('.sr-timer');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      bar.style.transition = 'width ' + EVERY + 'ms linear'; bar.style.width = 'calc(100% - 24px)';
    }); });
    timer = setTimeout(function () { show((cur + 1) % tabs.length); }, EVERY);
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var n = (cur + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        show(n); tabs[n].focus(); e.preventDefault();
      }
    });
  });
  var copy = room.querySelector('.sr-copy');
  function pause(on) { paused = on; if (on) { clearTimeout(timer); tabs.forEach(function (t) { var b = t.querySelector('.sr-timer'); b.style.transition = 'none'; b.style.width = '0'; }); } else schedule(); }
  copy.addEventListener('mouseenter', function () { pause(true); });
  copy.addEventListener('mouseleave', function () { pause(false); });
  copy.addEventListener('focusin', function () { pause(true); });
  copy.addEventListener('focusout', function () { pause(false); });

  function start() { room.classList.add('lit'); show(0); }
  if (reduce || !('IntersectionObserver' in window)) { room.classList.add('lit'); show(0); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && !room.classList.contains('lit')) { setTimeout(start, 150); }
      if (!e.isIntersecting) { clearTimeout(timer); } else if (room.classList.contains('lit')) schedule();
    });
  }, { threshold: .25 });
  io.observe(room);
})();
