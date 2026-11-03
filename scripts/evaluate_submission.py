#!/usr/bin/env python3
"""
AiCademy Production-Ready Submission Evaluator
==============================================
Autonomous academic assessment pipeline leveraging:
1. `pypdf` for robust, zero-dependency multi-page and layout document extraction.
2. `duckduckgo-search` (DDGS) for live academic and algorithmic benchmark web lookup.
3. `groq` (Llama 3.1/3.3) for intelligent, differential rubric evaluation and mistake analysis.

Usage via CLI:
    python scripts/evaluate_submission.py --file submission.pdf --assignment "Dijkstra's Algorithm"
    python scripts/evaluate_submission.py --file solution.py --assignment "AVL Tree Rotations" --max-marks 100
"""

import os
import sys
import json
import argparse
import logging
import warnings
from typing import Dict, List, Any, Optional

# Suppress library rename notices
warnings.filterwarnings("ignore", category=RuntimeWarning)

# Load environment variables from .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv("backend/.env")
    load_dotenv("ai-service/.env")
except ImportError:
    pass

# Reconfigure stdout for safe UTF-8 printing across Windows and Linux terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("evaluator")

# ---------------------------------------------------------------------------
# 1. Document Extraction via pypdf & text decoders
# ---------------------------------------------------------------------------
def extract_document(file_path: str) -> Dict[str, Any]:
    """
    Extracts text, pages, word count, and topics from a submission file.
    Supports PDF (via pypdf layout and standard extraction), DOCX, TXT, and source code.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Submission file not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower().lstrip(".")
    pages: List[Dict[str, Any]] = []
    full_text = ""

    if ext == "pdf":
        try:
            import pypdf
        except ImportError:
            raise ImportError("pypdf is required for PDF extraction. Run: pip install pypdf")

        logger.info(f"Extracting PDF with pypdf: {file_path}")
        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            total_pages = len(reader.pages)
            page_texts = []

            for idx, page in enumerate(reader.pages):
                # Try layout extraction mode first (preserves column alignments & spaces)
                try:
                    p_text = page.extract_text(extraction_mode="layout") or ""
                except Exception:
                    p_text = ""

                # Fall back to standard extraction if layout mode yielded insufficient text
                if len(p_text.strip().split()) < 5:
                    try:
                        alt_text = page.extract_text() or ""
                        if len(alt_text.strip().split()) > len(p_text.strip().split()):
                            p_text = alt_text
                    except Exception:
                        pass

                clean_page = p_text.strip()
                if clean_page:
                    pages.append({"pageNumber": idx + 1, "text": clean_page})
                    page_texts.append(clean_page)

            full_text = "\n\n".join(page_texts).strip()
    elif ext == "docx":
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(file_path) as z:
                xml_content = z.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                paragraphs = []
                for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                    texts = [node.text for node in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if node.text]
                    if texts:
                        paragraphs.append("".join(texts))
                full_text = "\n\n".join(paragraphs).strip()
                pages.append({"pageNumber": 1, "text": full_text})
        except Exception as e:
            logger.warning(f"DOCX XML parsing fallback on {file_path}: {e}")
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read().strip()
                pages.append({"pageNumber": 1, "text": full_text})
    else:
        # Plain text, Markdown, Python, JS/TS, Java, C/C++, JSON, etc.
        logger.info(f"Reading source/text file: {file_path}")
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            full_text = f.read().strip()
            pages.append({"pageNumber": 1, "text": full_text})

    words = full_text.split()
    word_count = len(words)
    topics = extract_topics_heuristic(full_text, os.path.basename(file_path))

    logger.info(f"Extraction complete: {word_count} words across {len(pages)} page(s).")
    return {
        "text": full_text,
        "pages": pages,
        "pageCount": len(pages) if pages else 1,
        "wordCount": word_count,
        "topics": topics,
        "format": ext or "txt"
    }

def extract_topics_heuristic(text: str, file_name: str) -> List[str]:
    """Extracts dominant keywords and topics from document text."""
    if not text or len(text.strip()) < 15:
        base = os.path.splitext(file_name)[0].replace("-", " ").replace("_", " ").title()
        return [base]

    stop_words = {
        "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "for", "of", "with",
        "as", "by", "that", "this", "it", "from", "be", "are", "was", "or", "have", "has",
        "not", "but", "can", "all", "any", "we", "you", "your", "our", "my", "their", "they",
        "will", "would", "should", "could", "about", "each", "into", "then", "than", "more"
    }
    tokens = [w.lower().strip(".,;:()[]{}\"'`") for w in text.split() if len(w) >= 4]
    counts: Dict[str, int] = {}
    for t in tokens:
        if t and t not in stop_words and t.isalpha():
            counts[t] = counts.get(t, 0) + 1

    sorted_topics = [w.capitalize() for w, _ in sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]]
    return sorted_topics if sorted_topics else ["Core Algorithms"]

# ---------------------------------------------------------------------------
# 2. Web Lookup via duckduckgo-search (DDGS)
# ---------------------------------------------------------------------------
def lookup_web_context(topic: str, assignment_title: str, max_results: int = 3) -> List[Dict[str, str]]:
    """
    Searches DuckDuckGo for academic specifications, invariants, and benchmark requirements.
    """
    try:
        try:
            from duckduckgo_search import DDGS
        except ImportError:
            from ddgs import DDGS
    except ImportError:
        logger.warning("duckduckgo-search is not installed. Web lookup skipped. (Run: pip install duckduckgo-search)")
        return []

    query = f"{assignment_title} {topic} computer science algorithms invariants edge cases".strip()
    logger.info(f"Querying DuckDuckGo: '{query}'")
    results: List[Dict[str, str]] = []

    try:
        with DDGS() as ddgs:
            raw = list(ddgs.text(query, max_results=max_results))
            for item in raw:
                title = item.get("title", "")
                snippet = item.get("body", "") or item.get("snippet", "")
                href = item.get("href", "") or item.get("link", "")
                if title or snippet:
                    results.append({
                        "title": title,
                        "snippet": snippet,
                        "url": href
                    })
        logger.info(f"Retrieved {len(results)} web grounding reference(s) from DuckDuckGo.")
    except Exception as e:
        logger.warning(f"DuckDuckGo search error: {e}")

    return results

# ---------------------------------------------------------------------------
# 3. Intelligent Evaluation via Groq (Llama 3)
# ---------------------------------------------------------------------------
PROFESSOR_VANCE_PERSONA = """You are Professor Eleanor Vance, Senior Academic Examiner and Lead Course Evaluator.

YOUR PEDAGOGICAL PERSONA & EVALUATION RULES:
1. You are an exacting, fair, and pedagogically rigorous university professor.
2. Ground your grading strictly in the provided curriculum standards, rubric criteria, and retrieved DuckDuckGo web context.
3. DIFFERENTIAL SCORING REQUIREMENT:
   - IF ACCURATE & WORKING: The code/derivations correctly solve the problem, satisfy algorithmic invariants, handle boundary conditions, and follow syllabus standards. Award high marks (88% to 96% of maxMarks, varying realistically like 91, 94, 95).
   - IF FLAWED & BUGGY: The submission has syntax errors, logical bugs, wrong answers, missing edge-case handling, or failing invariants. Heavily penalize: award 25% to 48% of maxMarks. List 2 to 4 CONCRETE, SPECIFIC mistakes in "mistakes" quoting the exact broken logic.
   - IF OFF-TOPIC OR EMPTY: Award 0% to 20% of maxMarks and state clearly in "reasoning" that the content fails to address the assignment.
4. RAG TOPIC IDENTIFICATION:
   - Populate "topicIdentified" with the exact computer science / mathematical concept (e.g. "Dijkstra's Shortest Path Algorithm with Min-Heap", "AVL Tree Balance Invariants & Rotations").
   - Populate "topicAlignment" with "high", "moderate", "low", or "off_topic".
5. CRITERION BREAKDOWN:
   - Score each criterion independently. Ensure sum of criterion scores harmonizes with total awarded marks.
6. Return ONLY a valid JSON object matching the requested schema. No conversational preamble or codeblock tags outside JSON."""

def call_groq_evaluator(
    submission_text: str,
    submission_file_name: str,
    assignment_title: str,
    assignment_description: str,
    rubric_criteria: List[Dict[str, Any]],
    max_marks: int,
    web_context: str,
    course_name: str = "CS301: Advanced Data Structures & Algorithms",
    api_key: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Calls Groq Llama 3 with candidate model fallback to generate thorough evaluation.
    """
    key = api_key or os.getenv("GROQ_API_KEY")
    if not key:
        logger.warning("GROQ_API_KEY environment variable not set. Falling back to heuristic evaluator.")
        return None

    try:
        from groq import Groq
        client = Groq(api_key=key)
    except Exception as e:
        logger.warning(f"Could not initialize Groq client: {e}")
        return None

    criteria_str = "\n".join([
        f"- [ID: {c.get('id', f'crit_{i+1}')}] {c.get('name', 'Criterion')} (Max: {c.get('maxScore', 25)} pts): {c.get('description', 'Standard proficiency')}"
        for i, c in enumerate(rubric_criteria)
    ])

    user_prompt = f"""STUDENT SUBMISSION EVALUATION REQUEST:
Course: {course_name}
Assignment: "{assignment_title}"
Description: "{assignment_description}"
Total Max Marks: {max_marks}
Submitted File: {submission_file_name}

RUBRIC CRITERIA:
{criteria_str}

VERIFIED DUCKDUCKGO WEB GROUNDING & ALGORITHMIC BENCHMARKS:
{web_context}

STUDENT EXTRACTED SUBMISSION CONTENT:
\"\"\"
{submission_text[:35000]}
\"\"\"

Return ONLY a valid JSON object matching this schema:
{{
  "marks": <awarded marks, number>,
  "confidence": <float between 0.70 and 0.98>,
  "topicIdentified": "<precise technical topic name>",
  "topicAlignment": "high" | "moderate" | "low" | "off_topic",
  "reasoning": "<comprehensive evaluation paragraph>",
  "criterionScores": [
    {{
      "criterionId": "<id>",
      "criterionName": "<name>",
      "score": <number>,
      "maxScore": <number>,
      "reasoning": "<specific criterion critique>"
    }}
  ],
  "mistakes": ["<specific mistake 1>", "<specific mistake 2>"],
  "suggestions": ["<actionable recommendation 1>", "<actionable recommendation 2>"],
  "promptInjectionSuspected": false
}}"""

    candidate_models = [
        os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "mixtral-8x7b-32768"
    ]
    seen = set()
    models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

    for model in models_to_try:
        try:
            logger.info(f"Querying Groq model: {model}...")
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": PROFESSOR_VANCE_PERSONA},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=1800,
                response_format={"type": "json_object"}
            )
            raw_content = completion.choices[0].message.content
            parsed = json.loads(raw_content)
            logger.info(f"Groq evaluation received successfully from {model}.")
            return parsed
        except Exception as err:
            err_str = str(err)
            if "model_not_found" in err_str or "does not exist" in err_str or "404" in err_str:
                logger.warning(f"Groq model '{model}' unavailable, trying fallback candidate...")
                continue
            logger.warning(f"Groq API error on model '{model}': {err}")
            break

    return None

def heuristic_evaluator(
    submission_text: str,
    file_name: str,
    assignment_title: str,
    rubric_criteria: List[Dict[str, Any]],
    max_marks: int
) -> Dict[str, Any]:
    """
    Deterministic pedagogical heuristic fallback when Groq is unavailable.
    """
    clean_text = (submission_text or "").strip()
    words = clean_text.split()
    word_count = len(words)
    lower = clean_text.lower()

    if word_count == 0 or not clean_text:
        return {
            "marks": round(max_marks * 0.15),
            "maxMarks": max_marks,
            "confidence": 0.95,
            "topicIdentified": "Unreadable or Empty Document",
            "topicAlignment": "low",
            "reasoning": f"No readable code or solution text could be extracted from '{file_name}'. The document appears empty or unparseable.",
            "criterionScores": [
                {
                    "criterionId": c.get("id", f"crit_{i+1}"),
                    "criterionName": c.get("name", f"Criterion {i+1}"),
                    "score": max(1, round(c.get("maxScore", 25) * 0.15)),
                    "maxScore": c.get("maxScore", 25),
                    "reasoning": "Unable to verify criterion because submitted document contains no readable text."
                } for i, c in enumerate(rubric_criteria)
            ],
            "mistakes": ["Document contains no readable code, text, or equations."],
            "suggestions": ["Resubmit work in standard PDF, DOCX, TXT, or code (.py, .js) format."],
            "promptInjectionSuspected": False
        }

    flaw_words = ["error", "syntaxerror", "exception", "failed", "failing", "todo", "fixme", "broken", "bug", "crash"]
    detected_flaws = [f for f in flaw_words if f in lower]
    is_flawed = len(detected_flaws) >= 1 or "not working" in lower or "syntax error" in lower

    ratio = 0.42 if is_flawed else (0.92 if word_count >= 60 else 0.70)
    awarded_marks = round(max_marks * ratio)

    criterion_scores = []
    for i, c in enumerate(rubric_criteria):
        c_max = c.get("maxScore", round(max_marks / len(rubric_criteria)))
        c_score = min(c_max, max(1, round(c_max * ratio)))
        criterion_scores.append({
            "criterionId": c.get("id", f"crit_{i+1}"),
            "criterionName": c.get("name", f"Criterion {i+1}"),
            "score": c_score,
            "maxScore": c_max,
            "reasoning": f"Assessed based on syllabus requirements for {c.get('name', 'criterion')}."
        })

    return {
        "marks": awarded_marks,
        "maxMarks": max_marks,
        "confidence": 0.91,
        "topicIdentified": assignment_title or "Core Algorithms",
        "topicAlignment": "high" if not is_flawed else "moderate",
        "reasoning": f"Heuristic evaluation completed against course syllabus standards for {assignment_title}." if not is_flawed else f"Flaws detected in implementation ({', '.join(detected_flaws)}). Invariants not maintained.",
        "criterionScores": criterion_scores,
        "mistakes": [f"Detected flaw/error markers in submission: {', '.join(detected_flaws)}"] if is_flawed else ["Assert all non-trivial boundary edge cases."],
        "suggestions": ["Review lecture notes on invariants before resubmitting."],
        "promptInjectionSuspected": False
    }

# ---------------------------------------------------------------------------
# 4. Integrated Pipeline Execution
# ---------------------------------------------------------------------------
def evaluate_submission_pipeline(
    file_path: str,
    assignment_title: str,
    assignment_description: str = "",
    rubric_criteria: Optional[List[Dict[str, Any]]] = None,
    max_marks: int = 100,
    course_name: str = "CS301: Advanced Data Structures & Algorithms",
    use_web_lookup: bool = True,
    groq_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the complete production evaluation pipeline:
    1. pypdf extraction
    2. DuckDuckGo web lookup
    3. Groq intelligence evaluation
    """
    criteria = rubric_criteria or [
        {"id": "crit_1", "name": "Algorithmic Correctness & Invariants", "maxScore": 40, "description": "Correct logic, boundary handling, and complexity."},
        {"id": "crit_2", "name": "Implementation & Code Quality", "maxScore": 30, "description": "Clean modular implementation and syntax."},
        {"id": "crit_3", "name": "Edge Cases & Validation", "maxScore": 30, "description": "Verification of empty, extreme, and cyclic inputs."}
    ]

    # Step 1: Extraction via pypdf / decoders
    doc = extract_document(file_path)
    file_name = os.path.basename(file_path)

    # Step 2: Web lookup via DuckDuckGo
    web_context_text = "Standard academic algorithmic benchmarks."
    web_results = []
    if use_web_lookup and doc["topics"]:
        primary_topic = doc["topics"][0]
        web_results = lookup_web_context(primary_topic, assignment_title, max_results=3)
        if web_results:
            web_context_text = "\n---\n".join([f"[{r['title']}]: {r['snippet']}" for r in web_results])

    # Step 3: Groq Intelligence Evaluation
    groq_res = call_groq_evaluator(
        submission_text=doc["text"],
        submission_file_name=file_name,
        assignment_title=assignment_title,
        assignment_description=assignment_description,
        rubric_criteria=criteria,
        max_marks=max_marks,
        web_context=web_context_text,
        course_name=course_name,
        api_key=groq_api_key
    )

    if groq_res:
        awarded = round(float(groq_res.get("marks", max_marks * 0.85)))
        evaluation = {
            "file": file_name,
            "assignmentTitle": assignment_title,
            "marks": awarded,
            "maxMarks": max_marks,
            "percentage": round((awarded / max_marks) * 100, 1),
            "confidence": float(groq_res.get("confidence", 0.94)),
            "topicIdentified": groq_res.get("topicIdentified", doc["topics"][0] if doc["topics"] else assignment_title),
            "topicAlignment": groq_res.get("topicAlignment", "high"),
            "reasoning": groq_res.get("reasoning", "Comprehensive academic evaluation completed."),
            "criterionScores": groq_res.get("criterionScores", []),
            "mistakes": groq_res.get("mistakes", []),
            "suggestions": groq_res.get("suggestions", []),
            "promptInjectionSuspected": bool(groq_res.get("promptInjectionSuspected", False)),
            "webGroundingSources": [r["title"] for r in web_results],
            "wordCount": doc["wordCount"],
            "pageCount": doc["pageCount"]
        }
    else:
        heur = heuristic_evaluator(doc["text"], file_name, assignment_title, criteria, max_marks)
        evaluation = {
            "file": file_name,
            "assignmentTitle": assignment_title,
            **heur,
            "percentage": round((heur["marks"] / max_marks) * 100, 1),
            "webGroundingSources": [r["title"] for r in web_results],
            "wordCount": doc["wordCount"],
            "pageCount": doc["pageCount"]
        }

    return evaluation

# ---------------------------------------------------------------------------
# 5. CLI Entrypoint
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="AiCademy Production-Ready Submission Evaluator (pypdf + DDGS + Groq)")
    parser.add_argument("--file", "-f", required=True, help="Path to submission file (PDF, TXT, PY, DOCX, etc.)")
    parser.add_argument("--assignment", "-a", required=True, help="Title of the assignment")
    parser.add_argument("--description", "-d", default="", help="Description or specifications of the assignment")
    parser.add_argument("--rubric", "-r", default=None, help="JSON file path or string containing rubric criteria")
    parser.add_argument("--max-marks", "-m", type=int, default=100, help="Maximum possible marks (default: 100)")
    parser.add_argument("--course", "-c", default="CS301: Advanced Data Structures & Algorithms", help="Course name or code")
    parser.add_argument("--no-web", action="store_true", help="Disable DuckDuckGo web lookup")
    parser.add_argument("--output", "-o", default=None, help="Path to write JSON output file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    if args.verbose:
        logger.setLevel(logging.DEBUG)

    criteria = None
    if args.rubric:
        if os.path.exists(args.rubric):
            with open(args.rubric, "r", encoding="utf-8") as rf:
                criteria = json.load(rf)
        else:
            try:
                criteria = json.loads(args.rubric)
            except Exception as e:
                logger.warning(f"Could not parse rubric JSON: {e}")

    result = evaluate_submission_pipeline(
        file_path=args.file,
        assignment_title=args.assignment,
        assignment_description=args.description,
        rubric_criteria=criteria,
        max_marks=args.max_marks,
        course_name=args.course,
        use_web_lookup=not args.no_web
    )

    # Pretty-print summary to terminal
    print("\n" + "=" * 65)
    print(f"  AICADEMY EVALUATION REPORT: {result['assignmentTitle']}")
    print("=" * 65)
    print(f"  File:             {result['file']} ({result['wordCount']} words, {result['pageCount']} page(s))")
    print(f"  Identified Topic: {result['topicIdentified']}")
    print(f"  Topic Alignment:  {result['topicAlignment'].upper()}")
    print(f"  Score Awarded:    {result['marks']} / {result['maxMarks']} ({result['percentage']}%)")
    print(f"  Confidence:       {int(result['confidence'] * 100)}%")
    print("-" * 65)
    print(f"  Professor Feedback:\n  {result['reasoning']}")
    print("-" * 65)
    print("  Criterion Scores:")
    for cs in result.get("criterionScores", []):
        c_name = cs.get("criterionName") or cs.get("name") or "Criterion"
        c_score = cs.get("score") if cs.get("score") is not None else cs.get("awardedMarks", 0)
        c_max = cs.get("maxScore", 25)
        print(f"    • {c_name:35} : {c_score:>2}/{c_max} pts")

    if result.get("mistakes"):
        print("-" * 65)
        print("  Pinpointed Mistakes & Flaws:")
        for m in result["mistakes"]:
            print(f"    [X] {m}")

    if result.get("suggestions"):
        print("-" * 65)
        print("  Actionable Recommendations:")
        for s in result["suggestions"]:
            print(f"    [->] {s}")

    if result.get("webGroundingSources"):
        print("-" * 65)
        print(f"  Web Grounding Sources (DuckDuckGo): {', '.join(result['webGroundingSources'][:2])}")
    print("=" * 65 + "\n")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as out_f:
            json.dump(result, out_f, indent=2)
        logger.info(f"Report saved to {args.output}")

if __name__ == "__main__":
    main()
