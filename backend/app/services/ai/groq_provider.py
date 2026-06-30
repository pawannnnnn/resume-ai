import httpx
from config import settings
from services.ai.openai_provider import OpenAICompatibleProvider

class GroqProvider(OpenAICompatibleProvider):
    def __init__(self, client: httpx.Client):
        api_url = "https://api.groq.com/openai/v1/chat/completions"
        super().__init__(
            api_key=settings.GROQ_API_KEY,
            api_url=api_url,
            model=settings.GROQ_MODEL,
            client=client
        )
