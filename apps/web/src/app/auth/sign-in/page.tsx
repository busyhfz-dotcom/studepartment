import { AuthForm } from "../auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; next?: string }>;
}) {
  const { callbackUrl, next } = await searchParams;
  return <AuthForm callbackUrl={callbackUrl ?? next} />;
}
