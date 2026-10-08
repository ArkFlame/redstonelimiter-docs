
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const players = [...document.querySelectorAll('.diagram')].map(figure => {
    const frame = figure.querySelector('.diagram-html');
    const toggle = figure.querySelector('.diagram-toggle');
    let inView = false;
    let manuallyPaused = false;
    let manuallyPlayed = false;
    let playing = false;
    toggle.hidden = false;

    function update() {
      playing = inView && !manuallyPaused && (!reducedMotion.matches || manuallyPlayed);
      // The sandbox gives each self-contained SVG animation a separate opaque origin.
      frame.contentWindow?.postMessage({ type: 'redstonelimiter:playback', play: playing }, '*');
      toggle.textContent = playing ? 'Pause animation' : 'Play animation';
      toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${frame.title}`);
      toggle.setAttribute('aria-pressed', String(playing));
    }

    toggle.addEventListener('click', () => {
      if (playing) {
        manuallyPaused = true;
        manuallyPlayed = false;
      } else {
        manuallyPaused = false;
        manuallyPlayed = true;
      }
      update();
    });
    frame.addEventListener('load', update);
    return { figure, setVisible(visible) { inView = visible; update(); }, update };
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const player = players.find(p => p.figure === entry.target);
        player?.setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.2);
      }
    }, { threshold: [0, 0.2, 0.75] });
    players.forEach(player => observer.observe(player.figure));
  } else {
    players.forEach(player => player.setVisible(true));
  }
  reducedMotion.addEventListener('change', () => players.forEach(player => player.update()));
