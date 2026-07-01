import json
from google import genai
from google.genai import types
from config import settings
from services.ai.base_provider import (
    BaseAIProvider,
    JobDetails,
    ResumeAnalysis,
    OptimizeResult,
    AISuggestions,
)
from utils.logger import logger

class GeminiProvider(BaseAIProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is not set. Gemini AI operations will fail.")
            self.client = None
        else:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash"

    def _get_client(self):
        if not self.client:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY environment variable is not configured. Please add it to your backend .env file.")
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self.client

    def extract_job_details(self, raw_text: str) -> dict:
        """Parse messy scraped text into structured JobDetails schema."""
        client = self._get_client()
        prompt = (
            f"You are a job scraper utility. Clean the following raw web text page and extract "
            f"the structured job details.\n\nRaw Text:\n{raw_text[:12000]}"
        )
        
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=JobDetails,
            ),
        )
        return json.loads(response.text)

    def analyze_resume(self, resume_text: str, job_description: str) -> dict:
        """Analyze original resume against job description and produce metrics."""
        client = self._get_client()
        prompt = (
            f"Compare the candidate's resume text against the job description. Evaluate match rates, "
            f"identify missing skills, keyword gaps, education alignement, and assign an estimated ATS Score.\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Candidate Resume:\n{resume_text}"
        )
        
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ResumeAnalysis,
                temperature=0.2,
            ),
        )
        return json.loads(response.text)

    def optimize_resume(self, resume_text: str, job_description: str, opt_settings: dict) -> dict:
        """
        Optimize the resume to align with the job description.
        Incorporate styling, layout, and mode configuration parameters.
        """
        client = self._get_client()
        
        mode = opt_settings.get("mode", "ATS Mode")
        length = opt_settings.get("length", "Keep Original")
        style = opt_settings.get("style", "Professional")
        
        prompt = (
            f"You are an expert executive resume optimizer. Your task is to optimize the text of the candidate's resume "
            f"to match the job description below. You MUST preserve the exact layout, structure, section ordering, and hierarchy of the original resume.\n\n"
            f"CRITICAL STRUCTURAL PRESERVATION RULES:\n"
            f"- Do NOT change the names, order, or headers of the sections (e.g. keep all headers like 'Work Experience', 'Education', 'Skills' in their exact original order).\n"
            f"- Keep all work experience blocks, job titles, company names, dates, and locations in their exact original position.\n"
            f"- Keep the candidate's contact details unchanged and placed at the top.\n"
            f"- Only optimize the wording and phrasing of the existing bullet points and summaries to align with job keywords and highlight relevant experience.\n"
            f"- Do NOT add new sections or delete existing ones.\n\n"
            f"Optimization Guidelines:\n"
            f"- Optimization Mode: {mode} (If Creative Mode: use dynamic verbs and narrative summary. If ATS Mode: focus on structured headings, keyword density, and clean format.)\n"
            f"- Target Page Length Constraints: {length}\n"
            f"- Resume Style Theme: {style}\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Original Resume:\n{resume_text}\n\n"
            f"Output the results in the requested JSON structure containing the full optimized resume markdown (preserving the original structure) and a clear list of edits."
        )
        
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=OptimizeResult,
                temperature=0.3,
            ),
        )
        return json.loads(response.text)

    def generate_suggestions(self, resume_text: str, job_description: str) -> dict:
        """Generate Cover Letter, Recruiter Email, LinkedIn Summary, LinkedIn Headline, and Prep Questions."""
        client = self._get_client()
        prompt = (
            f"Based on the optimized resume and job description, generate supporting job application collateral: "
            f"a customized Cover Letter, a direct cold email to the hiring recruiter, a polished LinkedIn 'About' summary, "
            f"a professional headline, and a list of target interview questions and prep notes.\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Resume Text:\n{resume_text}"
        )
        
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AISuggestions,
                temperature=0.5,
            ),
        )
        return json.loads(response.text)

    def generate_latex(self, resume_markdown: str) -> str:
        """Converts resume markdown text into professional LaTeX code using the user's specific template layout."""
        client = self._get_client()
        prompt = (
            f"You are a professional LaTeX typesetter specializing in resume formatting.\n"
            f"Convert the following resume markdown into a high-quality LaTeX document that matches EXACTLY the layout, styling, custom commands, margins, and packages shown in the reference template below.\n\n"
            f"--- START OF LATEX TEMPLATE REFERENCE ---\n"
            f"%-------------------------\n"
            f"% Resume in Latex\n"
            f"% Author : Jake Gutierrez\n"
            f"% Based off of: https://github.com/sb2nov/resume\n"
            f"% License : MIT\n"
            f"%------------------------\n\n"
            f"\\documentclass[letterpaper,11pt]{{article}}\n\n"
            f"\\usepackage{{latexsym}}\n"
            f"\\usepackage[empty]{{fullpage}}\n"
            f"\\usepackage{{titlesec}}\n"
            f"\\usepackage{{marvosym}}\n"
            f"\\usepackage[usenames,dvipsnames]{{color}}\n"
            f"\\usepackage{{verbatim}}\n"
            f"\\usepackage{{enumitem}}\n"
            f"\\usepackage[hidelinks]{{hyperref}}\n"
            f"\\usepackage{{fancyhdr}}\n"
            f"\\usepackage[english]{{babel}}\n"
            f"\\usepackage{{tabularx}}\n"
            f"\\usepackage{{fontawesome}}\n"
            f"\\usepackage{{multicol}}\n"
            f"\\setlength{{\\multicolsep}}{{-3.0pt}}\n"
            f"\\setlength{{\\columnsep}}{{-1pt}}\n"
            f"\\input{{glyphtounicode}}\n\n"
            f"%----------FONT OPTIONS----------\n"
            f"% sans-serif\n"
            f"% \\usepackage[sfdefault]{{FiraSans}}\n"
            f"% \\usepackage[sfdefault]{{roboto}}\n"
            f"% \\usepackage[sfdefault]{{noto-sans}}\n"
            f"% \\usepackage[default]{{sourcesanspro}}\n\n"
            f"% serif\n"
            f"% \\usepackage{{CormorantGaramond}}\n"
            f"% \\usepackage{{charter}}\n\n"
            f"\\pagestyle{{fancy}}\n"
            f"\\fancyhf{{}} % clear all header and footer fields\n"
            f"\\fancyfoot{{}}\n"
            f"\\renewcommand{{\\headrulewidth}}{{0pt}}\n"
            f"\\renewcommand{{\\footrulewidth}}{{0pt}}\n\n"
            f"% Adjust margins\n"
            f"\\addtolength{{\\oddsidemargin}}{{-0.6in}}\n"
            f"\\addtolength{{\\evensidemargin}}{{-0.5in}}\n"
            f"\\addtolength{{\\textwidth}}{{1.19in}}\n"
            f"\\addtolength{{\\topmargin}}{{-.7in}}\n"
            f"\\addtolength{{\\textheight}}{{1.4in}}\n\n"
            f"\\urlstyle{{same}}\n\n"
            f"\\raggedbottom\n"
            f"\\raggedright\n"
            f"\\setlength{{\\tabcolsep}}{{0in}}\n\n"
            f"% Sections formatting\n"
            f"\\titleformat{{\\section}}{{\n"
            f"  \\vspace{{-4pt}}\\scshape\\raggedright\\large\\bfseries\n"
            f"}}{{}}{{0em}}{{}}[\\color{{black}}\\titlerule \\vspace{{-5pt}}]\n\n"
            f"% Ensure that generate pdf is machine readable/ATS parsable\n"
            f"\\pdfgentounicode=1\n\n"
            f"%-------------------------\n"
            f"% Custom commands\n"
            f"\\newcommand{{\\resumeItem}}[1]{{\n"
            f"  \\item\\small{{\n"
            f"{{#1 \\vspace{{-2pt}}}}\n"
            f"  }}\n"
            f"}}\n\n"
            f"\\newcommand{{\\classesList}}[4]{{\n"
            f"\\item\\small{{\n"
            f"    {{#1 #2 #3 #4 \\vspace{{-2pt}}}}\n"
            f"  }}\n"
            f"}}\n\n"
            f"\\newcommand{{\\resumeSubheading}}[4]{{\n"
            f"  \\vspace{{-2pt}}\\item\n"
            f"\\begin{{tabular*}}{{1.0\\textwidth}}[t]{{l@{{\\extracolsep{{\\fill}}}}r}}\n"
            f"  \\textbf{{#1}} & \\textbf{{\\small #2}} \\\\\n"
            f"  \\textit{{\\small#3}} & \\textit{{\\small #4}} \\\\\n"
            f"\\end{{tabular*}}\\vspace{{-7pt}}\n"
            f"}}\n\n"
            f"\\newcommand{{\\resumeSubSubheading}}[2]{{\n"
            f"\\item\n"
            f"\\begin{{tabular*}}{{0.97\\textwidth}}{{l@{{\\extracolsep{{\\fill}}}}r}}\n"
            f"  \\textit{{\\small#1}} & \\textit{{\\small #2}} \\\\\n"
            f"\\end{{tabular*}}\\vspace{{-7pt}}\n"
            f"}}\n\n"
            f"\\newcommand{{\\resumeProjectHeading}}[2]{{\n"
            f"\\item\n"
            f"\\begin{{tabular*}}{{1.001\\textwidth}}{{l@{{\\extracolsep{{\\fill}}}}r}}\n"
            f"  \\small#1 & \\textbf{{\\small #2}}\\\\\n"
            f"\\end{{tabular*}}\\vspace{{-7pt}}\n"
            f"}}\n\n"
            f"\\newcommand{{\\resumeSubItem}}[1]{{\\resumeItem{{#1}}\\vspace{{-4pt}}}}\n\n"
            f"\\renewcommand\\labelitemi{{$\\vcenter{{\\hbox{{\\tiny$\\bullet$}}}}$}}\n"
            f"\\renewcommand\\labelitemii{{$\\vcenter{{\\hbox{{\\tiny$\\bullet$}}}}$}}\n\n"
            f"\\newcommand{{\\resumeSubHeadingListStart}}{{\\begin{{itemize}}[leftmargin=0.0in, label={{}}]}}\n"
            f"\\newcommand{{\\resumeSubHeadingListEnd}}{{\\end{{itemize}}}}\n"
            f"\\newcommand{{\\resumeItemListStart}}{{\\begin{{itemize}}}}\n"
            f"\\newcommand{{\\resumeItemListEnd}}{{\\end{{itemize}}\\vspace{{-5pt}}}}\n"
            f"--- END OF LATEX TEMPLATE REFERENCE ---\n\n"
            f"MAPPING INSTRUCTIONS:\n"
            f"1. **Header**: Translate candidate name, phone, email, address/location, and LinkedIn link using \\raisebox, \\faPhone, \\faEnvelope, \\faMapMarker, and \\faLinkedin inside a center environment exactly like the template reference.\n"
            f"2. **Summary**: Map to \\section{{Summary}}, wrap in \\resumeSubHeadingListStart/\\resumeSubHeadingListEnd, and use \\resumeProjectHeading{{}}{{}} to contain the summary paragraph.\n"
            f"3. **Experience/Internships**: Map each position to \\resumeSubheading{{Company/Organization Name}}{{Location}}{{Job Title}}{{Dates}} inside \\resumeSubHeadingListStart/\\resumeSubHeadingListEnd. Use \\resumeItemListStart/\\resumeItemListEnd and \\resumeItem{{...}} for bullet points.\n"
            f"4. **Projects**: Map each project using \\resumeProjectHeading{{\\textbf{{Project Name}} $|$ \\emph{{Technologies Used}}}}{{Dates}} or similar pattern. Use \\resumeItemListStart/\\resumeItemListEnd and \\resumeItem{{...}} for bullets.\n"
            f"5. **Publications**: Map to a section using \\resumeProjectHeading and \\resumeItemListStart/\\resumeItemListEnd for details.\n"
            f"6. **Skills**: Map to \\section{{Skills}} and format EXACTLY like this (pay strict attention to the braces):\n"
            f" \\begin{{itemize}}[leftmargin=0.15in, label={{}}]\n"
            f"    \\small{{\\item{{\n"
            f"     \\textbf{{Category 1}}{{: Skill 1, Skill 2}} \\\\\n"
            f"     \\textbf{{Category 2}}{{: Skill 3, Skill 4}}\n"
            f"    }}}}\n"
            f" \\end{{itemize}}\n"
            f"7. **Education**: Map each degree to \\resumeSubheading{{School Name}}{{Dates}}{{Degree details (including GPA if present)}}{{Location}} inside \\resumeSubHeadingListStart/\\resumeSubHeadingListEnd.\n\n"
            f"8. **Escapes**: Ensure all LaTeX special characters (%, &, $, _, #) are correctly escaped (e.g. \\%, \\&, \\$, \\_, \\#) in the content. For example, 'R&D' must be 'R\\&D'.\n"
            f"9. Return ONLY the raw compiling LaTeX document starting with \\documentclass and ending with \\end{{document}}. Do not include any markdown comments or enclosing ticks.\n\n"
            f"Candidate Resume Markdown:\n{resume_markdown}"
        )
        
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )
        
        text = response.text.strip()
        if text.startswith("```latex"):
            text = text[8:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()
