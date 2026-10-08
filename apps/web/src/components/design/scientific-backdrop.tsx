import styles from "./scientific-backdrop.module.css";

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
          <linearGradient id={`dna-strand-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset=".18" stopColor="currentColor" stopOpacity=".8" />
            <stop offset=".78" stopColor="var(--motion-secondary)" stopOpacity=".72" />
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
            <line x1="20" y1="166" x2="20" y2="364" /><line x1="100" y1="151" x2="100" y2="379" />
            <line x1="180" y1="205" x2="180" y2="325" /><line x1="260" y1="280" x2="260" y2="280" />
            <line x1="340" y1="355" x2="340" y2="205" /><line x1="420" y1="379" x2="420" y2="151" />
            <line x1="500" y1="334" x2="500" y2="196" /><line x1="580" y1="280" x2="580" y2="280" />
            <line x1="660" y1="196" x2="660" y2="334" /><line x1="740" y1="151" x2="740" y2="379" />
            <line x1="820" y1="190" x2="820" y2="340" /><line x1="900" y1="268" x2="900" y2="292" />
            <line x1="980" y1="350" x2="980" y2="210" /><line x1="1060" y1="378" x2="1060" y2="152" />
            <line x1="1140" y1="330" x2="1140" y2="200" /><line x1="1220" y1="260" x2="1220" y2="300" />
            <line x1="1300" y1="184" x2="1300" y2="346" /><line x1="1380" y1="151" x2="1380" y2="379" />
          </g>
          <path className={styles.strandOne} stroke={`url(#dna-strand-${tone})`} d="M-100 280C20 150 140 150 260 280S500 410 620 280 860 150 980 280 1220 410 1540 250" />
          <path className={styles.strandTwo} stroke={`url(#dna-strand-${tone})`} d="M-100 250C20 380 140 380 260 250S500 120 620 250 860 380 980 250 1220 120 1540 280" />
          <g className={styles.sequenceNodes} fill={`url(#dna-node-${tone})`}>
            <circle cx="100" cy="151" r="5" /><circle cx="180" cy="325" r="4" />
            <circle cx="420" cy="151" r="5" /><circle cx="500" cy="334" r="4" />
            <circle cx="740" cy="379" r="5" /><circle cx="820" cy="190" r="4" />
            <circle cx="1060" cy="152" r="5" /><circle cx="1140" cy="330" r="4" />
            <circle cx="1380" cy="379" r="5" />
          </g>
        </g>

        <g className={`${styles.dnaHelix} ${styles.secondaryHelix}`} transform="translate(210 560) scale(.72) rotate(7 720 280)">
          <g className={styles.basePairs}>
            <line x1="20" y1="166" x2="20" y2="364" /><line x1="140" y1="170" x2="140" y2="360" />
            <line x1="260" y1="280" x2="260" y2="280" /><line x1="380" y1="375" x2="380" y2="155" />
            <line x1="500" y1="334" x2="500" y2="196" /><line x1="620" y1="250" x2="620" y2="250" />
            <line x1="740" y1="151" x2="740" y2="379" /><line x1="860" y1="225" x2="860" y2="305" />
            <line x1="980" y1="350" x2="980" y2="210" /><line x1="1100" y1="360" x2="1100" y2="170" />
            <line x1="1220" y1="260" x2="1220" y2="300" /><line x1="1380" y1="151" x2="1380" y2="379" />
          </g>
          <path className={styles.strandOne} stroke={`url(#dna-strand-${tone})`} d="M-100 280C20 150 140 150 260 280S500 410 620 280 860 150 980 280 1220 410 1540 250" />
          <path className={styles.strandTwo} stroke={`url(#dna-strand-${tone})`} d="M-100 250C20 380 140 380 260 250S500 120 620 250 860 380 980 250 1220 120 1540 280" />
        </g>
      </svg>
    </div>
  );
}