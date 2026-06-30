# ResumeAI - Switching AI Providers Guide

ResumeAI is built with a provider-independent modular AI architecture. It supports three providers out-of-the-box:
1. **Google Gemini** (via `google-genai` SDK)
2. **Groq** (OpenAI-compatible)
3. **OpenRouter** (OpenAI-compatible)

---

## Configuration

To switch AI providers, update the environment variables in your backend `.env` file.

### Environment Variables Reference

| Variable | Description | Example / Default |
|---|---|---|
| `AI_PROVIDER` | The primary provider to use. Options: `gemini`, `groq`, `openrouter`. | `gemini` |
| `GEMINI_API_KEY` | Your Google Gemini API Key from Google AI Studio. | `AIzaSy...` |
| `GROQ_API_KEY` | Your Groq API Key. | `gsk_...` |
| `GROQ_MODEL` | Groq model identifier. | `llama-3.3-70b-versatile` |
| `OPENROUTER_API_KEY` | Your OpenRouter API Key. | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | OpenRouter model identifier (Required if OpenRouter selected). | `google/gemini-2.5-flash` |

---

## Automatic Failover Mechanism

To guarantee continuous availability and avoid downtime due to rate limits or model outages, ResumeAI features intelligent automatic provider failover:

1. **Prioritization**: The service builds a list of *configured* providers (providers with valid API keys in `.env`). The primary provider configured in `AI_PROVIDER` is prioritized first.
2. **Execution**: The service attempts to execute the AI request (e.g. Resume Optimization or Analysis) using the primary provider.
3. **Failover**: If the primary provider fails (e.g. rate-limit `429`, timeout, or server error), the service logs the error, executes a failover, and immediately redirects the request to the next configured provider in the list.
4. **Outcome**: The first successful response is returned. If all configured providers fail, a clean JSON error is returned without exposing raw traceback or API key details.

### How to Configure Fallbacks
Simply provide the keys for multiple providers in your `.env` file. For example, if you configure:
```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxx
GEMINI_API_KEY=AIzaSy_xxx
```
ResumeAI will try **Groq** first. If Groq fails (e.g., due to rate limits), it will automatically fail over to **Gemini**.
