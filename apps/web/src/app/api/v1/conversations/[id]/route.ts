import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@studepartment/db";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { assertFileOrigin } from "@/server/files/http";
import { FileError } from "@/server/files/validation";
import { consumeClientRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const MAX_MESSAGE_LENGTH = 4000;
const PAGE_SIZE = 60;

class ConversationError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
  }
}

function failure(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers: PRIVATE_HEADERS });
}

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
  if (error instanceof AuthenticationRequiredError) return failure("AUTHENTICATION_REQUIRED", "Sign in to open this conversation.", 401);
  if (error instanceof FileError) return failure("INVALID_ORIGIN", "Send messages from Provenant.", error.status);
  if (error instanceof ConversationError) return failure(error.code, error.message, error.status);
  if (error instanceof SyntaxError) return failure("INVALID_MESSAGE", "The message could not be read.", 400);
  console.error("Private conversation failed", error instanceof Error ? error.name : "UnknownError");
  return failure("CONVERSATION_FAILED", fallback, 500);
}

/**
 * Only the two account holders behind an ACCEPTED introduction may read or write.
 * Anyone else, including the other side of a pending/declined/withdrawn request,
 * gets the same 404 so a conversation's existence is never revealed.
 */
async function requireParticipant(requestId: string) {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(requestId)) {
    throw new ConversationError("CONVERSATION_NOT_FOUND", "Conversation unavailable.", 404);
  }
  const user = await requireCurrentUser();
  const db = getDb();
  const thread = await db.connectionRequest.findFirst({
    where: {
      id: requestId,
      status: "ACCEPTED",
      OR: [{ sender: { userId: user.id } }, { receiver: { userId: user.id } }],
    },
    select: {
      id: true,
      sender: { select: { userId: true, fullName: true } },
      receiver: { select: { userId: true, fullName: true } },
    },
  });
  if (!thread) throw new ConversationError("CONVERSATION_NOT_FOUND", "Conversation unavailable.", 404);
  const counterpart = thread.sender.userId === user.id ? thread.receiver : thread.sender;
  return { user, db, thread, counterpart };
}

async function pauseState(db: ReturnType<typeof getDb>, requestId: string, userId: string) {
  const states = await db.conversationState.findMany({
    where: { requestId, blockedAt: { not: null } },
    select: { userId: true },
  });
  return {
    pausedByMe: states.some((state) => state.userId === userId),
    pausedByOther: states.some((state) => state.userId !== userId),
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db, counterpart } = await requireParticipant(id);
    await db.conversationState.upsert({
      where: { requestId_userId: { requestId: id, userId: user.id } },
      create: { requestId: id, userId: user.id, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
    const [messages, pause] = await Promise.all([
      db.privateMessage.findMany({
        where: { requestId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE,
        select: { id: true, senderId: true, body: true, createdAt: true },
      }),
      pauseState(db, id, user.id),
    ]);
    return NextResponse.json(
      {
        success: true,
        data: {
          messages: messages.reverse().map(({ senderId, ...message }) => ({ ...message, mine: senderId === user.id })),
          counterpartName: counterpart.fullName,
          blocked: pause.pausedByMe || pause.pausedByOther,
          ...pause,
        },
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    return errorResponse(error, "Unable to load conversation.");
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await consumeClientRateLimit(request, "conversation:message", { windowSeconds: 60, max: 30 });
    assertFileOrigin(request);
    const { id } = await params;
    const { user, db } = await requireParticipant(id);

    const input = (await request.json()) as Record<string, unknown>;
    const body = typeof input.body === "string" ? input.body.trim() : "";
    const clientId = typeof input.clientId === "string" ? input.clientId : "";
    if (!body || body.length > MAX_MESSAGE_LENGTH || !/^[\w-]{8,80}$/.test(clientId)) {
      return failure("INVALID_MESSAGE", "Write a message under 4,000 characters.", 400);
    }

    const pause = await pauseState(db, id, user.id);
    if (pause.pausedByMe) return failure("CONVERSATION_PAUSED", "You paused this conversation. Resume it before sending.", 409);
    if (pause.pausedByOther) return failure("CONVERSATION_PAUSED", "The other researcher has paused this conversation.", 409);

    // clientId makes retries idempotent: a resent message is stored once.
    const message = await db.privateMessage.upsert({
      where: { requestId_senderId_clientId: { requestId: id, senderId: user.id, clientId } },
      create: { requestId: id, senderId: user.id, clientId, body },
      update: {},
      select: { id: true, body: true, createdAt: true },
    });
    await db.connectionRequest.update({ where: { id }, data: { updatedAt: new Date() } });
    return NextResponse.json({ success: true, data: { ...message, mine: true } }, { status: 201, headers: PRIVATE_HEADERS });
  } catch (error) {
    return errorResponse(error, "Unable to send message.");
  }
}

/** Toggles the caller's own pause. Only the person who paused can resume. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await consumeClientRateLimit(request, "conversation:pause", { windowSeconds: 60, max: 20 });
    assertFileOrigin(request);
    const { id } = await params;
    const { user, db } = await requireParticipant(id);
    const previous = await db.conversationState.findUnique({
      where: { requestId_userId: { requestId: id, userId: user.id } },
      select: { blockedAt: true },
    });
    const pausedByMe = !previous?.blockedAt;
    await db.conversationState.upsert({
      where: { requestId_userId: { requestId: id, userId: user.id } },
      create: { requestId: id, userId: user.id, blockedAt: pausedByMe ? new Date() : null },
      update: { blockedAt: pausedByMe ? new Date() : null },
    });
    const pause = await pauseState(db, id, user.id);
    return NextResponse.json(
      { success: true, data: { ...pause, blocked: pause.pausedByMe || pause.pausedByOther } },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    return errorResponse(error, "Unable to update conversation.");
  }
}
