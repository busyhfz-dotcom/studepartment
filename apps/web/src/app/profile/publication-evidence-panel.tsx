"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  ApiError,
  ApiSuccess,
  PublicationListResponse,
  PublicationRecord,
} from "@/lib/api-contracts";
import styles from "./profile.module.css";

type ListResponse = ApiSuccess<PublicationListResponse> | ApiError;

function formatDate(value?: string) {
  if (!value) return "Date not published";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short" }).format(new Date(value));
}

function evidenceLabel(publication: PublicationRecord) {
  if (publication.evidenceLevel === "pubmed-corroborated") return "PubMed corroborated";
  if (publication.evidenceLevel === "orcid-asserted") return "ORCID asserted";
  return "Manual assertion";
}

async function fetchPublications() {
  const response = await fetch("/api/v1/profile/publications", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await response.json()) as ListResponse;
  if (!response.ok || !body.success) {
    throw new Error(body.success ? "Unable to load publications." : body.error.message);
  }
  return body.data;
}

export function PublicationEvidencePanel() {
  const [data, setData] = useState<PublicationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchPublications()
      .then((next) => {
        if (active) setData(next);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load publications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className={styles.publications} aria-labelledby="publication-evidence-title">
      <div className={styles.publicationHeader}>
        <div>
          <span className="sectionLabel">Publication evidence</span>
          <h2 id="publication-evidence-title">Source-backed research outputs</h2>
          <p>
            Previously recorded research outputs retain their source and evidence labels.
          </p>
        </div>
        <Link className={styles.syncButton} href="/profile/orcid">Research profile links →</Link>
      </div>

      {error ? <div className={styles.publicationError}>{error}</div> : null}

      {loading ? (
        <div className={styles.publicationSkeleton} />
      ) : !data?.publications.length ? (
        <div className={styles.publicationEmpty}>
          <strong>No research outputs have been imported yet.</strong>
        </div>
      ) : (
        <>
          <div className={styles.publicationSummary}>
            <strong>{data.total}</strong>
            <span>active research outputs</span>
          </div>
          <div className={styles.publicationList}>
            {data.publications.slice(0, 12).map((publication) => (
              <article className={styles.publicationCard} key={publication.id}>
                <div className={styles.publicationTopline}>
                  <span className={styles.evidenceBadge}>{evidenceLabel(publication)}</span>
                  <span>{formatDate(publication.publicationDate)}</span>
                </div>
                <h3>{publication.title}</h3>
                <p>{publication.journal ?? "Journal not published"}{publication.publicationType ? " · " + publication.publicationType : ""}</p>
                <div className={styles.identifierRow}>
                  {publication.pmid ? <span>PMID {publication.pmid}</span> : null}
                  {publication.doi ? <span>DOI {publication.doi}</span> : null}
                  {publication.pmcid ? <span>{publication.pmcid}</span> : null}
                </div>
                <div className={styles.publicationFooter}>
                  <span>Evidence: {publication.evidenceSources.join(" + ") || "Recorded source"}</span>
                  {publication.sourceUrl ? (
                    <a href={publication.sourceUrl} rel="noreferrer" target="_blank">Open source ↗</a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
