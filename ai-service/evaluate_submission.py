#!/usr/bin/env python3
"""
AiCademy Production-Ready Submission Evaluator (Inside ai-service)
==================================================================
1. `pypdf` for robust, zero-dependency multi-page document extraction.
2. `duckduckgo-search` (DDGS) for live academic benchmark web lookup.
3. `groq` (Llama 3.1/3.3) for intelligent, differential rubric evaluation and mistake analysis.
"""

from scripts.evaluate_submission import evaluate_submission_pipeline, main

if __name__ == "__main__":
    main()
