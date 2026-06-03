"""前台页面路由"""
import json
from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project, BlogPost
from ..auth import login_required

router = APIRouter()


@router.get("/")
async def home(request: Request, db: Session = Depends(get_db)):
    featured_projects = (
        db.query(Project)
        .filter(Project.featured == True)
        .order_by(Project.sort_order.desc())
        .limit(6)
        .all()
    )
    return request.app.state.templates.TemplateResponse("index.html", {
        "request": request,
        "projects": featured_projects,
        "logged_in": login_required(request),
        "page": "home",
    })


@router.get("/about")
async def about(request: Request):
    return request.app.state.templates.TemplateResponse("about.html", {
        "request": request,
        "logged_in": login_required(request),
        "page": "about",
    })


@router.get("/projects")
async def projects(request: Request, db: Session = Depends(get_db)):
    all_projects = (
        db.query(Project)
        .order_by(Project.sort_order.desc(), Project.created_at.desc())
        .all()
    )
    # 解析 tech_stack JSON
    for p in all_projects:
        try:
            p.tech_list = json.loads(p.tech_stack or "[]")
        except json.JSONDecodeError:
            p.tech_list = []
    return request.app.state.templates.TemplateResponse("projects.html", {
        "request": request,
        "projects": all_projects,
        "logged_in": login_required(request),
        "page": "projects",
    })


@router.get("/blog")
async def blog_list(request: Request, db: Session = Depends(get_db)):
    posts = (
        db.query(BlogPost)
        .filter(BlogPost.published == True)
        .order_by(BlogPost.created_at.desc())
        .all()
    )
    for p in posts:
        try:
            p.tag_list = json.loads(p.tags or "[]")
        except json.JSONDecodeError:
            p.tag_list = []
    return request.app.state.templates.TemplateResponse("blog.html", {
        "request": request,
        "posts": posts,
        "logged_in": login_required(request),
        "page": "blog",
    })


@router.get("/blog/{slug}")
async def blog_detail(request: Request, slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.published == True).first()
    if not post:
        return request.app.state.templates.TemplateResponse("404.html", {
            "request": request,
            "logged_in": login_required(request),
            "page": "404",
        }, status_code=404)
    try:
        post.tag_list = json.loads(post.tags or "[]")
    except json.JSONDecodeError:
        post.tag_list = []
    # Markdown 转 HTML
    import markdown
    post.html_content = markdown.markdown(
        post.content or "",
        extensions=["fenced_code", "codehilite", "tables"],
    )
    return request.app.state.templates.TemplateResponse("blog_detail.html", {
        "request": request,
        "post": post,
        "logged_in": login_required(request),
        "page": "blog",
    })


@router.get("/projects/{project_id}")
async def project_detail(request: Request, project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return request.app.state.templates.TemplateResponse("404.html", {
            "request": request,
            "logged_in": login_required(request),
            "page": "404",
        }, status_code=404)
    try:
        project.tech_list = json.loads(project.tech_stack or "[]")
    except json.JSONDecodeError:
        project.tech_list = []
    return request.app.state.templates.TemplateResponse("project_detail.html", {
        "request": request,
        "project": project,
        "logged_in": login_required(request),
        "page": "projects",
    })


@router.get("/contact")
async def contact(request: Request):
    return request.app.state.templates.TemplateResponse("contact.html", {
        "request": request,
        "logged_in": login_required(request),
        "page": "contact",
    })
