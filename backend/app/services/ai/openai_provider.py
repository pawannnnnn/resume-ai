import json
import httpx
from services.ai.base_provider import (
    BaseAIProvider,
    JobDetails,
    ResumeAnalysis,
    OptimizeResult,
    AISuggestions,
)
from utils.logger import logger

class OpenAICompatibleProvider(BaseAIProvider):
    def __init__(self, api_key: str, api_url: str, model: str, client: httpx.Client):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
        self.client = client

    def _call_api(self, prompt: str, schema_class=None, temperature: float = 0.3) -> dict | str:
        if not self.api_key:
            raise ValueError(f"API key is not configured for provider at URL: {self.api_url}")
        if not self.model:
            raise ValueError(f"Model is not configured for provider at URL: {self.api_url}")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.model,
            "temperature": temperature,
        }
        
        if schema_class:
            # We inject the JSON schema into the system prompt to enforce formatting.
            schema_json = json.dumps(schema_class.model_json_schema(), indent=2)
            system_msg = (
                f"You are a helpful assistant. You must respond ONLY with a JSON object conforming to the following JSON schema:\n"
                f"{schema_json}\n"
                f"Do not include any commentary, markdown wrappers (like ```json), or extra text. Output raw JSON only."
            )
            payload["messages"] = [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt}
            ]
            payload["response_format"] = {"type": "json_object"}
        else:
            payload["messages"] = [
                {"role": "user", "content": prompt}
            ]
            
        try:
            logger.info(f"Sending request to OpenAI-compatible provider: {self.api_url} using model: {self.model}")
            response = self.client.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 429:
                logger.warning(f"Rate limited (429) by provider at {self.api_url}")
                response.raise_for_status()
            elif response.status_code != 200:
                logger.error(f"Error status {response.status_code} from provider at {self.api_url}: {response.text}")
                response.raise_for_status()
                
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            
            if schema_class:
                # Clean up any potential markdown ticks added by overzealous models
                cleaned_content = content
                if cleaned_content.startswith("```json"):
                    cleaned_content = cleaned_content[7:]
                elif cleaned_content.startswith("```"):
                    cleaned_content = cleaned_content[3:]
                if cleaned_content.endswith("```"):
                    cleaned_content = cleaned_content[:-3]
                cleaned_content = cleaned_content.strip()
                
                parsed = json.loads(cleaned_content)
                # Validate using Pydantic
                schema_class.model_validate(parsed)
                return parsed
            else:
                return content
                
        except httpx.TimeoutException as e:
            logger.error(f"Timeout calling OpenAI-compatible provider: {str(e)}")
            raise e
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTPStatusError from OpenAI-compatible provider: {str(e)}")
            raise e
        except json.JSONDecodeError as e:
            logger.error(f"JSONDecodeError parsing response: {str(e)}. Raw response: {content}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI-compatible provider call: {str(e)}")
            raise e

    def extract_job_details(self, raw_text: str) -> dict:
        prompt = (
            f"You are a job scraper utility. Clean the following raw web text page and extract "
            f"the structured job details.\n\nRaw Text:\n{raw_text[:12000]}"
        )
        return self._call_api(prompt, schema_class=JobDetails)

    def analyze_resume(self, resume_text: str, job_description: str) -> dict:
        prompt = (
            f"Compare the candidate's resume text against the job description. Evaluate match rates, "
            f"identify missing skills, keyword gaps, education alignement, and assign an estimated ATS Score.\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Candidate Resume:\n{resume_text}"
        )
        return self._call_api(prompt, schema_class=ResumeAnalysis, temperature=0.2)

    def optimize_resume(self, resume_text: str, job_description: str, opt_settings: dict) -> dict:
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
        return self._call_api(prompt, schema_class=OptimizeResult, temperature=0.3)

    def generate_suggestions(self, resume_text: str, job_description: str) -> dict:
        prompt = (
            f"Based on the optimized resume and job description, generate supporting job application collateral: "
            f"a customized Cover Letter, a direct cold email to the hiring recruiter, a polished LinkedIn 'About' summary, "
            f"a professional headline, and a list of target interview questions and prep notes.\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Resume Text:\n{resume_text}"
        )
        return self._call_api(prompt, schema_class=AISuggestions, temperature=0.5)

    def generate_latex(self, resume_markdown: str) -> str:
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
            f"6. **Skills**: Map to \\section{{Skills}} using an itemize list with no bullets, small font, and format items like: \\textbf{{Category Name}}{{: Skill list...}} \\\\\n"
            f"7. **Education**: Map each degree to \\resumeSubheading{{School Name}}{{Dates}}{{Degree details (including GPA if present)}}{{Location}} inside \\resumeSubHeadingListStart/\\resumeSubHeadingListEnd.\n\n"
            f"8. **Escapes**: Ensure all LaTeX special characters (%, &, $, _, #) are correctly escaped (e.g. \\%, \\&, \\$, \\_, \\#) in the content. For example, 'R&D' must be 'R\\&D'.\n"
            f"9. Return ONLY the raw compiling LaTeX document starting with \\documentclass and ending with \\end{{document}}. Do not include any markdown comments or enclosing ticks.\n\n"
            f"Candidate Resume Markdown:\n{resume_markdown}"
        )
        return self._call_api(prompt)
