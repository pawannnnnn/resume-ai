import re
import urllib.parse
import requests
from bs4 import BeautifulSoup
from utils.logger import logger
from config import settings

class JobScraper:
    def __init__(self, ai_service=None):
        self.ai_service = ai_service

    def detect_platform(self, url: str) -> str:
        """Automatically detect the job portal platform from the URL."""
        parsed_url = urllib.parse.urlparse(url)
        domain = parsed_url.netloc.lower()
        path = parsed_url.path.lower()
        
        if "greenhouse.io" in domain:
            return "Greenhouse"
        elif "lever.co" in domain:
            return "Lever"
        elif "ashbyhq.com" in domain:
            return "Ashby"
        elif "smartrecruiters.com" in domain or "smartrecruiters" in path:
            return "SmartRecruiters"
        elif "myworkdayjobs.com" in domain or "workday" in domain:
            return "Workday"
        elif "oracle" in domain or "oraclecloud.com" in domain or "taleo.net" in domain:
            return "Oracle Careers"
        elif "successfactors" in domain or "sfshare" in domain:
            return "SAP SuccessFactors"
        else:
            return "Generic / Webpage"

    def _clean_html(self, html_content: str) -> str:
        """Strip scripts, styles, and other metadata to leave readable text."""
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Remove non-textual or irrelevant tags
        for element in soup(["script", "style", "nav", "header", "footer", "aside", "head", "title", "meta"]):
            element.decompose()
            
        # Get clean text
        text = soup.get_text(separator="\n")
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return "\n".join(chunk for chunk in chunks if chunk)

    def scrape_job_description(self, url: str) -> dict:
        """
        Scrapes job description from a URL.
        Falls back to AI extraction if the content is client-side rendered or scraping is blocked.
        """
        platform = self.detect_platform(url)
        logger.info(f"Scraping job from {url} (Detected: {platform})")
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            html = response.text
        except Exception as e:
            logger.warning(f"HTTP request to job URL failed: {str(e)}. Attempting AI fallback if raw content was retrieved.")
            html = ""
            
        # Parse text using BeautifulSoup selectors based on platform
        scraped_text = ""
        title = "Unknown Job"
        company = "Unknown Company"
        
        if html:
            soup = BeautifulSoup(html, "html.parser")
            
            # Platform-specific scraping selectors
            if platform == "Greenhouse":
                # Greenhouse usually has title inside .app-title and description inside #content
                title_elem = soup.find(class_="app-title")
                title = title_elem.text.strip() if title_elem else title
                
                company_elem = soup.find(class_="company-name") or soup.find(class_="company")
                company = company_elem.text.strip() if company_elem else company
                
                desc_elem = soup.find(id="content") or soup.find(class_="job-description") or soup.find(id="main")
                if desc_elem:
                    scraped_text = desc_elem.get_text(separator="\n")
                    
            elif platform == "Lever":
                # Lever usually has title inside h2 and description inside .section.page-centered
                title_elem = soup.find("h2")
                title = title_elem.text.strip() if title_elem else title
                
                # Check for logo or title for company name, Lever URLs are jobs.lever.co/company_name/job_id
                path_parts = urllib.parse.urlparse(url).path.split("/")
                if len(path_parts) > 1:
                    company = path_parts[1].capitalize()
                    
                desc_elems = soup.find_all(class_="section")
                if desc_elems:
                    scraped_text = "\n".join(e.get_text(separator="\n") for e in desc_elems)
                    
            elif platform == "Ashby":
                # Ashby listings usually have description inside class containing "job-description" or similar
                title_elem = soup.find("h1")
                title = title_elem.text.strip() if title_elem else title
                
                desc_elem = soup.find(class_=re.compile(r"description|job_description|body", re.I))
                if desc_elem:
                    scraped_text = desc_elem.get_text(separator="\n")
                    
            elif platform == "SmartRecruiters":
                title_elem = soup.find(class_="job-title") or soup.find("h1")
                title = title_elem.text.strip() if title_elem else title
                
                company_elem = soup.find(class_="company-name") or soup.find(class_="company")
                company = company_elem.text.strip() if company_elem else company
                
                desc_elems = soup.find_all(class_=re.compile(r"job-section|description|details", re.I))
                if desc_elems:
                    scraped_text = "\n".join(e.get_text(separator="\n") for e in desc_elems)
            
            # If standard scraping did not yield substantial content, clean all HTML and try AI parsing
            if not scraped_text:
                scraped_text = self._clean_html(html)
        
        # If we failed to get HTML or the extracted text is too short to be a job description, we raise an error
        # or we try to pass whatever text we scraped to the AI fallback to extract.
        if len(scraped_text) < 100:
            if not html:
                raise ValueError("Could not access the job page. The website might be blocking requests or the URL is invalid.")
            raise ValueError("Could not extract a valid job description from the page.")
            
        # Trigger AI fallback if we have a clean text dump, to parse it into structured title, company, description
        if self.ai_service:
            try:
                logger.info("Using AI service to clean and extract job details from raw text")
                extracted_data = self.ai_service.extract_job_details(scraped_text)
                return {
                    "platform": platform,
                    "title": extracted_data.get("title", title),
                    "company": extracted_data.get("company", company),
                    "description": extracted_data.get("description", scraped_text)
                }
            except Exception as ai_err:
                logger.error(f"AI job extraction fallback failed: {str(ai_err)}. Returning BeautifulSoup parsed text.")
        
        # Fallback to basic dictionary if AI is unavailable or failed
        return {
            "platform": platform,
            "title": title,
            "company": company,
            "description": scraped_text
        }
