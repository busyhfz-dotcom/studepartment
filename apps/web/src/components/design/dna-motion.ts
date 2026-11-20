import { allowsMotion, subscribeToMotion } from "@/lib/motion-preference";

type Point = { x: number; y: number; z: number; scale: number };
type DrawPart = { z: number; paint: () => void };
type Base = "A" | "T" | "G" | "C";

/** Decorative B-DNA schematic: 10.5 complementary pairs per turn and a groove
 * offset. Illustrative geometry and sequence, not an atomistic biological record.
 * Uses no libraries, network requests, randomness, or user data.
 */
export function mountDnaMotion(canvas: HTMLCanvasElement, tone: "dark" | "light" = "dark") {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return () => {};
  const ctx = context;
  const sequence = [..."ATGCCAGTACGATTCGAGCTACGGTATCAGGCTAATCGTACCGATAGCTACGATCG"] as Base[];
  const complement: Record<Base, Base> = { A: "T", T: "A", G: "C", C: "G" };
  const colors: Record<Base, string> = tone === "dark"
    ? { A: "#f4f4f4", T: "#a3a3a3", G: "#c2c2c2", C: "#e5e5e5" }
    : { A: "#202020", T: "#828282", G: "#5b5b5b", C: "#3b3b3b" };
  const backbone = tone === "dark" ? ["#dadada", "#fff"] : ["#262626", "#626262"];
  let width = 0, height = 0, phase = 0, previous = 0, frame = 0;
  let pixelRatio = 0;
  let disposed = false, contextLost = false, pageHidden = false;
  let motionEnabled = allowsMotion("background");
  function point(n: number, side: number): Point {
    const radius = width < 700 ? 43 : 72;
    const theta = n * Math.PI * 2 / 10.5 + phase + (side ? 2.47 : 0);
    const axis = n * radius * .325 - height * .55;
    const radial = Math.cos(theta) * radius, z = Math.sin(theta) * radius;
    const inset = width < 700 ? 36 : 70;
    const angle = -Math.min(width < 700 ? .12 : .38, Math.max(0, width - 2 * inset) * .32 / height);
    const scale = 700 / (700 - z);
    return { x: Math.min(width - inset, width * (width < 700 ? .95 : .80)) + (radial * Math.cos(angle) - axis * Math.sin(angle)) * scale,
      y: height * .48 + (radial * Math.sin(angle) + axis * Math.cos(angle)) * scale, z, scale };
  }
  function line(a: Pick<Point, "x" | "y">, b: Pick<Point, "x" | "y">, color: string, size: number, opacity: number) {
    ctx.globalAlpha = opacity; ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!width || !height) return;
    const radius = width < 700 ? 43 : 72, parts: DrawPart[] = [];
    const opacity = (z: number) => .20 + .66 * (z + radius) / (radius * 2);
    const count = Math.ceil(height / (radius * .325)) + 65;
    for (let n = -25; n < count; n++) {
      const a = point(n, 0), b = point(n, 1);
      const base = sequence[((n % sequence.length) + sequence.length) % sequence.length];
      const other = complement[base], depth = (a.z + b.z) / 2;
      const m1 = { x: a.x + (b.x - a.x) * .43, y: a.y + (b.y - a.y) * .43 };
      const m2 = { x: a.x + (b.x - a.x) * .57, y: a.y + (b.y - a.y) * .57 };
      parts.push({ z: depth, paint: () => {
        line(a, m1, colors[base], 5.5, opacity(depth) * .7);
        line(m2, b, colors[other], 5.5, opacity(depth) * .7);
        const bonds = base === "G" || base === "C" ? 3 : 2;
        const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1;
        for (let i = 0; i < bonds; i++) {
          const offset = (i - (bonds - 1) / 2) * 2.1, ox = -dy / length * offset, oy = dx / length * offset;
          line({ x: m1.x + ox, y: m1.y + oy }, { x: m2.x + ox, y: m2.y + oy }, colors[base], .65, opacity(depth) * .65);
        }
      } });
      for (let side = 0; side < 2; side++) {
        const p = side ? b : a, color = backbone[side];
        for (let s = 0; s < 4; s++) {
          const p1 = point(n + s / 4, side), p2 = point(n + (s + 1) / 4, side), z = (p1.z + p2.z) / 2;
          parts.push({ z, paint: () => {
            line(p1, p2, color, 3.6 * p1.scale, opacity(z));
            line({ x: p1.x - .5, y: p1.y }, { x: p2.x - .5, y: p2.y }, tone === "dark" ? "#f6f6f6" : color, .6, opacity(z) * .5);
          } });
        }
        parts.push({ z: p.z + .1, paint: () => {
          ctx.globalAlpha = opacity(p.z); ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(p.x, p.y, 3.3 * p.scale, 0, Math.PI * 2); ctx.fill();
          if (p.z > radius * .45 && n % 2 === 0) {
            ctx.globalAlpha = opacity(p.z) * .8; ctx.font = "10px Arial, sans-serif";
            ctx.fillStyle = color; ctx.textAlign = side ? "left" : "right";
            ctx.fillText(side ? other : base, p.x + (side ? 10 : -10), p.y + 3);
          }
        } });
      }
    }
    parts.sort((a, b) => a.z - b.z).forEach(part => part.paint()); ctx.globalAlpha = 1;
  }
  function tick(now: number) {
    frame = 0;
    if (!canAnimate()) { previous = 0; return; }
    if (now - previous >= 30) {
      phase = (phase + Math.min((now - (previous || now)) / 1000, .08) * .26) % (Math.PI * 2);
      previous = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function canAnimate() {
    return Boolean(width && height && !disposed && !contextLost && !pageHidden && !document.hidden && motionEnabled);
  }

  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  }

  function sync() {
    pause();
    if (disposed || contextLost || pageHidden) return;
    draw();
    if (canAnimate()) frame = requestAnimationFrame(tick);
  }

  function resize() {
    if (disposed || contextLost || pageHidden) return;
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;
    const nextRatio = Math.min(window.devicePixelRatio || 1, 1.5, 4096 / Math.max(nextWidth, nextHeight));
    if (nextWidth !== width || nextHeight !== height || nextRatio !== pixelRatio) {
      width = nextWidth;
      height = nextHeight;
      pixelRatio = nextRatio;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }
    sync();
  }

  function showPage() { pageHidden = false; resize(); }
  function hidePage() { pageHidden = true; pause(); }
  function loseContext() { contextLost = true; pause(); }
  function restoreContext() {
    contextLost = false;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    resize();
  }

  // The canvas is viewport-fixed. A visibility observer can stop it during
  // layout or history restoration even though the page is still foregrounded.
  const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(resize);
  resizeObserver?.observe(canvas);
  const unsubscribeMotion = subscribeToMotion(() => {
    const enabled = allowsMotion("background");
    if (enabled === motionEnabled) return;
    motionEnabled = enabled;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pageshow", showPage);
  window.addEventListener("pagehide", hidePage);
  window.addEventListener("resize", resize);
  canvas.addEventListener("contextlost", loseContext);
  canvas.addEventListener("contextrestored", restoreContext);
  resize();

  return () => {
    disposed = true;
    pause();
    resizeObserver?.disconnect();
    unsubscribeMotion();
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener("pageshow", showPage);
    window.removeEventListener("pagehide", hidePage);
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("contextlost", loseContext);
    canvas.removeEventListener("contextrestored", restoreContext);
    ctx.clearRect(0, 0, width, height);
  };
}
