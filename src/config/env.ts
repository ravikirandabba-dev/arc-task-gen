import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_ENVIRONMENT: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_LLM_SIMULATED_LATENCY_MS: z.coerce.number().default(400),
  NEXT_PUBLIC_TTS_SIMULATED_LATENCY_MS: z.coerce.number().default(100),
  // RIME_API_KEY: z.string().optional(),
});

// We cast to process.env securely
const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  NEXT_PUBLIC_LLM_SIMULATED_LATENCY_MS: process.env.NEXT_PUBLIC_LLM_SIMULATED_LATENCY_MS,
  NEXT_PUBLIC_TTS_SIMULATED_LATENCY_MS: process.env.NEXT_PUBLIC_TTS_SIMULATED_LATENCY_MS,
});

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
