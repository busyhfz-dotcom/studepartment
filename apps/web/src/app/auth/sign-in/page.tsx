import { AuthForm } from "../auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; next?: string; kind?: string }>;
}) {
  const { callbackUrl, kind, next } = await searchParams;
  return <AuthForm callbackUrl={callbackUrl ?? next} initialKind={kind === "institution" ? "institution" : "individual"} />;
}
