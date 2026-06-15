/**
 * 管理后台 JS：项目/博客 CRUD 表单处理 + 图片上传
 */

// === 图片上传通用函数 ===
async function handleUpload(fileInput, urlInputId, previewId, statusId) {
    const file = fileInput.files[0];
    if (!file) return;

    const statusEl = document.getElementById(statusId);
    const previewEl = document.getElementById(previewId);
    const urlInput = document.getElementById(urlInputId);

    statusEl.textContent = '⏳ 上传中...';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const resp = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await resp.json();
        if (data.success) {
            urlInput.value = data.url;
            previewEl.style.backgroundImage = `url('${data.url}')`;
            previewEl.classList.add('has-image');
            previewEl.querySelector('.upload-placeholder')?.remove();
            statusEl.textContent = '✅ 上传成功';
        } else {
            statusEl.textContent = '❌ 上传失败';
        }
    } catch (err) {
        statusEl.textContent = '❌ 网络错误';
    }
}

// === 项目表单提交 ===
const projectForm = document.getElementById('projectForm');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isNew = projectForm.dataset.isNew === 'true';
        const id = projectForm.dataset.id;
        const formData = new FormData(projectForm);

        const url = isNew ? '/api/projects' : `/api/projects/${id}`;
        const method = isNew ? 'POST' : 'PUT';

        try {
            const resp = await fetch(url, { method, body: formData });
            if (resp.ok) {
                window.location.href = '/admin/projects';
            } else {
                alert('保存失败，请检查输入');
            }
        } catch (err) {
            alert('网络错误：' + err.message);
        }
    });
}

// === 删除项目 ===
async function deleteProject(id, title) {
    if (!confirm(`确定要删除项目「${title}」吗？此操作不可撤销。`)) return;

    try {
        const resp = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (resp.ok) {
            window.location.reload();
        } else {
            alert('删除失败');
        }
    } catch (err) {
        alert('网络错误：' + err.message);
    }
}

// === 博客表单提交 ===
const blogForm = document.getElementById('blogForm');
if (blogForm) {
    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isNew = blogForm.dataset.isNew === 'true';
        const id = blogForm.dataset.id;
        const formData = new FormData(blogForm);

        const url = isNew ? '/api/blogs' : `/api/blogs/${id}`;
        const method = isNew ? 'POST' : 'PUT';

        try {
            const resp = await fetch(url, { method, body: formData });
            if (resp.ok) {
                window.location.href = '/admin/blogs';
            } else {
                alert('保存失败，请检查输入（slug 可能重复）');
            }
        } catch (err) {
            alert('网络错误：' + err.message);
        }
    });
}

// === 删除博客 ===
async function deleteBlog(id, title) {
    if (!confirm(`确定要删除文章「${title}」吗？此操作不可撤销。`)) return;

    try {
        const resp = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
        if (resp.ok) {
            window.location.reload();
        } else {
            alert('删除失败');
        }
    } catch (err) {
        alert('网络错误：' + err.message);
    }
}

// === 奖项表单提交 ===
const awardForm = document.getElementById('awardForm');
if (awardForm) {
    awardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isNew = awardForm.dataset.isNew === 'true';
        const id = awardForm.dataset.id;
        const formData = new FormData(awardForm);

        const url = isNew ? '/api/awards' : `/api/awards/${id}`;
        const method = isNew ? 'POST' : 'PUT';

        try {
            const resp = await fetch(url, { method, body: formData });
            if (resp.ok) {
                window.location.href = '/admin/awards';
            } else {
                alert('保存失败，请检查输入');
            }
        } catch (err) {
            alert('网络错误：' + err.message);
        }
    });
}

// === 删除奖项 ===
async function deleteAward(id, title) {
    if (!confirm(`确定要删除「${title}」吗？此操作不可撤销。`)) return;
    try { const resp = await fetch(`/api/awards/${id}`, { method: 'DELETE' }); if (resp.ok) window.location.reload(); else alert('删除失败'); } catch (err) { alert('网络错误：' + err.message); }
}

// === 里程碑表单 ===
const milestoneForm = document.getElementById('milestoneForm');
if (milestoneForm) {
    milestoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isNew = milestoneForm.dataset.isNew === 'true';
        const id = milestoneForm.dataset.id;
        const formData = new FormData(milestoneForm);
        const url = isNew ? '/api/milestones' : `/api/milestones/${id}`;
        const method = isNew ? 'POST' : 'PUT';
        try {
            const resp = await fetch(url, { method, body: formData });
            if (resp.ok) { window.location.href = '/admin/milestones'; }
            else alert('保存失败');
        } catch (err) { alert('网络错误：' + err.message); }
    });
}

// === 删除里程碑 ===
async function deleteMilestone(id, title) {
    if (!confirm(`确定要删除「${title}」吗？此操作不可撤销。`)) return;
    try { const resp = await fetch(`/api/milestones/${id}`, { method: 'DELETE' }); if (resp.ok) window.location.reload(); else alert('删除失败'); } catch (err) { alert('网络错误：' + err.message); }
}
