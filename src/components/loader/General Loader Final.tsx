import { useEffect, useRef } from "react";

type Theme = "light" | "dark";

interface HryantraLoaderProps {
  theme?: Theme;
}

function HOrbitCanvas({ size = 160, theme = "light" }: { size?: number; theme?: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.38;
    const innerR = size * 0.26;
    const light = theme === "light";

    const teal = "#2596be";
    const orange = "#ef8b21";
    const priColor = light ? teal : "#3ab8e8";
    const secColor = light ? orange : "#f5a84e";
    const glowColor = light ? "rgba(37,150,190,0.25)" : "rgba(37,150,190,0.35)";
    const orbitColor = light ? "rgba(37,150,190,0.18)" : "rgba(37,150,190,0.22)";
    const innerOrbitColor = light ? "rgba(239,139,33,0.12)" : "rgba(239,139,33,0.2)";
    const hColor = "#1a5a8a";

    let frame = 0;
    let animId: number;

    const drawH = (x: number, y: number, sf: number, a: number) => {
      ctx.save();
      const scalePulse = 1 + 0.03 * Math.sin(a * 0.5);
      const alphaPulse = 0.88 + 0.12 * Math.sin(a * 0.5);
      ctx.globalAlpha = alphaPulse;
      ctx.translate(x, y);
      ctx.scale(scalePulse, scalePulse);
      const fontSize = Math.round(26 * sf);
      ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = hColor;
      ctx.fillText("H", 0, fontSize * 0.04);
      ctx.restore();
    };

    const drawRings = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.strokeStyle = orbitColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.strokeStyle = innerOrbitColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const drawOuter = (a: number) => {
      const cur = a * 1.4 + 1.5;
      const tl = 16;
      for (let i = tl; i >= 0; i--) {
        const ta = cur - i * 0.11;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(ta) * outerR,
          cy + Math.sin(ta) * outerR,
          size * 0.036 * (1 - (i / tl) * 0.45),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = priColor;
        ctx.globalAlpha = Math.min(0.88, (1 - i / tl) * 0.92);
        ctx.fill();
      }
    };

    const drawInner = (a: number) => {
      const ba = a * 1.6 + Math.PI * 0.85;
      const tl = 14;
      for (let i = tl; i >= 0; i--) {
        const ta = ba - i * 0.14;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(ta) * innerR,
          cy + Math.sin(ta) * innerR,
          size * 0.027 * (1 - (i / tl) * 0.3),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = secColor;
        ctx.globalAlpha = Math.min(0.7, (1 - i / tl) * 0.75);
        ctx.fill();
      }
    };

    const drawParticles = (a: number) => {
      for (let i = 0; i < 5; i++) {
        const ro = a * 2 + (i * Math.PI * 2) / 5;
        const rp = outerR * 0.45;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(ro) * rp,
          cy + Math.sin(ro) * rp,
          size * 0.018,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = i % 2 === 0 ? priColor : secColor;
        ctx.globalAlpha = 0.5 + 0.25 * Math.sin(a * 3 + i);
        ctx.fill();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, size, size);
      const a = frame * 0.006 * Math.PI * 2;

      drawRings();
      ctx.save();
      drawOuter(a);
      drawInner(a);
      ctx.restore();
      ctx.save();
      drawParticles(a);
      ctx.restore();

      drawH(cx, cy, size / 100, a);

      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.065, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.globalAlpha = 0.25 + 0.12 * Math.sin(a * 2.5);
      ctx.fill();

      const sx = cx + Math.cos(a * 1.9) * (outerR + 2);
      const sy = cy + Math.sin(a * 1.9) * (outerR + 2);
      ctx.beginPath();
      ctx.arc(sx, sy, size * 0.015, 0, Math.PI * 2);
      ctx.fillStyle = light ? orange : "#f5a84e";
      ctx.globalAlpha = 0.8;
      ctx.fill();

      ctx.globalAlpha = 1;
      frame++;
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [size, theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        filter:
          theme === "dark"
            ? "drop-shadow(0 0 4px rgba(37,150,190,0.45))"
            : "none",
      }}
    />
  );
}

export default function HryantraLoader({ theme = "light" }: HryantraLoaderProps) {
  const bg = theme === "light" ? "#f0f4f8" : "#090C15";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HOrbitCanvas size={160} theme={theme} />
    </div>
  );
}
