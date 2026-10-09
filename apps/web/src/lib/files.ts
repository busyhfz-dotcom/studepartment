export const FILE_MAX_BYTES = 20 * 1024 * 1024;
export const FILE_QUOTA_BYTES = 250 * 1024 * 1024;
export const FILE_MAX_COUNT = 100;
export const FILE_ACCEPT = ".pdf,.docx,.xlsx,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.gif";
export const FILE_CATEGORIES = {
  cv: "CV / résumé",
  education: "Education & training",
  certificate: "Certificate / accreditation",
  publication: "Publication / manuscript",
  portfolio: "Project / portfolio",
  proposal: "Research / grant proposal",
  application: "Application / cover letter",
  organization: "Organization document",
  other: "Other document",
} as const;
export type FileCategory = keyof typeof FILE_CATEGORIES;
export type FileScope = "profile" | "organization" | "application" | "library";
export type FileRecord = {
  id: string;
  name: string;
  mediaType: string;
  size: number;
  category: FileCategory;
  scope: FileScope;
  contextId: string | null;
  public: boolean;
  createdAt: string;
  url: string;
};
export type FileLibrary = {
  files: FileRecord[];
  usage: { bytes: number; count: number; maxBytes: number; maxCount: number };
};
export function uploadedFileId(value: unknown): string | null {
  return typeof value === "string" ? value.match(/^\/api\/v1\/files\/([a-zA-Z0-9-]{20,80})$/)?.[1] ?? null : null;
}
export function fileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.ceil(bytes / 1024)) + " KB";
}
