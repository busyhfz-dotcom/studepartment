import { getDb } from "@studepartment/db";
import { getCurrentUser } from "@/server/auth/current-user";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(id)) return new Response(null, { status: 404 });
  const image = await getDb().profileImage.findUnique({ where: { id }, include: { owner: { select: { image: true, researcher: { select: { profilePublic: true } }, ownedOrganization: { select: { logoUrl: true } } } } } });
  if (!image) return new Response(null, { status: 404 });
  const url = `/api/v1/profile-images/${id}`;
  const isPublic = image.owner.ownedOrganization?.logoUrl === url || (image.owner.image === url && image.owner.researcher?.profilePublic === true);
  if (!isPublic && (await getCurrentUser())?.id !== image.ownerId) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return new Response(new Uint8Array(image.data), { headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": isPublic ? "public, max-age=60, must-revalidate" : "private, no-store" } });
}
