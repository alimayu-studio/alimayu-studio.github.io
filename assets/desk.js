/* Homepage desk hero: scroll position drives which layer of the desk is showing. */
(function () {
  var hero = document.querySelector('.desk-hero');
  if (!hero) return;
  var shots = hero.querySelectorAll('.desk-zoom > img');
  var frame = hero.querySelector('.desk-frame');
  var zoom = hero.querySelector('.desk-zoom');
  var panels = hero.querySelectorAll('.desk-panel');
  var ticks = hero.querySelectorAll('.desk-ticks i');
  var num = hero.querySelector('.desk-num');
  // Picture opening inside the gold frame on each photo: left, top, width, height (percent)
  var frames = [[41.83, 27.56, 16.38, 42.67], [41.75, 27.78, 16.5, 42.44], [41.54, 27.56, 16.92, 43.26], [41.54, 27.63, 16.88, 43.19], [41.83, 23.63, 16.46, 41.85], [41.79, 23.78, 16.46, 41.85]];
  var grounds = [[244, 238, 227], [228, 233, 226], [239, 228, 207], [227, 228, 236], [221, 232, 230], [244, 238, 227]];
  var n = shots.length;

  function placeFrame(f) { frame.style.left = f[0] + '%'; frame.style.top = f[1] + '%'; frame.style.width = f[2] + '%'; frame.style.height = f[3] + '%'; }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.classList.add('still');
    placeFrame(frames[n - 1]);
    return;
  }

  var active = -1, queued = false;
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }

  function update() {
    queued = false;
    var r = hero.getBoundingClientRect();
    var span = hero.offsetHeight - (innerHeight - 72);
    var p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
    var L = p * (n - 1);                         // 0 .. 5, continuous
    for (var i = 1; i < n; i++) {
      var t = Math.min(1, Math.max(0, (L - (i - 1) - 0.3) / 0.45));
      shots[i].style.opacity = ease(t).toFixed(3);
    }
    var k = Math.min(n - 2, Math.floor(L)), f = ease(Math.min(1, Math.max(0, (L - k - 0.3) / 0.45)));
    placeFrame(frames[k].map(function (v, j) { return lerp(v, frames[k + 1][j], f); }));
    zoom.style.transform = 'scale(' + (1.12 - 0.12 * p).toFixed(4) + ')';
    var g = grounds[k].map(function (v, j) { return Math.round(lerp(v, grounds[k + 1][j], f)); });
    hero.style.backgroundColor = 'rgb(' + g.join(',') + ')';
    var now = Math.min(n - 1, Math.round(L));
    if (now !== active) {
      active = now;
      panels.forEach(function (el, j) { el.classList.toggle('is-on', j === now); });
      ticks.forEach(function (el, j) { el.classList.toggle('on', j <= now); });
      num.textContent = '0' + (now + 1);
    }
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  update();
})();

/* Doorways between sections: scroll zooms into one desk object, then fades into the next section's color. */
(function () {
  var doors = document.querySelectorAll('[data-door]');
  if (!doors.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { doors.forEach(function (d) { d.classList.add('still'); }); return; }
  var queued = false;
  function origin(d) {
    // Where the object sits inside the cropped (object-fit: cover) photo, as a point in the box.
    var img = d.querySelector('img'), box = d.querySelector('.door-sticky');
    var iw = img.naturalWidth || 1920, ih = img.naturalHeight || 1080, bw = box.clientWidth, bh = box.clientHeight;
    var k = Math.max(bw / iw, bh / ih), dw = iw * k, dh = ih * k;
    var ox = (bw - dw) / 2, oy = (bh - dh) / 2;
    var x = ox + dw * (+d.dataset.x / 100), y = oy + dh * (+d.dataset.y / 100);
    img.style.transformOrigin = x + 'px ' + y + 'px';
    d._o = [x, y, bw, bh];
    d._shift = [bw / 2 - x, bh * .45 - y];   // how far to slide the object toward the center
  }
  function update() {
    queued = false;
    doors.forEach(function (d) {
      var r = d.getBoundingClientRect(), span = d.offsetHeight - (innerHeight - 72);
      if (r.bottom < 0 || r.top > innerHeight) return;
      var p = Math.min(1, Math.max(0, (72 - r.top) / Math.max(1, span)));
      var z = p * p, e = Math.min(1, p / .55); e = e * e * (3 - 2 * e);
      var sh = d._shift || [0, 0], o = d._o || [0, 0, 0, 0], sc = 1 + z * 9;
      // Slide toward the center, but never so far that the photo's edge shows.
      var tx = Math.min(o[0] * (sc - 1), Math.max(-(o[2] - o[0]) * (sc - 1), sh[0] * e));
      var ty = Math.min(o[1] * (sc - 1), Math.max(-(o[3] - o[1]) * (sc - 1), sh[1] * e));
      d.querySelector('img').style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
      d.querySelector('.door-label').style.opacity = (p < .15 ? p / .15 : Math.max(0, 1 - (p - .45) / .2)).toFixed(3);
      d.querySelector('.door-fade').style.opacity = Math.max(0, (p - .62) / .3).toFixed(3);
    });
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  function setup() { doors.forEach(origin); request(); }
  doors.forEach(function (d) { var img = d.querySelector('img'); if (!img.complete) img.addEventListener('load', function () { origin(d); }); });
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', setup);
  setup();
})();
