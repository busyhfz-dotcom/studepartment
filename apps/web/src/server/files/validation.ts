import sharp from "sharp";
import { unzipSync } from "fflate";
import { FILE_MAX_BYTES } from "@/lib/files";

export class FileError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}
export function cleanFileName(name: string) {
  const cleaned = name.normalize("NFC").replace(/[\x00-\x1f\x7f/\\\u202a-\u202e\u2066-\u2069]/g, "_").trim().slice(0, 180);
  return cleaned || "document";
}
export async function readUpload(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data;")) throw new FileError("Choose a file to upload.");
  if (Number(request.headers.get("content-length")) > FILE_MAX_BYTES + 65536) throw new FileError("Choose a file smaller than 20 MB.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new FileError("Choose a file to upload.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > FILE_MAX_BYTES + 65536) { await reader.cancel(); throw new FileError("Choose a file smaller than 20 MB.", 413); }
    chunks.push(chunk.value);
  }
  try {
    return await new Response(Buffer.concat(chunks), { headers: { "Content-Type": contentType } }).formData();
  } catch (error) {
    console.warn("Multipart upload could not be parsed", { bytes: size, error: error instanceof Error ? error.message : "Invalid form" });
    throw new FileError("The upload was incomplete. Please choose the file again.");
  }
}
export async function validateFile(file: File) {
  if (!file.size || file.size > FILE_MAX_BYTES) throw new FileError("Choose a non-empty file smaller than 20 MB.", 413);
  let name = cleanFileName(file.name);
  const extension = name.split(".").at(-1)?.toLowerCase() ?? "";
  let data = Buffer.from(await file.arrayBuffer());
  let mediaType: string;
  if (["jpg", "jpeg", "png", "webp", "heic", "heif", "avif", "gif"].includes(extension)) {
    try {
      const image = sharp(data, { limitInputPixels: 40_000_000, animated: false });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp", "heif", "avif", "gif"].includes(metadata.format ?? "")) throw new Error("format");
      data = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
      name = name.replace(/\.[^.]+$/, "") + ".webp";
      mediaType = "image/webp";
    } catch { throw new FileError("This image cannot be read. Try JPG, PNG or WebP."); }
  } else if (extension === "pdf") {
    if (data.subarray(0, 5).toString() !== "%PDF-" || !data.subarray(-2048).includes(Buffer.from("%%EOF"))) throw new FileError("This file is not a readable PDF.");
    mediaType = "application/pdf";
  } else if (["docx", "xlsx", "pptx"].includes(extension)) {
    const root = { docx: "word/document.xml", xlsx: "xl/workbook.xml", pptx: "ppt/presentation.xml" }[extension as "docx" | "xlsx" | "pptx"];
    try {
      let total = 0, count = 0;
      const entries = new Set<string>();
      const selected = unzipSync(data, { filter: (entry) => {
        total += entry.originalSize;
        count++;
        if (count > 5000 || total > 100 * 1024 * 1024 || entry.originalSize > 25 * 1024 * 1024 || /vbaProject\.bin$|(^|\/)\.\.(\/|$)/i.test(entry.name)) throw new Error("unsafe archive");
        entries.add(entry.name);
        return entry.name === "[Content_Types].xml";
      } });
      const types = selected["[Content_Types].xml"];
      if (!entries.has(root) || !types || /macroEnabled|vbaProject/i.test(new TextDecoder().decode(types))) throw new Error("invalid Office document");
    } catch { throw new FileError("Choose a valid DOCX, XLSX or PPTX document without macros (maximum 100 MB expanded)."); }
    mediaType = { docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }[extension as "docx" | "xlsx" | "pptx"];
  } else if (["txt", "csv"].includes(extension)) {
    try { const text = new TextDecoder("utf-8", { fatal: true }).decode(data); if (text.includes("\0")) throw new Error("binary"); }
    catch { throw new FileError("Text and CSV files must contain UTF-8 text."); }
    mediaType = extension === "csv" ? "text/csv" : "text/plain";
  } else throw new FileError("Supported: PDF, DOCX, XLSX, PPTX, TXT, CSV and photos. Save older Office documents in a modern format first.");
  if (data.length > FILE_MAX_BYTES) throw new FileError("The processed file exceeds 20 MB.", 413);
  return { data, name, mediaType };
}
