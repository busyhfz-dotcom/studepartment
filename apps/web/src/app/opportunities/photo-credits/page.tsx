import Link from "next/link";
import { countryName } from "@/lib/countries";
import photos from "@/lib/location-photos.json";
import verifiedMarks from "@/lib/additional-verified-marks.json";
import styles from "@/app/profile/workspace.module.css";

export const metadata = { title: "Location photo credits" };

type Source = { credit: string; url: string; licenseUrl?: string };
type MarkCredit = { name: string; source: string; artist?: string; license: string; licenseUrl?: string };

export default function PhotoCredits() {
  return <main className={styles.workspace}>
    <header className={styles.hero}>
      <h1>Location photo credits</h1>
      <nav className={styles.actions} aria-label="Opportunity navigation"><Link href="/start?step=browse">Explore opportunities</Link></nav>
    </header>
    <p>The photographs are resized for the opportunity browser.</p>
    <ul>
      {(Object.entries(photos) as [string, Source][]).map(([code, photo]) =>
        <li key={code}>
          {countryName(code)} · <a href={photo.url}>{photo.credit}</a>
          {photo.licenseUrl ? <> · <a href={photo.licenseUrl}>License</a></> : null}
        </li>
      )}
    </ul>
    <h2>Institutional marks</h2>
    <p>These marks are resized for the results cards.</p>
    <ul>
      {(Object.values(verifiedMarks.marks) as MarkCredit[]).map((mark) =>
        <li key={mark.source}>
          <a href={mark.source}>{mark.name}</a>{mark.artist ? " · " + mark.artist : ""}{" · "}
          {mark.licenseUrl ? <a href={mark.licenseUrl}>{mark.license}</a> : mark.license}
        </li>
      )}
    </ul>
  </main>;
}
