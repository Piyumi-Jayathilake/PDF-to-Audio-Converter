from pathlib import Path
import uuid

from fastapi import FastAPI, File, HTTPException, Response, UploadFile, WebSocket, Form, Header
from fastapi.responses import FileResponse
import pyttsx3
from PyPDF2 import PdfReader
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
import models

from auth import hash_password, verify_password

from token import create_token, verify_token

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

file_settings = {}


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
async def upload_file(
    file: UploadFile = File(...),
    voice: str = Form(...),
    speed: float = Form(...),
    authorization: str = Header(...)

):

    token = authorization.split(" ")[1]
    payload = verify_token(token)
    user_id = payload["user_id"]
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    file_id = str(uuid.uuid4())
    pdf_path = BASE_DIR / f"{file_id}.pdf"

    with pdf_path.open("wb") as f:
        f.write(await file.read())
    
    db = SessionLocal()

    new_file = models.File(
        id=file_id,
        filename=pdf_path.name,
        status="processing",
        audio_path="",
        user_id=user_id
    )

    db.add(new_file)
    db.commit()
    db.close()

    file_settings[file_id] = {
        "voice": voice,
        "speed": speed
    }

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

        settings = file_settings.get(file_id, {})
        voice = settings.get("voice", "female")
        speed = settings.get("speed", 1)

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

        rate = engine.getProperty('rate')

        if speed < 1:
            engine.setProperty('rate', int(rate * 0.7))
        elif speed > 1:
            engine.setProperty('rate', int(rate * 1.3))
        else:
            engine.setProperty('rate', rate)

        voices = engine.getProperty('voices')

        if voice == "male" and len(voices) > 0:
            engine.setProperty('voice', voices[0].id)
        elif voice == "female" and len(voices) > 1:
            engine.setProperty('voice', voices[1].id)

        engine.save_to_file(text, str(audio_path))
        
    engine.runAndWait()

        db = SessionLocal()

        file_record = db.query(models.File).filter(models.File.id == file_id).first()

        if file_record:
            file_record.status = "done"
            file_record.audio_path = str(audio_path)

        db.commit()
        db.close()

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

@app.get("/files")
def get_files(authorization: str = Header(...)):
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    user_id = payload["user_id"]

    db = SessionLocal()
    files = db.query(models.File).filter(models.File.user_id == user_id).all()
    db.close()
 return files

@app.post("/signup")
def signup(email: str = Form(...), password: str = Form(...)):
    db = SessionLocal()

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        db.close()
        return {"error": "User already exists"}

    user = models.User(
        id=str(uuid.uuid4()),
        email=email,
        password=hash_password(password)
    )

    db.add(user)
    db.commit()
    db.close()

    return {"message": "User created"}

@app.post("/login")
def login(email: str = Form(...), password: str = Form(...)):
    db = SessionLocal()

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user or not verify_password(password, user.password):
        db.close()
        return {"error": "Invalid credentials"}
        token = create_token({"user_id": user.id})

    db.close()

    return {
        "message": "Login successful",
        "access_token": token
    }