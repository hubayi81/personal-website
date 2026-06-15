"""前台页面路由"""
import json
from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project, BlogPost, Award, Profile, Milestone, ContactMessage, ContactMessage
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
    for p in featured_projects:
        try: p.tech_list = json.loads(p.tech_stack or "[]")
        except json.JSONDecodeError: p.tech_list = []

    blog_posts = (
        db.query(BlogPost)
        .filter(BlogPost.published == True)
        .order_by(BlogPost.created_at.desc())
        .limit(4)
        .all()
    )
    for bp in blog_posts:
        try: bp.tag_list = json.loads(bp.tags or "[]")
        except json.JSONDecodeError: bp.tag_list = []

    awards = (
        db.query(Award)
        .order_by(Award.sort_order.desc(), Award.created_at.desc())
        .limit(6)
        .all()
    )

    profile = db.query(Profile).filter(Profile.id == 1).first()
    if not profile:
        profile = Profile(id=1, info_items="[]", skills="[]", subtitle="计算机专业在读，热爱 AI 应用开发与开源")
    try: info_list = json.loads(profile.info_items or "[]")
    except json.JSONDecodeError: info_list = []
    try: skill_list = json.loads(profile.skills or "[]")
    except json.JSONDecodeError: skill_list = []
    try: contact_list = json.loads(profile.contact_items or "[]")
    except json.JSONDecodeError: contact_list = []
    try: social_list = json.loads(profile.social_links or "[]")
    except json.JSONDecodeError: social_list = []

    return request.app.state.templates.TemplateResponse("index.html", {
        "request": request,
        "projects": featured_projects,
        "blog_posts": blog_posts,
        "awards": awards,
        "profile": profile,
        "info_list": info_list,
        "skill_list": skill_list,
        "contact_list": contact_list,
        "social_list": social_list,
        "logged_in": login_required(request),
        "page": "home",
    })


@router.get("/about")
async def about(request: Request, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == 1).first()
    if not profile:
        # 返回默认空数据，等管理员初始化
        profile = Profile(id=1, info_items="[]", skills="[]", subtitle="计算机专业在读，热爱 AI 应用开发与开源")

    try:
        info_list = json.loads(profile.info_items or "[]")
    except json.JSONDecodeError:
        info_list = []
    try:
        skill_list = json.loads(profile.skills or "[]")
    except json.JSONDecodeError:
        skill_list = []

    milestones = (
        db.query(Milestone)
        .order_by(Milestone.sort_order.desc(), Milestone.created_at.desc())
        .all()
    )

    return request.app.state.templates.TemplateResponse("about.html", {
        "request": request,
        "profile": profile,
        "info_list": info_list,
        "skill_list": skill_list,
        "milestones": milestones,
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
async def contact(request: Request, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == 1).first()
    contact_list = []; social_list = []
    if profile:
        try: contact_list = json.loads(profile.contact_items or "[]")
        except json.JSONDecodeError: pass
        try: social_list = json.loads(profile.social_links or "[]")
        except json.JSONDecodeError: pass
    return request.app.state.templates.TemplateResponse("contact.html", {
        "request": request,
        "contact_list": contact_list,
        "social_list": social_list,
        "logged_in": login_required(request),
        "page": "contact",
    })


@router.post("/api/contact")
async def submit_contact(
    name: str = Form(...),
    email: str = Form(...),
    message: str = Form(...),
    db: Session = Depends(get_db),
):
    """游客提交留言 → 写入数据库"""
    if not name.strip() or not message.strip():
        return JSONResponse({"success": False, "error": "名字和留言不能为空"}, status_code=400)
    msg = ContactMessage(
        sender_name=name.strip(),
        sender_email=email.strip(),
        message=message.strip(),
    )
    db.add(msg)
    db.commit()
    return JSONResponse({"success": True})


@router.get("/awards")
async def awards(request: Request, db: Session = Depends(get_db)):
    all_awards = (
        db.query(Award)
        .order_by(Award.sort_order.desc(), Award.created_at.desc())
        .all()
    )
    return request.app.state.templates.TemplateResponse("awards.html", {
        "request": request,
        "awards": all_awards,
        "logged_in": login_required(request),
        "page": "awards",
    })
