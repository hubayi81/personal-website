/**
 * 全局交互：自定义光标、暗色模式、滚动渐入、导航栏
 */

// === 自定义光标 ===
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

if (cursorDot && cursorRing) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    });

    function animateRing() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // hover 效果：鼠标在可交互元素上时放大光标
    const interactables = document.querySelectorAll('a, button, input, textarea, select, [data-clickable], .project-card');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('hover');
            cursorRing.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('hover');
            cursorRing.classList.remove('hover');
        });
    });
}

// === 暗色模式切换 ===
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // 恢复保存的主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// === 滚动渐入动画 ===
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    revealObserver.observe(el);
});

// === 技能进度条动画 ===
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const fill = entry.target.querySelector('.skill-fill');
            if (fill) {
                fill.style.width = fill.dataset.width + '%';
            }
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-item').forEach(el => {
    skillObserver.observe(el);
});

// === 导航栏滚动效果 ===
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// === 移动端菜单 ===
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });
}

// === 首页：导航栏链接滚动 + 当前板块高亮 ===
(function navScrollTracking() {
    const sections = {
        home: document.getElementById('section-home'),
        about: document.getElementById('section-about'),
        projects: document.getElementById('section-projects'),
        blog: document.getElementById('section-blog'),
        awards: document.getElementById('section-awards'),
        contact: document.getElementById('section-contact'),
    };

    // 只在有首页板块时启用（即当前在首页）
    const hasHomeSections = sections.home || sections.about;
    if (!hasHomeSections) return;

    const navLinksAll = document.querySelectorAll('#navLinks a[data-section]');

    // 点击导航 → 滚动到对应板块（阻止默认跳转）
    navLinksAll.forEach(link => {
        link.addEventListener('click', (e) => {
            const secKey = link.dataset.section;
            const target = sections[secKey];
            if (!target) return; // 该板块不在首页，正常跳转

            e.preventDefault();
            const offset = document.querySelector('.navbar').offsetHeight + 20;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });

            // 关闭移动端菜单
            document.querySelector('.nav-links')?.classList.remove('open');
        });
    });

    // IntersectionObserver：滚动到某个板块时高亮对应导航
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const secKey = Object.keys(sections).find(k => sections[k] === entry.target);
            if (!secKey) return;

            navLinksAll.forEach(l => {
                l.classList.toggle('active', l.dataset.section === secKey);
            });
        });
    }, {
        threshold: 0.25,
        rootMargin: '-80px 0px -30% 0px',
    });

    Object.values(sections).forEach(s => { if (s) navObserver.observe(s); });
})();

