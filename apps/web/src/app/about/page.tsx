import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "About Provenant",
  description: "What Provenant is, where its research positions and funding listings come from, how it treats your data and how to contact us.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalPage current="about" title="About Provenant">
      <p>
        Provenant helps medical and biomedical researchers find positions, fellowships, scholarships and grants, and
        shows where every listing came from and when it was last checked. Browsing is free and needs no account.
      </p>

      <h2>Where listings come from</h2>
      <p>
        We read listings directly from the organizations that publish them: funders, universities, hospitals and
        research institutes. Each listing links to its original page, and we remove it from search when its deadline
        passes or the publisher takes it down. The <Link href="/sources">data sources page</Link> lists every publisher
        we read, how many open listings each one has and when it was last checked.
      </p>
      <p>
        Institutions can also publish their own positions. A posting from an institution we have not verified is held
        until verification, and its links must lead to that institution&apos;s own website.
      </p>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell advertising or share your activity with advertisers.</li>
        <li>We do not rank researchers publicly or show follower counts.</li>
        <li>We are not a recruiter, a funder or an employer, and we take no part in selection decisions.</li>
        <li>We do not open a conversation between two researchers until the recipient accepts an introduction.</li>
      </ul>

      <h2>Your data</h2>
      <p>
        Your profile is private until you choose to make it public. You can export or permanently delete your account
        from <Link href="/settings/privacy">privacy settings</Link> at any time. The <Link href="/privacy">Privacy Notice</Link>{" "}
        explains what we store and why.
      </p>

      <h2>Accuracy</h2>
      <p>
        Deadlines, eligibility and funding terms are set by the publisher and can change. Always confirm them at the
        original source before you apply. If a listing is wrong or out of date, tell us and we will check it.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, corrections, or a request to add or remove a source: <LegalContact />.
      </p>
    </LegalPage>
  );
}
