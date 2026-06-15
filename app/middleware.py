"""FastAPI 中间件 — 每次 HTTP 请求自动记录访问日志"""
from datetime import date, datetime
from starlette.middleware.base import BaseHTTPMiddleware
from .database import SessionLocal
from .models import VisitorLog


SKIP_PREFIXES = ("/static", "/uploads", "/api", "/favicon.ico")


class VisitTrackerMiddleware(BaseHTTPMiddleware):
    """记录每一次前台页面访问"""

    async def dispatch(self, request, call_next):
        response = await call_next(request)

        path = request.url.path

        # 跳过静态资源和 API
        if any(path.startswith(p) for p in SKIP_PREFIXES):
            return response

        # 只记录成功的 GET 请求（页面浏览）
        if request.method != "GET":
            return response
        if response.status_code >= 400:
            return response

        # 异步写入数据库（不阻塞请求响应）
        try:
            db = SessionLocal()
            ip = request.client.host if request.client else ""
            ua = request.headers.get("user-agent", "")[:500]
            ref = request.headers.get("referer", "")[:500]
            is_admin = path.startswith("/admin")

            log = VisitorLog(
                path=path,
                ip_address=ip,
                user_agent=ua,
                referer=ref,
                is_admin=is_admin,
                visit_date=date.today(),
                created_at=datetime.utcnow(),
            )
            db.add(log)
            db.commit()
        except Exception:
            pass  # 记录失败不影响正常响应
        finally:
            db.close()

        return response
