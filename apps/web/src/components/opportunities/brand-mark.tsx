import marks from "@/lib/institution-marks.json";
import additionalMarks from "@/lib/additional-institution-marks.json";
import confirmedMarks from "@/lib/additional-verified-marks.json";
import styles from "./brand-mark.module.css";

const institutionMarks: Record<string, number> = marks.slots;
const extraSlots: Record<string, number> = additionalMarks.slots;
const nameAliases: Record<string, string> = additionalMarks.aliases;
const verifiedSlots: Record<string, { slot: number; name: string }> = confirmedMarks.marks;
const markDomains = [...new Set([...Object.keys(institutionMarks), ...Object.keys(extraSlots), ...Object.keys(verifiedSlots)])].sort((a,b) => b.length - a.length);
const normalizeName = (name: string) => name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const verifiedNames = new Map(Object.entries(verifiedSlots).map(([domain, record]) => [normalizeName(record.name), domain]));
const institutionAliases: readonly [RegExp, string][] = [
  [/Netherlands Cancer Institute|Antoni van Leeuwenhoek/i, "nki.nl"],
  [/Agency for Science, Technology and Research|\bA\*STAR\b/i, "a-star.edu.sg"],
  [/Swiss Cancer Research Foundation|Swiss Cancer League/i, "cancerresearch.ch"],
  [/National Institutes of Health/i, "nih.gov"],
  [/European Research Council|Horizon Europe|European Commission/i, "ec.europa.eu"],
  [/University of Oxford/i, "ox.ac.uk"], [/University of Cambridge/i, "cam.ac.uk"],
  [/Harvard/i, "harvard.edu"], [/Stanford/i, "stanford.edu"],
  [/National University of Singapore/i, "nus.edu.sg"],
  [/\bKAIST\b/i, "kaist.ac.kr"],
  [/\bMersey Care\b/i, "merseycare.nhs.uk"],
  [/\bNorthern Care Alliance\b/i, "northerncarealliance.nhs.uk"],
  [/\bLiverpool University Hospitals\b/i, "liverpoolft.nhs.uk"],
  [/\bThe Royal Marsden\b/i, "royalmarsden.nhs.uk"],
  [/\bManchester University NHS\b/i, "mft.nhs.uk"],
  [/\bUniversity Hospitals Bristol\b/i, "uhbristol.nhs.uk"],
  [/\bGreat Ormond Street\b/i, "gosh.nhs.uk"],
  [/\bUniversity College London Hospitals\b/i, "uclh.nhs.uk"],
  [/\bOxford University Hospitals\b/i, "ouh.nhs.uk"],
  [/Universidade de São Paulo/i, "usp.br"],
];

function findMark(name: string, website: string | null | undefined) {
  const domain = host(website);
  const known = markDomains.find(key => domain === key || domain.endsWith("." + key));
  const nameKey = normalizeName(name);
  const alias = nameAliases[nameKey] ?? verifiedNames.get(nameKey) ?? institutionAliases.find(([pattern]) => pattern.test(name))?.[1];
  const key = known ?? alias ?? "";
  if (Object.hasOwn(verifiedSlots, key)) return { columns: confirmedMarks.columns, rows: confirmedMarks.rows, slot: verifiedSlots[key].slot, src: "/images/institutions/additional-verified.webp" };
  if (Object.hasOwn(extraSlots, key)) return { columns: additionalMarks.columns, rows: additionalMarks.rows, slot: extraSlots[key], src: "/images/institutions/additional-marks.webp" };
  if (Object.hasOwn(institutionMarks, key)) return { columns: marks.columns, rows: marks.rows, slot: institutionMarks[key], src: "/images/institutions/marks.webp" };
}

export function InstitutionalMark({ name, website, className }: { name: string; website?: string | null; className?: string }) {
  const mark = findMark(name, website);
  if (!mark) return null;
  return <span className={className ?? styles.tile} aria-hidden="true" style={{
    backgroundImage: `url("${mark.src}")`,
    backgroundSize: `${mark.columns * 100}% ${mark.rows * 100}%`,
    backgroundPosition: `${mark.slot % mark.columns * 100 / (mark.columns - 1)}% ${Math.floor(mark.slot / mark.columns) * 100 / (mark.rows - 1)}%`,
  }} />;
}

export function Institution({ name, website }: { name: string; website?: string | null }) {
  const initials = name.trim().split(/[\s–,&-]+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();
  return <span className={styles.institution} data-original-content>
    <span className={styles.mark}>
      <span className={styles.initials} aria-hidden="true">{initials}</span>
      <InstitutionalMark name={name} website={website} />
    </span>
    <span className={styles.name}>{name}</span>
  </span>;
}

function host(website?: string | null) {
  if (!website) return "";
  try { return new URL(website).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

const appMarks = ["Gmail", "Outlook", "LinkedIn", "X", "Slack", "GoogleCalendar"] as const;
type App = typeof appMarks[number];

export function AppMark({ app }: { app: App }) {
  // eslint-disable-next-line @next/next/no-img-element -- small logos in labelled action buttons
  return <img className={styles.app} src={"/images/apps/" + app + ".webp"} width={19} height={19} alt="" />;
}
