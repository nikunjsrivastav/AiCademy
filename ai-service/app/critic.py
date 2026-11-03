import re
from typing import Tuple

INJECTION_PATTERNS = [
    r'ignore\s+(all\s+)?(previous|prior)\s+instructions',
    r'you\s+are\s+now\s+(an?\s+)?administrator',
    r'give\s+(me\s+)?(full|100%|maximum)\s+marks?',
    r'bypass\s+all\s+(evaluations?|grading|rubrics?)',
    r'override\s+score',
    r'system\s+override',
    r'disregard\s+(the\s+)?rubric',
    r'reveal\s+(the\s+)?system\s+prompt',
    r'act\s+as\s+DAN',
    r'jailbreak',
    r'you\s+must\s+award\s+100',
]

def check_prompt_injection(text: str) -> Tuple[bool, str]:
    """Inspects text for prompt injection attempts per Decision D13."""
    for pattern in INJECTION_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return True, f"Detected adversarial prompt injection pattern: '{match.group(0)}'"
    return False, "Clean input. No adversarial jailbreak patterns detected."
