import type { getDb } from "../src/client";
import { cancerResearchCenters } from "./seed-data/cancer-research-centers";

type Db = ReturnType<typeof getDb>;

// Organizations that already exist under a fixed id elsewhere in the seed data
// (or from earlier seed runs) — reuse those ids so we upsert instead of duplicating.
const ORG_ID_OVERRIDES: Record<string, string> = {
  "University of Oxford": "org-oxford",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function orgId(university: string) {
  return ORG_ID_OVERRIDES[university] ?? `org-${slugify(university)}`;
}

function labId(university: string, center: string) {
  return `lab-${slugify(`${university}-${center}`)}`.slice(0, 190);
}

export async function seedCancerResearchCenters(db: Db) {
  const organizations = new Map<string, { name: string; countryCode: string; website: string }>();
  for (const entry of cancerResearchCenters) {
    const id = orgId(entry.university);
    if (!organizations.has(id)) {
      organizations.set(id, {
        name: entry.university,
        countryCode: entry.countryCode,
        website: entry.universityWebsite,
      });
    }
  }

  for (const [id, org] of organizations) {
    await db.organization.upsert({
      where: { id },
      update: {
        website: org.website,
        countryCode: org.countryCode,
      },
      create: {
        id,
        name: org.name,
        normalizedName: org.name.toLocaleLowerCase("en"),
        type: "UNIVERSITY",
        countryCode: org.countryCode,
        website: org.website,
        verified: true,
        description: "Cancer research center data sourced from QS World University Rankings 2026 cross-reference (Sep 2026).",
      },
    });
  }

  for (const entry of cancerResearchCenters) {
    const organizationId = orgId(entry.university);
    const id = labId(entry.university, entry.center);
    const descriptionParts = [
      entry.qsRank ? `QS World University Ranking: ${entry.qsRank}` : null,
      `Source list phase: ${entry.phase}`,
      entry.director ? `Leadership: ${entry.director}` : null,
    ].filter(Boolean);

    await db.laboratory.upsert({
      where: { id },
      update: {
        name: entry.center,
        website: entry.centerWebsite,
        description: descriptionParts.join(" · "),
      },
      create: {
        id,
        organizationId,
        name: entry.center,
        website: entry.centerWebsite,
        description: descriptionParts.join(" · "),
        verified: true,
      },
    });
  }

  return {
    organizations: organizations.size,
    laboratories: cancerResearchCenters.length,
  };
}
