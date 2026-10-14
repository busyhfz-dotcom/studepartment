import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal/legal-page";
import { SEARCH_LOG_RETENTION_DAYS } from "@/server/personalization/interest-signals";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "What Provenant collects, why, who processes it, and how to export or delete your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage current="privacy" title="Privacy Notice">
      <p>
        Provenant helps medical and biomedical researchers find positions, funding, collaborators and
        institutions. This notice explains what we collect, why, which services process it, and the controls
        you have. Questions or requests: <LegalContact />.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> your name, email address and a securely hashed password. Organization accounts also store the representative&apos;s name.</li>
        <li><strong>Scientific Identity:</strong> what you add to your profile, such as career stage, country, research topics, methods, affiliations, publications and links. If you connect ORCID, we import only the records you consent to.</li>
        <li><strong>Files:</strong> documents you upload (for example a CV or certificate), stored in private object storage.</li>
        <li><strong>Workspace activity:</strong> saved opportunities, application stages and private notes, introduction requests and replies, and private feedback on results.</li>
        <li><strong>Search text:</strong> when you are signed in, the text of your searches is used to adjust your research-interest weights. The raw text is deleted after {SEARCH_LOG_RETENTION_DAYS} days.</li>
        <li><strong>Product events:</strong> a small set of events, such as a saved opportunity or a sent introduction. They do not include raw search text or Research Assistant prompts.</li>
        <li><strong>Security data:</strong> session cookies and rate-limit records used to protect accounts and prevent abuse.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show you relevant opportunities, people and institutions, with the reasons for each match.</li>
        <li>To send emails you choose to receive, such as the weekly digest of new positions and grants that match your research topics and the upcoming deadlines of opportunities you saved. You can turn the digest off in <Link href="/settings/privacy">Privacy settings</Link>.</li>
        <li>To keep the service secure and prevent spam and abuse.</li>
      </ul>
      <p>We do not sell personal data, show advertising, or use private messages or notes for advertising.</p>

      <h2>Who can see your profile</h2>
      <p>
        New Scientific Identities are private by default. Your profile appears in researcher discovery only if you
        make it public. You also decide who may send you introduction requests.
      </p>

      <h2>Services that process data for us</h2>
      <ul>
        <li><strong>Railway:</strong> application hosting, database and private file storage (EU West region).</li>
        <li><strong>Resend:</strong> delivery of account and notification emails.</li>
        <li><strong>OpenAI:</strong> semantic search over the text you search for, and Research Assistant answers when you use that feature. The Assistant receives your question plus the relevant Provenant evidence.</li>
        <li><strong>ORCID and NCBI PubMed:</strong> sources of publication and identity records that you choose to connect or import.</li>
      </ul>

      <h2>Your controls</h2>
      <ul>
        <li><strong>Export:</strong> download your account and scientific data as JSON from <Link href="/settings/privacy">Privacy settings</Link>.</li>
        <li><strong>Delete:</strong> permanently delete your account and owned Scientific Identity from the same page.</li>
        <li><strong>Correct:</strong> edit your Scientific Identity at any time.</li>
        <li><strong>Email preferences:</strong> switch the weekly digest off at any time.</li>
      </ul>
      <p>
        Depending on where you live, you may also have the right to object to or restrict processing, and to complain
        to your data protection authority.
      </p>

      <h2>Cookies</h2>
      <p>
        We use only the cookies needed to keep you signed in and to protect the service. We do not use advertising or
        third-party tracking cookies.
      </p>

      <h2>Changes</h2>
      <p>We will update the date above when this notice changes and tell account holders about significant changes.</p>
    </LegalPage>
  );
}
