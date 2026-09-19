import crypto from "node:crypto";
import pg from "pg";

const { Client } = pg;

const DIMENSIONS = 1536;
const MODEL = process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
const API_KEY = process.env.OPENAI_API_KEY?.trim();
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const BATCH_SIZE = 32;

if (!DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!API_KEY) throw new Error("OPENAI_API_KEY is required to build the discovery embedding index.");

const client = new Client({ connectionString: DATABASE_URL });

function contentHash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function embeddingId(entityType, entityId) {
  return crypto.createHash("sha256").update(`${entityType}:${entityId}:${MODEL}`).digest("hex");
}

function vectorLiteral(vector) {
  if (!Array.isArray(vector) || vector.length !== DIMENSIONS) {
    throw new Error(`Expected a ${DIMENSIONS}-dimension embedding.`);
  }
  return `[${vector.join(",")}]`;
}

async function embed(inputs) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: inputs,
      encoding_format: "float",
      dimensions: DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const payload = await response.json();
  const rows = [...(payload.data ?? [])].sort((a, b) => a.index - b.index);
  if (rows.length !== inputs.length) throw new Error("Embedding API returned an unexpected vector count.");
  return rows.map((row) => row.embedding);
}

async function loadDocuments() {
  const documents = [];

  const researchers = await client.query(`
    SELECT
      r.id AS "entityId",
      trim(concat_ws(' ',
        r."fullName",
        r.headline,
        r.bio,
        r."careerStage",
        r.city,
        r."countryCode",
        COALESCE((
          SELECT string_agg(o.name, ' ' ORDER BY o.name)
          FROM "ResearcherAffiliation" a
          JOIN "Organization" o ON o.id = a."organizationId"
          WHERE a."researcherId" = r.id AND a.current = true
        ), ''),
        COALESCE((
          SELECT string_agg(t.name || ' ' || t.slug, ' ' ORDER BY rt.weight DESC, t.name)
          FROM "ResearcherTopic" rt
          JOIN "ResearchTopic" t ON t.id = rt."topicId"
          WHERE rt."researcherId" = r.id
        ), ''),
        COALESCE((
          SELECT string_agg(m.name || ' ' || m.slug, ' ' ORDER BY m.name)
          FROM "ResearcherMethod" rm
          JOIN "ResearchMethod" m ON m.id = rm."methodId"
          WHERE rm."researcherId" = r.id
        ), '')
      )) AS content
    FROM "ResearcherProfile" r
    WHERE r."profilePublic" = true
  `);
  for (const row of researchers.rows) documents.push({ entityType: "researcher", ...row });

  const laboratories = await client.query(`
    SELECT
      l.id AS "entityId",
      trim(concat_ws(' ',
        l.name,
        l.description,
        o.name,
        o.type::text,
        o."countryCode",
        COALESCE((
          SELECT string_agg(DISTINCT t.name || ' ' || t.slug, ' ')
          FROM "LabMember" lm
          JOIN "ResearcherProfile" r ON r.id = lm."researcherId" AND r."profilePublic" = true
          JOIN "ResearcherTopic" rt ON rt."researcherId" = r.id
          JOIN "ResearchTopic" t ON t.id = rt."topicId"
          WHERE lm."laboratoryId" = l.id
        ), ''),
        COALESCE((
          SELECT string_agg(DISTINCT m.name || ' ' || m.slug, ' ')
          FROM "LabMember" lm
          JOIN "ResearcherProfile" r ON r.id = lm."researcherId" AND r."profilePublic" = true
          JOIN "ResearcherMethod" rm ON rm."researcherId" = r.id
          JOIN "ResearchMethod" m ON m.id = rm."methodId"
          WHERE lm."laboratoryId" = l.id
        ), '')
      )) AS content
    FROM "Laboratory" l
    JOIN "Organization" o ON o.id = l."organizationId"
  `);
  for (const row of laboratories.rows) documents.push({ entityType: "laboratory", ...row });

  const institutions = await client.query(`
    SELECT
      o.id AS "entityId",
      trim(concat_ws(' ',
        o.name,
        o.type::text,
        o."countryCode",
        COALESCE((SELECT string_agg(l.name, ' ' ORDER BY l.name) FROM "Laboratory" l WHERE l."organizationId" = o.id), ''),
        COALESCE((
          SELECT string_agg(DISTINCT t.name || ' ' || t.slug, ' ')
          FROM "ResearcherAffiliation" a
          JOIN "ResearcherProfile" r ON r.id = a."researcherId" AND r."profilePublic" = true
          JOIN "ResearcherTopic" rt ON rt."researcherId" = r.id
          JOIN "ResearchTopic" t ON t.id = rt."topicId"
          WHERE a."organizationId" = o.id AND a.current = true
        ), ''),
        COALESCE((
          SELECT string_agg(DISTINCT m.name || ' ' || m.slug, ' ')
          FROM "ResearcherAffiliation" a
          JOIN "ResearcherProfile" r ON r.id = a."researcherId" AND r."profilePublic" = true
          JOIN "ResearcherMethod" rm ON rm."researcherId" = r.id
          JOIN "ResearchMethod" m ON m.id = rm."methodId"
          WHERE a."organizationId" = o.id AND a.current = true
        ), '')
      )) AS content
    FROM "Organization" o
  `);
  for (const row of institutions.rows) documents.push({ entityType: "institution", ...row });

  return documents
    .map((document) => ({ ...document, content: String(document.content ?? "").replace(/\s+/g, " ").trim() }))
    .filter((document) => document.content.length > 0);
}

async function loadExistingHashes() {
  const result = await client.query(
    `SELECT "entityType", "entityId", "contentHash" FROM "DiscoveryEmbedding" WHERE model = $1`,
    [MODEL],
  );
  return new Map(result.rows.map((row) => [`${row.entityType}:${row.entityId}`, row.contentHash]));
}

async function upsertDocument(document, vector, hash) {
  await client.query(
    `
      INSERT INTO "DiscoveryEmbedding"
        (id, "entityType", "entityId", model, dimensions, "contentHash", embedding, "createdAt", "updatedAt")
      VALUES
        ($1, $2, $3, $4, $5, $6, $7::vector, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("entityType", "entityId", model)
      DO UPDATE SET
        dimensions = EXCLUDED.dimensions,
        "contentHash" = EXCLUDED."contentHash",
        embedding = EXCLUDED.embedding,
        "updatedAt" = CURRENT_TIMESTAMP
    `,
    [
      embeddingId(document.entityType, document.entityId),
      document.entityType,
      document.entityId,
      MODEL,
      DIMENSIONS,
      hash,
      vectorLiteral(vector),
    ],
  );
}

async function removeStale(documents) {
  for (const entityType of ["researcher", "laboratory", "institution"]) {
    const ids = documents.filter((document) => document.entityType === entityType).map((document) => document.entityId);
    if (ids.length) {
      await client.query(
        `DELETE FROM "DiscoveryEmbedding" WHERE "entityType" = $1 AND model = $2 AND NOT ("entityId" = ANY($3::text[]))`,
        [entityType, MODEL, ids],
      );
    } else {
      await client.query(`DELETE FROM "DiscoveryEmbedding" WHERE "entityType" = $1 AND model = $2`, [entityType, MODEL]);
    }
  }
}

async function main() {
  await client.connect();
  const documents = await loadDocuments();
  const existingHashes = await loadExistingHashes();
  const pending = documents
    .map((document) => ({ document, hash: contentHash(document.content) }))
    .filter(({ document, hash }) => existingHashes.get(`${document.entityType}:${document.entityId}`) !== hash);

  console.log(`Discovery index: ${documents.length} documents, ${pending.length} changed, model ${MODEL}.`);

  for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
    const batch = pending.slice(offset, offset + BATCH_SIZE);
    const vectors = await embed(batch.map(({ document }) => document.content));
    await client.query("BEGIN");
    try {
      for (let index = 0; index < batch.length; index += 1) {
        await upsertDocument(batch[index].document, vectors[index], batch[index].hash);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    console.log(`Indexed ${Math.min(offset + batch.length, pending.length)} / ${pending.length} changed documents.`);
  }

  await removeStale(documents);
  console.log("Discovery semantic index is current.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => undefined);
  });
