"""数据统计 API — 仪表盘图表数据源"""
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import VisitorLog
from ..auth import get_current_user

router = APIRouter()


def _check_auth(request: Request):
    """每个 API 调用都验证登录"""
    return get_current_user(request)


@router.get("/api/analytics/overview")
async def overview(request: Request, db: Session = Depends(get_db)):
    _check_auth(request)
    today = date.today()
    yesterday = today - timedelta(days=1)

    today_pv = db.query(func.count(VisitorLog.id)).filter(
        VisitorLog.is_admin == False,
        VisitorLog.visit_date == today,
    ).scalar() or 0

    yesterday_pv = db.query(func.count(VisitorLog.id)).filter(
        VisitorLog.is_admin == False,
        VisitorLog.visit_date == yesterday,
    ).scalar() or 0

    total_pv = db.query(func.count(VisitorLog.id)).filter(
        VisitorLog.is_admin == False,
    ).scalar() or 0

    unique_ips = db.query(func.count(func.distinct(VisitorLog.ip_address))).filter(
        VisitorLog.is_admin == False,
    ).scalar() or 0

    # 今日活跃时段
    now = datetime.utcnow()
    hour_ago = now - timedelta(hours=1)
    last_hour_pv = db.query(func.count(VisitorLog.id)).filter(
        VisitorLog.is_admin == False,
        VisitorLog.created_at >= hour_ago,
    ).scalar() or 0

    return JSONResponse({
        "today_pv": today_pv,
        "yesterday_pv": yesterday_pv,
        "total_pv": total_pv,
        "unique_ips": unique_ips,
        "last_hour_pv": last_hour_pv,
    })


@router.get("/api/analytics/daily")
async def daily_trend(request: Request, days: int = 7, db: Session = Depends(get_db)):
    _check_auth(request)
    start = date.today() - timedelta(days=days - 1)
    rows = (
        db.query(VisitorLog.visit_date, func.count(VisitorLog.id).label("cnt"))
        .filter(VisitorLog.is_admin == False, VisitorLog.visit_date >= start)
        .group_by(VisitorLog.visit_date)
        .order_by(VisitorLog.visit_date)
        .all()
    )

    # 补全缺失的日期
    result = []
    seen = {r.visit_date: r.cnt for r in rows}
    for i in range(days):
        d = start + timedelta(days=i)
        result.append({"date": d.strftime("%m-%d"), "count": int(seen.get(d, 0))})
    return JSONResponse(result)


@router.get("/api/analytics/pages")
async def top_pages(request: Request, limit: int = 10, db: Session = Depends(get_db)):
    _check_auth(request)
    rows = (
        db.query(VisitorLog.path, func.count(VisitorLog.id).label("cnt"))
        .filter(VisitorLog.is_admin == False)
        .group_by(VisitorLog.path)
        .order_by(func.count(VisitorLog.id).desc())
        .limit(limit)
        .all()
    )
    return JSONResponse([{"path": r.path, "count": int(r.cnt)} for r in rows])


@router.get("/api/analytics/hourly")
async def hourly_distribution(request: Request, db: Session = Depends(get_db)):
    _check_auth(request)
    today = date.today()
    rows = (
        db.query(
            func.hour(VisitorLog.created_at).label("h"),
            func.count(VisitorLog.id).label("cnt"),
        )
        .filter(VisitorLog.is_admin == False, VisitorLog.visit_date == today)
        .group_by(func.hour(VisitorLog.created_at))
        .order_by(func.hour(VisitorLog.created_at))
        .all()
    )
    counts = {r.h: r.cnt for r in rows}
    result = [{"hour": f"{h:02d}:00", "count": int(counts.get(h, 0))} for h in range(24)]
    return JSONResponse(result)


@router.get("/api/analytics/recent")
async def recent_visits(request: Request, limit: int = 20, db: Session = Depends(get_db)):
    _check_auth(request)
    rows = (
        db.query(VisitorLog)
        .filter(VisitorLog.is_admin == False)
        .order_by(VisitorLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return JSONResponse([{
        "time": r.created_at.strftime("%H:%M:%S") if r.created_at else "-",
        "date": r.created_at.strftime("%m-%d") if r.created_at else "-",
        "path": r.path,
        "ip": r.ip_address,
        "referer": r.referer[:50] if r.referer else "direct",
    } for r in rows])
