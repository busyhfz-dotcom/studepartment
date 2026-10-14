import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using Studepartment, including accuracy of listings, acceptable use and accounts.",
};

export default function TermsPage() {
  return (
    <LegalPage current="terms" title="Terms of Use">
      <p>
        These terms apply to your use of Studepartment. By creating an account you agree to them. Please also read
        the <Link href="/privacy">Privacy Notice</Link>. Questions: <LegalContact />.
      </p>

      <h2>What Studepartment is</h2>
      <p>
        Studepartment is a research-intelligence service. It helps you find positions, funding, conferences,
        collaborators and institutions, and explains why each result may be relevant. It is not a recruiter, a funder
        or an employer, and it does not take part in any selection decision.
      </p>

      <h2>Listings and external sources</h2>
      <ul>
        <li>Opportunities show their source and when they were last checked. Deadlines, eligibility and funding terms can change, so always confirm them with the official source before you apply.</li>
        <li>Relevance and eligibility indications are guidance, not a guarantee of eligibility or of success.</li>
        <li>Scanner and Conferences link to independent services. We do not control their content, availability or terms.</li>
        <li>Research Assistant answers are based on the evidence held in Studepartment and may be incomplete. Check important facts.</li>
      </ul>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information, and represent only yourself or an organization you are authorized to act for.</li>
        <li>Keep your password secure and tell us if you suspect unauthorized access.</li>
        <li>You can delete your account at any time in <Link href="/settings/privacy">Privacy settings</Link>.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Do not:</p>
      <ul>
        <li>send unsolicited bulk messages, or introduction requests that ignore a recipient&apos;s stated preferences;</li>
        <li>impersonate another researcher or institution, or claim publications, affiliations or credentials that are not yours;</li>
        <li>post opportunities that are fraudulent, discriminatory or charge applicants a fee to apply;</li>
        <li>scrape, copy at scale, or attempt to bypass rate limits or security controls;</li>
        <li>upload content you do not have the right to share, or material that is unlawful.</li>
      </ul>
      <p>We may limit or close accounts that break these rules.</p>

      <h2>Your content</h2>
      <p>
        You keep ownership of what you add. You allow us to store and display it as you choose in the product, so that
        the service can work. Public profile fields are visible only after you make your profile public.
      </p>

      <h2>Availability and liability</h2>
      <p>
        We work to keep Studepartment accurate and available but provide it &quot;as is&quot;, without guarantees of
        uninterrupted service or of the completeness of third-party information. To the extent permitted by law, we are
        not liable for decisions made on the basis of listings or recommendations.
      </p>

      <h2>Changes</h2>
      <p>We will update the date above when these terms change and tell account holders about significant changes.</p>
    </LegalPage>
  );
}
