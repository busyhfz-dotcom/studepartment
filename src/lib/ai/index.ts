import { demoIntelligenceProvider } from "@/lib/ai/demo-provider";

// Provider selection is centralized so a production LLM/embedding service can be
// introduced without coupling pages or route handlers to a vendor SDK.
export const researchIntelligence = demoIntelligenceProvider;
