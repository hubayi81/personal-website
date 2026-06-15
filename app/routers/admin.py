"""后台管理路由 + CRUD API"""
import json
import os
import uuid
from fastapi import APIRouter, Request, Form, Depends, HTTPException, UploadFile, File
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project, BlogPost, Award, Profile, Milestone, ContactMessage
from ..auth import get_current_user, login_required

router = APIRouter()

UPLOAD_DIR = os.path.join("app", "static", "uploads")


# === 中间件简化为依赖函数 ===
async def require_admin(request: Request):
    """在每个后台路由中手动调用以保护页面"""
    if not login_required(request):
        return RedirectResponse(url="/admin/login", status_code=303)
    return None


# ===== 文件上传 =====
@router.post("/api/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    _ = get_current_user(request)
    # 生成唯一文件名
    ext = os.path.splitext(file.filename or ".png")[1].lower()
    if ext not in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"):
        raise HTTPException(status_code=400, detail="不支持的图片格式")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_name)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    return JSONResponse({"success": True, "url": f"/uploads/{unique_name}"})


# ===== 仪表盘 =====
@router.get("/admin")
async def dashboard(request: Request, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    project_count = db.query(Project).count()
    blog_count = db.query(BlogPost).count()
    published_blog_count = db.query(BlogPost).filter(BlogPost.published == True).count()
    award_count = db.query(Award).count()
    unread_count = db.query(ContactMessage).filter(ContactMessage.is_read == False).count()
    return request.app.state.templates.TemplateResponse("admin/dashboard.html", {
        "request": request,
        "logged_in": True,
        "project_count": project_count,
        "blog_count": blog_count,
        "published_blog_count": published_blog_count,
        "award_count": award_count,
        "unread_count": unread_count,
    })


# ===== 个人信息编辑 =====
@router.get("/admin/profile")
async def admin_profile(request: Request, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect: return redirect
    profile = db.query(Profile).filter(Profile.id == 1).first()
    if not profile:
        profile = Profile(id=1, info_items="[]", skills="[]")
        db.add(profile); db.commit()
    try: info_list = json.loads(profile.info_items or "[]")
    except json.JSONDecodeError: info_list = []
    try: skill_list = json.loads(profile.skills or "[]")
    except json.JSONDecodeError: skill_list = []
    try: contact_list = json.loads(profile.contact_items or "[]")
    except json.JSONDecodeError: contact_list = []
    try: social_list = json.loads(profile.social_links or "[]")
    except json.JSONDecodeError: social_list = []
    return request.app.state.templates.TemplateResponse("admin/profile.html", {
        "request": request, "logged_in": True, "profile": profile,
        "info_list": info_list, "skill_list": skill_list,
        "contact_list": contact_list, "social_list": social_list,
    })


@router.post("/api/profile")
async def update_profile(
    request: Request,
    avatar_emoji: str = Form("🧑‍💻"),
    subtitle: str = Form(""),
    info_items: str = Form("[]"),
    skills: str = Form("[]"),
    github_username: str = Form("hubayi81"),
    contact_items: str = Form("[]"),
    social_links: str = Form("[]"),
    db: Session = Depends(get_db),
):
    _ = get_current_user(request)
    profile = db.query(Profile).filter(Profile.id == 1).first()
    if not profile:
        profile = Profile(id=1)
        db.add(profile)
    profile.avatar_emoji = avatar_emoji
    profile.subtitle = subtitle
    profile.info_items = info_items
    profile.skills = skills
    profile.github_username = github_username
    profile.contact_items = contact_items
    profile.social_links = social_links
    db.commit()
    return JSONResponse({"success": True})


# ===== 里程碑管理 =====
@router.get("/admin/milestones")
async def admin_milestones(request: Request, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect: return redirect
    milestones = db.query(Milestone).order_by(Milestone.sort_order.desc(), Milestone.created_at.desc()).all()
    return request.app.state.templates.TemplateResponse("admin/milestones.html", {
        "request": request, "logged_in": True, "milestones": milestones,
    })


@router.get("/admin/milestones/new")
async def admin_milestone_new(request: Request):
    redirect = await require_admin(request)
    if redirect: return redirect
    return request.app.state.templates.TemplateResponse("admin/milestone_editor.html", {
        "request": request, "logged_in": True, "milestone": None, "is_new": True,
    })


@router.get("/admin/milestones/{m_id}/edit")
async def admin_milestone_edit(request: Request, m_id: int, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect: return redirect
    milestone = db.query(Milestone).filter(Milestone.id == m_id).first()
    if not milestone: return RedirectResponse(url="/admin/milestones", status_code=303)
    return request.app.state.templates.TemplateResponse("admin/milestone_editor.html", {
        "request": request, "logged_in": True, "milestone": milestone, "is_new": False,
    })


# ===== Milestone API =====
@router.post("/api/milestones")
async def create_milestone(
    request: Request, date: str = Form(...), title: str = Form(...),
    description: str = Form(""), badge: str = Form("badge-tech"),
    sort_order: int = Form(0), db: Session = Depends(get_db),
):
    _ = get_current_user(request)
    m = Milestone(date=date, title=title, description=description, badge=badge, sort_order=sort_order)
    db.add(m); db.commit()
    return JSONResponse({"success": True, "id": m.id})


@router.put("/api/milestones/{m_id}")
async def update_milestone(
    request: Request, m_id: int, date: str = Form(...), title: str = Form(...),
    description: str = Form(""), badge: str = Form("badge-tech"),
    sort_order: int = Form(0), db: Session = Depends(get_db),
):
    _ = get_current_user(request)
    m = db.query(Milestone).filter(Milestone.id == m_id).first()
    if not m: raise HTTPException(status_code=404, detail="不存在")
    m.date = date; m.title = title; m.description = description
    m.badge = badge; m.sort_order = sort_order
    db.commit()
    return JSONResponse({"success": True})


@router.delete("/api/milestones/{m_id}")
async def delete_milestone(request: Request, m_id: int, db: Session = Depends(get_db)):
    _ = get_current_user(request)
    m = db.query(Milestone).filter(Milestone.id == m_id).first()
    if not m: raise HTTPException(status_code=404, detail="不存在")
    db.delete(m); db.commit()
    return JSONResponse({"success": True})


# ===== 收件箱（联系我留言管理） =====
@router.get("/admin/inbox")
async def admin_inbox(request: Request, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect: return redirect
    messages = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    unread_count = db.query(ContactMessage).filter(ContactMessage.is_read == False).count()
    return request.app.state.templates.TemplateResponse("admin/inbox.html", {
        "request": request, "logged_in": True,
        "messages": messages, "unread_count": unread_count,
    })


@router.post("/api/inbox/{msg_id}/read")
async def mark_read(request: Request, msg_id: int, db: Session = Depends(get_db)):
    _ = get_current_user(request)
    msg = db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()
    if msg:
        msg.is_read = True
        db.commit()
    return JSONResponse({"success": True})


@router.delete("/api/inbox/{msg_id}")
async def delete_message(request: Request, msg_id: int, db: Session = Depends(get_db)):
    _ = get_current_user(request)
    msg = db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()
    if msg:
        db.delete(msg)
        db.commit()
    return JSONResponse({"success": True})


# ===== 项目管理页面 =====
@router.get("/admin/projects")
async def admin_projects(request: Request, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    projects = db.query(Project).order_by(Project.sort_order.desc(), Project.created_at.desc()).all()
    return request.app.state.templates.TemplateResponse("admin/projects.html", {
        "request": request,
        "logged_in": True,
        "projects": projects,
    })


@router.get("/admin/projects/new")
async def admin_project_new(request: Request):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    return request.app.state.templates.TemplateResponse("admin/project_editor.html", {
        "request": request,
        "logged_in": True,
        "project": None,
        "is_new": True,
    })


@router.get("/admin/projects/{project_id}/edit")
async def admin_project_edit(request: Request, project_id: int, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return RedirectResponse(url="/admin/projects", status_code=303)
    return request.app.state.templates.TemplateResponse("admin/project_editor.html", {
        "request": request,
        "logged_in": True,
        "project": project,
        "is_new": False,
    })


# ===== 博客管理页面 =====
@router.get("/admin/blogs")
async def admin_blogs(request: Request, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    posts = db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()
    return request.app.state.templates.TemplateResponse("admin/blogs.html", {
        "request": request,
        "logged_in": True,
        "posts": posts,
    })


@router.get("/admin/blogs/new")
async def admin_blog_new(request: Request):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    return request.app.state.templates.TemplateResponse("admin/blog_editor.html", {
        "request": request,
        "logged_in": True,
        "post": None,
        "is_new": True,
    })


@router.get("/admin/blogs/{post_id}/edit")
async def admin_blog_edit(request: Request, post_id: int, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        return RedirectResponse(url="/admin/blogs", status_code=303)
    return request.app.state.templates.TemplateResponse("admin/blog_editor.html", {
        "request": request,
        "logged_in": True,
        "post": post,
        "is_new": False,
    })


# ===== 奖项管理页面 =====
@router.get("/admin/awards")
async def admin_awards(request: Request, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    awards = db.query(Award).order_by(Award.sort_order.desc(), Award.created_at.desc()).all()
    return request.app.state.templates.TemplateResponse("admin/awards.html", {
        "request": request,
        "logged_in": True,
        "awards": awards,
    })


@router.get("/admin/awards/new")
async def admin_award_new(request: Request):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    return request.app.state.templates.TemplateResponse("admin/award_editor.html", {
        "request": request,
        "logged_in": True,
        "award": None,
        "is_new": True,
    })


@router.get("/admin/awards/{award_id}/edit")
async def admin_award_edit(request: Request, award_id: int, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    award = db.query(Award).filter(Award.id == award_id).first()
    if not award:
        return RedirectResponse(url="/admin/awards", status_code=303)
    return request.app.state.templates.TemplateResponse("admin/award_editor.html", {
        "request": request,
        "logged_in": True,
        "award": award,
        "is_new": False,
    })


# ===== Award CRUD API =====
@router.post("/api/awards")
async def create_award(
    request: Request,
    title: str = Form(...),
    organization: str = Form(""),
    award_date: str = Form(""),
    description: str = Form(""),
    image_url: str = Form(""),
    sort_order: int = Form(0),
    db: Session = Depends(get_db),
):
    _ = get_current_user(request)
    award = Award(
        title=title,
        organization=organization,
        award_date=award_date,
        description=description,
        image_url=image_url,
        sort_order=sort_order,
    )
    db.add(award)
    db.commit()
    return JSONResponse({"success": True, "id": award.id})


@router.put("/api/awards/{award_id}")
async def update_award(
    request: Request,
    award_id: int,
    title: str = Form(...),
    organization: str = Form(""),
    award_date: str = Form(""),
    description: str = Form(""),
    image_url: str = Form(""),
    sort_order: int = Form(0),
    db: Session = Depends(get_db),
):
    _ = get_current_user(request)
    award = db.query(Award).filter(Award.id == award_id).first()
    if not award:
        raise HTTPException(status_code=404, detail="奖项不存在")
    award.title = title
    award.organization = organization
    award.award_date = award_date
    award.description = description
    award.image_url = image_url
    award.sort_order = sort_order
    db.commit()
    return JSONResponse({"success": True})


@router.delete("/api/awards/{award_id}")
async def delete_award(request: Request, award_id: int, db: Session = Depends(get_db)):
    _ = get_current_user(request)
    award = db.query(Award).filter(Award.id == award_id).first()
    if not award:
        raise HTTPException(status_code=404, detail="奖项不存在")
    db.delete(award)
    db.commit()
    return JSONResponse({"success": True})


# ===== Project CRUD API =====
@router.post("/api/projects")
async def create_project(
    request: Request,
    title: str = Form(...),
    description: str = Form(""),
    tech_stack: str = Form("[]"),
    image_url: str = Form(""),
    github_url: str = Form(""),
    live_url: str = Form(""),
    featured: bool = Form(False),
    star_count: int = Form(0),
    user_count: int = Form(0),
    sort_order: int = Form(0),
    db: Session = Depends(get_db),
):
    _ = get_current_user(request)  # 验证登录
    project = Project(
        title=title,
        description=description,
        tech_stack=tech_stack,
        image_url=image_url,
        github_url=github_url,
        live_url=live_url,
        featured=featured,
        star_count=star_count,
        user_count=user_count,
        sort_order=sort_order,
    )
    db.add(project)
    db.commit()
    return JSONResponse({"success": True, "id": project.id})


@router.put("/api/projects/{project_id}")
async def update_project(
    request: Request,
    project_id: int,
    title: str = Form(...),
    description: str = Form(""),
    tech_stack: str = Form("[]"),
    image_url: str = Form(""),
    github_url: str = Form(""),
    live_url: str = Form(""),
    featured: bool = Form(False),
    star_count: int = Form(0),
    user_count: int = Form(0),
    sort_order: int = Form(0),
    db: Session = Depends(get_db),
):
    _ = get_current_user(request)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    project.title = title
    project.description = description
    project.tech_stack = tech_stack
    project.image_url = image_url
    project.github_url = github_url
    project.live_url = live_url
    project.featured = featured
    project.star_count = star_count
    project.user_count = user_count
    project.sort_order = sort_order
    db.commit()
    return JSONResponse({"success": True})


@router.delete("/api/projects/{project_id}")
async def delete_project(request: Request, project_id: int, db: Session = Depends(get_db)):
    _ = get_current_user(request)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    db.delete(project)
    db.commit()
    return JSONResponse({"success": True})


# ===== Blog CRUD API =====
@router.post("/api/blogs")
async def create_blog(
    request: Request,
    title: str = Form(...),
    slug: str = Form(...),
    summary: str = Form(""),
    content: str = Form(""),
    tags: str = Form("[]"),
    published: bool = Form(False),
    db: Session = Depends(get_db),
):
    _ = get_current_user(request)
    post = BlogPost(
        title=title,
        slug=slug,
        summary=summary,
        content=content,
        tags=tags,
        published=published,
    )
    db.add(post)
    db.commit()
    return JSONResponse({"success": True, "id": post.id})


@router.put("/api/blogs/{post_id}")
async def update_blog(
    request: Request,
    post_id: int,
    title: str = Form(...),
    slug: str = Form(...),
    summary: str = Form(""),
    content: str = Form(""),
    tags: str = Form("[]"),
    published: bool = Form(False),
    db: Session = Depends(get_db),
):
    _ = get_current_user(request)
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    post.title = title
    post.slug = slug
    post.summary = summary
    post.content = content
    post.tags = tags
    post.published = published
    db.commit()
    return JSONResponse({"success": True})


@router.delete("/api/blogs/{post_id}")
async def delete_blog(request: Request, post_id: int, db: Session = Depends(get_db)):
    _ = get_current_user(request)
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    db.delete(post)
    db.commit()
    return JSONResponse({"success": True})
