from sqlalchemy import Column, String
from database import Base

class File(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    status = Column(String)
    audio_path = Column(String)