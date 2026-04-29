import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Theme {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accent2: string;
  glow: string;
  glow2: string;
  scan: string;
  node: string;
  node2: string;
  progressBg: string;
  progressFrom: string;
  progressTo: string;
  gridLine: string;
  gridFlash: string;
  dot: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  pillShimmer: string;
  pillTask: string;
  pillDivider: string;
}

const LIGHT: Theme = {
  bg: "#f7f8fc",
  surface: "#ffffff",
  surface2: "#f0f2f8",
  border: "rgba(80,100,180,0.13)",
  textPrimary: "#1a1d2e",
  textSecondary: "#5a6180",
  textMuted: "#9ba3c0",
  accent: "#3b5bdb",
  accent2: "#00b5d8",
  glow: "rgba(59,91,219,0.18)",
  glow2: "rgba(0,181,216,0.15)",
  scan: "rgba(0,181,216,0.55)",
  node: "rgba(59,91,219,0.7)",
  node2: "rgba(0,181,216,0.7)",
  progressBg: "rgba(59,91,219,0.1)",
  progressFrom: "#3b5bdb",
  progressTo: "#00b5d8",
  gridLine: "rgba(59,91,219,0.10)",
  gridFlash: "rgba(59,91,219,0.55)",
  dot: "rgba(59,91,219,0.12)",
  pillBg: "rgba(59,91,219,0.07)",
  pillBorder: "rgba(59,91,219,0.28)",
  pillText: "#3b5bdb",
  pillShimmer: "rgba(59,91,219,0.15)",
  pillTask: "rgba(59,91,219,0.55)",
  pillDivider: "rgba(59,91,219,0.22)",
};

const DARK: Theme = {
  bg: "#0e1117",
  surface: "#161b2e",
  surface2: "#1c2240",
  border: "rgba(100,140,255,0.14)",
  textPrimary: "#e8ecff",
  textSecondary: "#8b95c0",
  textMuted: "#4a5280",
  accent: "#6282ff",
  accent2: "#22d3ee",
  glow: "rgba(98,130,255,0.22)",
  glow2: "rgba(34,211,238,0.18)",
  scan: "rgba(34,211,238,0.6)",
  node: "rgba(98,130,255,0.8)",
  node2: "rgba(34,211,238,0.75)",
  progressBg: "rgba(98,130,255,0.12)",
  progressFrom: "#6282ff",
  progressTo: "#22d3ee",
  gridLine: "rgba(98,130,255,0.12)",
  gridFlash: "rgba(34,211,238,0.7)",
  dot: "rgba(98,130,255,0.18)",
  pillBg: "rgba(98,130,255,0.10)",
  pillBorder: "rgba(98,130,255,0.35)",
  pillText: "#8aabff",
  pillShimmer: "rgba(98,130,255,0.18)",
  pillTask: "rgba(34,211,238,0.7)",
  pillDivider: "rgba(98,130,255,0.25)",
};

// ─── Animated Grid ────────────────────────────────────────────────────────────
function AnimatedGrid({ theme, dark }: { theme: Theme; dark: boolean }) {
  const uid = dark ? "d" : "l";
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Static grid via SVG pattern — mask always uses white→black regardless of theme */}
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, opacity: dark ? 1 : 0.85 }}>
        <defs>
          <pattern id={`grid-${uid}`} width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke={theme.gridLine} strokeWidth={dark ? 1 : 0.75} />
          </pattern>
          <radialGradient id={`gridFade-${uid}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="75%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`gridMask-${uid}`}>
            <rect width="100%" height="100%" fill={`url(#gridFade-${uid})`} />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${uid})`} mask={`url(#gridMask-${uid})`} />
      </svg>

      {/* Slow diagonal shimmer sweep */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(115deg, transparent 30%, ${theme.glow} 50%, transparent 70%)`,
        backgroundSize: "200% 200%",
        animation: "gridSweep 6s ease-in-out infinite",
        opacity: dark ? 0.9 : 0.6,
      }} />

      <style>{`
        @keyframes gridSweep {
          0%   { background-position: 200% 200%; opacity: 0; }
          20%  { opacity: ${dark ? 0.9 : 0.6}; }
          80%  { opacity: ${dark ? 0.9 : 0.6}; }
          100% { background-position: -50% -50%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const MESSAGES = [
  "Analyzing your CV…",
  "Extracting key details…",
  "Matching skills with industry standards…",
  "Running ATS compatibility check…",
  "Almost done…",
];

const TASKS = ["Parsing…", "Identifying…", "Mapping…", "Building…", "Finalizing…"];

export default function HryantraLoader() {
  const [dark, setDark] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [taskIdx, setTaskIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const t = dark ? DARK : LIGHT;

  // Cycle messages
  useEffect(() => {
    const id = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % MESSAGES.length);
        setMsgVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  // Cycle tasks
  useEffect(() => {
    const id = setInterval(() => {
      setTaskIdx((i) => (i + 1) % TASKS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: 680,
        background: t.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        transition: "background 0.4s",
        padding: "40px 20px",
        fontFamily: "-apple-system, Inter, sans-serif",
      }}
    >
      {/* Animated grid */}
      <AnimatedGrid theme={t} dark={dark} />

      {/* Dot pattern */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.7,
        backgroundImage: `radial-gradient(circle, ${t.dot} 1.5px, transparent 1.5px)`,
        backgroundSize: "36px 36px",
        backgroundPosition: "18px 18px",
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: t.glow, filter: "blur(60px)", opacity: 0.4, top: -40, left: -60, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: t.glow2, filter: "blur(60px)", opacity: 0.4, bottom: -20, right: -40, pointerEvents: "none" }} />

      {/* Dark mode toggle */}
      <div style={{ position: "absolute", top: 18, right: 20, display: "flex", alignItems: "center", gap: 8, zIndex: 10 }}>
        <span style={{ fontSize: 12, color: t.textMuted }}>{dark ? "Dark" : "Light"}</span>
        <div
          onClick={() => setDark((d) => !d)}
          style={{
            width: 44, height: 24, borderRadius: 12,
            border: `1px solid ${t.border}`,
            background: t.surface2,
            cursor: "pointer", position: "relative", transition: "background 0.3s",
          }}
        >
          <div style={{
            position: "absolute", width: 16, height: 16, borderRadius: "50%",
            background: t.accent, top: 3, left: 4,
            transition: "transform 0.3s",
            transform: dark ? "translateX(20px)" : "translateX(0)",
          }} />
        </div>
      </div>

      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, zIndex: 1 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20}>
            <circle cx="10" cy="10" r="4" fill="white" opacity="0.9" />
            <circle cx="4" cy="5" r="2" fill="white" opacity="0.6" />
            <circle cx="16" cy="5" r="2" fill="white" opacity="0.6" />
            <circle cx="4" cy="15" r="2" fill="white" opacity="0.6" />
            <circle cx="16" cy="15" r="2" fill="white" opacity="0.6" />
            <line x1="6" y1="6" x2="8.5" y2="8.5" stroke="white" strokeWidth="1" opacity="0.5" />
            <line x1="14" y1="6" x2="11.5" y2="8.5" stroke="white" strokeWidth="1" opacity="0.5" />
            <line x1="6" y1="14" x2="8.5" y2="11.5" stroke="white" strokeWidth="1" opacity="0.5" />
            <line x1="14" y1="14" x2="11.5" y2="11.5" stroke="white" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.04em", color: t.textPrimary }}>
          HR<span style={{ color: t.accent2 }}>YANTRA</span>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20,
        padding: "32px 36px 28px", width: "100%", maxWidth: 420,
        display: "flex", flexDirection: "column", alignItems: "center",
        position: "relative", zIndex: 1,
        boxShadow: `0 4px 40px ${t.glow}`,
        transition: "background 0.4s, box-shadow 0.4s",
      }}>

        {/* Doc stage */}
        <div style={{ width: 180, height: 140, position: "relative", marginBottom: 24 }}>
          <div style={{ position: "absolute", inset: 0, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
            <ScanBeam t={t} />
            <div style={{ padding: "18px 16px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
              {[80, 65, 90, 55, 70, 40].map((w, i) => (
                <div key={i} style={{
                  height: 7, borderRadius: 4, background: t.border, opacity: 0,
                  width: `${w}%`,
                  animation: `lineReveal 3s ease-out ${0.2 + i * 0.3}s infinite`,
                }} />
              ))}
            </div>
          </div>

          {/* Folded corner */}
          <div style={{
            position: "absolute", top: 0, right: 0, width: 28, height: 28,
            background: t.surface,
            clipPath: "polygon(0 0, 100% 100%, 100% 0)",
            borderRadius: "0 10px 0 0",
          }} />

          {/* Node dots */}
          {[
            { top: 10, left: -8, delay: 0, cyan: false },
            { top: 30, right: -8, delay: 0.6, cyan: true },
            { bottom: 20, left: -6, delay: 1.2, cyan: false },
            { bottom: 8, right: -6, delay: 0.9, cyan: true },
            { top: -8, left: "50%", delay: 0.3, cyan: false },
          ].map((nd, i) => (
            <div key={i} style={{
              position: "absolute", width: 8, height: 8, borderRadius: "50%",
              background: nd.cyan ? t.node2 : t.node,
              top: nd.top as any, left: nd.left as any, right: nd.right as any, bottom: nd.bottom as any,
              animation: `nodePulse 3s ease-in-out ${nd.delay}s infinite`,
            }} />
          ))}

          {/* ATS badge */}
          <div style={{
            position: "absolute", bottom: -14, right: 16,
            background: t.accent, color: "#fff", fontSize: 9, fontWeight: 600,
            padding: "3px 8px", borderRadius: 6, letterSpacing: "0.05em",
            animation: "badgePop 3.5s ease 2s infinite", opacity: 0,
          }}>ATS SCORE</div>

          {/* Connecting dashes */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }} viewBox="0 0 180 140">
            <line x1="-8" y1="10" x2="0" y2="10" strokeWidth="1" strokeDasharray="3 3" style={{ stroke: t.node, animation: "dashFlow 1.2s linear infinite" }} />
            <line x1="180" y1="30" x2="190" y2="30" strokeWidth="1" strokeDasharray="3 3" style={{ stroke: t.node2, animation: "dashFlow 1.2s linear 0.3s infinite" }} />
            <line x1="-6" y1="120" x2="0" y2="120" strokeWidth="1" strokeDasharray="3 3" style={{ stroke: t.node, animation: "dashFlow 1.2s linear 0.6s infinite" }} />
          </svg>
        </div>

        {/* Field chips */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, width: "100%" }}>
          {[
            { label: "Name", val: "Detected", c2: false, delay: 0.5 },
            { label: "Skills", val: "Parsing", c2: true, delay: 1.1 },
            { label: "Exp.", val: "Found", c2: false, delay: 1.7 },
          ].map((chip, i) => (
            <div key={i} style={{
              flex: 1, background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: 8, padding: "7px 10px", opacity: 0,
              animation: `chipIn 3.5s ease ${chip.delay}s infinite`,
            }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 3 }}>{chip.label}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: chip.c2 ? t.accent2 : t.accent }}>{chip.val}</div>
            </div>
          ))}
        </div>

        {/* Microcopy */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{
            fontSize: 15, fontWeight: 500, color: t.textPrimary, marginBottom: 5, minHeight: 22,
            opacity: msgVisible ? 1 : 0, transform: msgVisible ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 0.5s, transform 0.5s",
          }}>
            {MESSAGES[msgIdx]}
          </div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Powered by HRYANTRA AI Engine</div>
        </div>

        {/* AI Pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "9px 16px", border: `1px solid ${t.pillBorder}`,
          borderRadius: 28, background: t.pillBg,
          position: "relative", overflow: "hidden",
          marginBottom: 20, width: "100%", justifyContent: "center",
        }}>
          <div style={{
            position: "absolute", top: 0, left: "-60%", width: "50%", height: "100%",
            background: `linear-gradient(90deg, transparent, ${t.pillShimmer}, transparent)`,
            animation: "shimmer 2.6s ease-in-out infinite",
            pointerEvents: "none",
          }} />
          <AiOrb t={t} />
          <span style={{ fontSize: 12, fontWeight: 600, color: t.pillText, letterSpacing: "0.01em", position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
            AI is handling everything
          </span>
          <div style={{ width: 1, height: 14, background: t.pillDivider, flexShrink: 0, position: "relative", zIndex: 1 }} />
          <div style={{ height: 16, overflow: "hidden", position: "relative", minWidth: 80, zIndex: 1 }}>
            {TASKS.map((task, i) => (
              <span key={i} style={{
                position: i === taskIdx ? "relative" : "absolute", left: 0, width: "100%",
                fontSize: 11, color: t.pillTask, whiteSpace: "nowrap",
                opacity: i === taskIdx ? 1 : 0,
                transform: i === taskIdx ? "translateY(0)" : "translateY(5px)",
                transition: "opacity 0.35s, transform 0.35s",
              }}>
                {task}
              </span>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div style={{ width: "100%", height: 3, background: t.progressBg, borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${t.progressFrom} 0%, ${t.progressTo} 100%)`,
            animation: "progressWave 3.5s ease-in-out infinite",
          }} />
        </div>

        {/* Dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[t.accent, t.accent2, t.accent].map((color, i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: "50%", background: color,
              animation: `dotBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <GlobalKeyframes />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ScanBeam({ t }: { t: Theme }) {
  return (
    <>
      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${t.scan} 40%, ${t.accent2} 50%, ${t.scan} 60%, transparent 100%)`,
        top: 0, animation: "scanDown 2.4s ease-in-out infinite", opacity: 0.85, borderRadius: 1,
      }} />
      <div style={{
        position: "absolute", left: 0, right: 0, height: 28,
        background: `linear-gradient(180deg, ${t.glow2} 0%, transparent 100%)`,
        top: 0, animation: "scanDown 2.4s ease-in-out infinite", pointerEvents: "none",
      }} />
    </>
  );
}

function AiOrb({ t }: { t: Theme }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", background: t.accent,
      flexShrink: 0, animation: "orbBreath 2s ease-in-out infinite",
      position: "relative", zIndex: 1,
    }} />
  );
}

function GlobalKeyframes() {
  return (
    <style>{`
      @keyframes scanDown { 0% { top: 0% } 100% { top: 100% } }
      @keyframes lineReveal {
        0% { opacity: 0; transform: scaleX(0.5); transform-origin: left; }
        15% { opacity: 1; transform: scaleX(1); }
        80% { opacity: 1; }
        100% { opacity: 0.3; }
      }
      @keyframes nodePulse {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.3); }
      }
      @keyframes chipIn {
        0% { opacity: 0; transform: translateY(6px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes badgePop {
        0% { opacity: 0; transform: scale(0.8) translateY(4px); }
        15% { opacity: 1; transform: scale(1) translateY(0); }
        80% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes dashFlow { to { stroke-dashoffset: -16; } }
      @keyframes shimmer { 0% { left: -60%; } 100% { left: 130%; } }
      @keyframes orbBreath {
        0%,100% { opacity: 0.5; transform: scale(0.85); }
        50% { opacity: 1; transform: scale(1.25); }
      }
      @keyframes progressWave {
        0% { width: 8%; opacity: 0.7; }
        25% { width: 38%; }
        60% { width: 72%; }
        85% { width: 88%; }
        95% { width: 93%; }
        100% { width: 95%; opacity: 1; }
      }
      @keyframes dotBounce {
        0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
        40% { transform: scale(1.2); opacity: 1; }
      }
    `}</style>
  );
}
