import pytest
from unittest.mock import MagicMock, patch
from config import settings
from services.ai_service import AIService, AllAIProvidersFailedError
from services.ai.provider_factory import ProviderFactory
from services.ai.base_provider import BaseAIProvider

def test_provider_factory_caching():
    # Save original settings values
    orig_gemini = settings.GEMINI_API_KEY
    orig_groq = settings.GROQ_API_KEY
    orig_groq_model = settings.GROQ_MODEL
    orig_openrouter = settings.OPENROUTER_API_KEY
    orig_openrouter_model = settings.OPENROUTER_MODEL
    
    settings.GEMINI_API_KEY = "test_gemini"
    settings.GROQ_API_KEY = "test_groq"
    settings.GROQ_MODEL = "llama-3.3-70b-versatile"
    settings.OPENROUTER_API_KEY = "test_openrouter"
    settings.OPENROUTER_MODEL = "google/gemini-2.5-flash"
    
    try:
        # Clear factory cache
        ProviderFactory._instances.clear()
        
        # Get providers
        gemini = ProviderFactory.get_provider("gemini")
        groq = ProviderFactory.get_provider("groq")
        openrouter = ProviderFactory.get_provider("openrouter")
        
        assert gemini is not None
        assert groq is not None
        assert openrouter is not None
        
        # Check caching
        assert ProviderFactory.get_provider("gemini") is gemini
        assert ProviderFactory.get_provider("groq") is groq
        assert ProviderFactory.get_provider("openrouter") is openrouter
    finally:
        # Restore original values
        settings.GEMINI_API_KEY = orig_gemini
        settings.GROQ_API_KEY = orig_groq
        settings.GROQ_MODEL = orig_groq_model
        settings.OPENROUTER_API_KEY = orig_openrouter
        settings.OPENROUTER_MODEL = orig_openrouter_model

def test_failover_sequence_prioritization():
    # Test failover order logic based on env settings
    ai_service = AIService()
    
    # Save original settings values
    orig_provider = settings.AI_PROVIDER
    orig_gemini = settings.GEMINI_API_KEY
    orig_groq = settings.GROQ_API_KEY
    orig_groq_model = settings.GROQ_MODEL
    orig_openrouter = settings.OPENROUTER_API_KEY
    orig_openrouter_model = settings.OPENROUTER_MODEL
    
    try:
        settings.GEMINI_API_KEY = "key_gemini"
        settings.GROQ_API_KEY = "key_groq"
        settings.GROQ_MODEL = "llama-3.3-70b-versatile"
        settings.OPENROUTER_API_KEY = "key_openrouter"
        settings.OPENROUTER_MODEL = "model_openrouter"
        
        # Scenario 1: AI_PROVIDER is gemini
        settings.AI_PROVIDER = "gemini"
        seq = ai_service._get_failover_sequence()
        assert [name for name, _ in seq] == ["gemini", "groq", "openrouter"]
        
        # Scenario 2: AI_PROVIDER is groq
        settings.AI_PROVIDER = "groq"
        seq = ai_service._get_failover_sequence()
        assert [name for name, _ in seq] == ["groq", "gemini", "openrouter"]
        
        # Scenario 3: AI_PROVIDER is openrouter
        settings.AI_PROVIDER = "openrouter"
        seq = ai_service._get_failover_sequence()
        assert [name for name, _ in seq] == ["openrouter", "gemini", "groq"]
        
        # Scenario 4: Missing some keys
        settings.AI_PROVIDER = "groq"
        settings.GEMINI_API_KEY = ""
        seq = ai_service._get_failover_sequence()
        assert [name for name, _ in seq] == ["groq", "openrouter"]
    finally:
        # Restore original values
        settings.AI_PROVIDER = orig_provider
        settings.GEMINI_API_KEY = orig_gemini
        settings.GROQ_API_KEY = orig_groq
        settings.GROQ_MODEL = orig_groq_model
        settings.OPENROUTER_API_KEY = orig_openrouter
        settings.OPENROUTER_MODEL = orig_openrouter_model

def test_execute_with_failover_success():
    ai_service = AIService()
    
    # Mock sequence with two providers: provider1 (fails) and provider2 (succeeds)
    mock_provider1 = MagicMock()
    mock_provider1.analyze_resume.side_effect = Exception("Rate limit reached")
    
    mock_provider2 = MagicMock()
    mock_provider2.analyze_resume.return_value = {"ats_score": 85}
    
    sequence = [
        ("groq", mock_provider1),
        ("gemini", mock_provider2)
    ]
    
    with patch.object(ai_service, "_get_failover_sequence", return_value=sequence):
        res = ai_service.analyze_resume("resume_text", "job_description")
        assert res == {"ats_score": 85}
        
        # Verify provider1 was tried, failed, and provider2 was tried and succeeded
        mock_provider1.analyze_resume.assert_called_once_with("resume_text", "job_description")
        mock_provider2.analyze_resume.assert_called_once_with("resume_text", "job_description")

def test_execute_with_failover_all_fail():
    ai_service = AIService()
    
    mock_provider1 = MagicMock()
    mock_provider1.analyze_resume.side_effect = Exception("Connection timed out")
    
    mock_provider2 = MagicMock()
    mock_provider2.analyze_resume.side_effect = Exception("API error")
    
    sequence = [
        ("groq", mock_provider1),
        ("gemini", mock_provider2)
    ]
    
    with patch.object(ai_service, "_get_failover_sequence", return_value=sequence):
        with pytest.raises(AllAIProvidersFailedError):
            ai_service.analyze_resume("resume_text", "job_description")
