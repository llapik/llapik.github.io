// scenes.jsx — celestial-body + helvetica animation reel for llapik portfolio
// Text auto-inverts via mix-blend-mode: difference (TEXT_LIGHT vs BG → reads dark; vs dark circle → reads light).

const HEL = 'Helvetica Neue, Helvetica, Arial, sans-serif';
const MONO = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';
const FG = '#0a0a0a';      // ink for circles & solid shapes
const BG = '#ededea';
const DIM = '#9d9d99';     // dim variant of TEXT_LIGHT (rendered through difference: looks like soft mid-grey)
const TEXT_LIGHT = '#ededea';

// ── Wrap any text element in a difference-blend layer ─────────────────────
function T({ style = {}, children, dim = false }) {
  return (
    <div style={{
      mixBlendMode: 'difference',
      color: dim ? DIM : TEXT_LIGHT,
      position: 'absolute',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Atmospheric grain layer ──────────────────────────────────────────────
function Grain() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none',
      opacity: 0.06,
      mixBlendMode: 'multiply',
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
    }}/>
  );
}

// ── Starfield ────────────────────────────────────────────────────────────
function StarField({ count = 60 }) {
  const stars = React.useMemo(() => {
    const arr = [];
    let seed = 1337;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < count; i++) {
      arr.push({ x: rnd() * 1920, y: rnd() * 1080, r: rnd() * 1.6 + 0.4, o: rnd() * 0.5 + 0.15 });
    }
    return arr;
  }, [count]);
  const t = useTime();
  return (
    <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {stars.map((s, i) => {
        const tw = 0.6 + 0.4 * Math.sin(t * 2 + i * 0.7);
        return <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={FG} opacity={s.o * tw} />;
      })}
    </svg>
  );
}

// ── Circle (celestial body) ──────────────────────────────────────────────
function Circle({ cx, cy, r, fill = FG, stroke = null, strokeW = 1, opacity = 1, dashed = false }) {
  return (
    <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <circle
        cx={cx} cy={cy} r={r}
        fill={fill}
        stroke={stroke || 'none'}
        strokeWidth={strokeW}
        strokeDasharray={dashed ? '4 6' : 'none'}
        opacity={opacity}
      />
    </svg>
  );
}

// ── HUD ─────────────────────────────────────────────────────────────────
function HUD() {
  const t = useTime();
  const { duration } = useTimeline();
  const fmt = (v) => {
    const m = Math.floor(v / 60);
    const s = Math.floor(v % 60);
    const cs = Math.floor((v * 100) % 100);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(cs).padStart(2,'0')}`;
  };
  return (
    <>
      <T style={{ top: 36, left: 48, fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        llapik / portfolio reel
      </T>
      <T style={{ top: 36, right: 48, fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>
        T+{fmt(t)} / {fmt(duration)}
      </T>
      <T dim style={{ bottom: 36, left: 48, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        2026 — alexandr stih
      </T>
      <T dim style={{ bottom: 36, right: 48, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        sprite reel ▸ helvetica monochrome
      </T>
    </>
  );
}

// ── Reticle ─────────────────────────────────────────────────────────────
function Reticle() {
  return (
    <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18 }}>
      <line x1="960" y1="0" x2="960" y2="1080" stroke={FG} strokeWidth="0.5" strokeDasharray="2 8" />
      <line x1="0" y1="540" x2="1920" y2="540" stroke={FG} strokeWidth="0.5" strokeDasharray="2 8" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 1 — INTRO
// ─────────────────────────────────────────────────────────────────────────
function SceneIntro() {
  const { progress, localTime } = useSprite();
  const radius = interpolate([0, 0.4, 1], [0, 180, 220], Easing.easeOutCubic)(progress);
  const num = Math.floor(interpolate([0, 0.7, 1], [0, 1, 1], Easing.easeOutQuad)(progress) * 999);
  const numStr = String(num).padStart(3, '0');

  return (
    <>
      <Circle cx={960} cy={540} r={radius} fill={FG} />
      {localTime > 0.2 && (
        <T style={{
          left: 48, top: 540 - 8, fontFamily: MONO, fontSize: 12,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          opacity: clamp((localTime - 0.2) / 0.5, 0, 1),
        }}>
          ▸ booting reel
        </T>
      )}
      <T style={{
        right: 48, bottom: 120, fontFamily: HEL, fontSize: 240, fontWeight: 700,
        letterSpacing: '-0.06em', lineHeight: 0.85, fontVariantNumeric: 'tabular-nums',
      }}>
        {numStr}
      </T>
      <T dim style={{
        right: 48, bottom: 80, fontFamily: MONO, fontSize: 12,
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        scene 01 / 06
      </T>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 2 — NAME / HERO
// ─────────────────────────────────────────────────────────────────────────
function SceneName() {
  const { progress, localTime } = useSprite();

  const orbitT = localTime * 0.7;
  const orbitR = 320;
  const sunX = 960, sunY = 540;
  const sunR = interpolate([0, 0.3], [220, 80], Easing.easeInOutCubic)(progress);
  const moonAng = orbitT * 2 * Math.PI;
  const moonX = sunX + orbitR * Math.cos(moonAng);
  const moonY = sunY + orbitR * 0.35 * Math.sin(moonAng);
  const farAng = -orbitT * 2 * Math.PI * 0.4 + 1.2;
  const farX = sunX + 600 * Math.cos(farAng);
  const farY = sunY + 220 * Math.sin(farAng);

  const charReveal = (i) => {
    const start = 0.15 + i * 0.04;
    const end = start + 0.3;
    return clamp((progress - start) / (end - start), 0, 1);
  };

  const renderText = (str) => [...str].map((ch, i) => {
    const r = charReveal(i);
    const ease = Easing.easeOutCubic(r);
    return (
      <span key={i} style={{
        display: 'inline-block',
        opacity: ease,
        transform: `translateY(${(1 - ease) * 30}px)`,
      }}>
        {ch === ' ' ? '\u00A0' : ch}
      </span>
    );
  });

  return (
    <>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        <ellipse cx={sunX} cy={sunY} rx={orbitR} ry={orbitR * 0.35}
          fill="none" stroke={FG} strokeWidth="0.8" strokeDasharray="3 8" />
      </svg>

      <Circle cx={sunX} cy={sunY} r={sunR} fill={FG} />
      <Circle cx={moonX} cy={moonY} r={28} fill={FG} />
      <Circle cx={farX} cy={farY} r={14} fill={FG} opacity={0.6} />

      <T style={{
        left: 120, top: 200, fontFamily: MONO, fontSize: 14,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        opacity: clamp(progress * 4, 0, 1),
      }}>
        ▸ привет, я
      </T>

      <T style={{
        left: 120, top: 260, fontFamily: HEL, fontSize: 220, fontWeight: 800,
        letterSpacing: '-0.05em', lineHeight: 0.92,
      }}>
        {renderText('Alexandr')}
      </T>
      <T style={{
        left: 120, top: 470, fontFamily: HEL, fontSize: 220, fontWeight: 800,
        letterSpacing: '-0.05em', lineHeight: 0.92,
      }}>
        {renderText('Stih.')}
      </T>

      <T style={{
        left: 124, top: 720, fontFamily: HEL, fontSize: 26, fontWeight: 400,
        letterSpacing: '-0.005em', maxWidth: 880,
        opacity: clamp((progress - 0.5) * 4, 0, 1),
        transform: `translateY(${(1 - clamp((progress - 0.5) * 4, 0, 1)) * 20}px)`,
      }}>
        Создаю цифровые продукты на стыке дизайна,<br/>
        кода и безответственности.
      </T>

      <T style={{
        right: 120, bottom: 220, fontFamily: MONO, fontSize: 12,
        letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'right',
        opacity: clamp((progress - 0.4) * 3, 0, 1),
      }}>
        body.01 — primary<br/>
        ⌀ {Math.round(sunR * 2)}px<br/>
        orbit ⟲ {(orbitT).toFixed(2)}rad
      </T>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 3 — ABOUT
// ─────────────────────────────────────────────────────────────────────────
function SceneAbout() {
  const { progress, localTime } = useSprite();

  const bigX = interpolate([0, 1], [-80, 480], Easing.easeOutCubic)(progress);
  const bigR = interpolate([0, 0.5, 1], [340, 360, 380], Easing.easeInOutQuad)(progress);
  const bigY = 540;
  const smallX = interpolate([0, 1], [1900, 1380], Easing.easeOutCubic)(progress);
  const smallY = interpolate([0, 1], [200, 280], Easing.easeInOutQuad)(progress);
  const smallR = 90;

  const paragraph =
`Developer & Creative Thinker.

Я разработчик с фокусом на визуальные
впечатления и интересные программные
решения. Каждая деталь продумана —
от анимации до архитектуры кода.`;
  const totalChars = paragraph.length;
  const revealChars = Math.floor(interpolate([0.15, 0.95], [0, totalChars], Easing.linear)(progress));
  const visible = paragraph.slice(0, revealChars);

  return (
    <>
      <Circle cx={bigX} cy={bigY} r={bigR} fill={FG} />
      <Circle cx={smallX} cy={smallY} r={smallR} fill="none" stroke={FG} strokeW={2} dashed />
      <Circle cx={smallX} cy={smallY} r={smallR * 0.55} fill={FG} />

      <T style={{
        left: 120, top: 140, fontFamily: MONO, fontSize: 12,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        opacity: clamp(progress * 5, 0, 1),
      }}>
        02 ▸ о себе / about
      </T>

      <T style={{
        left: 720, top: 220, fontFamily: HEL, fontSize: 140, fontWeight: 800,
        letterSpacing: '-0.05em', lineHeight: 0.9,
        opacity: clamp(progress * 4, 0, 1),
        transform: `translateY(${(1 - clamp(progress * 4, 0, 1)) * 30}px)`,
      }}>
        About<br/>the body.
      </T>

      <T style={{
        left: 720, top: 560, width: 760, fontFamily: HEL, fontSize: 26, fontWeight: 400,
        lineHeight: 1.45, whiteSpace: 'pre-wrap',
      }}>
        {visible}
        <span style={{
          display: 'inline-block', width: 12, height: 28,
          background: TEXT_LIGHT, marginLeft: 2, verticalAlign: 'text-bottom',
          opacity: localTime % 0.6 < 0.3 ? 1 : 0,
        }} />
      </T>

      <T dim style={{
        left: 120, bottom: 140, fontFamily: MONO, fontSize: 12,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        readout · ⌀{Math.round(bigR * 2)}px · drift {bigX > 0 ? '+' : ''}{Math.round(bigX)}
      </T>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 4 — SKILLS
// ─────────────────────────────────────────────────────────────────────────
function SceneSkills() {
  const { progress } = useSprite();

  const skills = [
    { label: 'JavaScript', x: 380,  y: 380, r: 70 },
    { label: 'C++',         x: 760,  y: 240, r: 50 },
    { label: 'C#',          x: 1180, y: 320, r: 42 },
    { label: 'Node.js',     x: 1540, y: 440, r: 58 },
    { label: 'CSS / SCSS',  x: 1380, y: 720, r: 64 },
    { label: 'Python',      x: 940,  y: 800, r: 76 },
    { label: 'WebGL',       x: 540,  y: 740, r: 48 },
    { label: 'UI / UX',     x: 220,  y: 600, r: 36 },
  ];

  const seedOffset = (i) => {
    const a = (i * 137.5) * Math.PI / 180;
    return { dx: Math.cos(a) * 1400, dy: Math.sin(a) * 1000 };
  };

  const lineProgress = clamp((progress - 0.45) / 0.4, 0, 1);
  const arrival = (i) => {
    const start = i * 0.05;
    const end = start + 0.45;
    return clamp((progress - start) / (end - start), 0, 1);
  };

  return (
    <>
      <T style={{
        left: 120, top: 140, fontFamily: MONO, fontSize: 12,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        opacity: clamp(progress * 5, 0, 1),
      }}>
        03 ▸ stack / constellation
      </T>

      <T style={{
        left: 120, top: 200, fontFamily: HEL, fontSize: 110, fontWeight: 800,
        letterSpacing: '-0.05em', lineHeight: 0.95,
        opacity: clamp(progress * 4, 0, 1),
      }}>
        the&nbsp;stack
      </T>

      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {skills.map((s, i) => {
          if (i === 0) return null;
          const a = arrival(i - 1);
          const b = arrival(i);
          if (a < 0.9 || b < 0.9) return null;
          const prev = skills[i - 1];
          const drawT = clamp(lineProgress * 1.5 - i * 0.06, 0, 1);
          return (
            <line key={i}
              x1={prev.x} y1={prev.y}
              x2={prev.x + (s.x - prev.x) * drawT}
              y2={prev.y + (s.y - prev.y) * drawT}
              stroke={FG} strokeWidth="1" strokeDasharray="3 6" opacity="0.5"
            />
          );
        })}
        {(() => {
          const drawT = clamp(lineProgress * 1.4 - 0.6, 0, 1);
          const last = skills[skills.length - 1];
          const first = skills[0];
          if (drawT <= 0) return null;
          return (
            <line
              x1={last.x} y1={last.y}
              x2={last.x + (first.x - last.x) * drawT}
              y2={last.y + (first.y - last.y) * drawT}
              stroke={FG} strokeWidth="1" strokeDasharray="3 6" opacity="0.5"
            />
          );
        })()}
      </svg>

      {skills.map((s, i) => {
        const a = arrival(i);
        const ease = Easing.easeOutBack(a);
        const off = seedOffset(i);
        const x = s.x - off.dx * (1 - ease);
        const y = s.y - off.dy * (1 - ease);
        const r = s.r * Math.max(0.2, ease);
        const labelOpacity = clamp((a - 0.7) / 0.3, 0, 1);
        return (
          <React.Fragment key={i}>
            <Circle cx={x} cy={y} r={r} fill={FG} />
            <T style={{
              left: x + s.r + 14, top: y - 12,
              fontFamily: HEL, fontSize: 22, fontWeight: 500,
              letterSpacing: '-0.005em',
              opacity: labelOpacity,
              transform: `translateX(${(1 - labelOpacity) * -10}px)`,
              whiteSpace: 'nowrap',
            }}>
              {s.label}
              <div style={{
                fontFamily: MONO, fontSize: 11, color: DIM,
                letterSpacing: '0.1em', marginTop: 2,
              }}>
                ⌀{Math.round(s.r * 2)} · #{String(i + 1).padStart(2, '0')}
              </div>
            </T>
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 5 — PROJECTS
// ─────────────────────────────────────────────────────────────────────────
function SceneProjects() {
  const { progress } = useSprite();

  const projects = [
    { idx: '01', title: 'Genesis', desc: 'WebGL particle field + shader playground', tag: 'webgl · glsl', r: 200, x: 380, y: 540 },
    { idx: '02', title: 'Stellar', desc: 'Three.js portfolio scene & camera rig',     tag: 'three · gsap', r: 160, x: 960, y: 540 },
    { idx: '03', title: 'Atlas',   desc: 'SCSS design system & motion tokens',         tag: 'scss · ts',    r: 120, x: 1480, y: 540 },
  ];

  const cardProg = (i) => {
    const start = 0.05 + i * 0.18;
    const end = start + 0.45;
    return clamp((progress - start) / (end - start), 0, 1);
  };

  return (
    <>
      <T style={{
        left: 120, top: 140, fontFamily: MONO, fontSize: 12,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        opacity: clamp(progress * 5, 0, 1),
      }}>
        04 ▸ projects / catalogue
      </T>
      <T style={{
        left: 120, top: 200, fontFamily: HEL, fontSize: 110, fontWeight: 800,
        letterSpacing: '-0.05em', lineHeight: 0.95,
        opacity: clamp(progress * 4, 0, 1),
      }}>
        the&nbsp;catalogue
      </T>

      {projects.map((p, i) => {
        const a = cardProg(i);
        const ease = Easing.easeOutCubic(a);
        const r = p.r * Math.max(0.15, ease);
        const ringR = p.r + 28;
        return (
          <React.Fragment key={i}>
            <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <circle cx={p.x} cy={p.y} r={ringR * Math.max(0.15, ease)}
                fill="none" stroke={FG} strokeWidth="1" strokeDasharray="3 6"
                opacity={ease * 0.6} />
            </svg>

            <Circle cx={p.x} cy={p.y} r={r} fill={FG} />

            {/* Index inside circle — NOT in difference layer; explicit BG color reads as light on dark */}
            <div style={{
              position: 'absolute',
              left: p.x - 60, top: p.y - 32,
              width: 120, textAlign: 'center',
              fontFamily: HEL, fontSize: 64, fontWeight: 700, color: BG,
              letterSpacing: '-0.04em', lineHeight: 1,
              opacity: ease,
            }}>
              {p.idx}
            </div>

            <T style={{
              left: p.x - 200, top: p.y + ringR + 28,
              width: 400, textAlign: 'center',
              opacity: ease,
              transform: `translateY(${(1 - ease) * 16}px)`,
            }}>
              <div style={{
                fontFamily: HEL, fontSize: 36, fontWeight: 700,
                letterSpacing: '-0.02em',
              }}>
                {p.title}
              </div>
              <div style={{
                fontFamily: HEL, fontSize: 16, fontWeight: 400,
                lineHeight: 1.4, marginTop: 8,
              }}>
                {p.desc}
              </div>
              <div style={{
                fontFamily: MONO, fontSize: 11, color: DIM,
                letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 14,
              }}>
                ▸ {p.tag}
              </div>
            </T>
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 6 — CONTACT
// ─────────────────────────────────────────────────────────────────────────
function SceneContact() {
  const { progress, localTime } = useSprite();

  const channels = [
    { label: 'GitHub',   handle: 'github.com/llapik', x: 480 },
    { label: 'Telegram', handle: 't.me/eayyyyyy',     x: 960 },
    { label: 'Email',    handle: 'alex74s00@mail.ru', x: 1440 },
  ];

  const conv = clamp(progress * 2, 0, 1);
  const eased = Easing.easeOutCubic(conv);
  const pulse = progress > 0.65 ? 1 + 0.06 * Math.sin((progress - 0.65) * 60) : 1;
  const bigOpacity = clamp((progress - 0.55) * 3, 0, 1);
  const finalWord = '▸ TRANSMIT';
  const showChars = Math.floor(clamp((progress - 0.78) * 4, 0, 1) * finalWord.length);

  return (
    <>
      <T style={{
        left: 120, top: 140, fontFamily: MONO, fontSize: 12,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        opacity: clamp(progress * 5, 0, 1),
      }}>
        05 ▸ contact / signal
      </T>

      <T style={{
        left: 0, top: 220, width: 1920, textAlign: 'center',
        fontFamily: HEL, fontSize: 280, fontWeight: 800,
        letterSpacing: '-0.06em', lineHeight: 0.85,
        opacity: bigOpacity * 0.08,
      }}>
        TRANSMIT
      </T>

      <T style={{
        left: 120, top: 220, fontFamily: HEL, fontSize: 110, fontWeight: 800,
        letterSpacing: '-0.05em', lineHeight: 0.95,
        opacity: clamp(progress * 4, 0, 1),
      }}>
        open<br/>signal.
      </T>

      <T style={{
        left: 120, top: 460, width: 600, fontFamily: HEL, fontSize: 24, fontWeight: 400,
        lineHeight: 1.4,
        opacity: clamp((progress - 0.2) * 3, 0, 1),
      }}>
        Открыт для сотрудничества и новых идей.<br/>
        Choose a channel:
      </T>

      {channels.map((c, i) => {
        const startOffset = (i - 1) * 600;
        const x = c.x - startOffset * (1 - eased);
        const y = 760;
        const r = 56 * pulse;
        const labelOpacity = clamp((progress - 0.35 - i * 0.04) * 4, 0, 1);
        return (
          <React.Fragment key={i}>
            <Circle cx={x} cy={y} r={r} fill={FG} opacity={eased} />
            <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <circle cx={x} cy={y} r={r + 24}
                fill="none" stroke={FG} strokeWidth="1" strokeDasharray="2 5"
                opacity={eased * 0.4} />
            </svg>
            <T style={{
              left: x - 200, top: y + 84,
              width: 400, textAlign: 'center',
              opacity: labelOpacity,
              transform: `translateY(${(1 - labelOpacity) * 12}px)`,
            }}>
              <div style={{
                fontFamily: HEL, fontSize: 26, fontWeight: 700,
                letterSpacing: '-0.01em',
              }}>
                {c.label}
              </div>
              <div style={{
                fontFamily: MONO, fontSize: 13,
                letterSpacing: '0.04em', marginTop: 6,
              }}>
                {c.handle}
              </div>
            </T>
          </React.Fragment>
        );
      })}

      <T style={{
        left: 0, bottom: 120, width: 1920, textAlign: 'center',
        fontFamily: MONO, fontSize: 22,
        letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        {finalWord.slice(0, showChars)}
        <span style={{
          display: 'inline-block', width: 10, height: 22,
          background: TEXT_LIGHT, marginLeft: 4, verticalAlign: 'middle',
          opacity: localTime % 0.6 < 0.3 ? 1 : 0,
        }} />
      </T>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPOSITION
// ─────────────────────────────────────────────────────────────────────────
function Reel() {
  return (
    <>
      <Grain />
      <Reticle />
      <StarField count={50} />

      <Sprite start={0}    end={4}>   <SceneIntro    /></Sprite>
      <Sprite start={4}    end={9}>   <SceneName     /></Sprite>
      <Sprite start={9}    end={14}>  <SceneAbout    /></Sprite>
      <Sprite start={14}   end={20}>  <SceneSkills   /></Sprite>
      <Sprite start={20}   end={27}>  <SceneProjects /></Sprite>
      <Sprite start={27}   end={32}>  <SceneContact  /></Sprite>

      <HUD />
    </>
  );
}

Object.assign(window, { Reel });
