import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | undefined;
function config() {
  const endpoint = process.env.FILE_STORAGE_ENDPOINT;
  const bucket = process.env.FILE_STORAGE_BUCKET;
  const accessKeyId = process.env.FILE_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.FILE_STORAGE_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Railway file storage is not configured.");
  client ??= new S3Client({
    endpoint,
    region: process.env.FILE_STORAGE_REGION || "auto",
    forcePathStyle: process.env.FILE_STORAGE_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
    maxAttempts: 3,
    requestHandler: { connectionTimeout: 5000, requestTimeout: 60000 },
  });
  return { client, bucket };
}
export async function putFileObject(key: string, data: Buffer, mediaType: string) {
  const { client, bucket } = config();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: mediaType }));
}
export async function getFileObject(key: string, range?: string) {
  const { client, bucket } = config();
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: range }));
}
export async function deleteFileObject(key: string) {
  const { client, bucket } = config();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
