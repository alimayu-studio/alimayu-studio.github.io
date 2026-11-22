/* Finishing touches shared by every page: the signature writes itself, numbers count up, Field Notes reading thread. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onView(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fn(); io.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(el);
  }

  // The signature writes itself, left to right, the first time it scrolls into view.
  document.querySelectorAll('.signoff img').forEach(function (img) {
    if (reduce) return;
    img.classList.add('ink');
    onView(img, function () { img.classList.add('written'); });
  });

  // Figures count up from zero when they come into view: "$25M", "68%", "15", "200+".
  document.querySelectorAll('.stats b, [data-count]').forEach(function (el) {
    var txt = el.textContent, m = txt.match(/^(\D*)(\d[\d,]*)(.*)$/);
    if (!m || reduce || el.closest('[data-seat-count]')) return;
    var pre = m[1], end = +m[2].replace(/,/g, ''), post = m[3], comma = m[2].indexOf(',') > -1;
    if (!end) return;
    el.style.minWidth = el.offsetWidth + 'px';
    el.textContent = pre + '0' + post;
    onView(el, function () {
      var t0 = performance.now(), dur = 1400;
      (function step(now) {
        var t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3), v = Math.round(end * e);
        el.textContent = pre + (comma ? v.toLocaleString('en-US') : v) + post;
        if (t < 1) requestAnimationFrame(step);
      })(t0);
    });
  });

  // Field Notes: a thin gold thread across the top shows reading progress.
  var art = document.querySelector('.fn-article');
  if (art && !reduce) {
    var bar = document.createElement('div'); bar.className = 'read-thread'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var queued = false;
    function upd() {
      queued = false;
      var r = art.getBoundingClientRect(), total = r.height - innerHeight * .6;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, -r.top / Math.max(1, total))).toFixed(4) + ')';
    }
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
})();
