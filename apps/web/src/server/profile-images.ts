import { getDb } from "@studepartment/db";
import { isUploadedProfileImage } from "@/lib/profile-image-url";

export async function profileImageAvailableToUser(userId: string, url?: string | null) {
  if (!url || !isUploadedProfileImage(url)) return true;
  return Boolean(await getDb().profileImage.findFirst({ where: { id: url.split("/").at(-1), ownerId: userId }, select: { id: true } }));
}
