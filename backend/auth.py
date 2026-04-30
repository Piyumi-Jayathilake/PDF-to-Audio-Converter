from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    # truncate to 72 bytes BEFORE hashing
    password_bytes = password.encode("utf-8")[:72]
    safe_password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(safe_password)


def verify_password(password: str, hashed: str):
    password_bytes = password.encode("utf-8")[:72]
    safe_password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.verify(safe_password, hashed)