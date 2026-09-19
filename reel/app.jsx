/* llapik reel — scroll-driven app.
   Scrubs the sprite-reel timeline (animations.jsx + scenes.jsx) by page scroll. */
(function () {
  const { useState, useEffect, useMemo } = React;

  // Scroll-driven stage: the reel timeline is scrubbed by page scroll.
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

    // Map scroll position -> timeline seconds
    useEffect(() => {
      let raf = null;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
          setTime(p * duration);
          const hint = document.getElementById('reel-hint');
          if (hint) hint.classList.toggle('hidden', window.scrollY > window.innerHeight * 0.15);
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
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

  function App() {
    return (
      <React.Fragment>
        <ScrollStage width={1920} height={1080} duration={32} background="#ededea">
          <Reel />
        </ScrollStage>
        {/* Scroll runway — gives the page its scrubbing length */}
        <div style={{ height: '640vh' }} aria-hidden="true" />
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
