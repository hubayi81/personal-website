"""后台管理路由 + CRUD API"""
import json
from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project, BlogPost
from ..auth import get_current_user, login_required

router = APIRouter()


# === 中间件简化为依赖函数 ===
async def require_admin(request: Request):
    """在每个后台路由中手动调用以保护页面"""
    if not login_required(request):
        return RedirectResponse(url="/admin/login", status_code=303)
    return None


# ===== 仪表盘 =====
@router.get("/admin")
async def dashboard(request: Request, db: Session = Depends(get_db)):
    redirect = await require_admin(request)
    if redirect:
        return redirect
    project_count = db.query(Project).count()
    blog_count = db.query(BlogPost).count()
    published_blog_count = db.query(BlogPost).filter(BlogPost.published == True).count()
    return request.app.state.templates.TemplateResponse("admin/dashboard.html", {
        "request": request,
        "logged_in": True,
        "project_count": project_count,
        "blog_count": blog_count,
        "published_blog_count": published_blog_count,
    })


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
