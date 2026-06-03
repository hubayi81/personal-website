/**
 * 管理后台 JS：项目/博客 CRUD 表单处理
 */

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
