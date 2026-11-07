import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import { generateGeminiResearchAnswer } from "../src/server/assistant/gemini-provider";
import { assistantDailyRequestLimit, researchAssistantProvider } from "../src/server/assistant/provider";
import { groundedCitationIds } from "../src/server/assistant/grounding";
import { answerResearchQuestion } from "../src/server/assistant/research-assistant";
import { runtime } from "./fixtures/assistant-runtime";

const envNames = ["GEMINI_API_KEY", "GEMINI_ASSISTANT_MODEL", "OPENAI_API_KEY", "ASSISTANT_DAILY_REQUEST_LIMIT"];
let previous: Record<string, string | undefined>;
let restoreFetch: typeof fetch;
let requests: Array<{ url: string; init?: RequestInit }>;
const sources = [...runtime.publicSources];
let upstream: () => Response | Promise<Response>;
beforeEach(() => {
  previous = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  for (const name of envNames) delete process.env[name];
  process.env.GEMINI_API_KEY = "synthetic-test-key-never-valid";
  restoreFetch = globalThis.fetch;
  requests = [];
  runtime.limits.length = 0;
  runtime.quotaExceeded = false;
  runtime.publicSources = [...sources];
  upstream = () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "A documented synthetic fellowship [S2]." }] } }] });
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return upstream();
  };
});
afterEach(() => {
  globalThis.fetch = restoreFetch;
  for (const name of envNames) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});

test("Gemini has priority, without silently switching provider", () => {
  process.env.OPENAI_API_KEY = "synthetic-openai-key";
  assert.equal(researchAssistantProvider(), "gemini");
  delete process.env.GEMINI_API_KEY;
  assert.equal(researchAssistantProvider(), "openai");
  delete process.env.OPENAI_API_KEY;
  assert.equal(researchAssistantProvider(), null);
});

test("native request keeps the key out of URL/body, has no tools and bounds output", async () => {
  await generateGeminiResearchAnswer({ instructions: "Use citations", input: "Synthetic question" });
  const req = requests[0];
  assert.match(req.url, /^https:\/\/generativelanguage.googleapis.com\/v1beta\/models\/gemini-3.1-flash-lite:generateContent$/);
  assert.equal(req.init?.cache, "no-store");
  assert.equal(new Headers(req.init?.headers).get("x-goog-api-key"), process.env.GEMINI_API_KEY);
  assert.ok(!req.url.includes(process.env.GEMINI_API_KEY!));
  const body = JSON.parse(String(req.init?.body));
  assert.ok(!String(req.init?.body).includes(process.env.GEMINI_API_KEY!));
  assert.equal(body.generationConfig.maxOutputTokens, 1800);
  assert.equal(body.systemInstruction.parts[0].text, "Use citations");
  assert.equal(body.tools, undefined);
  assert.equal(body.contents[0].parts[0].text, "Synthetic question");
});

test("invalid model configuration cannot change the upstream destination", async () => {
  process.env.GEMINI_ASSISTANT_MODEL = "../../example.invalid?key=other";
  await assert.rejects(generateGeminiResearchAnswer({ instructions: "x", input: "x" }), /model is invalid/);
  assert.equal(requests.length, 0);
});

test("thought parts never become the user-visible answer", async () => {
  upstream = () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ thought: true, text: "PRIVATE REASONING" }, { text: "Answer [S2]" }] } }] });
  assert.equal((await generateGeminiResearchAnswer({ instructions: "x", input: "x" })).answer, "Answer [S2]");
});

test("partial, safety-blocked and empty candidates are rejected", async () => {
  for (const candidate of [ { finishReason: "MAX_TOKENS", content: { parts: [{ text: "Partial [S2]" }] } }, { finishReason: "SAFETY" }, { finishReason: "STOP", content: { parts: [] } } ]) {
    upstream = () => Response.json({ candidates: [candidate] });
    await assert.rejects(generateGeminiResearchAnswer({ instructions: "x", input: "x" }));
  }
});

test("quota and transport failures do not leak credentials or error bodies or retry", async () => {
  upstream = () => new Response("sensitive provider body", { status: 429 });
  await assert.rejects(generateGeminiResearchAnswer({ instructions: "x", input: "x" }), (error: Error) => !error.message.includes("sensitive") && /limit/.test(error.message));
  assert.equal(requests.length, 1);
  upstream = () => { throw new Error("sensitive network details"); };
  await assert.rejects(generateGeminiResearchAnswer({ instructions: "x", input: "x" }), (error: Error) => error.message === "Gemini is temporarily unavailable.");
});

test("daily cap has a default and fails closed for invalid configuration", () => {
  assert.equal(assistantDailyRequestLimit(), 50);
  for (const value of ["0", "-1", "1.5", "5000", "wrong"]) {
    process.env.ASSISTANT_DAILY_REQUEST_LIMIT = value;
    assert.equal(assistantDailyRequestLimit(), 0);
  }
  process.env.ASSISTANT_DAILY_REQUEST_LIMIT = "25";
  assert.equal(assistantDailyRequestLimit(), 25);
});

test("consent is required on the server and must be boolean true", async () => {
  for (const consent of [undefined, false, "true"]) {
    const result = await answerResearchQuestion({ question: "Review synthetic molecular fellowships", allowExternalAI: consent as boolean }, "synthetic-user");
    assert.equal(result.mode, "evidence-review");
  }
  assert.equal(requests.length, 0);
  assert.equal(runtime.limits.length, 0);
});

test("consented answers send only public sources, then show the referenced source", async () => {
  const result = await answerResearchQuestion({ question: "Review synthetic molecular fellowships", allowExternalAI: true }, "synthetic-user");
  assert.equal(result.mode, "ai-analysis");
  assert.deepEqual(result.referencedCitationIds, ["S2"]);
  const body = String(requests[0].init?.body);
  assert.ok(!body.includes("PRIVATE TEST"));
  assert.ok(!body.includes("https://example.org"));
  assert.equal(runtime.limits.length, 3);
  assert.deepEqual(runtime.limits.map((r) => r.max), [5, 50, 20]);
  assert.match(runtime.limits[1].subject, /^\d{4}-\d{2}-\d{2}$/);
});

test("no public sources, no key, kill switch and exhausted quota never call a provider", async () => {
  const input = { question: "Review synthetic molecular fellowships", allowExternalAI: true };
  runtime.publicSources = [];
  assert.equal((await answerResearchQuestion(input, "synthetic-user")).mode, "evidence-review");
  runtime.publicSources = [...sources];
  process.env.ASSISTANT_DAILY_REQUEST_LIMIT = "0";
  assert.equal((await answerResearchQuestion(input, "synthetic-user")).mode, "evidence-review");
  delete process.env.ASSISTANT_DAILY_REQUEST_LIMIT;
  runtime.quotaExceeded = true;
  assert.equal((await answerResearchQuestion(input, "synthetic-user")).mode, "evidence-review");
  delete process.env.GEMINI_API_KEY;
  assert.equal((await answerResearchQuestion(input, "synthetic-user")).mode, "evidence-review");
  assert.equal(requests.length, 0);
});

test("upstream failures and invented citations yield labelled evidence review", async () => {
  const input = { question: "Review synthetic molecular fellowships", allowExternalAI: true };
  for (const response of [new Response("provider error", { status: 503 }), Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Invented [S2] and [S99]." }] } }] })]) {
    upstream = () => response;
    assert.equal((await answerResearchQuestion(input, "synthetic-user")).mode, "evidence-review");
  }
  assert.equal(requests.length, 2);
});

test("grounding requires real references and rejects a mixture with invented ones", () => {
  assert.deepEqual(groundedCitationIds("Answer [S2] and [S2]", sources), ["S2"]);
  assert.deepEqual(groundedCitationIds("Answer [S2] and [S999]", sources), []);
  assert.deepEqual(groundedCitationIds("Uncited claim", sources), []);
});
