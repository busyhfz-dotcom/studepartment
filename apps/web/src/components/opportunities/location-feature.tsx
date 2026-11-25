import { countryName } from "@/lib/countries";
import photos from "@/lib/location-photos.json";
import styles from "./location-feature.module.css";

type CountryPhoto = { src: string; alt?: string };
const countryPhotos: Record<string, CountryPhoto> = photos;

export function LocationFeature({ value }: { value: string }) {
  const photo = countryPhotos[value];
  const country = countryName(value);
  if (!photo || !country) return null;
  return <div className={styles.feature}>
    {/* eslint-disable-next-line @next/next/no-img-element -- a small, local landscape */}
    <img className={styles.photo} src={photo.src} alt={photo.alt ?? country} loading="lazy" decoding="async" />
  </div>;
}
