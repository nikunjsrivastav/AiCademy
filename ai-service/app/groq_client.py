from typing import Optional, Dict, Any
from groq import Groq

try:
    from app.config import settings
except ImportError:
    from .config import settings

class GroqService:
    def __init__(self):
        self.client: Optional[Groq] = None
        if settings.GROQ_API_KEY:
            try:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                print(f"[GroqService] Warning: Failed to initialize Groq client: {e}")

    def is_available(self) -> bool:
        return self.client is not None

    def chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
        json_mode: bool = False
    ) -> Optional[str]:
        if not self.client:
            return None

        # Multi-model candidate fallback to guarantee resilience
        candidate_models = [
            settings.MODEL_NAME,
            "llama-3.1-8b-instant",
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768"
        ]
        # De-duplicate while preserving priority order
        seen = set()
        models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

        for model in models_to_try:
            try:
                kwargs: Dict[str, Any] = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                response = self.client.chat.completions.create(**kwargs)
                return response.choices[0].message.content
            except Exception as e:
                err_msg = str(e)
                if "model_not_found" in err_msg or "does not exist" in err_msg or "404" in err_msg:
                    print(f"[GroqService] Model '{model}' unavailable, trying fallback candidate...")
                    continue
                print(f"[GroqService] Groq API completion error with model '{model}': {e}")
                return None

        return None

groq_service = GroqService()

