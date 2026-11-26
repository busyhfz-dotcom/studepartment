import Link from "next/link";
import { DocumentManager } from "@/components/files/document-manager";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { ScientificProfileCard } from "@/components/scientific/scientific-profile-card";
import { ProfessionalProfileSections } from "@/components/scientific/professional-profile-sections";
import { PublicationEvidencePanel } from "./publication-evidence-panel";
import { getCurrentUser } from "@/server/auth/current-user";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import styles from "./profile.module.css";
import workspace from "./workspace.module.css";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile");
  if (user.accountKind === "INSTITUTION") redirect("/organization/profile");

  const profile = await researcherRepository.getProfileForUser(user.id);
  if (!profile) redirect("/onboarding");

  const identity = {
    id: profile.id,
    fullName: profile.fullName,
    imageUrl: profile.imageUrl,
    headline: profile.headline,
    institution: profile.institution,
    location: profile.location,
    careerStage: profile.careerStage,
    summary: profile.bio ?? "Add a research summary to make scientific discovery more precise.",
    researchInterests: profile.researchInterests.map((name) => ({ name })),
    methods: profile.methods.map((name) => ({ name })),
    openTo: profile.collaborationGoals,
    availabilityMode: profile.availability,
    verification: profile.verification,
  };
  const roleLabel = profile.accountRole === "student" ? "Student profile" : profile.accountRole === "professor" ? "Professor / faculty profile" : "Researcher profile";
  const roleDetails = profile.accountRole === "student"
    ? [["Degree program", profile.profileDetails?.degreeProgram], ["Expected graduation", profile.profileDetails?.graduationYear], ["Supervisor", profile.profileDetails?.supervisorName], ["Thesis topic", profile.profileDetails?.thesisTopic]]
    : profile.accountRole === "researcher"
      ? [["Research position", profile.profileDetails?.academicTitle], ["Department", profile.profileDetails?.department], ["Research experience", profile.profileDetails?.yearsExperience], ["Current project", profile.profileDetails?.currentProject]]
      : [["Academic title", profile.profileDetails?.academicTitle], ["Department", profile.profileDetails?.department], ["Lab / research group", profile.profileDetails?.labName], ["Student supervision", profile.profileDetails?.supervisionStatus]];

  return (
    <ProductShell>
      <div className={`profileShell ${workspace.workspace}`}>
        <header className={workspace.hero}>
          <div>
            <span className="eyebrow">Your workspace</span>
            <h1>Research profile</h1>
            <p>Update your research interests, publications and collaboration preferences.</p>
          </div>
          <nav className={workspace.actions} aria-label="Profile actions">
            <Link href="/profile/edit">Edit profile</Link>
            <Link href="/opportunities/saved">Saved</Link>
            <Link href="/settings/privacy">Privacy & data</Link>
            <Link href={"/graph?researcher=" + profile.id}>Evidence graph</Link>
          </nav>
        </header>

        <ScientificProfileCard identity={identity} nameHeading="h2" />
        <section className={styles.roleProfile}>
          <div><span className="sectionLabel">Personalized identity</span><h2>{roleLabel}</h2></div>
          <div className={styles.roleDetails}>
            {roleDetails.filter(([, value]) => value).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
            {!roleDetails.some(([, value]) => value) ? <p>Add your role-specific details to make this profile more useful.</p> : null}
          </div>
        </section>
        <ProfessionalProfileSections details={profile.profileDetails} orcid={profile.orcid} orcidVerified={profile.verification.some((signal) => signal.label === "ORCID" && signal.verified)} />
        <DocumentManager scope="profile" title="CV, certificates & research documents" />
        <PublicationEvidencePanel />

        {profile.completeness ? (
          <section className={styles.guidance} aria-labelledby="profile-guidance-title">
            <div className={styles.header}>
              <div>
                <span className="sectionLabel">Profile guidance</span>
                <h2 id="profile-guidance-title">{profile.completeness.completed} of {profile.completeness.total} identity dimensions ready</h2>
              </div>
              <strong>{profile.completeness.percent}%</strong>
            </div>
            <div className={styles.bar} aria-hidden="true">
              <span style={{ width: `${profile.completeness.percent}%` }} />
            </div>
            <div className={styles.grid}>
              {profile.completeness.dimensions.map((dimension) => (
                <div className={styles.item} key={dimension.key}>
                  <span>{dimension.complete ? "✓" : "○"}</span>
                  <span>{dimension.label}</span>
                </div>
              ))}
            </div>
            <p>{profile.completeness.note}</p>
          </section>
        ) : null}
      </div>
    </ProductShell>
  );
}
