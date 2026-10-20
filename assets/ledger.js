// Interactive record ledger: every role from 2006 to today, filterable by lane.
(function () {
  var rowsEl = document.getElementById('tl-rows');
  if (!rowsEl) return;
  var Y0 = 2006, Y1 = 2030, SPAN = Y1 - Y0 + 1, NOW = 2026.8;
  var C = { budget: '#B08D57', board: '#2F7A78', evidence: '#1E2346', ground: '#171717' };
  var R = [
    ['budget', 2006, 2015, 'UnitedHealthcare and UnitedHealth Networks', 'Rose through internal promotions to network program consultant. Designed a five-state value-based reimbursement program averaging $8.5 million in monthly savings.'],
    ['budget', 2015, 2018.4, 'DaVita Integrated Care', 'Senior manager, network development. Designed value-based provider payment models for complex, underserved populations.'],
    ['budget', 2018.3, 2026.8, 'Color Lens Consulting', 'Founder of an independent health care and policy advisory practice.'],
    ['budget', 2018.3, 2026.8, 'Periwinkle Group', 'Vice president of project development, including award-winning statewide campaigns for Black families.'],
    ['board', 2010, 2015, 'Nevada State Board of Occupational Therapy', 'Public representative, appointed by the governor.'],
    ['board', 2012, 2014, 'EnergyFit Nevada', 'Secretary, board of directors.'],
    ['board', 2013, 2019, 'Nevada Board of Regents', 'Elected November 2012 and served January 2013 to January 2019. Vice chair from December 2016 to June 2017. Chair of the Audit and Compliance Committee.'],
    ['board', 2013, 2014, 'Legislative Subcommittee on Governance and Financing', 'Member, Nevada Legislature.'],
    ['board', 2015, 2018, 'Nevada Commission for Women', 'Appointed by the governor.'],
    ['board', 2016, 2018, 'Nevada State Board of Education', 'Higher education representative, appointed by the governor.'],
    ['board', 2016, 2024, 'Democratic National Committee', 'Elected member for two terms. Secretary of the Black Caucus and an officer of the Environmental and Climate Crisis Council.'],
    ['board', 2017, 2018, 'Association of Community College Trustees', 'Member, Finance and Audit Committee.'],
    ['board', 2017, 2020, 'Nevada PEP board', 'Board member.'],
    ['board', 2019, 2020, 'Children’s Justice Act Task Force', 'Appointee, Nevada Division of Child and Family Services.'],
    ['board', 2020, 2021.5, 'Nevada Vocational Rehabilitation Council', 'Appointed by the governor.'],
    ['board', 2026, 2030, 'North Carolina Oil and Gas Commission', 'Commissioner, appointed in 2026 to a four-year term.'],
    ['evidence', 2016.5, 2020.4, 'PhD, Biomedical Informatics, Rutgers', 'Dissertation on extreme heat and kidney-related emergency care in Nevada.'],
    ['evidence', 2019, 2027, 'MEDCAC', 'Medicare Evidence Development and Coverage Advisory Committee, appointed by the US Secretary of Health and Human Services.'],
    ['evidence', 2021, 2024.8, 'Tufts University School of Medicine', 'Assistant professor, Department of Medicine, 2022 to 2024, and director of networks and policy for the HOPE National Resource Center.'],
    ['evidence', 2025.7, 2026.4, 'Fulbright US Scholar, Research Ireland', 'Advised on challenge-based and mission-oriented funding design, and later on organizational and international strategy.'],
    ['evidence', 2026, 2026.8, 'IPCC expert reviewer', 'Special Report on Climate Change and Cities.'],
    ['ground', 2019, 2021.6, 'Nevada PEP, Statewide Family Network', 'Director of statewide programs for families of children with mental health needs and developmental disabilities.'],
    ['ground', 2021.5, 2026.8, 'Nevada PEP, strategic initiatives', 'Strategic initiatives director.'],
    ['ground', 2018, 2018.9, 'Candidate for US Congress', 'Nevada’s 4th Congressional District, including a televised debate on KTNV 13.']
  ];
  var years = document.getElementById('tl-years'), grid = document.getElementById('tl-grid');
  for (var y = Y0; y <= Y1; y++) { var s = document.createElement('span'); s.textContent = y; years.appendChild(s); grid.appendChild(document.createElement('i')); }
  function pct(v) { return ((v - Y0) / SPAN * 100) + '%'; }
  var bars = [];
  R.forEach(function (r) {
    var row = document.createElement('div'); row.className = 'tl-row';
    var b = document.createElement('button'); b.className = 'tl-bar'; b.type = 'button';
    b.style.left = pct(r[1]); b.style.width = 'calc(' + ((r[2] - r[1]) / SPAN * 100) + '% + 4px)';
    b.style.setProperty('--c', C[r[0]]); b.textContent = r[3]; b.title = r[3]; b.dataset.lane = r[0];
    function show() {
      bars.forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
      document.getElementById('d-sw').style.background = C[r[0]];
      document.getElementById('d-title').textContent = r[3];
      document.getElementById('d-text').textContent = r[4];
    }
    b.addEventListener('mouseenter', show); b.addEventListener('focus', show); b.addEventListener('click', show);
    var lab = document.createElement('span'); lab.className = 'tl-label'; lab.textContent = r[3];
    lab.style.left = 'calc(' + pct(r[2]) + ' + 10px)'; lab.setAttribute('aria-hidden', 'true');
    lab.addEventListener('click', show);
    row.appendChild(b); row.appendChild(lab); rowsEl.appendChild(row); bars.push(b);
  });
  // Bars too short for their name show the name beside them instead
  function fit() {
    bars.forEach(function (b) {
      var short = b.scrollWidth > b.clientWidth + 1 || b.classList.contains('short') && b.clientWidth < 170;
      b.classList.toggle('short', short);
      var lab = b.nextSibling, end = b.offsetLeft + b.offsetWidth, room = rowsEl.clientWidth - end;
      if (short && room < lab.offsetWidth + 20) { lab.style.left = 'auto'; lab.style.right = 'calc(' + (100 - parseFloat(b.style.left)) + '% + 10px)'; lab.classList.add('left'); }
    });
  }
  fit(); addEventListener('resize', fit);
  var now = document.createElement('div'); now.className = 'tl-now'; now.style.left = pct(NOW); rowsEl.appendChild(now);
  [].forEach.call(document.querySelectorAll('.lenses button'), function (btn) {
    btn.addEventListener('click', function () {
      btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      var active = [].map.call(document.querySelectorAll('.lenses button[aria-pressed="true"]'), function (x) { return x.dataset.lane; });
      bars.forEach(function (x) { x.classList.toggle('dim', active.indexOf(x.dataset.lane) < 0); });
    });
  });
  var tl = document.getElementById('tl');
  // A page can open the ledger on one lane (data-only="board") while keeping the others a tap away
  var only = tl.getAttribute('data-only');
  if (only) {
    [].forEach.call(document.querySelectorAll('.lenses button'), function (b) { b.setAttribute('aria-pressed', b.dataset.lane === only ? 'true' : 'false'); });
    bars.forEach(function (x) { x.classList.toggle('dim', x.dataset.lane !== only); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { tl.classList.add('drawn'); io.disconnect(); } }, { threshold: .2 });
    io.observe(tl);
  } else { tl.classList.add('drawn'); }
})();
