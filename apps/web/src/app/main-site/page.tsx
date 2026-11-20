import { permanentRedirect } from "next/navigation";

export default function RetiredMainSite() {
  permanentRedirect("/start");
}
