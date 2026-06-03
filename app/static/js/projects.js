/**
 * 项目展示页：标签筛选、弹窗详情、3D 卡片
 */

// === 标签筛选 ===
(function filterProjects() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');

    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            cards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = '';
                    return;
                }
                try {
                    const techs = JSON.parse(card.dataset.techs || '[]');
                    const match = techs.some(t => t.toLowerCase().includes(filter.toLowerCase()));
                    card.style.display = match ? '' : 'none';
                } catch {
                    card.style.display = '';
                }
            });
        });
    });
})();

// === 项目详情弹窗 ===
(function projectModal() {
    const modal = document.getElementById('projectModal');
    const closeBtn = document.getElementById('modalClose');
    const cards = document.querySelectorAll('.project-card');

    if (!modal) return;

    // 点击卡片打开弹窗
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // 不拦截链接点击
            if (e.target.closest('a')) return;

            document.getElementById('modalTitle').textContent = card.dataset.title;
            document.getElementById('modalDesc').textContent = card.dataset.desc;

            // 技术标签
            const techsContainer = document.getElementById('modalTechs');
            techsContainer.innerHTML = '';
            try {
                const techs = JSON.parse(card.dataset.techs || '[]');
                techs.forEach(tech => {
                    const span = document.createElement('span');
                    span.className = 'project-tech-tag';
                    span.textContent = tech;
                    techsContainer.appendChild(span);
                });
            } catch {}

            // 链接
            const githubLink = document.getElementById('modalGithub');
            const liveLink = document.getElementById('modalLive');
            if (card.dataset.github) {
                githubLink.href = card.dataset.github;
                githubLink.style.display = '';
            } else {
                githubLink.style.display = 'none';
            }
            if (card.dataset.live) {
                liveLink.href = card.dataset.live;
                liveLink.style.display = '';
            } else {
                liveLink.style.display = 'none';
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // 关闭弹窗
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
})();
