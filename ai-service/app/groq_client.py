import json
from typing import Optional, Dict, Any, List
from groq import Groq
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
        try:
            kwargs: Dict[str, Any] = {
                "model": settings.MODEL_NAME,
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
            print(f"[GroqService] Groq API completion error: {e}")
            return None

groq_service = GroqService()
