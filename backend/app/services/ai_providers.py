import json
from abc import ABC, abstractmethod
from enum import Enum
import httpx

class AIProviderType(str, Enum):
    CLAUDE = "claude"          # Anthropic format (including relay/proxy)
    KIMI = "kimi"              # OpenAI-compatible
    GLM = "glm"                # OpenAI-compatible
    MINIMAX = "minimax"        # OpenAI-compatible
    DEEPSEEK = "deepseek"      # OpenAI-compatible
    CUSTOM = "custom"          # OpenAI-compatible, user-specified

class AIProvider(ABC):
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key

    @abstractmethod
    async def generate(self, prompt: str, model: str, max_tokens: int = 8000) -> str:
        """Generate response from the AI provider."""
        pass

class AnthropicProvider(AIProvider):
    async def generate(self, prompt: str, model: str, max_tokens: int = 8000) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": max_tokens,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=60.0,
            )
            response.raise_for_status()
            result = response.json()
            return result.get("content", [{}])[0].get("text", "{}")

class OpenAICompatibleProvider(AIProvider):
    async def generate(self, prompt: str, model: str, max_tokens: int = 8000) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": max_tokens,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=60.0,
            )
            response.raise_for_status()
            result = response.json()
            return result.get("choices", [{}])[0].get("message", {}).get("content", "{}")

def get_ai_provider(provider_type: str, base_url: str, api_key: str) -> AIProvider:
    if provider_type == AIProviderType.CLAUDE:
        return AnthropicProvider(base_url, api_key)
    else:
        return OpenAICompatibleProvider(base_url, api_key)
