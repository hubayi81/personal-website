/**
 * 数据看板 — Chart.js 图表 + 实时日志 + 自动刷新
 */
(function initDashboard() {
    if (!document.getElementById('pvTrendChart')) return; // 非仪表盘页面跳过

    // ===== 颜色常量 =====
    const COLORS = {
        purple: 'rgba(108, 92, 231, 0.8)',
        purpleLight: 'rgba(108, 92, 231, 0.15)',
        cyan: 'rgba(0, 210, 255, 0.8)',
        cyanLight: 'rgba(0, 210, 255, 0.15)',
        gold: 'rgba(255, 215, 0, 0.8)',
        goldLight: 'rgba(255, 215, 0, 0.12)',
        white: 'rgba(224, 224, 255, 0.8)',
        gridLine: 'rgba(255, 255, 255, 0.05)',
    };

    Chart.defaults.color = 'rgba(224, 224, 255, 0.6)';
    Chart.defaults.borderColor = COLORS.gridLine;
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    // ===== 数字卡片 =====
    async function loadOverview() {
        try {
            const resp = await fetch('/api/analytics/overview');
            const d = await resp.json();
            document.getElementById('statTodayPV').textContent = d.today_pv.toLocaleString();
            document.getElementById('statYesterdayPV').textContent = d.yesterday_pv.toLocaleString();
            document.getElementById('statTotalPV').textContent = d.total_pv.toLocaleString();
            document.getElementById('statUniqueIPs').textContent = d.unique_ips.toLocaleString();
            document.getElementById('lastUpdate').textContent =
                '🟢 更新于 ' + new Date().toLocaleTimeString('zh-CN');
        } catch (e) {
            document.getElementById('lastUpdate').textContent = '⚠ 加载失败';
        }
    }

    // ===== 7天趋势折线图 =====
    const pvCtx = document.getElementById('pvTrendChart').getContext('2d');
    const pvChart = new Chart(pvCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'PV',
                data: [],
                borderColor: COLORS.purple,
                backgroundColor: createGradient(pvCtx, 'rgba(108,92,231,0.4)', 'rgba(108,92,231,0)'),
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: COLORS.purple,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8,
            }],
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: {} },
                x: { grid: { display: false } },
            },
        },
    });

    function createGradient(ctx, colorStart, colorEnd) {
        const g = ctx.createLinearGradient(0, 0, 0, 300);
        g.addColorStop(0, colorStart);
        g.addColorStop(1, colorEnd);
        return g;
    }

    async function loadDailyTrend() {
        try {
            const resp = await fetch('/api/analytics/daily?days=7');
            const data = await resp.json();
            pvChart.data.labels = data.map(d => d.date);
            pvChart.data.datasets[0].data = data.map(d => d.count);
            pvChart.update();
        } catch {}
    }

    // ===== 热门页面柱状图 =====
    const pagesCtx = document.getElementById('topPagesChart').getContext('2d');
    const pagesChart = new Chart(pagesCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '访问量',
                data: [],
                backgroundColor: [
                    COLORS.purple, COLORS.cyan, COLORS.gold,
                    'rgba(108, 92, 231, 0.5)', 'rgba(0, 210, 255, 0.5)',
                    'rgba(255, 215, 0, 0.5)', COLORS.purple,
                    COLORS.cyan, COLORS.gold, 'rgba(108, 92, 231, 0.4)',
                ],
                borderRadius: 6,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: {} },
                y: { grid: { display: false } },
            },
        },
    });

    async function loadTopPages() {
        try {
            const resp = await fetch('/api/analytics/pages?limit=10');
            const data = await resp.json();
            pagesChart.data.labels = data.map(d => d.path);
            pagesChart.data.datasets[0].data = data.map(d => d.count);
            pagesChart.update();
        } catch {}
    }

    // ===== 时段分布柱状图 =====
    const hourlyCtx = document.getElementById('hourlyChart').getContext('2d');
    const hourlyChart = new Chart(hourlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '访问量',
                data: [],
                backgroundColor: ctx => {
                    const h = ctx.index;
                    return h >= 8 && h < 22
                        ? 'rgba(0, 210, 255, 0.7)'
                        : 'rgba(108, 92, 231, 0.4)';
                },
                borderRadius: 4,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: {} },
                x: { grid: { display: false } },
            },
        },
    });

    async function loadHourly() {
        try {
            const resp = await fetch('/api/analytics/hourly');
            const data = await resp.json();
            hourlyChart.data.labels = data.map((d, i) => i % 3 === 0 ? d.hour : '');
            hourlyChart.data.datasets[0].data = data.map(d => d.count);
            hourlyChart.update();
        } catch {}
    }

    // ===== 实时日志表 =====
    async function loadRecentLogs() {
        try {
            const resp = await fetch('/api/analytics/recent?limit=20');
            const data = await resp.json();
            const tbody = document.getElementById('recentLogsBody');
            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="log-empty">暂无访问记录</td></tr>';
                return;
            }
            tbody.innerHTML = data.map(r => `
                <tr>
                    <td class="log-date">${escapeHtml(r.date)}</td>
                    <td class="log-time">${escapeHtml(r.time)}</td>
                    <td class="log-path"><code>${escapeHtml(r.path)}</code></td>
                    <td class="log-ip">${escapeHtml(r.ip)}</td>
                    <td class="log-ref">${escapeHtml(r.referer)}</td>
                </tr>
            `).join('');
        } catch {}
    }

    function escapeHtml(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    // ===== 初始化加载 + 定时刷新 =====
    loadOverview();
    loadDailyTrend();
    loadTopPages();
    loadHourly();
    loadRecentLogs();

    // 每30秒刷新数字卡片 + 日志
    setInterval(() => {
        loadOverview();
        loadHourly();
        loadRecentLogs();
    }, 30000);

    // 趋势和排行每5分钟刷新
    setInterval(() => {
        loadDailyTrend();
        loadTopPages();
    }, 300000);
})();
