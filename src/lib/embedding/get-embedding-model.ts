import { serverEnv } from "@/data/serverEnv"
import { createOpenAI, openai } from "@ai-sdk/openai"

const QWEN_MODEL = "text-embedding-qwen3-embedding-0.6b"
const OPENAI_MODEL = "text-embedding-3-small"

export function getEmbeddingModel() {
  if (serverEnv.EMBEDDING_PROVIDER === "qwen") {
    const provider = createOpenAI({
      apiKey: "not-needed",
      baseURL: serverEnv.LOCAL_EMBEDDING_BASE_URL,
    })
    return provider.embedding(QWEN_MODEL)
  } else {
    return openai.embedding(OPENAI_MODEL)
  }
}
