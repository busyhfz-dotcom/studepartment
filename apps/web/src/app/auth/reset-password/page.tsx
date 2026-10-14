import { PasswordForm } from "../password-form";

export const metadata = { title: "Reset password", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <PasswordForm mode="reset" token={token} invalidToken={Boolean(error)} />;
}
