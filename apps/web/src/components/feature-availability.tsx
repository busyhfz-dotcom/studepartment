import { integrationConfiguration } from "@/server/config/environment";
import styles from "./feature-availability.module.css";

/** Public status uses configuration booleans only; credentials never leave the server. */
export function FeatureAvailability() {
  const integrations = integrationConfiguration();
  return <section className={styles.panel} aria-labelledby="feature-availability-title">
    <h2 id="feature-availability-title">What is available today</h2>
    <p>Profiles, private document storage, structured search and source-based research review are available. Results depend on the evidence currently listed.</p>
    <ul>
      <li><strong>ORCID connection and automatic import:</strong> {integrations.orcid ? "Configured; import requires your authorization." : "Unavailable. You can save a public record link without verifying ownership."}</li>
      <li><strong>AI research interpretation:</strong> {integrations.researchAssistant ? "Configured; responses remain limited to the available evidence." : "Unavailable. The assistant currently provides structured evidence review."}</li>
      <li><strong>Email delivery and password recovery:</strong> {integrations.emailDelivery ? "Configured." : "Unavailable until email delivery is enabled."}</li>
    </ul>
  </section>;
}
