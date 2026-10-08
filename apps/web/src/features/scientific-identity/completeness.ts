import type { ProfileCompleteness, ProfileResponse } from "@/lib/api-contracts";

type CompletenessInput = Pick<
  ProfileResponse,
  | "fullName"
  | "headline"
  | "institution"
  | "researchInterests"
  | "methods"
  | "collaborationGoals"
  | "verification"
  | "accountRole"
  | "profileDetails"
>;

/**
 * Completeness is a private guidance mechanism for the researcher.
 * It is deliberately not exposed as a public reputation, quality, impact, or
 * researcher ranking score.
 */
export function calculateProfileCompleteness(profile: CompletenessInput): ProfileCompleteness {
  const hasVerification = (label: string) =>
    profile.verification.some((item) => item.label === label && item.verified);

  const dimensions = [
    {
      key: "role-context",
      label: profile.accountRole === "student" ? "Study context" : profile.accountRole === "professor" ? "Faculty context" : "Professional context",
      complete: profile.accountRole === "student"
        ? Boolean(profile.profileDetails?.degreeProgram || profile.profileDetails?.thesisTopic)
        : Boolean(profile.profileDetails?.academicTitle || profile.profileDetails?.department),
    },
    {
      key: "identity",
      label: "Identity",
      complete: profile.fullName.trim().length > 1 && profile.headline.trim().length > 3,
    },
    {
      key: "affiliation",
      label: "Affiliation",
      complete: profile.institution !== "Independent researcher" || hasVerification("Institution"),
    },
    {
      key: "topics",
      label: "Research topics",
      complete: profile.researchInterests.length > 0,
    },
    {
      key: "methods",
      label: "Research methods",
      complete: profile.methods.length > 0,
    },
    {
      key: "intent",
      label: "Collaboration intent",
      complete: profile.collaborationGoals.length > 0,
    },
    {
      key: "publications",
      label: "Publications",
      complete: hasVerification("Publications"),
    },
    {
      key: "verification",
      label: "Scientific verification",
      complete: hasVerification("ORCID") || hasVerification("Email") || hasVerification("Institution"),
    },
  ];

  const completed = dimensions.filter((dimension) => dimension.complete).length;

  return {
    percent: Math.round((completed / dimensions.length) * 100),
    completed,
    total: dimensions.length,
    dimensions,
    note: "Guidance only — not a reputation or researcher ranking score.",
  };
}
