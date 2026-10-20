// Media ticker. Logos load from Wikimedia Commons. Outlets without a public logo file show a set wordmark.
(function () {
  var W = 'https://upload.wikimedia.org/wikipedia/commons/';
  var OUTLETS = [
    ['Fox News', W + '6/67/Fox_News_Channel_logo.svg'],
    ['CNN', W + '9/9d/CNN_Logo_%282014%29.svg'],
    ['CBS News', W + '2/2e/CBS_News_2020_%28Stacked_II%29.svg'],
    ['The Washington Post', W + '9/93/The_Logo_of_The_Washington_Post_Newspaper.svg'],
    ['The Guardian', W + '7/75/The_Guardian_2018.svg'],
    ['The Hill', W + '1/1a/The_Hill_logo_%28blue_horizontal%29.svg'],
    ['Nevada Public Radio', W + 'a/a1/Nevada_Public_Radio_2025.svg'],
    ['HuffPost', W + '5/5a/HuffPost.svg'],
    ['KSNV News 3', W + '9/9f/KSNV_logo.svg'],
    ['KLAS 8 News Now', W + '1/12/KLAS-TV_logo.svg'],
    ['The Nevada Independent', W + '8/86/The_Nevada_Independent_Logo_%28as_of_2025%29.svg'],
    ['Houston Public Media', W + 'f/f9/Houston_Public_Media_%282020%29.svg'],
    ['PopSugar', W + '7/79/Popsugar_logo.svg'],
    ['Daily Kos', W + '0/04/Daily_Kos_new_logo.png'],
    ['Washington Examiner'], ['Las Vegas Sun'], ['Nevada Current'], ['The Imprint'],
    ['The American Presidency Project'], ['Power 88.1'], ['ESPN Las Vegas'], ['Nevada Newsmakers'],
    ['Politics Now'], ['Carson City Crossfire'], ['Child Welfare Monitor'], ['News Medical Life Sciences']
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
        img.onerror = function () { var s = document.createElement('span'); s.className = 'wordmark'; s.textContent = o[0]; li.replaceChild(s, img); };
        li.appendChild(img);
      } else {
        var s = document.createElement('span');
        s.className = 'wordmark';
        s.textContent = o[0];
        li.appendChild(s);
      }
      ul.appendChild(li);
    });
    return ul;
  }
  track.appendChild(list(false));
  track.appendChild(list(true));
})();
