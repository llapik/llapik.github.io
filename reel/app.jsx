/* llapik reel — scroll-driven app.
   Scrubs the sprite-reel timeline (animations.jsx + scenes.jsx) by page scroll,
   with eased smoothing so content does not snap. */
(function () {
  const { useState, useEffect, useMemo } = React;

  const RUNWAY_VH = 1100;  // scroll length: higher = slower scrub
  const SMOOTH = 0.09;     // easing toward scroll target (lower = smoother/slower)

  function ScrollStage({ width, height, duration, background, children }) {
    const [time, setTime] = useState(0);
    const [scale, setScale] = useState(1);

    // Cover-fit the 1920x1080 stage to the viewport
    useEffect(() => {
      const measure = () => setScale(Math.max(window.innerWidth / width, window.innerHeight / height));
      measure();
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }, []);

    // Map scroll position -> timeline seconds, eased via a rAF lerp
    useEffect(() => {
      let target = 0, cur = 0, raf = null;

      const readTarget = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        target = p * duration;
        const hint = document.getElementById('reel-hint');
        if (hint) hint.classList.toggle('hidden', window.scrollY > window.innerHeight * 0.12);
      };

      const loop = () => {
        cur += (target - cur) * SMOOTH;
        if (Math.abs(target - cur) < 0.0004) cur = target;
        setTime(cur);                     // identical value => React skips re-render
        raf = requestAnimationFrame(loop);
      };

      readTarget();
      cur = target;                       // start already settled (no intro sweep)
      window.addEventListener('scroll', readTarget, { passive: true });
      window.addEventListener('resize', readTarget, { passive: true });
      raf = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', readTarget);
        window.removeEventListener('resize', readTarget);
      };
    }, []);

    const ctx = useMemo(
      () => ({ time, duration, playing: true, setTime, setPlaying: function () {} }),
      [time, duration]
    );

    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background, zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width, height, background,
          transform: 'translate(-50%,-50%) scale(' + scale + ')', transformOrigin: 'center',
        }}>
          <TimelineContext.Provider value={ctx}>{children}</TimelineContext.Provider>
        </div>
      </div>
    );
  }

  // Smooth-scroll to a fraction (0..1) of the runway — used by the overlay nav.
  window.reelScrollToFrac = function (frac) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.round(max * frac), behavior: 'smooth' });
  };

  function App() {
    return (
      <React.Fragment>
        <ScrollStage width={1920} height={1080} duration={32} background="#ededea">
          <Reel />
        </ScrollStage>
        {/* Scroll runway — gives the page its scrubbing length */}
        <div style={{ height: RUNWAY_VH + 'vh' }} aria-hidden="true" />
      </React.Fragment>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);

  // Hide loader once React has mounted
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      const l = document.getElementById('reel-loading');
      if (l) { l.classList.add('done'); setTimeout(function () { l.remove(); }, 700); }
    });
  });
})();
