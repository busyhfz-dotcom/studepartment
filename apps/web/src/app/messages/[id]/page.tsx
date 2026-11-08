import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { ProductShell } from "@/components/shell/product-shell";
import { PrivateConversation } from "./private-conversation";

export default async function MessagePage({params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user)redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent("/introductions")}`);
  const {id}=await params;
  return <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}><main style={{maxWidth:900,margin:"0 auto",padding:"24px 12px"}}><p className="eyebrow">Private conversation</p><h1>Research conversation</h1><p className="lede">Only the two researchers in this accepted introduction can read these messages.</p><PrivateConversation requestId={id}/></main></ProductShell>;
}

