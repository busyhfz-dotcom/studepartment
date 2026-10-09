export function isUploadedProfileImage(value: string) {
  return /^\/api\/v1\/profile-images\/[a-zA-Z0-9-]{20,80}$/.test(value);
}
