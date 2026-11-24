(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Nav background once the page scrolls */
  var nav = $('.nav');
  var onScrollNav = function () { nav.classList.toggle('stuck', window.scrollY > 12); };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* Wall of lifts: three sprite sheets, 16 lifts each, 12 frames per lift */
  var LIFTS = ['Barbell bench press', 'Back squat', 'Pull-up', 'Barbell deadlift', 'Standing barbell overhead press', 'Barbell row', 'Barbell hip thrust', 'Dumbbell curl', 'Dip', 'Lat pulldown', 'Leg press', 'Kettlebell swing', 'Bulgarian split squat', 'Cable fly', 'Hammer curl', 'Push-up',
    'Front squat', 'Incline dumbbell press', 'Chin-up', 'Barbell Romanian deadlift', 'Arnold press', 'Seated cable row', 'Walking lunge', 'Cable triceps pushdown', 'Hanging leg raise', 'Dumbbell lateral raise', 'Goblet squat', 'T-bar row', 'Sumo deadlift', 'Cable face pull', 'Plank', "Farmer's carry",
    'Incline barbell bench press', 'Hack squat', 'One-arm dumbbell row', 'Dumbbell skull crusher', 'Leg extension', 'Preacher curl', 'Reverse lunge', 'Pec deck', 'Glute bridge', 'Russian twist', 'Pike push-up', 'Lying leg curl', 'Dumbbell shrug', 'Inverted row', 'Standing calf raise', 'Jump squat'];
  var wall = $('#wall');
  if (wall) {
    var rows = 4, per = LIFTS.length / rows;
    for (var r = 0; r < rows; r++) {
      var row = document.createElement('div');
      row.className = 'row' + (r % 2 ? ' rev' : '');
      row.style.setProperty('--t', (70 + r * 9) + 's');
      var html = '';
      for (var pass = 0; pass < 2; pass++) {
        for (var k = 0; k < per; k++) {
          /* interleave so each row mixes all three sheets */
          var i = (k * rows + r) % LIFTS.length;
          var sheet = Math.floor(i / 16) + 1, line = i % 16;
          html += '<div class="cell"' + (pass ? ' aria-hidden="true"' : '') + '><div class="mv" style="background-image:url(assets/anim/wall-' + sheet +
            '.webp);background-position-y:' + (line / 15 * 100).toFixed(3) + '%;--dl:-' + ((i * 0.37) % 2.3).toFixed(2) + 's"></div><span>' + LIFTS[i] + '</span></div>';
        }
      }
      row.innerHTML = html;
      wall.appendChild(row);
    }
  }

  /* Reveal on scroll */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    /* Pause looping animations that are off screen */
    var pio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('paused', !e.isIntersecting); });
    }, { rootMargin: '100px' });
    $$('[data-pause]').forEach(function (el) { pio.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Parallax */
  var layers = $$('[data-speed]');
  if (layers.length && !reduce) {
    var ticking = false;
    var paint = function () {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var host = el.offsetParent || el;
        var rect = host.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var off = (rect.top + rect.height / 2 - vh / 2) * parseFloat(el.dataset.speed);
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }

  /* Lift picker */
  var FEAT = {
    'barbell-bench-press': ['Barbell bench press', 'Chest, upper and lower', 'Front delts, triceps'],
    'back-squat': ['Back squat', 'Quads, glutes', 'Adductors, hamstrings, lower back, abs'],
    'pull-up': ['Pull-up', 'Lats, teres major', 'Biceps, rhomboids, lower traps, rear delts'],
    'barbell-deadlift': ['Barbell deadlift', 'Glutes, hamstrings, lower back', 'Quads, adductors, traps, lats, forearms'],
    'standing-barbell-overhead-press': ['Standing barbell overhead press', 'Front and side delts', 'Triceps, upper traps, upper chest, serratus'],
    'barbell-row': ['Barbell row', 'Lats, rhomboids, mid traps', 'Rear delts, biceps, lower back, hamstrings'],
    'barbell-hip-thrust': ['Barbell hip thrust', 'Glutes', 'Hamstrings, adductors, glute medius'],
    'dumbbell-curl': ['Dumbbell curl', 'Biceps', 'Brachialis, forearms']
  };
  var chips = $$('.chip[data-lift]');
  var mv = $('#lift-mv'), map = $('#lift-map'), nm = $('#lift-name'), mn = $('#lift-main'), hp = $('#lift-help');
  var pick = function (slug) {
    var f = FEAT[slug]; if (!f) return;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.lift === slug ? 'true' : 'false'); });
    mv.style.backgroundImage = 'url(assets/anim/' + slug + '.webp)';
    mv.setAttribute('aria-label', f[0] + ', animated');
    map.style.opacity = 0;
    var img = new Image();
    img.onload = function () { map.src = img.src; map.alt = f[0] + ' muscle map, front and back: ' + f[1] + ' in ice blue; ' + f[2] + ' in violet.'; map.style.opacity = 1; };
    img.src = 'assets/muscles/' + slug + '.webp';
    nm.textContent = f[0]; mn.textContent = f[1]; hp.textContent = f[2];
  };
  chips.forEach(function (c) { c.addEventListener('click', function () { userPicked = true; pick(c.dataset.lift); }); });
  var userPicked = false;
  if (chips.length && !reduce) {
    var idx = 0, anatomy = $('#anatomy');
    setInterval(function () {
      if (userPicked || !anatomy || anatomy.classList.contains('paused') || document.hidden) return;
      idx = (idx + 1) % chips.length; pick(chips[idx].dataset.lift);
    }, 4600);
  }

  /* Workout stepper */
  var steps = $$('.step'), shots = $$('.flow-stick .stack img');
  if (steps.length && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = steps.indexOf(e.target);
        steps.forEach(function (s, i) { s.classList.toggle('on', i === n); });
        shots.forEach(function (s, i) { s.classList.toggle('on', i === n); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { sio.observe(s); });
  }

  /* iPhone Duo: the sticky frame folds, opens and props up as the steps pass; data-more flips once a step is past its midpoint, which fades in the scrolled or resting screen */
  var dstage = $('.dstage'), dsteps = $$('.dstep');
  if (dstage && dsteps.length && !reduce) {
    var dtick = false;
    var dpaint = function () {
      dtick = false;
      var mid = window.innerHeight * 0.5, cur = 0, best = Infinity;
      dsteps.forEach(function (st, i) {
        var r = st.getBoundingClientRect();
        var d = mid < r.top ? r.top - mid : (mid > r.bottom ? mid - r.bottom : 0);
        if (d < best) { best = d; cur = i; }
      });
      var r = dsteps[cur].getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (mid - r.top) / Math.max(1, r.height)));
      dstage.dataset.state = dsteps[cur].dataset.state;
      dstage.dataset.more = p > 0.5 ? '1' : '0';
      dsteps.forEach(function (st, i) { st.classList.toggle('on', i === cur); });
    };
    var dqueue = function () { if (!dtick) { dtick = true; requestAnimationFrame(dpaint); } };
    window.addEventListener('scroll', dqueue, { passive: true });
    window.addEventListener('resize', dqueue);
    dpaint();
  }

  /* Lock Screen illustration: rest counts down, the alert arrives, "+30 s" is tapped, repeat */
  var clocks = $$('[data-rest]'), bar = $('#rest-bar'), note = $('#rest-note'), add = $('#rest-add');
  if (clocks.length) {
    var total = 90, left = 12, wait = 0;
    var draw = function () {
      var t = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
      clocks.forEach(function (c) { c.textContent = t; });
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, left / total) + ')';
    };
    if (reduce) { left = 0; draw(); if (note) note.classList.add('show'); }
    else {
      draw();
      setInterval(function () {
        if (document.hidden) return;
        if (left > 0) { left--; draw(); if (left === 0 && note) note.classList.add('show'); return; }
        wait++;
        if (wait === 3 && add) add.classList.add('tap');
        if (wait === 4) { wait = 0; left = 30; draw(); if (add) add.classList.remove('tap'); if (note) note.classList.remove('show'); }
      }, 1000);
    }
  }

  /* Search shorthand demo */
  var q = $('#q'), res = $('#q-results');
  if (q && res) {
    var DEMOS = [
      ['rdl', ['Barbell Romanian deadlift']],
      ['incline bench press (barbell)', ['Incline barbell bench press']],
      ['ohp', ['Standing barbell overhead press']]
    ];
    var show = function (d, text) {
      q.textContent = text;
      res.innerHTML = text === d[0] ? d[1].map(function (x) { return '<li>' + x + '</li>'; }).join('') : '';
    };
    if (reduce) { show(DEMOS[0], DEMOS[0][0]); }
    else {
      var di = 0, ci = 0, hold = 0;
      setInterval(function () {
        if (document.hidden) return;
        var d = DEMOS[di];
        if (ci <= d[0].length) { show(d, d[0].slice(0, ci)); ci++; }
        else if (++hold > 26) { hold = 0; ci = 0; di = (di + 1) % DEMOS.length; }
      }, 90);
    }
  }
})();

// "Request an invite": the address is put together only when tapped, so it never sits in the page
// for scrapers. Without JavaScript the button goes to the support page instead.
document.querySelectorAll('[data-invite]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    var parts = ['moc.liamg', '@', 'egrof+42kiahsjat'].map(function (p) { return p.split('').reverse().join(''); }).reverse();
    window.location.href = 'mai' + 'lto:' + parts.join('') + '?subject=' + encodeURIComponent('FORGE beta invite');
  });
});
