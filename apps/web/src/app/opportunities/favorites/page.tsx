import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@studepartment/db";
import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { Favorites } from "./workspace";
import styles from "../saved/page.module.css";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=%2Fopportunities%2Ffavorites");
  const records = await getDb().opportunityLike.findMany({
    where: { userId: user.id }, orderBy: { createdAt: "desc" },
    select: { opportunity: { select: { id: true, title: true, type: true, deadline: true, deadlinePrecision: true,
      status: true, sourceUrl: true, applicationUrl: true, organization: { select: { name: true } } } } },
  });
  const favorites = records.map(({ opportunity: row }) => ({
    ...row, deadline: row.deadline?.toISOString() ?? null,
    deadlinePrecision: row.deadlinePrecision.toLowerCase().replaceAll("_", "-"),
    organization: row.organization.name,
    open: row.status === "ACTIVE" && (!row.deadline || row.deadline.getTime() > Date.now()),
  }));
  return <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1>My Favorites</h1>
        <p>Return to opportunities you liked from any device. Export your list or move a listing into your application workspace.</p>
        <Link href="/opportunities/saved">Application workspace ↗</Link>
      </header>
      <Favorites initial={favorites} />
    </div>
  </ProductShell>;
}
