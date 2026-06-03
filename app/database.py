"""数据库连接管理"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_size=5, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI 依赖注入：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """创建所有表并处理新增列"""
    Base.metadata.create_all(bind=engine)
    # 为已有表添加新列（兼容升级）
    with engine.connect() as conn:
        for col, col_def in [
            ("star_count", "INT DEFAULT 0"),
            ("user_count", "INT DEFAULT 0"),
        ]:
            try:
                conn.execute(text(
                    f"ALTER TABLE projects ADD COLUMN {col} {col_def}"
                ))
                conn.commit()
            except Exception:
                pass  # 列已存在则忽略
