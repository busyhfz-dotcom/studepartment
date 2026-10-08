import { redirect } from "next/navigation";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const query = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
  redirect(`/auth/sign-in${query}`);
}