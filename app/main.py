"""FastAPI 入口"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

from .database import init_db, SessionLocal
from .auth import create_admin
from .routers import pages, auth as auth_routes, admin
from .models import BlogPost


def seed_blog_posts():
    """首次启动时插入 3 篇默认博客（仅当博客表为空时）"""
    db = SessionLocal()
    try:
        if db.query(BlogPost).count() > 0:
            return
        posts = [
            BlogPost(
                title="FastAPI vs Flask：为什么我选择了 FastAPI 做个人网站",
                slug="fastapi-vs-flask",
                summary="从 Flask 迁移到 FastAPI 的真实体验，对比异步性能、类型安全、自动文档生成等关键特性。",
                tags='["FastAPI","Python","Web开发"]',
                published=True,
                content="""## 为什么换 FastAPI？

我在大二上学期用 Flask 写第一个 Web 项目，当时觉得「路由 + 模板 = 网站」就够了。但实际开发中遇到几个痛点：

### 1. 异步支持

Flask 默认是同步的，处理多个请求时会阻塞。FastAPI 基于 ASGI（Asynchronous Server Gateway Interface），原生支持 `async/await`：

```python
# FastAPI 异步路由
@app.get("/items")
async def read_items():
    result = await some_db_query()
    return result
```

### 2. 类型安全

FastAPI 通过 Pydantic 做数据验证，请求/响应的类型自动检查：

```python
from pydantic import BaseModel

class ItemCreate(BaseModel):
    title: str
    description: str = ""
    price: float

@app.post("/items")
async def create_item(item: ItemCreate):
    # item 的类型已经被自动验证
    return {"id": 1, **item.model_dump()}
```

### 3. 自动生成 API 文档

FastAPI 自带 Swagger UI（`/docs`）和 ReDoc（`/redoc`），不用额外配置。这对调试和学习非常有帮助。

### 4. 依赖注入

FastAPI 的 `Depends()` 让数据库会话管理、认证校验等逻辑变得非常干净：

```python
@app.get("/projects")
async def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()
```

## 总结

| 场景 | Flask | FastAPI |
|------|-------|---------|
| 简单项目 | ✅ 足够 | 稍重 |
| API 开发 | 需插件 | ✅ 原生 |
| 异步需求 | ❌ | ✅ |
| 学习曲线 | 低 | 中 |

如果你也在 Flask 和 FastAPI 之间纠结——**新项目选 FastAPI**，老项目不用急着改。

---

*发布于 2026 年 5 月*
""",
            ),
            BlogPost(
                title="Docker Compose 部署 FastAPI 全记录：从本地到阿里云",
                slug="docker-compose-fastapi-deploy",
                summary="一步步记录用 Docker Compose 把 FastAPI + MySQL 项目部署到阿里云服务器的完整过程，包括常见坑和解决方案。",
                tags='["Docker","FastAPI","DevOps","部署"]',
                published=True,
                content="""## 背景

写完个人网站后，下一步就是部署上线。我选择了 **Docker Compose** 方案，因为它能：
- 统一 FastAPI + MySQL 两个服务
- 本地和生产环境一致
- 一条命令启动/停止

## 项目结构

```
project/
├── app/              # FastAPI 应用
├── Dockerfile        # 应用镜像
├── docker-compose.yml
└── .env              # 环境变量（不上传 git）
```

## Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

关键点：
- 用 `slim` 镜像（体积小，节省带宽）
- Python 3.12（修复了 3.11 镜像中 pip 24.0 的 segfault bug）

## docker-compose.yml

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]

  app:
    build: .
    depends_on:
      mysql:
        condition: service_healthy  # 等 MySQL 就绪再启动
    ports:
      - "8000:8000"
```

## 踩坑记录

### 坑 1：app 容器连不上 MySQL

**原因**：app 比 MySQL 先就绪，但 MySQL 还没完成初始化。

**解决**：加 `healthcheck` + `depends_on: condition: service_healthy`，确保 MySQL 完全就绪后才启动 app。

### 坑 2：pip segfault

**原因**：Python 3.11 slim 镜像的 pip 24.0 在依赖解析时崩溃。

**解决**：换 Python 3.12 slim 镜像，或者 `pip install --upgrade pip` 先升级。

### 坑 3：数据持久化

不加 volume 的话，`docker-compose down` 后数据库就没了。用 `volumes: mysql_data:/var/lib/mysql` 持久化数据。

## 部署到阿里云

```bash
# 1. 把代码传到服务器
scp -r project/ user@aliyun:/home/user/

# 2. SSH 登录
ssh user@aliyun

# 3. 启动
cd /home/user/project
docker compose up -d

# 4. 访问
http://<阿里云公网IP>:8000
```

## 总结

Docker Compose 对个人项目非常友好：本地跑通 = 服务器就跑通。三个文件（Dockerfile + compose.yml + .env）管住整个项目的运行环境。

---

*发布于 2026 年 5 月*
""",
            ),
            BlogPost(
                title="LLM API 调用实践：从 Prompt Engineering 到 Function Calling",
                slug="llm-api-practice",
                summary="基于 DeepSeek API 的实际开发经验，深入探讨 prompt 设计、温度参数调优、以及 function calling 在项目中的应用。",
                tags='["LLM","AI","DeepSeek","Python"]',
                published=True,
                content="""## 前言

大二开始接触大模型 API，从最初的「给个 prompt 看返回」到后来做完整的 AI 应用，踩了不少坑。这篇文章梳理一下核心实践要点。

## 1. Prompt Engineering 不是玄学

很多人觉得 prompt 工程靠「运气」。其实有系统的方法：

### 结构化 Prompt 模板

```
你是一个 {role}，擅长 {expertise}。

任务：{task_description}

约束条件：
1. {constraint_1}
2. {constraint_2}

输出格式：{format_description}
```

### 实际例子——AI 鞋类推荐助手

```
你是一个专业的鞋类导购顾问。

用户信息：
- 性别：{gender}
- 使用场景：{scenario}
- 预算范围：{budget}
- 偏好风格：{style}

任务：根据用户信息推荐 3-5 款合适的鞋子，并说明推荐理由。

约束条件：
1. 优先推荐用户预算范围内的商品
2. 考虑场景的实用性（运动鞋 vs 休闲鞋 vs 正装鞋）
3. 每个推荐配一句话理由

输出格式：JSON 数组
```

## 2. 温度参数调优

`temperature` 控制输出的随机性：

| 温度值 | 适用场景 | 特点 |
|--------|----------|------|
| 0 ~ 0.3 | 分类、提取、事实问答 | 确定性高，结果稳定 |
| 0.3 ~ 0.7 | 对话、写作、推荐 | 有一定创意，不跑偏 |
| 0.7 ~ 1.2 | 创意写作、头脑风暴 | 多样性高，可能偏离 |

**实践心得**：做推荐系统时用 `0.4-0.5`，既保证推荐质量，又不会每次都推一样的东西。

## 3. Function Calling

这是最强大的特性——让 LLM 能**调用你的函数**获取实时数据，而不是只靠训练数据。

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_shoes",
            "description": "根据条件搜索鞋类商品",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": ["运动鞋", "休闲鞋", "正装鞋", "跑鞋"]
                    },
                    "price_min": {"type": "number"},
                    "price_max": {"type": "number"},
                    "brand": {"type": "string"}
                },
                "required": ["category"]
            }
        }
    }
]
```

当用户说「推荐一双 500 以内的跑鞋」，模型不会自己编数据，而是调用 `search_shoes(category="跑鞋", price_max=500)` 拿到真实商品列表，再基于真实数据回答。

## 4. 不同平台的兼容性

我用 DeepSeek API（兼容 OpenAI 协议），切换时主要注意：

- **Token 计算**：不同平台 tokenizer 不同，中文 token 数差异大
- **System prompt**：DeepSeek 对 system prompt 的遵循度有时不同
- **停止词**：中文场景下 `stop` 参数的设置要实测

## 总结

三个关键原则：
1. **结构化 prompt** 比「自然语言描述」效果好得多
2. **Function calling** 是 LLM 应用落地的核心能力
3. **不要过度调参**——先跑通，再优化

---

*发布于 2026 年 6 月*
""",
            ),
        ]
        db.add_all(posts)
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动/关闭时的生命周期管理"""
    init_db()
    db = SessionLocal()
    try:
        create_admin(db)
    finally:
        db.close()
    seed_blog_posts()
    yield


app = FastAPI(title="个人网站", lifespan=lifespan)

# 模板引擎
templates = Jinja2Templates(directory="app/templates")
app.state.templates = templates

# 静态文件
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# 注册路由
app.include_router(pages.router)
app.include_router(auth_routes.router)
app.include_router(admin.router)
