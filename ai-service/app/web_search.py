from typing import List, Dict, Any
import logging
import warnings

# Suppress library rename notice
warnings.filterwarnings("ignore", category=RuntimeWarning)

logger = logging.getLogger(__name__)

def search_academic_web_context(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    """
    Searches DuckDuckGo for authoritative academic specifications,
    algorithmic invariants, and reference benchmarks to ground AI grading and tutoring.
    Uses duckduckgo-search (DDGS).
    """
    results: List[Dict[str, str]] = []
    clean_query = (query or "").strip()
    if not clean_query:
        return results

    try:
        try:
            from duckduckgo_search import DDGS
        except ImportError:
            from ddgs import DDGS

        with DDGS() as ddgs:
            raw_results = list(ddgs.text(clean_query, max_results=max_results))
            for item in raw_results:
                title = item.get("title", "")
                snippet = item.get("body", "") or item.get("snippet", "")
                href = item.get("href", "") or item.get("link", "")
                if title or snippet:
                    results.append({
                        "title": title,
                        "snippet": snippet,
                        "url": href
                    })
    except Exception as e:
        logger.warning(f"[WebSearch] DuckDuckGo search failed for query '{clean_query}': {e}")

    return results
