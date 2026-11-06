import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@studepartment/db";
import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import styles from "../../institutions/[id]/page.module.css";

export const metadata: Metadata = {
  title: "Research laboratory",
  robots: { index: false, follow: false },
};

export default async function LaboratoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL || !/^[\w-]{1,128}$/.test(id)) notFound();

  const [lab, viewer] = await Promise.all([
    getDb().laboratory.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        website: true,
        verified: true,
        organization: { select: { id: true, name: true, countryCode: true } },
        members: {
          where: { researcher: { profilePublic: true } },
          take: 24,
          orderBy: [{ researcher: { fullName: "asc" } }, { researcherId: "asc" }],
          select: {
            role: true,
            researcher: {
              select: {
                id: true,
                fullName: true,
                topics: { select: { topic: { select: { name: true } } } },
                methods: { select: { method: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
    getShellViewer(),
  ]);
  if (!lab) notFound();

  const topics = [...new Set(lab.members.flatMap(({ researcher }) => researcher.topics.map(({ topic }) => topic.name)))].sort();
  const methods = [...new Set(lab.members.flatMap(({ researcher }) => researcher.methods.map(({ method }) => method.name)))].sort();
  const website = lab.website && /^https?:\/\//i.test(lab.website) ? lab.website : null;

  return (
    <ProductShell {...viewer}>
      <div className={styles.shell}>
        <Link className="backLink" href="/discover/labs">← Back to laboratory discovery</Link>
        <header className={styles.hero}>
          <div>
            <span className="eyebrow">{lab.verified ? "Verified laboratory" : "Laboratory profile"}</span>
            <h1>{lab.name}</h1>
            <p><Link href={"/institutions/" + lab.organization.id}>{lab.organization.name}</Link>{lab.organization.countryCode ? " · " + lab.organization.countryCode : ""}</p>
          </div>
          {website ? <a href={website} rel="noreferrer" target="_blank">Official laboratory website ↗</a> : null}
        </header>
        {lab.description ? <section className={styles.panel}><h2>About the laboratory</h2><p>{lab.description}</p></section> : null}
        <section className={styles.grid}>
          <article className={styles.panel}>
            <h2>Research topics</h2>
            {topics.length ? <p>{topics.join(" · ")}</p> : <p>Public member profiles have not provided topic evidence yet.</p>}
          </article>
          <article className={styles.panel}>
            <h2>Research methods</h2>
            {methods.length ? <p>{methods.join(" · ")}</p> : <p>Public member profiles have not provided method evidence yet.</p>}
          </article>
        </section>
        <section className={styles.panel}>
          <h2>Public member profiles</h2>
          {lab.members.length ? <ul>{lab.members.map(({ researcher, role }) => (
            <li key={researcher.id}><Link href={"/researchers/" + researcher.id}>{researcher.fullName}</Link>{role ? " · " + role : ""}</li>
          ))}</ul> : <p>No members have shared a public profile.</p>}
          <Link href={"/institutions/" + lab.organization.id}>View the institution and its opportunities →</Link>
        </section>
      </div>
    </ProductShell>
  );
}
