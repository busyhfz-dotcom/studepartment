import { AuthForm } from "../auth-form";
import type { IndividualProfileRole, InstitutionalOrganizationType } from "@/lib/api-contracts";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; kind?: string; role?: string; type?: string }>;
}) {
  const { callbackUrl, kind, role, type } = await searchParams;
  const initialKind = kind === "institution" ? "institution" : "individual";
  const initialRole: IndividualProfileRole = role === "student" || role === "professor" ? role : "researcher";
  const allowedTypes = new Set<InstitutionalOrganizationType>(["university", "hospital", "laboratory", "research-institute", "company", "foundation"]);
  const initialOrganizationType = allowedTypes.has(type as InstitutionalOrganizationType) ? type as InstitutionalOrganizationType : "university";
  return <AuthForm callbackUrl={callbackUrl} mode="sign-up" initialKind={initialKind} initialRole={initialRole} initialOrganizationType={initialOrganizationType} />;
}
