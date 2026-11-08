import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { ProductShell } from "@/components/shell/product-shell";
import { PrivateConversation } from "./private-conversation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Private conversation · Provenant", robots: { index: false, follow: false } };

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(`/messages/${id}`)}`);

  return (
    <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ margin: "0 0 14px" }}>
          <Link href="/introductions" style={{ fontSize: 13 }}>← Introductions</Link>
        </p>
        <span className="eyebrow">Private conversation</span>
        <h1>Research conversation</h1>
        <p className="lede">Only the two researchers in this accepted introduction can read these messages. Either of you can pause the conversation at any time.</p>
        <PrivateConversation requestId={id} />
      </div>
    </ProductShell>
  );
}
