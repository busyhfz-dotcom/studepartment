import "server-only";
import { randomUUID } from "node:crypto";
import { getDb, type Prisma } from "@studepartment/db";
import { FILE_CATEGORIES, FILE_MAX_COUNT, FILE_QUOTA_BYTES, uploadedFileId, type FileCategory, type FileScope, type FileRecord } from "@/lib/files";
import { putFileObject, deleteFileObject } from "./storage";
import { FileError, validateFile } from "./validation";

type StoredRow = { id: string; name: string; size: number; mediaType: string; category: string; scope: string; contextId: string | null; public: boolean; createdAt: Date };
export function fileRecord(file: StoredRow): FileRecord {
  return { id: file.id, name: file.name, size: file.size, mediaType: file.mediaType, category: file.category as FileCategory, scope: file.scope as FileScope, contextId: file.contextId, public: file.public, createdAt: file.createdAt.toISOString(), url: "/api/v1/files/" + file.id };
}
export async function lockFileOwner(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRawUnsafe("SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext($1))", userId);
}

// Deletes are idempotent. Jobs stay in Postgres until the bucket confirms deletion.
export async function drainFileDeletions() {
  const db = getDb();
  const stale = await db.storedFile.findMany({ where: { status: "UPLOADING", createdAt: { lt: new Date(Date.now() - 3600_000) } }, take: 50 });
  for (const file of stale) {
    await db.$transaction(async (tx) => {
      await tx.fileDeletion.upsert({ where: { storageKey: file.storageKey }, create: { storageKey: file.storageKey }, update: {} });
      await tx.storedFile.deleteMany({ where: { id: file.id, status: "UPLOADING" } });
    });
  }
  const jobs = await db.fileDeletion.findMany({ where: { createdAt: { lt: new Date(Date.now() - 120_000) } }, orderBy: { createdAt: "asc" }, take: 25 });
  await Promise.allSettled(jobs.map(async (job) => {
    await deleteFileObject(job.storageKey);
    await db.fileDeletion.deleteMany({ where: { storageKey: job.storageKey } });
  }));
}
export async function listFiles(ownerId: string, scope?: FileScope, contextId?: string) {
  const db = getDb();
  const [files, usage] = await Promise.all([
    db.storedFile.findMany({ where: { ownerId, status: "READY", ...(scope ? { scope } : {}), ...(contextId ? { contextId } : {}) }, orderBy: { createdAt: "desc" }, take: FILE_MAX_COUNT }),
    db.storedFile.aggregate({ where: { ownerId }, _count: true, _sum: { size: true } }),
  ]);
  return { files: files.map(fileRecord), usage: { bytes: usage._sum.size ?? 0, count: usage._count, maxBytes: FILE_QUOTA_BYTES, maxCount: FILE_MAX_COUNT } };
}
export async function uploadFile(ownerId: string, form: FormData) {
  const input = form.get("file");
  if (!(input instanceof File)) throw new FileError("Choose a file to upload.");
  const category = String(form.get("category") || "other");
  const scope = String(form.get("scope") || "library");
  const contextId = String(form.get("contextId") || "") || null;
  if (!Object.hasOwn(FILE_CATEGORIES, category) || !["profile", "organization", "application", "library"].includes(scope)) throw new FileError("Choose a valid document category.");
  if (contextId && !/^[A-Za-z0-9_-]{1,128}$/.test(contextId)) throw new FileError("Invalid application reference.");
  if (scope === "application" && !contextId) throw new FileError("Save an opportunity before uploading application documents.");
  if (scope !== "application" && contextId) throw new FileError("Application references are only available for application files.");
  const validated = await validateFile(input);
  const db = getDb();
  const key = "documents/" + ownerId + "/" + randomUUID();
  const file = await db.$transaction(async (tx) => {
    await lockFileOwner(tx, ownerId);
    if (scope === "application" && !await tx.savedOpportunity.findUnique({ where: { userId_opportunityId: { userId: ownerId, opportunityId: contextId! } }, select: { id: true } })) throw new FileError("This opportunity is not saved in your workspace.", 404);
    const usage = await tx.storedFile.aggregate({ where: { ownerId }, _count: true, _sum: { size: true } });
    if (usage._count >= FILE_MAX_COUNT || (usage._sum.size ?? 0) + validated.data.length > FILE_QUOTA_BYTES) throw new FileError("Your file library is full. Delete unused files to free space.", 409);
    return tx.storedFile.create({ data: { ownerId, storageKey: key, name: validated.name, mediaType: validated.mediaType, size: validated.data.length, category, scope, contextId } });
  });
  try {
    await putFileObject(key, validated.data, validated.mediaType);
    return fileRecord(await db.storedFile.update({ where: { id: file.id }, data: { status: "READY" } }));
  } catch (error) {
    await db.$transaction(async (tx) => {
      await tx.fileDeletion.upsert({ where: { storageKey: key }, create: { storageKey: key }, update: {} });
      await tx.storedFile.deleteMany({ where: { id: file.id } });
    });
    console.error("Railway document upload failed", error instanceof Error ? error.name : "StorageError");
    throw new FileError("The file could not be stored. Please try again.", 503);
  }
}
export async function deleteStoredFile(ownerId: string, id: string) {
  const db = getDb();
  const key = await db.$transaction(async (tx) => {
    await lockFileOwner(tx, ownerId);
    const file = await tx.storedFile.findFirst({ where: { id, ownerId } });
    if (!file) throw new FileError("File not found.", 404);
    await tx.fileDeletion.upsert({ where: { storageKey: file.storageKey }, create: { storageKey: file.storageKey }, update: {} });
    await tx.storedFile.delete({ where: { id } });
    return file.storageKey;
  });
  try { await deleteFileObject(key); await db.fileDeletion.deleteMany({ where: { storageKey: key } }); } catch { /* Retry from the durable queue. */ }
}
export async function updateFile(ownerId: string, id: string, input: Record<string, unknown>) {
  if (Object.keys(input).some((key) => !["public", "name", "category", "revokeShares"].includes(key))) throw new FileError("Unsupported file settings.");
  const db = getDb();
  const file = await db.storedFile.findFirst({ where: { id, ownerId, status: "READY" } });
  if (!file) throw new FileError("File not found.", 404);
  if (input.revokeShares !== undefined) {
    if (input.revokeShares !== true) throw new FileError("Invalid sharing setting.");
    await db.connectionRequestAttachment.deleteMany({ where: { fileId: file.id } });
  }
  const data: { public?: boolean; name?: string; category?: string } = {};
  if (input.public !== undefined) {
    if (typeof input.public !== "boolean") throw new FileError("Choose public or private visibility.");
    if (input.public && !["profile", "organization"].includes(file.scope)) throw new FileError("Application and library files remain private.");
    if (input.public && file.scope === "profile" && !(await db.researcherProfile.findUnique({ where: { userId: ownerId }, select: { profilePublic: true } }))?.profilePublic) throw new FileError("Make your profile public before publishing a document.");
    if (input.public && file.scope === "organization" && !await db.organization.findUnique({ where: { ownerUserId: ownerId }, select: { id: true } })) throw new FileError("Create your organization profile before publishing a document.");
    data.public = input.public;
  }
  if (input.name !== undefined) {
    if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 180 || /[\x00-\x1f\x7f/\\\u202a-\u202e\u2066-\u2069]/.test(input.name)) throw new FileError("Use a document title of 1–180 characters.");
    const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
    data.name = input.name.trim().replace(/\.[a-z0-9]+$/i, "") + extension;
  }
  if (input.category !== undefined) {
    if (typeof input.category !== "string" || !Object.hasOwn(FILE_CATEGORIES, input.category)) throw new FileError("Choose a valid category.");
    data.category = input.category;
  }
  return fileRecord(await db.storedFile.update({ where: { id }, data }));
}
export async function filesAvailableToUser(userId: string, value: unknown): Promise<boolean> {
  const ids = new Set<string>();
  function walk(item: unknown) {
    const id = uploadedFileId(item);
    if (id) ids.add(id);
    else if (Array.isArray(item)) item.forEach(walk);
    else if (item && typeof item === "object") Object.values(item).forEach(walk);
  }
  walk(value);
  return !ids.size || await getDb().storedFile.count({ where: { id: { in: [...ids] }, ownerId: userId, status: "READY", scope: "profile" } }) === ids.size;
}
export async function publicFiles(ownerId: string | null, scope: "profile" | "organization") {
  if (!ownerId) return [];
  const files = await getDb().storedFile.findMany({ where: { ownerId, scope, public: true, status: "READY" }, orderBy: { createdAt: "desc" }, take: FILE_MAX_COUNT });
  return files.map(fileRecord);
}
