// Handmade interactions for the atelier: torn-paper section edges, pinned notes that pull off the board,
// a wax seal that breaks open a letter, page-turning books, the ledger book, the topic deck, and the
// Postmoon mailer. Every piece respects prefers-reduced-motion and works by keyboard.
document.documentElement.classList.add('js');
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function onView(el, fn, margin) {
    if (reduce || !('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fn(); io.disconnect(); } }, { rootMargin: margin || '0px 0px -12% 0px' });
    io.observe(el);
  }

  // ---------- 1. Torn-paper edges between sections of different color ----------
  (function () {
    if (!document.body.classList.contains('paper')) return;
    var main = document.getElementById('main');
    if (!main) return;
    var secs = $$(':scope > section', main);
    function tone(s) {
      var c = getComputedStyle(s).backgroundColor;
      return (c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c)) ? 'paper' : c;
    }
    for (var i = 1; i < secs.length; i++) {
      var a = tone(secs[i - 1]), b = tone(secs[i]);
      if (a === b || secs[i].classList.contains('no-tear')) continue;
      var t = document.createElement('div');
      t.className = 'tear' + (b === 'paper' ? ' to-paper' : '');
      t.setAttribute('aria-hidden', 'true');
      if (b !== 'paper') t.style.setProperty('--tc', b);
      t.innerHTML = '<b></b><i></i>';
      secs[i].parentNode.insertBefore(t, secs[i]);
      (function (t) { onView(t, function () { t.classList.add('ripped'); }, '0px 0px -6% 0px'); })(t);
    }
  })();

  // ---------- 2. Pinned notes: pull one off the board and toss it ----------
  (function () {
    var stage = document.getElementById('seats');
    if (!stage || reduce || !matchMedia('(min-width: 901px) and (pointer: fine)').matches) return;
    stage.classList.add('notes-loose');
    $$('.tag', stage).forEach(function (tag) {
      var dx = 0, dy = 0, vx = 0, vy = 0, sx, sy, lx, ly, lt, dragging = false, moved = false, raf;
      function put() { tag.style.setProperty('--dx', dx + 'px'); tag.style.setProperty('--dy', dy + 'px'); }
      function bounds() {
        var s = stage.getBoundingClientRect(), r = tag.getBoundingClientRect();
        return { minX: dx - (r.left - s.left) + 8, maxX: dx + (s.right - r.right) - 8, minY: dy - (r.top - s.top) + 8, maxY: dy + (s.bottom - r.bottom) - 8 };
      }
      tag.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        cancelAnimationFrame(raf);
        dragging = true; moved = false; sx = lx = e.clientX; sy = ly = e.clientY; lt = performance.now(); vx = vy = 0;
        tag.setPointerCapture(e.pointerId);
      });
      tag.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
        if (!moved) { moved = true; tag.classList.add('unpinned', 'dragging'); }
        var now = performance.now(), dt = Math.max(1, now - lt);
        vx = (e.clientX - lx) / dt * 16; vy = (e.clientY - ly) / dt * 16;
        dx += e.clientX - lx; dy += e.clientY - ly; lx = e.clientX; ly = e.clientY; lt = now;
        tag.style.setProperty('--tilt', Math.max(-14, Math.min(14, vx * 1.4)) + 'deg');
        put();
      });
      function release() {
        if (!dragging) return;
        dragging = false;
        if (!moved) return;
        tag.classList.remove('dragging');
        (function glide() {
          vx *= .92; vy *= .92; dx += vx; dy += vy;
          var b = bounds();
          if (dx < b.minX) { dx = b.minX; vx = -vx * .5; } if (dx > b.maxX) { dx = b.maxX; vx = -vx * .5; }
          if (dy < b.minY) { dy = b.minY; vy = -vy * .5; } if (dy > b.maxY) { dy = b.maxY; vy = -vy * .5; }
          tag.style.setProperty('--tilt', Math.max(-14, Math.min(14, vx * 1.4)) + 'deg');
          put();
          if (Math.abs(vx) + Math.abs(vy) > .3) raf = requestAnimationFrame(glide);
          else tag.style.setProperty('--tilt', '0deg');
        })();
      }
      tag.addEventListener('pointerup', release);
      tag.addEventListener('pointercancel', release);
      // A drag is not a click: only a still press opens the link.
      tag.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } });
      tag.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });
  })();

  // ---------- 3. The wax seal: break it to open the letter ----------
  $$('[data-sealed]').forEach(function (env) {
    var seal = env.querySelector('.seal-btn'), letter = env.querySelector('.env-letter');
    letter.inert = true;
    var body = env.querySelector('.env-body');
    function measure() {
      // The letter rises until its foot rests just above the pocket; the section grows to make room.
      var envH = body.offsetHeight, letH = letter.offsetHeight, rise = letH - envH * .44;
      env.style.setProperty('--rise', rise + 'px');
      if (env.classList.contains('opened')) env.style.paddingTop = Math.max(0, rise - envH * .06) + 24 + 'px';
    }
    addEventListener('resize', measure);
    seal.addEventListener('click', function () {
      env.classList.add('opened');
      measure();
      seal.disabled = true;
      seal.setAttribute('aria-expanded', 'true');
      letter.inert = false;
      setTimeout(function () { var a = letter.querySelector('a'); if (a) a.focus({ preventScroll: true }); }, reduce ? 0 : 1400);
    });
  });

  // ---------- 4. Books that turn ----------
  // Markup: <div class="book" aria-label="..."> with <div class="bp"> pages in reading order.
  // Wide screens show two-page spreads that flip in 3D; phones show one page at a time.
  function Book(el) {
    var pages = $$(':scope > .bp', el), n = pages.length, mq = matchMedia('(max-width: 760px)');
    var mode, cur = 0, leaves = [], stage, count, prev, next, track;
    var label = el.getAttribute('aria-label') || 'Book';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-roledescription', 'book');

    var bar = document.createElement('div');
    bar.className = 'book-bar';
    bar.innerHTML = '<button type="button" class="book-prev" aria-label="Previous page"><span aria-hidden="true">&larr;</span></button><span class="book-count" aria-live="polite"></span><button type="button" class="book-next" aria-label="Next page"><span aria-hidden="true">&rarr;</span></button>';
    prev = bar.querySelector('.book-prev'); next = bar.querySelector('.book-next'); count = bar.querySelector('.book-count');

    function build() {
      var at = mode === 'spread' ? Math.max(0, cur * 2 - 1) : cur; // keep the reader on the same page across modes
      el.textContent = '';
      mode = mq.matches ? 'single' : 'spread';
      stage = document.createElement('div');
      stage.className = 'book-stage ' + mode;
      leaves = [];
      if (mode === 'spread') {
        var L = Math.ceil(n / 2);
        for (var i = 0; i < L; i++) {
          var leaf = document.createElement('div'); leaf.className = 'leaf';
          var f = document.createElement('div'); f.className = 'face front'; f.appendChild(pages[2 * i]);
          var b = document.createElement('div'); b.className = 'face back';
          if (pages[2 * i + 1]) b.appendChild(pages[2 * i + 1]); else { var blank = document.createElement('div'); blank.className = 'bp blank'; b.appendChild(blank); }
          leaf.appendChild(f); leaf.appendChild(b); stage.appendChild(leaf); leaves.push(leaf);
        }
        cur = Math.min(L, Math.ceil(at / 2));
      } else {
        track = document.createElement('div'); track.className = 'book-track';
        pages.forEach(function (p) { var s = document.createElement('div'); s.className = 'face solo'; s.appendChild(p); track.appendChild(s); });
        stage.appendChild(track);
        cur = Math.min(n - 1, at);
      }
      el.appendChild(stage); el.appendChild(bar);
      render(true);
    }

    function render(instant) {
      var visible = [];
      if (mode === 'spread') {
        var L = leaves.length;
        leaves.forEach(function (lf, i) {
          var turned = i < cur;
          lf.classList.toggle('turned', turned);
          if (instant || !lf.classList.contains('moving')) lf.style.zIndex = turned ? i + 1 : 2 * L - i;
        });
        if (cur > 0) visible.push(leaves[cur - 1].querySelector('.back'));
        if (cur < L) visible.push(leaves[cur].querySelector('.front'));
        stage.classList.toggle('closed-front', cur === 0);
        stage.classList.toggle('closed-back', cur === L);
        count.textContent = cur === 0 ? 'Cover' : cur === L ? 'Back cover' : 'Pages ' + (2 * cur) + ' and ' + Math.min(n, 2 * cur + 1) + ' of ' + n;
        prev.disabled = cur === 0; next.disabled = cur === L;
      } else {
        track.style.transform = 'translateX(' + (-cur * 100) + '%)';
        visible.push(track.children[cur]);
        count.textContent = 'Page ' + (cur + 1) + ' of ' + n;
        prev.disabled = cur === 0; next.disabled = cur === n - 1;
      }
      $$('.face', stage).forEach(function (f) { var on = visible.indexOf(f) > -1; f.inert = !on; f.setAttribute('aria-hidden', on ? 'false' : 'true'); });
      if (instant) stage.classList.add('instant'), requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.remove('instant'); }); });
    }

    function go(dir) {
      if (mode === 'spread') {
        var L = leaves.length, to = cur + dir;
        if (to < 0 || to > L) return;
        var moving = leaves[dir > 0 ? cur : cur - 1];
        moving.classList.add('moving'); moving.style.zIndex = 3 * L;
        cur = to; render();
        setTimeout(function () { moving.classList.remove('moving'); render(); }, reduce ? 0 : 950);
      } else {
        cur = Math.max(0, Math.min(n - 1, cur + dir)); render();
      }
    }

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    el.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    // Tap the right page to turn forward, the left page to turn back. Links and buttons keep working.
    el.addEventListener('click', function (e) {
      if (e.target.closest('a, button, input, select, textarea, [data-entry]')) return;
      var face = e.target.closest('.face');
      if (!face) return;
      if (face.classList.contains('front')) go(1);
      else if (face.classList.contains('back')) go(-1);
    });
    var px = null;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') px = e.clientX; });
    el.addEventListener('pointerup', function (e) { if (px === null) return; var d = e.clientX - px; px = null; if (Math.abs(d) > 45) go(d < 0 ? 1 : -1); });
    mq.addEventListener('change', build);
    build();
    el.bookApi = { go: go };
  }

  // ---------- 5. The ledger, kept as a book of eras ----------
  (function () {
    var host = document.getElementById('ledger-book');
    if (!host) return;
    var C = { budget: '#B08D57', board: '#2F7A78', evidence: '#1E2346', ground: '#171717' };
    var R = [
      ['budget', 2006, 2015, 'UnitedHealthcare and UnitedHealth Networks', 'Rose through internal promotions to network program consultant. Designed a five-state value-based reimbursement program averaging $8.5 million in monthly savings.'],
      ['board', 2010, 2015, 'Nevada State Board of Occupational Therapy', 'Public representative, appointed by the governor.'],
      ['board', 2012, 2014, 'EnergyFit Nevada', 'Secretary, board of directors.'],
      ['board', 2013, 2019, 'Nevada Board of Regents', 'Elected November 2012 and served January 2013 to January 2019. Vice chair from December 2016 to June 2017. Chair of the Audit and Compliance Committee.'],
      ['board', 2013, 2014, 'Legislative Subcommittee on Governance and Financing', 'Member, Nevada Legislature.'],
      ['budget', 2015, 2018, 'DaVita Integrated Care', 'Senior manager, network development. Designed value-based provider payment models for complex, underserved populations.'],
      ['board', 2015, 2018, 'Nevada Commission for Women', 'Appointed by the governor.'],
      ['board', 2016, 2018, 'Nevada State Board of Education', 'Higher education representative, appointed by the governor.'],
      ['board', 2016, 2024, 'Democratic National Committee', 'Elected member for two terms. Secretary of the Black Caucus and an officer of the Environmental and Climate Crisis Council.'],
      ['evidence', 2016, 2020, 'PhD, Biomedical Informatics, Rutgers', 'Dissertation on extreme heat and kidney-related emergency care in Nevada.'],
      ['board', 2017, 2018, 'Association of Community College Trustees', 'Member, Finance and Audit Committee.'],
      ['board', 2017, 2020, 'Nevada PEP board', 'Board member.'],
      ['ground', 2018, 2018, 'Candidate for US Congress', 'Nevada’s 4th Congressional District, including a televised debate on KTNV 13.'],
      ['budget', 2018, 0, 'Color Lens Consulting', 'Founder of an independent health care and policy advisory practice.'],
      ['budget', 2018, 0, 'Periwinkle Group', 'Vice president of project development, including award-winning statewide campaigns for Black families.'],
      ['evidence', 2019, 2027, 'MEDCAC', 'Medicare Evidence Development and Coverage Advisory Committee, appointed by the US Secretary of Health and Human Services.'],
      ['board', 2019, 2020, 'Children’s Justice Act Task Force', 'Appointee, Nevada Division of Child and Family Services.'],
      ['ground', 2019, 2021, 'Nevada PEP, Statewide Family Network', 'Director of statewide programs for families of children with mental health needs and developmental disabilities.'],
      ['board', 2020, 2021, 'Nevada Vocational Rehabilitation Council', 'Appointed by the governor.'],
      ['evidence', 2021, 2024, 'Tufts University School of Medicine', 'Assistant professor, Department of Medicine, 2022 to 2024, and director of networks and policy for the HOPE National Resource Center.'],
      ['ground', 2021, 0, 'Nevada PEP, strategic initiatives', 'Strategic initiatives director.'],
      ['evidence', 2025, 2026, 'Fulbright US Scholar, Research Ireland', 'Designed SAFE, an end-to-end governance framework for challenge funding, with documented selection, stage gates, risk controls, and transition planning.'],
      ['evidence', 2026, 2026, 'IPCC expert reviewer', 'Special Report on Climate Change and Cities.'],
      ['board', 2026, 2030, 'North Carolina Oil and Gas Commission', 'Commissioner, appointed in 2026 to a four-year term.']
    ];
    var ERAS = [
      [2006, 2012, 'Managed care and a first appointment'],
      [2013, 2015, 'Elected to the Board of Regents'],
      [2016, 2017, 'National seats, doctoral research'],
      [2018, 2019, 'A campaign, a practice, a federal seat'],
      [2020, 2024, 'Children, families, and the medical school'],
      [2025, 2026, 'Fulbright, the IPCC, and North Carolina']
    ];
    var ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
    function span(r) { return r[2] === 0 ? r[1] + ' to now' : r[1] === r[2] ? String(r[1]) : r[1] + ' to ' + r[2]; }
    var html = '<div class="bp ledger-cover"><img src="alimayu-seal.png" alt=""><p class="lc-kicker">The record</p><h3>The Ledger</h3><p class="lc-sub">Every seat at every table, 2006 to now</p><p class="lc-hint">Turn the page</p></div>';
    ERAS.forEach(function (e, k) {
      var rows = R.filter(function (r) { return r[1] >= e[0] && r[1] <= e[1]; });
      html += '<div class="bp ledger-page"><p class="lp-era"><span>' + ROMAN[k] + '.</span> ' + e[0] + (e[1] !== e[0] ? '&ndash;' + e[1] : '') + '</p><h4>' + e[2] + '</h4><ol>';
      rows.forEach(function (r) {
        html += '<li><button type="button" data-entry="' + R.indexOf(r) + '" data-lane="' + r[0] + '" style="--c:' + C[r[0]] + '"><span class="le-yr">' + span(r) + '</span><span class="le-name">' + r[3] + '</span></button></li>';
      });
      html += '</ol></div>';
    });
    html += '<div class="bp ledger-cover back-cover"><img src="alimayu-seal.png" alt=""><p class="lc-sub">Still writing</p></div>';
    host.innerHTML = html;
    Book(host);
    var sw = document.getElementById('d-sw'), dt = document.getElementById('d-title'), dd = document.getElementById('d-text');
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-entry]');
      if (!b) return;
      var r = R[+b.dataset.entry];
      $$('[data-entry]', host).forEach(function (x) { x.classList.toggle('on', x === b); });
      sw.style.background = C[r[0]]; dt.textContent = r[3] + ', ' + span(r); dd.textContent = r[4];
    });
    var lenses = $$('.lenses button');
    function filter() {
      var active = lenses.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; }).map(function (x) { return x.dataset.lane; });
      $$('[data-entry]', host).forEach(function (x) { x.classList.toggle('dim', active.indexOf(x.dataset.lane) < 0); });
    }
    lenses.forEach(function (btn) {
      btn.addEventListener('click', function () { btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); filter(); });
    });
    var only = host.getAttribute('data-only');
    if (only) { lenses.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lane === only ? 'true' : 'false'); }); filter(); }
  })();

  $$('.book').forEach(function (el) { if (el.id !== 'ledger-book') Book(el); });

  // ---------- 6. The topic deck: a hand of fifteen cards ----------
  (function () {
    var deck = document.querySelector('[data-deck]');
    if (!deck) return;
    var cards = $$('.topic-card', deck), panel = document.querySelector('.const-panel');
    cards.forEach(function (c, i) { c.style.setProperty('--i', i); c.style.setProperty('--n', cards.length); });
    function show(i, fromDraw) {
      var c = cards[i], d = c.dataset, name = c.querySelector('.tc-name').textContent.trim();
      cards.forEach(function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      panel.querySelector('.cp-title').textContent = name;
      panel.querySelector('.cp-hook').textContent = d.hook || '';
      panel.querySelector('.cp-best').textContent = d.best || '';
      panel.querySelector('.cp-ask').href = 'mailto:info@alimayu.studio?subject=' + encodeURIComponent('Speaking request: ' + name) + '&body=' + encodeURIComponent('Date:\nAudience:\nFormat:\nLocation:\nBudget:\n');
      panel.querySelector('.cp-more').href = '#' + (d.card || '');
      panel.classList.remove('flash'); void panel.offsetWidth; panel.classList.add('flash');
      if (fromDraw && matchMedia('(max-width: 900px)').matches) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    }
    cards.forEach(function (c, i) { c.addEventListener('click', function () { show(i); }); });
    var draw = document.querySelector('[data-draw]');
    if (draw) draw.addEventListener('click', function () {
      var cur = cards.findIndex(function (c) { return c.getAttribute('aria-pressed') === 'true'; }), i;
      do { i = Math.floor(Math.random() * cards.length); } while (i === cur);
      deck.classList.remove('shuffle'); void deck.offsetWidth; deck.classList.add('shuffle');
      setTimeout(function () { show(i, true); }, reduce ? 0 : 520);
    });
    show(0);
  })();

  // ---------- 7. The Postmoon mailer spills open ----------
  $$('[data-mailer]').forEach(function (m) { onView(m, function () { m.classList.add('spilled'); }, '0px 0px -25% 0px'); });
})();
