from pathlib import Path
import uuid

from fastapi import FastAPI, File, HTTPException, Response, UploadFile, WebSocket
from fastapi.responses import FileResponse
import pyttsx3
from PyPDF2 import PdfReader
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent


@app.get("/")
def root():
    return {
        "message": "PDF-to-audio API is running",
        "docs": "/docs",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    file_id = str(uuid.uuid4())
    pdf_path = BASE_DIR / f"{file_id}.pdf"

    with pdf_path.open("wb") as f:
        f.write(await file.read())

    return {"file_id": file_id, "filename": pdf_path.name}


@app.websocket("/ws/{file_id}")
async def process_pdf(websocket: WebSocket, file_id: str):
    await websocket.accept()

    try:
        pdf_path = BASE_DIR / f"{file_id}.pdf"
        audio_path = BASE_DIR / f"{file_id}.mp3"

        if not pdf_path.exists():
            await websocket.send_json({"error": "PDF file not found"})
            await websocket.close()
            return

        text = ""
        with pdf_path.open("rb") as book:
            reader = PdfReader(book)
            total = len(reader.pages)

            if total == 0:
                await websocket.send_json({"error": "PDF has no pages"})
                await websocket.close()
                return

            for i, page in enumerate(reader.pages):
                text += page.extract_text() or ""
                progress = int(((i + 1) / total) * 100)
                await websocket.send_json({"progress": progress})

        engine = pyttsx3.init()
        engine.save_to_file(text, str(audio_path))
        engine.runAndWait()

        await websocket.send_json({
            "done": True,
            "audio_url": f"/audio/{file_id}",
        })

    except Exception as e:
        await websocket.send_json({"error": str(e)})

    finally:
        await websocket.close()

@app.get("/audio/{file_id}")
def get_audio(file_id: str):
    audio_path = BASE_DIR / f"{file_id}.mp3"
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(str(audio_path), media_type="audio/mpeg")
