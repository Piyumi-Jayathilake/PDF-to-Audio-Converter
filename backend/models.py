from sqlalchemy import Column, String, ForeignKey
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

class File(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    status = Column(String)
    audio_path = Column(String)
    user_id = Column(String, ForeignKey("users.id"))