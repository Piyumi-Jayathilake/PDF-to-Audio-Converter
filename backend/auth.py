from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _bcrypt_safe_password(password: str) -> str:
    """Truncate password to bcrypt's 72-byte limit safely for UTF-8 strings."""
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def hash_password(password: str):
    password = _bcrypt_safe_password(password)
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str):
    password = _bcrypt_safe_password(password)
    return pwd_context.verify(password, hashed)