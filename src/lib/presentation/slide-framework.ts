export const SLIDE_FRAMEWORK = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pitch Deck</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --color-primary: #2563eb;
      --color-secondary: #1e40af;
      --color-accent: #f59e0b;
      --color-bg: #ffffff;
      --color-text: #1f2937;
      --font-heading: system-ui, sans-serif;
      --font-body: system-ui, sans-serif;
    }

    html, body {
      width: 100%; height: 100%;
      overflow: hidden;
      font-family: var(--font-body);
      color: var(--color-text);
      background: var(--color-bg);
    }

    #deck {
      width: 100%; height: 100%;
      position: relative;
    }

    .slide {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 5vh 8vw;
      opacity: 0;
      transform: translateX(40px);
      transition: opacity 0.5s ease, transform 0.5s ease;
      pointer-events: none;
      text-align: center;
    }

    .slide.active {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }

    .slide.prev {
      opacity: 0;
      transform: translateX(-40px);
    }

    /* Typography */
    .slide h1 { font-family: var(--font-heading); font-size: clamp(2rem, 5vw, 4rem); font-weight: 800; line-height: 1.1; margin-bottom: 0.5em; }
    .slide h2 { font-family: var(--font-heading); font-size: clamp(1.5rem, 3.5vw, 2.8rem); font-weight: 700; line-height: 1.2; margin-bottom: 0.5em; }
    .slide h3 { font-family: var(--font-heading); font-size: clamp(1.2rem, 2.5vw, 2rem); font-weight: 600; margin-bottom: 0.5em; }
    .slide p  { font-size: clamp(1rem, 1.8vw, 1.4rem); line-height: 1.6; max-width: 60ch; margin-bottom: 0.8em; }
    .slide ul { list-style: none; text-align: left; }
    .slide li { font-size: clamp(1rem, 1.6vw, 1.3rem); line-height: 1.5; margin-bottom: 0.6em; padding-left: 1.5em; position: relative; }
    .slide li::before { content: '\\2022'; color: var(--color-accent); position: absolute; left: 0; font-weight: bold; }
    .slide img { max-width: 80%; max-height: 50vh; object-fit: contain; border-radius: 8px; }
    .slide .logo { max-height: 60px; margin-bottom: 2rem; }

    /* Layout helpers */
    .slide .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 4vw; width: 100%; text-align: left; align-items: center; }
    .slide .stat { font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 800; color: var(--color-primary); font-family: var(--font-heading); }
    .slide .subtitle { font-size: clamp(0.9rem, 1.4vw, 1.2rem); opacity: 0.7; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1em; }
    .slide blockquote { font-style: italic; font-size: clamp(1.1rem, 2vw, 1.6rem); border-left: 4px solid var(--color-accent); padding-left: 1.5em; max-width: 50ch; text-align: left; }

    /* Slide counter */
    #counter {
      position: fixed; bottom: 2vh; right: 3vw;
      font-size: 0.85rem; opacity: 0.4;
      font-family: var(--font-body);
      z-index: 100;
    }

    /* Progress bar */
    #progress {
      position: fixed; top: 0; left: 0;
      height: 3px;
      background: var(--color-primary);
      transition: width 0.4s ease;
      z-index: 100;
    }
  </style>
</head>
<body>
  <div id="progress"></div>
  <div id="deck">
    <!-- SLIDES: Each slide is a <section class="slide"> inside this container -->
  </div>
  <div id="counter"></div>

  <script>
    (function() {
      const slides = document.querySelectorAll('.slide');
      const counter = document.getElementById('counter');
      const progress = document.getElementById('progress');
      let current = 0;

      function show(index) {
        slides.forEach(function(s, i) {
          s.classList.remove('active', 'prev');
          if (i === index) s.classList.add('active');
          else if (i < index) s.classList.add('prev');
        });
        counter.textContent = (index + 1) + ' / ' + slides.length;
        progress.style.width = ((index + 1) / slides.length * 100) + '%';
        current = index;
      }

      function next() { if (current < slides.length - 1) show(current + 1); }
      function prev() { if (current > 0) show(current - 1); }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
        if (e.key === 'Home') { e.preventDefault(); show(0); }
        if (e.key === 'End') { e.preventDefault(); show(slides.length - 1); }
        if (e.key === 'f' || e.key === 'F') {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
        }
      });

      // Touch support
      var touchStartX = 0;
      document.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; });
      document.addEventListener('touchend', function(e) {
        var diff = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(diff) > 50) { diff > 0 ? prev() : next(); }
      });

      // Click navigation (left third = prev, right third = next)
      document.addEventListener('click', function(e) {
        if (e.clientX < window.innerWidth / 3) prev();
        else if (e.clientX > window.innerWidth * 2 / 3) next();
      });

      show(0);
    })();
  </script>
</body>
</html>`;
