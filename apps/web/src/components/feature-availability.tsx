import { integrationConfiguration } from "@/server/config/environment";
import styles from "./feature-availability.module.css";

/** Public status uses configuration booleans only; credentials never leave the server. */
export function FeatureAvailability() {
  const integrations = integrationConfiguration();
  return <section className={styles.panel} aria-labelledby="feature-availability-title">
    <h2 id="feature-availability-title">What is available today</h2>
    <p>Profiles, private document storage, search and source-linked research review are live today. Results reflect the listings and records currently in Provenant.</p>
    <ul>
      <li><strong>ORCID connection and automatic import:</strong> {integrations.orcid ? "Available. Nothing is imported without your permission." : "Not yet available. You can still add a link to your public ORCID record."}</li>
      <li><strong>AI research interpretation:</strong> {integrations.researchAssistant ? "Available. Answers only use records held in Provenant." : "Not yet available. For now, the assistant summarizes matching records with their sources."}</li>
      <li><strong>Email delivery and password recovery:</strong> {integrations.emailDelivery ? "Available." : "Not yet available."}</li>
    </ul>
  </section>;
}
