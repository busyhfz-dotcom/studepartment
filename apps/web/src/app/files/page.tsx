import { redirect } from "next/navigation";
import { ProductShell } from "@/components/shell/product-shell";
import { DocumentManager } from "@/components/files/document-manager";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function FilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/files");
  const institutional = user.accountKind === "INSTITUTION";
  return <ProductShell accountKind={institutional ? "institution" : "individual"}><DocumentManager all scope={institutional ? "organization" : "profile"} title="Your file library" /></ProductShell>;
}
