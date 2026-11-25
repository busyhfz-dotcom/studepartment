import { countryName } from "@/lib/countries";
import photos from "@/lib/location-photos.json";
import styles from "./location-feature.module.css";

type CountryPhoto = { src: string; credit: string; url: string; licenseUrl?: string };
const countryPhotos: Record<string, CountryPhoto> = photos;

export function LocationFeature({ value }: { value: string }) {
  const photo = countryPhotos[value];
  const country = countryName(value);
  if (!photo || !country) return null;
  const place = value === "NL" || value === "GB" || value === "US" ? "the " + country : country;

  return <aside className={styles.feature} aria-label={country}>
    {/* eslint-disable-next-line @next/next/no-img-element -- a small, local landscape */}
    <img className={styles.photo} src={photo.src} alt="" loading="lazy" decoding="async" />
    <div className={styles.copy}>
      <strong>Research in {place}</strong>
      <a href={"/opportunities/directory?" + new URLSearchParams({ country: value })}>Explore institutions and programmes</a>
    </div>
    <span className={styles.credit}>
      <a href={photo.url} target="_blank" rel="noreferrer">Photo: {photo.credit}</a>
      {photo.licenseUrl ? <> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">License</a></> : null}
    </span>
  </aside>;
}
