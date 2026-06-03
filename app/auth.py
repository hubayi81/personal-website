"""认证工具：密码哈希 + session 管理"""
import hashlib
import secrets
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from .models import User
from .config import SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD


def hash_password(password: str) -> str:
    """SHA256 加盐哈希（简单方案，够用）"""
    salt = SECRET_KEY[:16]
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


# === Session 管理（用 cookie 存 session_id） ===
SESSIONS = {}  # session_id → username


def create_session(username: str) -> str:
    session_id = secrets.token_hex(32)
    SESSIONS[session_id] = username
    return session_id


def get_current_user(request: Request) -> str:
    """从 cookie 获取当前登录用户"""
    session_id = request.cookies.get("session_id", "")
    username = SESSIONS.get(session_id)
    if not username:
        raise HTTPException(status_code=401, detail="未登录")
    return username


def login_required(request: Request):
    """模板中判断是否已登录"""
    session_id = request.cookies.get("session_id", "")
    return session_id in SESSIONS


def create_admin(db: Session):
    """初始化管理员账号（仅当不存在时创建）"""
    admin = db.query(User).filter(User.username == ADMIN_USERNAME).first()
    if not admin:
        admin = User(
            username=ADMIN_USERNAME,
            password_hash=hash_password(ADMIN_PASSWORD),
        )
        db.add(admin)
        db.commit()
