import { permanentRedirect } from "next/navigation";

export default function LegacyFavoritesPage() {
  permanentRedirect("/opportunities/saved");
}
