/* Spatial shelf: [data-shelf] children stand in a curved row. Scrolling walks along the row; the item
   in front faces the visitor and the others turn away into depth. Wide screens only; phones keep the grid. */
(function () {
  var shelves = document.querySelectorAll('[data-shelf]');
  if (!shelves.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var wide = matchMedia('(min-width: 901px)');
  shelves.forEach(function (shelf) {
    var items = [].slice.call(shelf.children), n = items.length;
    if (n < 2) return;
    items.forEach(function (it) { it.removeAttribute('data-tilt'); });   // the shelf moves these; the cursor tilt would fight it
    var holder = document.createElement('div'); holder.className = 'shelf-holder';
    shelf.parentNode.insertBefore(holder, shelf); holder.appendChild(shelf);
    var dots = document.createElement('div'); dots.className = 'shelf-dots';
    items.forEach(function (it, i) {
      var b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', 'Show item ' + (i + 1) + ' of ' + n);
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
      it.addEventListener('click', function () { if (!it.classList.contains('front')) go(i); });
    });
    holder.appendChild(dots);
    var queued = false, perItem = .55;

    function size() {
      var on = wide.matches;
      holder.classList.toggle('on', on);
      if (!on) { holder.style.height = ''; shelf.style.height = ''; items.forEach(function (it) { it.style.transform = it.style.opacity = it.style.zIndex = ''; it.classList.remove('front'); }); return; }
      var h = 0; items.forEach(function (it) { h = Math.max(h, it.offsetHeight); });
      shelf.style.height = h + 'px';
      shelf.style.top = Math.max(24, (innerHeight - h) / 2 - 20) + 'px';
      dots.style.top = (h + 60) + 'px';
      holder.style.height = (h + 120 + (n - 1) * perItem * innerHeight) + 'px';
      update();
    }
    function progress() {
      var r = holder.getBoundingClientRect(), travel = holder.offsetHeight - shelf.offsetHeight - 120;
      return Math.min(1, Math.max(0, (parseFloat(shelf.style.top) + 36 - r.top) / Math.max(1, travel)));
    }
    function go(i) {
      var r = holder.getBoundingClientRect(), travel = holder.offsetHeight - shelf.offsetHeight - 120;
      scrollTo({ top: scrollY + r.top - parseFloat(shelf.style.top) - 36 + travel * (i / (n - 1)), behavior: 'smooth' });
    }
    function update() {
      queued = false;
      if (!holder.classList.contains('on')) return;
      var L = progress() * (n - 1), near = Math.round(L);
      items.forEach(function (it, i) {
        var d = i - L, a = Math.abs(d);
        var x = d * 62, z = -a * 260, ry = Math.max(-55, Math.min(55, -d * 38)), s = 1 - Math.min(a, 2) * .06;
        it.style.transform = 'translateX(' + x + '%) translateZ(' + z + 'px) rotateY(' + ry + 'deg) scale(' + s.toFixed(3) + ')';
        it.style.opacity = Math.max(.25, 1 - a * .35).toFixed(3);
        it.style.zIndex = String(100 - Math.round(a * 10));
        it.classList.toggle('front', i === near);
      });
      [].forEach.call(dots.children, function (b, i) { b.classList.toggle('on', i === near); });
    }
    function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', size);
    wide.addEventListener('change', size);
    shelf.addEventListener('toggle', size, true);   // a details panel opening changes the card height
    size();
  });
})();
