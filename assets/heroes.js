/* Page-header centerpieces. Each starts when it comes into view and plays once (the projector keeps cycling). */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onView(el, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: .3 });
    io.observe(el);
  }

  // Board book
  var bd = document.querySelector('.hx-binder');
  if (bd) onView(bd, function () { setTimeout(function () { bd.classList.add('go'); }, reduce ? 0 : 250); });

  // Decision strands: seven tangled curves that ease into one line
  var dc = document.querySelector('.hx-decide');
  if (dc) {
    var g = dc.querySelector('.dc-strands'), NS = 'http://www.w3.org/2000/svg', strands = [];
    var starts = [38, 60, 82, 185, 205, 225, 336, 362];
    function rnd(a, b) { return a + Math.random() * (b - a); }
    starts.forEach(function (y0) {
      var p = document.createElementNS(NS, 'path'); g.appendChild(p);
      var tang = [[0, y0]], flat = [[0, y0]];
      for (var i = 1; i <= 4; i++) { tang.push([i * 55 + rnd(-25, 25), rnd(30, 390)]); flat.push([i * 55, y0 + (210 - y0) * (i / 5)]); }
      tang.push([250, 210]); flat.push([250, 210]);
      strands.push({ el: p, a: tang, b: flat });
    });
    function draw(t) {
      strands.forEach(function (s) {
        var pts = s.a.map(function (q, i) { return [q[0] + (s.b[i][0] - q[0]) * t, q[1] + (s.b[i][1] - q[1]) * t]; });
        var d = 'M' + pts[0][0] + ' ' + pts[0][1];
        for (var i = 1; i < pts.length; i++) { var m = [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2]; d += ' Q' + pts[i - 1][0] + ' ' + pts[i - 1][1] + ' ' + m[0] + ' ' + m[1]; }
        d += ' L' + pts[pts.length - 1][0] + ' ' + pts[pts.length - 1][1];
        s.el.setAttribute('d', d);
      });
    }
    if (reduce) { draw(1); dc.classList.add('done'); }
    else {
      draw(0);
      onView(dc, function () {
        var t0 = performance.now() + 500, dur = 2600;
        (function step(now) {
          var t = Math.min(1, Math.max(0, (now - t0) / dur)), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          draw(e);
          if (t < 1) requestAnimationFrame(step); else dc.classList.add('done');
        })(performance.now());
      });
    }
  }

  // Projector: lessons change on the screen every few seconds
  var pj = document.querySelector('.hx-proj');
  if (pj) {
    var slides = pj.querySelectorAll('.pj-slide'), i = 0;
    slides[0].classList.add('on');
    if (!reduce) setInterval(function () {
      if (document.hidden) return;
      slides[i].classList.remove('on'); i = (i + 1) % slides.length; slides[i].classList.add('on');
    }, 3400);
  }
})();
