import Link from "next/link";
import { ScientificProfileCard } from "@/components/scientific/scientific-profile-card";
import type { ScientificIdentity } from "@/features/scientific-identity/types";

const demoIdentity: ScientificIdentity = {
  id: "demo-researcher",
  fullName: "Dr. Sarah Williams",
  headline: "Clinical Researcher · Translational Oncology",
  institution: "University of Oxford",
  location: "Oxford, UK",
  summary:
    "Researcher focused on translational oncology, immune-based therapies, and clinically actionable biomarkers, with an interest in cross-institutional collaboration.",
  researchInterests: [
    { name: "Cancer Immunotherapy" },
    { name: "Biomarkers" },
    { name: "Clinical Trials" },
  ],
  openTo: ["Research collaboration", "Clinical projects", "Mentorship"],
  verification: [
    { label: "Institution", verified: true },
    { label: "ORCID", verified: true },
    { label: "Publications", verified: true },
    { label: "Email", verified: false },
  ],
};

export default function ProfilePage() {
  return (
    <main className="shell profileShell">
      <Link className="backLink" href="/">← Studepartment</Link>
      <ScientificProfileCard identity={demoIdentity} />
    </main>
  );
}
