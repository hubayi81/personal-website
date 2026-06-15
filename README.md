# 🌌 个人网站

一个基于 **FastAPI + MySQL + 原生 HTML/CSS/JS** 的全栈个人展示网站，集成星空特效、内容管理后台、博客系统、访问日志追踪。

> **在线演示：** 目前通过 Cloudflare Tunnel 对外展示，后续将部署到阿里云。

---

## 🎯 功能概览

### 🏠 前台展示

| 页面 | 内容 |
|------|------|
| **首页** | Hero 区 + 全站星空背景（~1800 颗光晕星星）+ 波浪浮动文字 + 各板块卡片预览 |
| **关于我** | 个人信息 + 技能进度条（Intersection Observer 动画）+ 时间线里程碑 + GitHub 实时数据 |
| **项目展示** | 3D 卡片（Vanilla Tilt）+ 标签筛选 + 毛玻璃详情弹窗 + 项目详情页（含 Demo 链接） |
| **博客系统** | Markdown 写作 + 文章列表 + 详情页（代码高亮） |
| **奖项 & 证书** | 扑克牌扇形布局 + 图片预览 + 点击弹出大图详情 |
| **联系我** | 社交链接图标 + 留言表单（AJAX 提交至数据库） |

### ⚡ 星空特效

| 特效 | 说明 |
|------|------|
| 🌟 五层星场 | 远背景 → 中层 → 近层亮星 → 超大亮星 → 星团，Canvas 径向渐变纹理 |
| 🌌 银河带 | 260 团半透明光晕，左上→右下对角线分布 |
| ☁️ 星云微粒 | 100 团蓝紫/暖橙色调星云，独立缓慢呼吸 |
| 🐻 北斗七星 | 首页独占，带十字星芒 + 每隔 3-7 秒脉冲光芒 |
| ☄️ 流星 | 全站随机划过，最多 5 颗同时 |

### 🎨 界面特效

- 自定义光标（小圆点 + 跟随外圈 + hover 变形）
- 深色主题（星空黑蓝底 + 紫/青/金三色点缀）
- 滚动渐入动画（Intersection Observer）
- 固定导航栏 + 滚动时当前板块高亮
- 导航栏极简小圆点登录入口（游客灰 / 管理员金脉冲呼吸）
- 毛玻璃弹窗（backdrop-filter blur）

### 🔐 管理后台

| 模块 | 功能 |
|------|------|
| 📊 数据看板 | Chart.js 图表：今日/昨日/累计 PV、近7天趋势、热门页面排行、时段分布 |
| 👁 实时日志 | 最近 20 条访问记录，每 30 秒自动刷新；中间件自动记录 path/IP/UA/referer |
| 🚀 项目管理 | 增删改 + 精选首页展示 + Star 数 + 图片本地上传 |
| 📝 博客管理 | Markdown 编辑发布 + slug 管理 |
| 🏆 奖项管理 | 扑克牌式展示 + 证书图片上传 |
| 📬 收件箱 | 游客留言列表 + 未读高亮 + 标记已读 + 一键回复 |
| 👤 个人信息 | 可视化行编辑（emoji 选择器 + 拖滑条调技能等级 + 联系方式增删改） |
| 📅 里程碑 | 时间线节点 CRUD（日期/标题/描述/标签类型） |

---

## 🛠 技术栈

| 层 | 技术 |
|---|------|
| 后端 | FastAPI + SQLAlchemy + PyMySQL + Jinja2 |
| 数据库 | MySQL 8.0 |
| 前端 | 原生 HTML/CSS/JS |
| 3D 图形 | Three.js（光晕纹理 + 粒子系统） |
| 图表 | Chart.js（后台数据看板） |
| 卡片效果 | Vanilla Tilt.js（3D 倾斜） |
| 部署 | Docker Compose（FastAPI + MySQL 双容器） |

---

## 🚀 快速开始

### 前置条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 已安装并运行

### 1. 配置环境变量

```bash
# 复制示例文件并修改密码
cp .env.example .env
```

编辑 `.env`，至少修改 `SECRET_KEY` 和 `MYSQL_PASSWORD`。

### 2. 启动

```bash
docker compose up -d
```

首次启动会自动：
- 创建数据库表
- 插入 3 篇示例博客
- 初始化个人信息和里程碑
- 创建管理员账号

### 3. 访问

| 地址 | 说明 |
|------|------|
| http://localhost:8000 | 网站首页 |
| http://localhost:8000/admin/login | 管理后台登录 |

> **创建管理员：** 首次启动时，程序根据 `.env` 中的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 自动创建账号。默认值见 `.env.example`，请务必修改。

### 4. 停止

```bash
docker compose down
```

---

## 📖 使用指南

### 配置管理后台

首次启动后，登录后台即可管理所有内容：

1. **修改个人信息** → 侧边栏「👤 个人信息」→ 修改头像、技能、联系方式
2. **添加项目** → 侧边栏「🚀 项目管理」→「新建项目」→ 填写信息 + 上传截图
3. **写博客** → 侧边栏「📝 博客管理」→「写博客」→ Markdown 编辑
4. **添加奖项** → 侧边栏「🏆 奖项管理」→「添加奖项」→ 上传证书图片
5. **管理里程碑** → 侧边栏「📅 里程碑」→ 增删改时间线节点
6. **查看留言** → 侧边栏「📬 收件箱」→ 阅读/标记已读/回复

### 查看访问数据

侧边栏「📊 数据看板」提供完整的网站分析：
- PV 趋势折线图（近 7 天）
- 热门页面柱状图
- 24 小时时段分布
- 实时访问日志表（每 30 秒自动刷新）

### 本地开发（不使用 Docker）

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动本地 MySQL，创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS personal_website CHARACTER SET utf8mb4;"

# 3. 修改 .env 中 MYSQL_HOST=localhost

# 4. 启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🏗 项目结构

```
personal-website/
├── app/
│   ├── main.py              # FastAPI 入口 + 种子数据 + 生命周期管理
│   ├── config.py            # 环境变量配置
│   ├── database.py          # SQLAlchemy engine + session + 兼容性迁移
│   ├── models.py            # ORM 模型（7 个表）
│   ├── auth.py              # 登录认证 + Session 管理
│   ├── middleware.py         # 访问日志中间件（全站请求拦截）
│   ├── routers/
│   │   ├── pages.py         # 前台页面路由（首页/关于/项目/博客/联系/奖项）
│   │   ├── admin.py         # 后台管理 + CRUD API（项目/博客/奖项/个人信息/里程碑/收件箱/上传）
│   │   ├── auth.py          # 登录/登出
│   │   └── analytics.py     # 数据统计 API（5 个端点）
│   ├── templates/           # Jinja2 模板（18 个文件）
│   │   ├── base.html        # 公共布局（导航/页脚/星空canvas/光标/登录弹窗）
│   │   ├── index.html       # 首页（Hero+关于+项目+博客+奖项+联系 滚动式）
│   │   ├── about.html       # 关于我（个人信息+技能+时间线+GitHub统计）
│   │   ├── projects.html    # 项目展示（3D卡片+筛选+弹窗）
│   │   ├── project_detail.html  # 项目详情页
│   │   ├── blog.html        # 博客列表
│   │   ├── blog_detail.html # 博客详情（Markdown 渲染）
│   │   ├── awards.html      # 奖项证书（扑克牌扇形）
│   │   ├── contact.html     # 联系我
│   │   ├── 404.html         # 404 页面
│   │   └── admin/           # 管理后台模板（11 个文件）
│   └── static/
│       ├── css/             # style.css（全局）+ admin.css（后台）
│       ├── js/              # main.js（全局交互）+ home.js（星空）+ projects.js/dashboard.js/admin.js
│       ├── images/          # 静态图片
│       └── uploads/         # 用户上传文件（.gitignore 排除）
├── Dockerfile               # 应用镜像（Python 3.12-slim）
├── docker-compose.yml       # FastAPI + MySQL 双容器编排
├── requirements.txt         # Python 依赖
├── init.sql                 # MySQL 初始化建表
├── .env.example             # 环境变量模板
├── .gitignore               # 保护密码和上传文件
├── TODO.md                  # 待迭代功能清单
└── README.md                # 本文件
```

### 数据模型

| 表 | 用途 |
|----|------|
| `users` | 管理员账号 |
| `projects` | 项目展示 |
| `blog_posts` | 博客文章 |
| `awards` | 奖项和证书 |
| `profile` | 个人信息（单行） |
| `milestones` | 时间线里程碑 |
| `visitor_logs` | 访问日志（中间件自动记录） |
| `contact_messages` | 游客留言（收件箱） |

---

## 🌐 公网访问

当前通过 Cloudflare Tunnel 临时对外展示：

```bash
# 安装
winget install cloudflare.cloudflared

# 启动（每次生成随机域名）
cloudflared tunnel --url http://localhost:8000
```

后续计划部署到阿里云 ECS（详见 [TODO.md](TODO.md)）。

---

## 🔒 安全

- `.env` 文件在 `.gitignore` 中，密码不会提交到 Git
- 所有管理 API 需要登录 Session 认证
- 游客访问 `/api/analytics/*` 返回 401
- 上传文件限制图片格式（PNG/JPG/GIF/WebP/SVG）
- MySQL 密码通过环境变量注入，不硬编码

---

## 📝 License

MIT — 仅供展示学习，欢迎参考。
