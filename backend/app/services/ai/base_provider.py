from abc import ABC, abstractmethod
from pydantic import BaseModel, Field

# ----------------------------------------------------
# Pydantic Schemas for Structured JSON outputs
# ----------------------------------------------------

class JobDetails(BaseModel):
    title: str = Field(description="The job title of the position.")
    company: str = Field(description="The company offering the job.")
    description: str = Field(description="A clean, structured job description extracting key duties and requirements.")

class ResumeAnalysis(BaseModel):
    ats_score: int = Field(description="Estimated ATS Score from 0 to 100.")
    match_percentage: int = Field(description="Overall compatibility match percentage from 0 to 100.")
    missing_skills: list[str] = Field(description="Crucial skills or technologies present in job description but missing from resume.")
    matching_skills: list[str] = Field(description="Key skills present in both job description and resume.")
    suggested_keywords: list[str] = Field(description="Keywords or phrases to add to optimize the resume further.")
    experience_strength: int = Field(description="Score (0-100) assessing depth and relevance of experience.")
    education_match: str = Field(description="Assessment of education matching: High Match, Partial Match, or No Match.")
    skills_coverage: int = Field(description="Percentage coverage of required job skills.")
    suggested_title: str = Field(description="Optimized title suggestion for this resume variant.")

class ChangeItem(BaseModel):
    section: str = Field(description="The section name (e.g. Professional Summary, Experience - Google, Education).")
    description: str = Field(description="Short description of why this change was made.")
    original: str = Field(description="Original snippet text.")
    optimized: str = Field(description="Optimized snippet text.")

class OptimizeResult(BaseModel):
    optimized_resume_markdown: str = Field(description="The full optimized resume content formatted in clean Markdown.")
    changes: list[ChangeItem] = Field(description="List of specific section edits made to highlight differences.")

class InterviewQuestion(BaseModel):
    question: str = Field(description="A potential behavioral or technical interview question based on the job.")
    suggested_answer: str = Field(description="High-quality bullet points or structure for a strong answer using the candidate's resume context.")

class AISuggestions(BaseModel):
    cover_letter: str = Field(description="A highly tailored, professional Cover Letter in markdown format.")
    recruiter_email: str = Field(description="A short, catchy email to send to recruiter or hiring manager in markdown.")
    linkedin_summary: str = Field(description="An engaging About section summary for LinkedIn profile.")
    professional_headline: str = Field(description="A professional LinkedIn headline suggestion.")
    interview_prep: list[InterviewQuestion] = Field(description="List of tailored interview questions and answer advice.")
    suggested_title: str = Field(description="Suggested filename or version title for the resume.")


class BaseAIProvider(ABC):
    @abstractmethod
    def extract_job_details(self, raw_text: str) -> dict:
        """Parse raw job listing web text into structured JobDetails schema."""
        pass

    @abstractmethod
    def analyze_resume(self, resume_text: str, job_description: str) -> dict:
        """Analyze original resume against job description and produce compatibility metrics."""
        pass

    @abstractmethod
    def optimize_resume(self, resume_text: str, job_description: str, opt_settings: dict) -> dict:
        """Optimize resume text to align with the job description and custom settings."""
        pass

    @abstractmethod
    def generate_suggestions(self, resume_text: str, job_description: str) -> dict:
        """Generate Cover Letter, Recruiter Email, LinkedIn Summary, LinkedIn Headline, and Prep Questions."""
        pass

    @abstractmethod
    def generate_latex(self, resume_markdown: str) -> str:
        """Converts resume markdown text into professional LaTeX code."""
        pass

    # Expose individual utility methods with fallback to generate_suggestions for minimal duplication
    def generate_cover_letter(self, resume_text: str, job_description: str) -> str:
        """Generate cover letter from resume and job description."""
        suggestions = self.generate_suggestions(resume_text, job_description)
        return suggestions.get("cover_letter", "")

    def generate_linkedin_summary(self, resume_text: str, job_description: str) -> str:
        """Generate LinkedIn summary from resume and job description."""
        suggestions = self.generate_suggestions(resume_text, job_description)
        return suggestions.get("linkedin_summary", "")

    def generate_interview_questions(self, resume_text: str, job_description: str) -> list[dict]:
        """Generate interview preparation questions and answers."""
        suggestions = self.generate_suggestions(resume_text, job_description)
        return suggestions.get("interview_prep", [])
