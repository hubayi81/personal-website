"""认证路由：登录/登出"""
from fastapi import APIRouter, Request, Form, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..auth import verify_password, create_session, SESSIONS

router = APIRouter()


@router.get("/admin/login")
async def login_page(request: Request):
    return request.app.state.templates.TemplateResponse("admin/login.html", {
        "request": request,
        "error": "",
    })


@router.post("/admin/login")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        return request.app.state.templates.TemplateResponse("admin/login.html", {
            "request": request,
            "error": "用户名或密码错误",
        })

    session_id = create_session(username)
    response = RedirectResponse(url="/admin", status_code=303)
    response.set_cookie("session_id", session_id, httponly=True, max_age=86400)
    return response


@router.get("/admin/logout")
async def logout(request: Request):
    session_id = request.cookies.get("session_id", "")
    SESSIONS.pop(session_id, None)
    response = RedirectResponse(url="/", status_code=303)
    response.delete_cookie("session_id")
    return response
