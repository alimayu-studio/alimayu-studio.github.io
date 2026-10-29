// Media ticker. Logos are local copies from Wikimedia Commons or each outlet's own site
// (hotlinking got rate-limited). An entry with a style instead of a file is a typeset wordmark:
// The American Presidency Project's logo is its name set in Gentium Book Basic, and
// Capital Crossfire (Access Carson City) has no logo file outside Facebook.
(function () {
  var L = 'assets/logos/';
  var gentium = document.createElement('link');
  gentium.rel = 'stylesheet';
  gentium.href = 'https://fonts.googleapis.com/css2?family=Gentium+Book+Plus&display=swap';
  document.head.appendChild(gentium);
  var OUTLETS = [
    ['Fox News', L + 'fox-news.svg'],
    ['CNN', L + 'cnn.svg'],
    ['CBS News', L + 'cbs-news.svg'],
    ['The Washington Post', L + 'washington-post.svg'],
    ['The Guardian', L + 'guardian.svg'],
    ['The Hill', L + 'the-hill.svg'],
    ['Nevada Public Radio', L + 'nevada-public-radio.svg'],
    ['HuffPost', L + 'huffpost.svg'],
    ['KSNV News 3', L + 'ksnv.svg'],
    ['KLAS 8 News Now', L + 'klas.svg'],
    ['The Nevada Independent', L + 'nevada-independent.svg'],
    ['Houston Public Media', L + 'houston-public-media.svg'],
    ['PopSugar', L + 'popsugar.svg'],
    ['Daily Kos', L + 'daily-kos.png'],
    ['Washington Examiner', L + 'washington-examiner.webp'],
    ['Las Vegas Sun', L + 'las-vegas-sun.png'],
    ['Nevada Current', L + 'nevada-current.png'],
    ['The Imprint', L + 'the-imprint.svg'],
    ['The American Presidency Project', null, 'font-family:"Gentium Book Basic","Gentium Book Plus",Georgia,serif;font-weight:400;color:#111'],
    ['Power 88.1', L + 'power-881.png'],
    ['ESPN Las Vegas', L + 'espn-las-vegas.png'],
    ['Nevada Newsmakers', L + 'nevada-newsmakers.png'],
    ['Politics NOW, KLAS 8', L + 'politics-now.jpg'],
    ['Capital Crossfire'],
    ['Child Welfare Monitor', L + 'child-welfare-monitor.png'],
    ['News Medical Life Sciences', L + 'news-medical.png']
  ];

  var track = document.getElementById('ticker');
  if (!track) return;
  function list(hidden) {
    var ul = document.createElement('ul');
    if (hidden) ul.setAttribute('aria-hidden', 'true');
    OUTLETS.forEach(function (o) {
      var li = document.createElement('li');
      if (o[1]) {
        var img = document.createElement('img');
        img.src = o[1];
        img.alt = hidden ? '' : o[0];
        img.title = o[0];
        // Square and badge-shaped logos read too small at the strip's wordmark height.
        img.onload = function () { if (img.naturalWidth / img.naturalHeight < 2) img.style.height = '58px'; };
        img.onerror = function () { var s = document.createElement('span'); s.className = 'wordmark'; s.textContent = o[0]; li.replaceChild(s, img); };
        li.appendChild(img);
      } else {
        var s = document.createElement('span');
        s.className = 'wordmark';
        s.textContent = o[0];
        if (o[2]) s.style.cssText = o[2];
        li.appendChild(s);
      }
      ul.appendChild(li);
    });
    return ul;
  }
  track.appendChild(list(false));
  track.appendChild(list(true));
})();
