import { NextResponse } from "next/server";
import type { ApiSuccess, ProfileResponse } from "@/lib/api-contracts";
import { researcherRepository } from "@/server/repositories/researcher-repository";

export async function GET() {
  const profile = await researcherRepository.getCurrentProfile();
  const body: ApiSuccess<ProfileResponse> = { success: true, data: profile };
  return NextResponse.json(body);
}
