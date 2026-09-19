import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/api-contracts";
import { AuthenticationRequiredError } from "@/server/auth/current-user";
import {
  IntroductionBlockedError,
  IntroductionForbiddenError,
  IntroductionNotFoundError,
  InvalidIntroductionError,
} from "./engine";

export function introductionErrorResponse(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    const body: ApiError = { success: false, error: { code: error.code, message: error.message } };
    return NextResponse.json(body, { status: 401 });
  }
  if (error instanceof InvalidIntroductionError) {
    const body: ApiError = { success: false, error: { code: error.code, message: error.message } };
    return NextResponse.json(body, { status: 400 });
  }
  if (error instanceof IntroductionForbiddenError) {
    const body: ApiError = { success: false, error: { code: error.code, message: error.message } };
    return NextResponse.json(body, { status: 403 });
  }
  if (error instanceof IntroductionNotFoundError) {
    const body: ApiError = { success: false, error: { code: error.code, message: error.message } };
    return NextResponse.json(body, { status: 404 });
  }
  if (error instanceof IntroductionBlockedError) {
    const body: ApiError = { success: false, error: { code: error.code, message: error.message } };
    return NextResponse.json(body, { status: 409 });
  }

  console.error("Scientific introduction request failed", error);
  const body: ApiError = {
    success: false,
    error: { code: "INTRODUCTION_FAILED", message: "Scientific introductions are temporarily unavailable." },
  };
  return NextResponse.json(body, { status: 500 });
}
