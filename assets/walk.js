/* Initiatives walk-in: scroll climbs the stairs, opens the doors, passes through, and walks the hall. */
(function () {
  var w = document.querySelector('[data-walk]');
  if (!w) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { w.classList.add('still'); return; }
  var q = function (s) { return w.querySelector(s); };
  var stairs = q('.w-stairs'), open = q('.w-open'), hall = q('.w-hall'), flash = q('.w-flash'), t1 = q('.w-t1'), t2 = q('.w-t2'), t3 = q('.w-t3');
  function seg(p, a, b) { var t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (3 - 2 * t); }
  var queued = false;
  function update() {
    queued = false;
    var r = w.getBoundingClientRect(), span = w.offsetHeight - (innerHeight - 72);
    var p = Math.min(1, Math.max(0, (72 - r.top) / Math.max(1, span)));
    // 0 to .40: climb toward the door. .30 to .42: the doors open. .40 to .62: through the light. .55 to 1: down the hall.
    var climb = 1 + seg(p, 0, .52) * 1.9 + seg(p, .44, .62) * 4;
    stairs.style.transform = open.style.transform = 'scale(' + climb.toFixed(3) + ')';
    open.style.opacity = seg(p, .3, .4).toFixed(3);
    flash.style.opacity = (seg(p, .44, .56) - seg(p, .6, .7)).toFixed(3);
    hall.style.opacity = seg(p, .55, .62).toFixed(3);
    hall.style.transform = 'scale(' + (1.25 - seg(p, .55, .64) * .25 + seg(p, .64, 1) * 1.1).toFixed(3) + ')';
    t1.style.opacity = (1 - seg(p, .06, .16)).toFixed(3);
    t1.style.transform = 'translateY(' + (seg(p, .06, .16) * 30).toFixed(1) + 'px)';
    t1.style.pointerEvents = p > .12 ? 'none' : '';
    t2.style.opacity = (seg(p, .3, .38) - seg(p, .44, .5)).toFixed(3);
    t3.style.opacity = (seg(p, .66, .74) - seg(p, .9, .98)).toFixed(3);
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  update();
})();
