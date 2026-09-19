import { AuthForm } from "../auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return <AuthForm mode="sign-in" callbackUrl={callbackUrl} />;
}
