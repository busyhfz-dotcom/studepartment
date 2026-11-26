import { countryName } from "@/lib/countries";
import photos from "@/lib/location-photos.json";
import styles from "./location-feature.module.css";

type CountryPhoto = { src: string; alt?: string; width?: number; height?: number; position?: string };
const countryPhotos: Record<string, CountryPhoto> = photos;

export function LocationFeature({ value }: { value: string }) {
  const photo = countryPhotos[value];
  const country = countryName(value);
  if (!photo || !country) return null;
  return <figure className={styles.feature}>
    {/* eslint-disable-next-line @next/next/no-img-element -- this local asset is already compressed at its display width */}
    <img className={styles.photo} src={photo.src} alt={photo.alt ?? country} width={photo.width} height={photo.height}
      style={{ objectPosition: photo.position }} loading="lazy" decoding="async" />
  </figure>;
}
