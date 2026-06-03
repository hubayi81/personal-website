"""SQLAlchemy ORM 模型"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    tech_stack = Column(Text, default="[]")  # JSON 数组字符串
    image_url = Column(String(500), default="")
    github_url = Column(String(500), default="")
    live_url = Column(String(500), default="")
    featured = Column(Boolean, default=False)
    star_count = Column(Integer, default=0)
    user_count = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    slug = Column(String(300), unique=True, nullable=False)
    summary = Column(String(500), default="")
    content = Column(Text)
    tags = Column(Text, default="[]")  # JSON 数组字符串
    published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
