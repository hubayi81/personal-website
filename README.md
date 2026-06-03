# 🌌 个人网站

基于 **FastAPI + MySQL + 原生 HTML/CSS/JS** 的个人展示网站，包含星空特效、项目管理后台、博客系统。

## 技术栈

| 层 | 技术 |
|---|------|
| 后端 | FastAPI + SQLAlchemy + PyMySQL |
| 数据库 | MySQL 8.0 |
| 前端 | 原生 HTML/CSS/JS + Three.js |
| 部署 | Docker Compose |

## 功能

- 🌌 **星空粒子首页** — Three.js 粒子系统 + 打字机效果 + 鼠标光晕
- 👤 **关于我** — 技能进度条动画 + 时间线
- 🚀 **项目展示** — 3D 卡片 + 标签筛选 + 毛玻璃详情弹窗
- 📝 **博客系统** — Markdown 写作 + 文章列表 + 详情页
- 📬 **联系我** — 社交链接 + 留言表单
- 🔐 **管理后台** — 登录保护，网页端添加/编辑/删除项目和博客
- 🌓 **暗色模式** — CSS 变量主题切换
- ✨ **交互特效** — 自定义光标、滚动渐入、鼠标跟随光晕

## 快速开始

### 1. 启动服务

```bash
docker-compose up -d
```

### 2. 访问

- 网站首页：http://localhost:8000
- 管理后台：http://localhost:8000/admin/login
  - 默认账号：`admin` / `admin123`

### 3. 停止服务

```bash
docker-compose down
```

## 本地开发

如果不想用 Docker：

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 确保本地 MySQL 已启动，修改 .env 中的 MYSQL_HOST=localhost

# 3. 手动创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS personal_website CHARACTER SET utf8mb4;"

# 4. 启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 添加内容

登录管理后台后：

1. **添加项目**：点击「项目管理」→「新建项目」，填写名称、描述、技术栈（JSON 数组格式）、GitHub 链接等
2. **写博客**：点击「博客管理」→「写博客」，用 Markdown 格式撰写，设置 slug（URL 路径）
3. **设为精选**：编辑项目时勾选「首页精选展示」，项目会出现在首页

## 项目结构

```
personal-website/
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 配置（环境变量）
│   ├── database.py          # 数据库连接
│   ├── models.py            # ORM 模型
│   ├── auth.py              # 认证工具
│   ├── routers/             # 路由
│   │   ├── pages.py         # 前台页面
│   │   ├── admin.py         # 后台 API
│   │   └── auth.py          # 登录/登出
│   ├── templates/           # Jinja2 模板
│   │   ├── base.html        # 公共布局
│   │   ├── index.html       # 首页
│   │   ├── about.html       # 关于我
│   │   ├── projects.html    # 项目展示
│   │   ├── blog.html        # 博客列表
│   │   ├── blog_detail.html # 博客详情
│   │   ├── contact.html     # 联系我
│   │   └── admin/           # 管理后台模板
│   └── static/              # 静态资源
│       ├── css/
│       ├── js/
│       └── images/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env
├── init.sql                 # 数据库初始化
└── README.md
```

## 自定义

- **个人信息**：编辑 `app/templates/about.html` 修改技能、时间线等内容
- **配色**：编辑 `app/static/css/style.css` 中 `:root` 的 CSS 变量
- **星空效果**：调整 `app/static/js/home.js` 中星星数量和颜色
- **联系信息**：编辑 `app/templates/contact.html`
