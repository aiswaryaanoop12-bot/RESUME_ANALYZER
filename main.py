from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
from pypdf import PdfReader
from io import BytesIO
import os
import json
import time

# ----------------------------
# LOAD ENV
# ----------------------------
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise Exception("GROQ_API_KEY missing")

client = Groq(api_key=api_key)

# ----------------------------
# APP INIT
# ----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# HEALTH CHECK
# ----------------------------
@app.get("/")
def home():
    return {"message": "API working"}

@app.get("/health")
def health():
    return {"status": "ok"}

# ----------------------------
# EXTRACT PDF TEXT
# ----------------------------
def extract_text(file_bytes: bytes):
    reader = PdfReader(BytesIO(file_bytes))
    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    return text.strip()

# ----------------------------
# ANALYZE RESUME
# ----------------------------
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    start_time = time.time()

    if not file.filename.endswith(".pdf"):
        return {"error": "Only PDF files allowed"}

    contents = await file.read()

    if len(contents) > 2 * 1024 * 1024:
        return {"error": "File too large (max 2MB)"}

    resume_text = extract_text(contents)

    if not resume_text:
        return {"error": "Could not read PDF text"}

    prompt = f"""
You are a professional ATS Resume Analyzer.

Analyze the resume and return ONLY valid JSON.

JSON format:

{{
  "ats_score": number,
  "summary": "short professional summary",
  "skills": [string],
  "strengths": [string],
  "weaknesses": [string],
  "missing_skills": [string],
  "improvements": [string]
}}

Rules:
- ats_score must be between 0 and 100
- summary should be 2-3 professional sentences
- strengths must be an array of strings
- weaknesses must be an array of strings
- missing_skills must be an array of strings
- improvements must be an array of strings
- Return ONLY JSON
- No markdown
- No explanations
- skills should contain important skills detected from the resume

Resume:
{resume_text}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        raw_content = response.choices[0].message.content

        try:
            result = json.loads(raw_content)
        except Exception:
            result = {
                "error": "Failed to parse JSON",
                "raw_output": raw_content
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "filename": file.filename,
        "processing_time": round(time.time() - start_time, 2),
        "result": result
    }
