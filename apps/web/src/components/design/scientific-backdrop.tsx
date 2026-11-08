import styles from "./scientific-backdrop.module.css";

/*
 * The helix is generated from one regular wave so it always runs past both
 * edges of the viewport. The viewBox is 1440 wide, but the SVG is scaled with
 * `slice`, rotated and gently floated, so the strands extend well beyond
 * 0…1440 and only fade out far off-screen.
 */
const HALF_PERIOD = 360;
const START_X = -820;
const END_X = 2420;
const AMPLITUDE = 97.5;
const STRAND_ONE_BASE = 280;
const STRAND_TWO_BASE = 250;
const VISIBLE_MIN_X = -260;
const VISIBLE_MAX_X = 1700;

function strandPath(baseline: number, firstControl: number) {
  const opposite = baseline * 2 - firstControl;
  let d = `M${START_X} ${baseline}C${START_X + 120} ${firstControl} ${START_X + 240} ${firstControl} ${START_X + HALF_PERIOD} ${baseline}`;
  let up = false;
  for (let x = START_X + HALF_PERIOD; x < END_X; x += HALF_PERIOD) {
    const control = up ? firstControl : opposite;
    d += `S${x + 240} ${control} ${x + HALF_PERIOD} ${baseline}`;
    up = !up;
  }
  return d;
}

function wave(x: number) {
  return Math.sin((Math.PI * (x - START_X)) / HALF_PERIOD);
}

const round = (value: number) => Math.round(value * 10) / 10;

const strandOnePath = strandPath(STRAND_ONE_BASE, 150);
const strandTwoPath = strandPath(STRAND_TWO_BASE, 380);

const basePairs: Array<{ x: number; y1: number; y2: number }> = [];
for (let x = START_X + 36; x <= END_X; x += 72) {
  if (x < VISIBLE_MIN_X || x > VISIBLE_MAX_X) continue;
  const s = wave(x);
  basePairs.push({ x, y1: round(STRAND_ONE_BASE - AMPLITUDE * s), y2: round(STRAND_TWO_BASE + AMPLITUDE * s) });
}

const sequenceNodes: Array<{ x: number; y: number; r: number }> = [];
for (let x = START_X + HALF_PERIOD / 2, i = 0; x <= END_X; x += HALF_PERIOD / 2, i += 1) {
  if (x < VISIBLE_MIN_X || x > VISIBLE_MAX_X) continue;
  const s = wave(x);
  const onStrandOne = i % 2 === 0;
  sequenceNodes.push({
    x,
    y: round(onStrandOne ? STRAND_ONE_BASE - AMPLITUDE * s : STRAND_TWO_BASE + AMPLITUDE * s),
    r: onStrandOne ? 5 : 4,
  });
}

export function ScientificBackdrop({
  tone = "dark",
  className = "",
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={`${styles.backdrop} ${styles[tone]} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`dna-strand-${tone}`} gradientUnits="userSpaceOnUse" x1={START_X} y1="0" x2={END_X} y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset=".16" stopColor="currentColor" stopOpacity=".8" />
            <stop offset=".84" stopColor="var(--motion-secondary)" stopOpacity=".72" />
            <stop offset="1" stopColor="var(--motion-secondary)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`dna-node-${tone}`}>
            <stop stopColor="var(--motion-highlight)" />
            <stop offset=".28" stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className={styles.dnaHelix} transform="rotate(-8 720 280)">
          <g className={styles.basePairs}>
            {basePairs.map((pair) => (
              <line key={pair.x} x1={pair.x} y1={pair.y1} x2={pair.x} y2={pair.y2} />
            ))}
          </g>
          <path className={styles.strandOne} stroke={`url(#dna-strand-${tone})`} d={strandOnePath} />
          <path className={styles.strandTwo} stroke={`url(#dna-strand-${tone})`} d={strandTwoPath} />
          <g className={styles.sequenceNodes} fill={`url(#dna-node-${tone})`}>
            {sequenceNodes.map((node) => (
              <circle key={node.x} cx={node.x} cy={node.y} r={node.r} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
