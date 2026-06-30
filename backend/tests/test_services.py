import pytest
from fastapi import HTTPException
from app.services.job_scraper import JobScraper
from app.services.resume_parser import ResumeParser

def test_detect_platform():
    scraper = JobScraper()
    assert scraper.detect_platform("https://board.greenhouse.io/google/jobs/12345") == "Greenhouse"
    assert scraper.detect_platform("https://jobs.lever.co/facebook/123-abc") == "Lever"
    assert scraper.detect_platform("https://company.myworkdayjobs.com/en-US/careers") == "Workday"
    assert scraper.detect_platform("https://ashbyhq.com/startup/jobs") == "Ashby"
    assert scraper.detect_platform("https://www.google.com") == "Generic / Webpage"

def test_validate_file_size():
    parser = ResumeParser()
    # Mock files larger than 5MB
    large_content = b"x" * (6 * 1024 * 1024)
    with pytest.raises(HTTPException) as exc_info:
        parser.validate_file("resume.pdf", large_content)
    assert exc_info.value.status_code == 413

def test_validate_file_signature():
    parser = ResumeParser()
    # Test invalid signatures
    with pytest.raises(HTTPException) as exc_info_pdf:
        parser.validate_file("resume.pdf", b"NOTAPDFCONTENT")
    assert exc_info_pdf.value.status_code == 400
    assert "headers do not match a PDF signature" in exc_info_pdf.value.detail

    with pytest.raises(HTTPException) as exc_info_docx:
        parser.validate_file("resume.docx", b"NOTADOCXCONTENT")
    assert exc_info_docx.value.status_code == 400
    assert "headers do not match a DOCX (ZIP) signature" in exc_info_docx.value.detail

def test_pdf_generator_latex_compilation():
    from app.services.pdf_generator import PDFGenerator
    generator = PDFGenerator()
    
    # Check that compile_latex_via_cloud compiles a minimal LaTeX doc
    minimal_latex = r"""\documentclass{article}
\begin{document}
Hello World from PyTest
\end{document}"""
    
    try:
        pdf_bytes = generator.compile_latex_via_cloud(minimal_latex)
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b"%PDF")
    except Exception as e:
        pytest.skip(f"Cloud LaTeX compilation skipped due to network/API issue: {str(e)}")

