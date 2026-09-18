"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  ApiError,
  ApiSuccess,
  ScientificGraphEdge,
  ScientificGraphNeighborhoodResponse,
  ScientificGraphNode,
  ScientificGraphNodeType,
} from "@/lib/api-contracts";
import styles from "./page.module.css";

type GraphApiResponse = ApiSuccess<ScientificGraphNeighborhoodResponse> | ApiError;

const groupConfig: Array<{
  key: string;
  title: string;
  description: string;
  types: ScientificGraphNodeType[];
}> = [
  {
    key: "identity",
    title: "Identity anchors",
    description: "Institutions and laboratories directly connected to this researcher.",
    types: ["institution", "laboratory"],
  },
  {
    key: "research",
    title: "Research context",
    description: "Canonical topics and methods attached to the scientific identity.",
    types: ["topic", "method"],
  },
  {
    key: "outputs",
    title: "Research outputs",
    description: "Active publication relationships with evidence-aware authorship.",
    types: ["publication"],
  },
  {
    key: "opportunities",
    title: "Institutional opportunities",
    description: "Current source-backed opportunities connected through affiliated organizations.",
    types: ["opportunity"],
  },
];

function typeLabel(type: ScientificGraphNodeType) {
  const labels: Record<ScientificGraphNodeType, string> = {
    researcher: "Researcher",
    publication: "Publication",
    topic: "Topic",
    method: "Method",
    laboratory: "Laboratory",
    institution: "Institution",
    opportunity: "Opportunity",
  };
  return labels[type];
}

function evidenceLabel(node: ScientificGraphNode) {
  const labels = {
    verified: "Verified",
    corroborated: "Corroborated",
    "source-backed": "Source-backed",
    asserted: "Asserted",
  } as const;
  return labels[node.evidence.level];
}

function edgeTargetLabel(edge: ScientificGraphEdge, nodes: Map<string, ScientificGraphNode>) {
  const source = nodes.get(edge.source)?.label ?? edge.source;
  const target = nodes.get(edge.target)?.label ?? edge.target;
  return { source, target };
}

export function ScientificGraphExplorer({ researcherId }: { researcherId?: string }) {
  const [data, setData] = useState<ScientificGraphNeighborhoodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<ScientificGraphNodeType | "all">("all");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (researcherId) params.set("researcher", researcherId);

    void fetch("/api/v1/graph" + (params.size ? "?" + params.toString() : ""), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as GraphApiResponse;
        if (!response.ok || !body.success) {
          throw new Error(body.success ? "Scientific graph request failed." : body.error.message);
        }
        return body.data;
      })
      .then((graph) => {
        if (!controller.signal.aborted) setData(graph);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Scientific graph request failed.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [researcherId]);

  const nodesById = useMemo(
    () => new Map((data?.nodes ?? []).map((node) => [node.id, node])),
    [data],
  );
  const researcher = data?.nodes.find((node) => node.type === "researcher");

  if (loading) {
    return (
      <div className={styles.loadingShell}>
        <div className={styles.loadingHero} />
        <div className={styles.loadingGrid}>
          <div /><div /><div /><div />
        </div>
      </div>
    );
  }

  if (error || !data || !researcher) {
    return (
      <section className={styles.errorState}>
        <span className="sectionLabel">Graph unavailable</span>
        <h2>Scientific relationships could not be loaded.</h2>
        <p>{error ?? "No researcher graph is available for this identity."}</p>
        <Link className="primaryButton" href="/discover">Open Scientific Discovery</Link>
      </section>
    );
  }

  const visibleEdges = activeType === "all"
    ? data.edges
    : data.edges.filter((edge) => {
        const sourceType = nodesById.get(edge.source)?.type;
        const targetType = nodesById.get(edge.target)?.type;
        return sourceType === activeType || targetType === activeType;
      });

  return (
    <>
      <section className={styles.graphSummary}>
        <div className={styles.summaryIntro}>
          <span className="sectionLabel">Derived neighborhood</span>
          <h2>{researcher.label}</h2>
          <p>{researcher.subtitle}</p>
          <div className={styles.researcherEvidence}>
            <span>{evidenceLabel(researcher)}</span>
            <strong>{researcher.evidence.source}</strong>
          </div>
        </div>

        <div className={styles.countGrid}>
          {(["institution", "laboratory", "topic", "method", "publication", "opportunity"] as ScientificGraphNodeType[]).map((type) => (
            <button
              className={activeType === type ? styles.countCardActive : styles.countCard}
              key={type}
              onClick={() => setActiveType(activeType === type ? "all" : type)}
              type="button"
            >
              <strong>{data.counts[type]}</strong>
              <span>{typeLabel(type)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.graphCanvas}>
        <div className={styles.graphRoot}>
          <span className={styles.rootType}>Researcher</span>
          <strong>{researcher.label}</strong>
          <small>{researcher.subtitle}</small>
        </div>
        <div className={styles.connectionStem} aria-hidden="true" />

        <div className={styles.laneGrid}>
          {groupConfig.map((group) => {
            const groupNodes = data.nodes.filter((node) => group.types.includes(node.type));
            return (
              <section className={styles.lane} key={group.key}>
                <header>
                  <span>{group.title}</span>
                  <strong>{groupNodes.length}</strong>
                </header>
                <p>{group.description}</p>
                <div className={styles.nodeStack}>
                  {groupNodes.length ? groupNodes.map((node) => (
                    <article
                      className={activeType === "all" || activeType === node.type ? styles.nodeCard : styles.nodeCardMuted}
                      key={node.id}
                    >
                      <div className={styles.nodeTopline}>
                        <span>{typeLabel(node.type)}</span>
                        <span className={styles["evidence_" + node.evidence.level]}>{evidenceLabel(node)}</span>
                      </div>
                      <h3>{node.label}</h3>
                      {node.subtitle ? <p>{node.subtitle}</p> : null}
                      <footer>
                        <span>{node.evidence.source}</span>
                        {node.href ? (
                          node.href.startsWith("/") ? (
                            <Link href={node.href}>Open ↗</Link>
                          ) : (
                            <a href={node.href} rel="noreferrer" target="_blank">Source ↗</a>
                          )
                        ) : null}
                      </footer>
                    </article>
                  )) : (
                    <div className={styles.emptyLane}>No canonical nodes in this lane yet.</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className={styles.edgeSection}>
        <div className={styles.edgeHeading}>
          <div>
            <span className="sectionLabel">Relationship ledger</span>
            <h2>{visibleEdges.length} explainable edges</h2>
            <p>Every edge is derived from canonical product data; no separate graph copy or hidden graph score is used.</p>
          </div>
          <button className={styles.resetFilter} disabled={activeType === "all"} onClick={() => setActiveType("all")} type="button">
            Clear relation filter
          </button>
        </div>

        <div className={styles.edgeTable}>
          <div className={styles.edgeTableHeader}>
            <span>Source</span>
            <span>Relationship</span>
            <span>Target</span>
            <span>Evidence</span>
          </div>
          {visibleEdges.slice(0, 80).map((edge) => {
            const labels = edgeTargetLabel(edge, nodesById);
            return (
              <div className={styles.edgeRow} key={edge.id}>
                <span>{labels.source}</span>
                <strong>{edge.label}</strong>
                <span>{labels.target}</span>
                <span className={styles.edgeEvidence}>
                  <b>{edge.evidence.level.replace("-", " ")}</b>
                  <small>{edge.evidence.source}</small>
                </span>
              </div>
            );
          })}
        </div>

        <div className={styles.graphFootnote}>
          <span>Generated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))}</span>
          <span>Cap {data.limits.nodes} nodes · {data.limits.edges} edges</span>
          {data.truncated ? <strong>Graph was capped to preserve explainability.</strong> : <span>Neighborhood is within explainability limits.</span>}
        </div>
      </section>
    </>
  );
}
