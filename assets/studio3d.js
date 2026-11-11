// Alimayu Studio — 3D layer.
// Light effects run here with plain CSS transforms. WebGL scenes ([data-scene]) load
// from studio3d-scenes.js only when they come near the screen and the browser supports WebGL.
(function () {
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var SCENES_URL = new URL('studio3d-scenes.js', document.currentScript.src).href;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  document.documentElement.classList.add('s3d');
  if (REDUCED) document.documentElement.classList.add('s3d-still');

  // Scroll-linked work runs once per frame.
  var onScroll = [];
  var ticking = false;
  function frame() { ticking = false; onScroll.forEach(function (f) { f(); }); }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  function progress(el, start, end) {
    // 0 when the element's top is at start*vh, 1 when its center reaches end*vh.
    var r = el.getBoundingClientRect(), vh = innerHeight;
    var a = vh * start, topEnd = vh * end - r.height / 2;
    return clamp((a - r.top) / Math.max(1, a - topEnd), 0, 1);
  }

  // ---------- 1. Hero depth: the arch tilts, its layers separate, gold dust drifts ----------
  $$('[data-depth]').forEach(function (wrap) {
    var layers = $$('[data-z]', wrap);
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, push = 0;
    function apply() {
      x += (tx - x) * .08; y += (ty - y) * .08;
      wrap.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      wrap.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
      layers.forEach(function (l) {
        var z = +l.dataset.z;
        l.style.translate = (x * z * 14).toFixed(1) + 'px ' + (y * z * 10).toFixed(1) + 'px';
      });
      if (Math.abs(tx - x) > .001 || Math.abs(ty - y) > .001) raf = requestAnimationFrame(apply); else raf = 0;
    }
    function aim(nx, ny) { tx = clamp(nx, -1, 1); ty = clamp(ny, -1, 1); if (!raf) raf = requestAnimationFrame(apply); }
    if (!REDUCED) {
      if (FINE) {
        addEventListener('pointermove', function (e) {
          aim((e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2);
        }, { passive: true });
      } else {
        addEventListener('deviceorientation', function (e) {
          if (e.gamma == null) return;
          aim(e.gamma / 25, (e.beta - 45) / 30);
        }, { passive: true });
      }
      // Scroll push-in: the arch eases toward the viewer as the page begins to scroll.
      onScroll.push(function () {
        push = clamp(scrollY / (innerHeight * .9), 0, 1);
        wrap.style.setProperty('--push', push.toFixed(3));
      });
    }
    var dust = wrap.querySelector('canvas.dust');
    if (dust && !REDUCED) goldDust(dust);
  });

  function goldDust(canvas) {
    var ctx = canvas.getContext('2d'), w = 0, h = 0, dpr = Math.min(devicePixelRatio || 1, 2), motes = [], on = false;
    function size() { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function seed(m, fresh) {
      m.x = Math.random() * w; m.y = fresh ? Math.random() * h : h + 10;
      m.r = .6 + Math.random() * 1.8; m.v = 6 + Math.random() * 16; m.d = Math.random() * 6.28; m.a = .25 + Math.random() * .6;
    }
    new ResizeObserver(size).observe(canvas); size();
    for (var i = 0; i < 46; i++) { var m = {}; seed(m, true); motes.push(m); }
    var last = performance.now();
    function tick(now) {
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, w, h);
      motes.forEach(function (m) {
        m.y -= m.v * dt; m.d += dt * .8; m.x += Math.sin(m.d) * .25;
        if (m.y < -10) seed(m, false);
        var tw = .55 + .45 * Math.sin(m.d * 2.3);
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283);
        ctx.fillStyle = 'rgba(232,206,150,' + (m.a * tw).toFixed(3) + ')';
        ctx.shadowColor = 'rgba(255,226,170,.9)'; ctx.shadowBlur = 6; ctx.fill();
      });
      if (on) requestAnimationFrame(tick);
    }
    new IntersectionObserver(function (es) {
      var was = on; on = es[0].isIntersecting;
      if (on && !was) { last = performance.now(); requestAnimationFrame(tick); }
    }).observe(canvas);
  }

  // ---------- 2. Screens that lay flat as they arrive (TEDx folio, speaker reel) ----------
  $$('[data-screen-in]').forEach(function (el) {
    if (REDUCED) { el.style.setProperty('--flat', 1); return; }
    onScroll.push(function () {
      var p = progress(el, 1, .5);
      el.style.setProperty('--flat', p.toFixed(3));
      el.classList.toggle('is-flat', p > .97);
    });
  });

  // Reel: plays silently when it lays flat, offers sound, ends on a booking call.
  $$('[data-reel]').forEach(function (box) {
    var video = box.querySelector('video'), sound = box.querySelector('.reel-sound'), end = box.querySelector('.reel-end');
    if (!video) return;
    var started = false;
    if (!REDUCED) {
      new IntersectionObserver(function (es) {
        var e = es[0];
        if (e.intersectionRatio > .6 && !started) {
          started = true; video.muted = true;
          var pr = video.play(); if (pr && pr.catch) pr.catch(function () {});
          box.classList.add('previewing');
        } else if (e.intersectionRatio < .2 && video.muted && !video.paused) { video.pause(); started = false; }
      }, { threshold: [0, .2, .6] }).observe(box);
    }
    if (sound) sound.addEventListener('click', function () {
      video.muted = false; video.currentTime = video.currentTime < 2 ? 0 : video.currentTime;
      video.play(); box.classList.remove('previewing');
    });
    video.addEventListener('volumechange', function () { if (!video.muted) box.classList.remove('previewing'); });
    video.addEventListener('ended', function () { box.classList.add('ended'); box.classList.remove('previewing'); });
    video.addEventListener('play', function () { box.classList.remove('ended'); });
    var replay = box.querySelector('.reel-replay');
    if (replay) replay.addEventListener('click', function () { video.currentTime = 0; video.play(); });
  });

  // ---------- 5. Cards that tilt toward the cursor (or the phone's motion) ----------
  var tilters = $$('[data-tilt]');
  tilters.forEach(function (card) {
    if (REDUCED) return;
    var max = +card.dataset.tilt || 8;
    function set(nx, ny) {
      card.style.setProperty('--rx', (-ny * max).toFixed(2) + 'deg');
      card.style.setProperty('--ry', (nx * max).toFixed(2) + 'deg');
      card.style.setProperty('--gx', ((nx + 1) * 50).toFixed(1) + '%');
      card.style.setProperty('--gy', ((ny + 1) * 50).toFixed(1) + '%');
    }
    if (FINE) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        set(((e.clientX - r.left) / r.width - .5) * 2, ((e.clientY - r.top) / r.height - .5) * 2);
        card.classList.add('tilting');
      });
      card.addEventListener('pointerleave', function () { set(0, 0); card.classList.remove('tilting'); });
    }
  });
  if (!REDUCED && !FINE && tilters.length) {
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null) return;
      var nx = clamp(e.gamma / 30, -1, 1) * .6, ny = clamp((e.beta - 45) / 40, -1, 1) * .6;
      tilters.forEach(function (c) {
        var m = +c.dataset.tilt || 8;
        c.style.setProperty('--rx', (-ny * m).toFixed(2) + 'deg');
        c.style.setProperty('--ry', (nx * m).toFixed(2) + 'deg');
        c.style.setProperty('--gx', ((nx + 1) * 50).toFixed(1) + '%');
        c.style.setProperty('--gy', ((ny + 1) * 50).toFixed(1) + '%');
      });
    }, { passive: true });
  }

  // ---------- 9. Ballot ready planner: the cover swings open as it scrolls in ----------
  $$('[data-planner]').forEach(function (stack) {
    if (REDUCED) { stack.style.setProperty('--open', .55); return; }
    onScroll.push(function () { stack.style.setProperty('--open', (progress(stack, .95, .45) * .62).toFixed(3)); });
    stack.addEventListener('pointerenter', function () { stack.classList.add('peek'); });
    stack.addEventListener('pointerleave', function () { stack.classList.remove('peek'); });
  });

  // ---------- 7. Bookshelf: pull a book, it turns to show the cover and a note ----------
  $$('[data-shelf]').forEach(function (shelf) {
    var books = $$('.book3d', shelf);
    books.forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        var open = !b.classList.contains('pulled');
        books.forEach(function (o) { o.classList.remove('pulled'); o.setAttribute('aria-expanded', 'false'); });
        if (open) { b.classList.add('pulled'); b.setAttribute('aria-expanded', 'true'); }
      });
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } });
    });
  });

  // ---------- WebGL scenes: stage, constellation, boardroom, monogram ----------
  function webgl() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
    catch (e) { return false; }
  }
  var scenes = $$('[data-scene]');
  var GL = scenes.length && webgl();
  var modP = null;
  function mod() { return modP || (modP = import(SCENES_URL)); }
  scenes.forEach(function (el) {
    if (!GL) { el.classList.add('scene-off'); fallback(el); return; }
    new IntersectionObserver(function (es, io) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      mod().then(function (m) { m.mount(el); if (el.classList.contains('scene-off')) fallback(el); })
           .catch(function (err) { console.warn('3D unavailable:', err); el.classList.add('scene-off'); fallback(el); });
    }, { rootMargin: '600px 0px' }).observe(el);
  });

  // Without WebGL the constellation becomes a list of chips that still fill the panel.
  function fallback(el) {
    if (el.dataset.scene !== 'constellation') return;
    var labels = $$('[data-topic]', el), panel = el.querySelector('.const-panel');
    function show(i) {
      var d = labels[i].dataset, name = labels[i].textContent.trim();
      labels.forEach(function (l, k) { l.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      panel.querySelector('.cp-title').textContent = name;
      panel.querySelector('.cp-hook').textContent = d.hook || '';
      panel.querySelector('.cp-best').textContent = d.best || '';
      panel.querySelector('.cp-ask').href = 'mailto:info@alimayu.studio?subject=' + encodeURIComponent('Speaking request: ' + name) + '&body=' + encodeURIComponent('Date:\nAudience:\nFormat:\nLocation:\nBudget:\n');
      panel.querySelector('.cp-more').href = '#' + (d.card || '');
    }
    labels.forEach(function (l, i) { l.addEventListener('click', function () { show(i); }); });
    show(0);
  }

  request();
})();
