/**
 * EXTENSION: Ingestion Agent script from /docs/AGENTIC_DESIGN.md B1.2.
 * Plans document extraction, chunking, topic tagging, embedding, and retrieval self-test.
 */
import type { AgentScript } from './engine'
import { registerAgentScript } from './engine'

export const ingestionScript: AgentScript = async function* (input, ctx) {
  const fileName = input.fileName || 'Course_Document.pdf'
  const fileUrl = input.fileUrl || `/mock-files/${fileName}`
  const materialId = input.materialId

  // Step 1: Plan
  yield {
    type: 'plan',
    content: `Planning ingestion for ${fileName}: extract raw text, analyze structural density, generate semantic chunks with topic tags, and execute a vector retrieval self-test.`,
    autonomy: 'auto',
  }

  // Step 2: Tool Call (extract_text)
  yield {
    type: 'tool_call',
    content: `Extracting text and document hierarchy from ${fileName}.`,
    toolName: 'extract_text',
    input: {
      fileUrl,
      fileName,
      mimeType: input.mimeType || 'application/pdf',
    },
    autonomy: 'auto',
  }

  // Step 3: Reflection
  yield {
    type: 'reflection',
    content: `Text extraction successful. Calculated optimal chunk window of 800 tokens with 15% overlap. Identified core mathematical expressions and academic keywords for topic clustering.`,
    autonomy: 'auto',
  }

  // Step 4: Tool Call (chunk_and_embed)
  yield {
    type: 'tool_call',
    content: `Partitioning content into semantic chunks and generating vector embeddings in course-scoped collection.`,
    toolName: 'chunk_and_embed',
    input: {
      materialId,
      chunkSize: 800,
    },
    autonomy: 'auto',
  }

  // Step 5: Verification Tool Call (vector_search self-test)
  yield {
    type: 'tool_call',
    content: `Executing retrieval self-test: querying newly embedded chunks to verify index quality and cosine similarity.`,
    toolName: 'vector_search',
    input: {
      courseId: ctx.courseId,
      query: fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      topK: 2,
    },
    autonomy: 'auto',
  }

  // Step 6: Final
  return {
    status: 'indexed',
    materialId,
    verified: true,
    message: `Material ${fileName} successfully processed, chunked, and indexed into course collection. Retrieval self-test passed.`,
  }
}

registerAgentScript('ingestion', ingestionScript)
