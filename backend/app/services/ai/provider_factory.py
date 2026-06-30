import httpx
from services.ai.base_provider import BaseAIProvider
from services.ai.gemini_provider import GeminiProvider
from services.ai.groq_provider import GroqProvider
from services.ai.openrouter_provider import OpenRouterProvider

class ProviderFactory:
    _instances = {}
    _http_client = None

    @classmethod
    def get_http_client(cls) -> httpx.Client:
        if cls._http_client is None:
            cls._http_client = httpx.Client(
                timeout=httpx.Timeout(30.0, connect=10.0),
                limits=httpx.Limits(max_connections=50, max_keepalive_connections=10)
            )
        return cls._http_client

    @classmethod
    def get_provider(cls, provider_name: str) -> BaseAIProvider:
        provider_name = provider_name.lower().strip()
        if provider_name not in cls._instances:
            client = cls.get_http_client()
            if provider_name == "gemini":
                cls._instances[provider_name] = GeminiProvider()
            elif provider_name == "groq":
                cls._instances[provider_name] = GroqProvider(client=client)
            elif provider_name == "openrouter":
                cls._instances[provider_name] = OpenRouterProvider(client=client)
            else:
                raise ValueError(f"Unknown AI provider: {provider_name}")
        return cls._instances[provider_name]

    @classmethod
    def close(cls):
        """Close the reusable HTTP client if open."""
        if cls._http_client is not None:
            cls._http_client.close()
            cls._http_client = None
        cls._instances.clear()
