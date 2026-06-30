import httpx
from config import settings
from services.ai.openai_provider import OpenAICompatibleProvider

class OpenRouterProvider(OpenAICompatibleProvider):
    def __init__(self, client: httpx.Client):
        api_url = "https://openrouter.ai/api/v1/chat/completions"
        super().__init__(
            api_key=settings.OPENROUTER_API_KEY,
            api_url=api_url,
            model=settings.OPENROUTER_MODEL,
            client=client
        )
