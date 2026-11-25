import marks from "@/lib/institution-marks.json";
import styles from "./brand-mark.module.css";

const institutionMarks: Record<string, number> = marks.slots;
const institutionAliases: readonly [RegExp, string][] = [
  [/Netherlands Cancer Institute|Antoni van Leeuwenhoek/i, "nki.nl"],
  [/Agency for Science, Technology and Research|\bA\*STAR\b/i, "a-star.edu.sg"],
  [/Swiss Cancer Research Foundation|Swiss Cancer League/i, "cancerresearch.ch"],
  [/National Institutes of Health/i, "nih.gov"],
  [/European Research Council|Horizon Europe|European Commission/i, "ec.europa.eu"],
  [/University of Oxford/i, "ox.ac.uk"], [/University of Cambridge/i, "cam.ac.uk"],
  [/Harvard/i, "harvard.edu"], [/Stanford/i, "stanford.edu"],
  [/National University of Singapore/i, "nus.edu.sg"],
];

export function Institution({ name, website }: { name: string; website?: string | null }) {
  const domain = host(website);
  const known = Object.keys(institutionMarks).find(key => domain === key || domain.endsWith("." + key));
  const alias = institutionAliases.find(([pattern]) => pattern.test(name))?.[1];
  const slot = institutionMarks[known ?? alias ?? ""];
  const initials = name.trim().split(/[\s–,&-]+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();
  return <span className={styles.institution} data-original-content>
    {typeof slot === "number"
      ? <span className={styles.mark} aria-hidden="true"><span style={{
        backgroundSize: marks.columns * 100 + "% " + marks.rows * 100 + "%",
        backgroundPosition: (slot % marks.columns) * 100 / (marks.columns - 1) + "% "
          + Math.floor(slot / marks.columns) * 100 / (marks.rows - 1) + "%",
      }} /></span>
      : <span className={styles.initials} aria-hidden="true">{initials}</span>}
    <span className={styles.name}>{name}</span>
  </span>;
}

function host(website?: string | null) {
  if (!website) return "";
  try { return new URL(website).hostname.toLowerCase(); } catch { return ""; }
}

const appMarks = ["Gmail", "Outlook", "LinkedIn", "X", "Slack", "GoogleCalendar"] as const;
type App = typeof appMarks[number];

export function AppMark({ app }: { app: App }) {
  // eslint-disable-next-line @next/next/no-img-element -- small logos in labelled action buttons
  return <img className={styles.app} src={"/images/apps/" + app + ".webp"} width={19} height={19} alt="" />;
}
