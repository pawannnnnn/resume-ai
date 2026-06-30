import time
from utils.logger import logger
from config import settings
from services.ai.base_provider import (
    JobDetails,
    ResumeAnalysis,
    ChangeItem,
    OptimizeResult,
    InterviewQuestion,
    AISuggestions,
    BaseAIProvider,
)
from services.ai.provider_factory import ProviderFactory

class AllAIProvidersFailedError(Exception):
    """Exception raised when all configured AI providers fail to execute a request."""
    pass

class AIService:
    def __init__(self):
        pass

    def _get_failover_sequence(self) -> list[tuple[str, BaseAIProvider]]:
        """
        Get the sequence of configured providers to try.
        Ordered such that the primary settings.AI_PROVIDER is first, followed by others.
        """
        primary = settings.AI_PROVIDER.lower().strip() if settings.AI_PROVIDER else "gemini"
        all_possible = ["gemini", "groq", "openrouter"]
        
        if primary not in all_possible:
            primary = "gemini"
            
        ordered = [primary] + [p for p in all_possible if p != primary]
        
        sequence = []
        for p in ordered:
            if p == "gemini" and settings.GEMINI_API_KEY:
                sequence.append((p, ProviderFactory.get_provider("gemini")))
            elif p == "groq" and settings.GROQ_API_KEY:
                sequence.append((p, ProviderFactory.get_provider("groq")))
            elif p == "openrouter" and settings.OPENROUTER_API_KEY:
                if settings.OPENROUTER_MODEL:
                    sequence.append((p, ProviderFactory.get_provider("openrouter")))
                else:
                    logger.warning("OpenRouter requested or configured, but OPENROUTER_MODEL is not set. Skipping.")
                
        return sequence

    def _execute_with_failover(self, method_name: str, *args, **kwargs):
        """
        Execute a method on the providers in order of failover sequence.
        Returns the first successful result. Raises AllAIProvidersFailedError if all fail.
        """
        sequence = self._get_failover_sequence()
        if not sequence:
            raise ValueError("No AI providers are configured. Please verify your environment variables.")
            
        errors = []
        for index, (provider_name, provider) in enumerate(sequence):
            logger.info(f"Selected provider: '{provider_name}' (Attempt {index + 1}/{len(sequence)}) for '{method_name}'")
            start_time = time.time()
            try:
                method = getattr(provider, method_name)
                result = method(*args, **kwargs)
                elapsed = time.time() - start_time
                logger.info(f"AI provider '{provider_name}' succeeded in {elapsed:.2f} seconds")
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(
                    f"AI provider '{provider_name}' failed for '{method_name}' in {elapsed:.2f} seconds. "
                    f"Error: {type(e).__name__}: {str(e)}"
                )
                errors.append((provider_name, e))
                
                if index < len(sequence) - 1:
                    next_provider = sequence[index + 1][0]
                    logger.warning(
                        f"FAILOVER: Provider '{provider_name}' failed. Falling over to '{next_provider}'."
                    )
                    
        logger.error(f"All configured AI providers failed to execute '{method_name}'. Errors: {errors}")
        raise AllAIProvidersFailedError(
            f"All configured AI providers failed to execute '{method_name}'."
        )

    def extract_job_details(self, raw_text: str) -> dict:
        """Parse raw scraped text into structured JobDetails schema."""
        return self._execute_with_failover("extract_job_details", raw_text)

    def analyze_resume(self, resume_text: str, job_description: str) -> dict:
        """Analyze original resume against job description and produce metrics."""
        return self._execute_with_failover("analyze_resume", resume_text, job_description)

    def optimize_resume(self, resume_text: str, job_description: str, opt_settings: dict) -> dict:
        """
        Optimize the resume to align with the job description.
        Incorporate styling, layout, and mode configuration parameters.
        """
        return self._execute_with_failover("optimize_resume", resume_text, job_description, opt_settings)

    def generate_suggestions(self, resume_text: str, job_description: str) -> dict:
        """Generate Cover Letter, Recruiter Email, LinkedIn Summary, LinkedIn Headline, and Prep Questions."""
        return self._execute_with_failover("generate_suggestions", resume_text, job_description)

    def generate_latex(self, resume_markdown: str) -> str:
        """Converts resume markdown text into professional LaTeX code."""
        return self._execute_with_failover("generate_latex", resume_markdown)
