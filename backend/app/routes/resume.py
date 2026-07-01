from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import io

from services.job_scraper import JobScraper
from services.resume_parser import ResumeParser
from services.ai_service import AIService
from services.pdf_generator import PDFGenerator
from utils.logger import logger
from db.database import get_db
from db.models import User
from dependencies import get_current_user, verify_quota

router = APIRouter(prefix="/api", tags=["Resume"])

# Instantiate services
ai_service = AIService()
job_scraper = JobScraper(ai_service=ai_service)
resume_parser = ResumeParser()
pdf_generator = PDFGenerator()

# ----------------------------------------------------
# Request & Response Schemas
# ----------------------------------------------------

class ScrapeRequest(BaseModel):
    url: str = Field(..., description="The job posting URL.")

class ScrapeResponse(BaseModel):
    platform: str
    title: str
    company: str
    description: str

class ParseResponse(BaseModel):
    text: str
    filename: str

class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str

class OptimizeRequest(BaseModel):
    resume_text: str
    job_description: str
    settings: dict = Field(default_factory=dict, description="Style, color, and font choices.")

class SuggestionsRequest(BaseModel):
    resume_text: str
    job_description: str

class ExportRequest(BaseModel):
    markdown_text: str
    format: str = Field("pdf", description="Target format: 'pdf' or 'docx'")
    settings: dict = Field(default_factory=dict, description="Color, font, and layout options.")

# ----------------------------------------------------
# Endpoint Implementations
# ----------------------------------------------------

@router.post("/scrape", response_model=ScrapeResponse)
def scrape_job(request: ScrapeRequest, current_user: User = Depends(get_current_user)):
    try:
        data = job_scraper.scrape_job_description(request.url)
        return data
    except ValueError as val_err:
        logger.error(f"Validation error scraping job: {str(val_err)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"Unexpected error scraping job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while trying to parse the job page: {str(e)}"
        )

@router.post("/parse", response_model=ParseResponse)
def parse_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        content = file.file.read()
        logger.info(f"Received file upload: {file.filename} ({len(content)} bytes)")
        text = resume_parser.parse_resume(file.filename, content)
        return {"text": text, "filename": file.filename}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        logger.error(f"Unexpected error parsing file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse uploaded document: {str(e)}"
        )

@router.post("/analyze")
def analyze_resume(request: AnalyzeRequest, current_user: User = Depends(get_current_user)):
    try:
        analysis = ai_service.analyze_resume(request.resume_text, request.job_description)
        return analysis
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        logger.error(f"Error during AI analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Service error during resume analysis: {str(e)}"
        )

@router.post("/optimize")
def optimize_resume(
    request: OptimizeRequest, 
    current_user: User = Depends(verify_quota),
    db: Session = Depends(get_db)
):
    try:
        optimized = ai_service.optimize_resume(request.resume_text, request.job_description, request.settings)
        
        # Decrement quota / Increment used
        if current_user.subscription_type != "pro":
            current_user.resume_optimizations_used += 1
            db.commit()
            
        return optimized
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        logger.error(f"Error during AI optimization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Service error during resume optimization: {str(e)}"
        )

@router.post("/suggestions")
def generate_suggestions(request: SuggestionsRequest, current_user: User = Depends(get_current_user)):
    try:
        suggestions = ai_service.generate_suggestions(request.resume_text, request.job_description)
        return suggestions
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        logger.error(f"Error during AI suggestions generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Service error during suggestion generation: {str(e)}"
        )

@router.post("/export")
def export_document(request: ExportRequest, current_user: User = Depends(get_current_user)):
    try:
        fmt = request.format.lower()
        if fmt == "tex":
            # Generate raw LaTeX file using Gemini
            logger.info("Generating raw LaTeX source...")
            latex_code = ai_service.generate_latex(request.markdown_text)
            file_bytes = latex_code.encode("utf-8")
            media_type = "text/plain"
            filename = "optimized_resume.tex"
        elif fmt == "pdf":
            engine = request.settings.get("pdfEngine", "latex").lower()
            if engine == "latex":
                try:
                    logger.info("Generating LaTeX code for PDF compilation...")
                    latex_code = ai_service.generate_latex(request.markdown_text)
                    file_bytes = pdf_generator.generate_pdf_via_latex(latex_code)
                except Exception as e:
                    logger.warning(f"LaTeX PDF compilation failed, falling back to ReportLab: {str(e)}")
                    file_bytes = pdf_generator.generate_pdf(request.markdown_text, request.settings)
            else:
                file_bytes = pdf_generator.generate_pdf(request.markdown_text, request.settings)
            media_type = "application/pdf"
            filename = "optimized_resume.pdf"
        elif fmt == "docx":
            file_bytes = pdf_generator.generate_docx(request.markdown_text, request.settings)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            filename = "optimized_resume.docx"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {request.format}. Only 'pdf', 'docx', and 'tex' are supported."
            )
            
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        logger.error(f"Error during file export: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export engine error: {str(e)}"
        )

