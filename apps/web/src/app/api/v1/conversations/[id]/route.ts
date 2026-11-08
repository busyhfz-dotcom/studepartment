import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@studepartment/db";
import { requireCurrentUser } from "@/server/auth/current-user";
import { consumeClientRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";
import { assertFileOrigin } from "@/server/files/http";

export const dynamic = "force-dynamic";
async function participant(requestId: string) {
  const user = await requireCurrentUser();
  const db = getDb();
  const thread = await db.connectionRequest.findFirst({ where: { id: requestId, status: "ACCEPTED", OR: [{ sender: { userId: user.id } }, { receiver: { userId: user.id } }] }, select: { id: true } });
  if (!thread) return null;
  return { user, db, thread };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const auth = await participant(id);
    if (!auth) return NextResponse.json({ success: false, error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation unavailable." } }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    const state = await auth.db.conversationState.upsert({ where: { requestId_userId: { requestId: id, userId: auth.user.id } }, create: { requestId: id, userId: auth.user.id, lastReadAt: new Date() }, update: { lastReadAt: new Date() } });
    const messages = await auth.db.privateMessage.findMany({ where: { requestId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 60, include: { sender: { select: { id: true, name: true } } } });
    return NextResponse.json({ success: true, data: { messages: messages.reverse().map(({id,senderId,body,createdAt,sender})=>({id,senderId,body,createdAt,senderName:sender.name})), blocked: Boolean(state.blockedAt), userId: auth.user.id } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error); return NextResponse.json({success:false,error:{code:"CONVERSATION_FAILED",message:"Unable to load conversation."}},{status:500}); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await consumeClientRateLimit(request, "conversation:message", { windowSeconds: 60, max: 30 });
    assertFileOrigin(request); const {id}=await params; const auth=await participant(id);
    if(!auth)return NextResponse.json({success:false,error:{code:"CONVERSATION_NOT_FOUND",message:"Conversation unavailable."}},{status:404});
    const input=await request.json() as Record<string,unknown>; const body=typeof input.body==="string"?input.body.trim():""; const clientId=typeof input.clientId==="string"?input.clientId:"";
    if(!body||body.length>4000||!/^[\w-]{8,80}$/.test(clientId))return NextResponse.json({success:false,error:{code:"INVALID_MESSAGE",message:"Write a message under 4,000 characters."}},{status:400});
    const state=await auth.db.conversationState.findUnique({where:{requestId_userId:{requestId:id,userId:auth.user.id}}});
    const eitherPaused=await auth.db.conversationState.findFirst({where:{requestId:id,blockedAt:{not:null}}});
    if(eitherPaused)return NextResponse.json({success:false,error:{code:"CONVERSATION_PAUSED",message:"This conversation is paused. Resume it before sending."}},{status:409});
    const message=await auth.db.privateMessage.upsert({where:{requestId_senderId_clientId:{requestId:id,senderId:auth.user.id,clientId}},create:{requestId:id,senderId:auth.user.id,clientId,body},update:{},select:{id:true,senderId:true,body:true,createdAt:true}});
    await auth.db.connectionRequest.update({where:{id},data:{updatedAt:new Date()}});
    return NextResponse.json({success:true,data:message},{status:201,headers:{"Cache-Control":"private, no-store"}});
  }catch(error){if(error instanceof RateLimitExceededError)return rateLimitErrorResponse(error);return NextResponse.json({success:false,error:{code:"CONVERSATION_FAILED",message:"Unable to send message."}},{status:500});}
}

export async function PATCH(request: NextRequest,{params}:{params:Promise<{id:string}>}){
  try{assertFileOrigin(request);const{ id }=await params;const auth=await participant(id);if(!auth)return NextResponse.json({success:false,error:{code:"CONVERSATION_NOT_FOUND",message:"Conversation unavailable."}},{status:404});const previous=await auth.db.conversationState.findUnique({where:{requestId_userId:{requestId:id,userId:auth.user.id}}});const wasBlocked=Boolean(previous?.blockedAt);await auth.db.conversationState.upsert({where:{requestId_userId:{requestId:id,userId:auth.user.id}},create:{requestId:id,userId:auth.user.id,blockedAt:new Date()},update:{blockedAt:wasBlocked?null:new Date()}});return NextResponse.json({success:true,data:{blocked:!wasBlocked}},{headers:{"Cache-Control":"private, no-store"}});}catch{return NextResponse.json({success:false,error:{code:"CONVERSATION_FAILED",message:"Unable to update conversation."}},{status:500});}
}

