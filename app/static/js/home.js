/**
 * 全站星空背景：银河带 + 星团 + 高密度星场 + 星云 + 流星 + 北斗七星
 */

// ========== 工具：Canvas 光晕纹理 ==========
function createGlowTexture(innerColor, outerColor, size, falloff) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half * falloff);
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(0.06, innerColor);
    gradient.addColorStop(0.45, outerColor);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}

function createSpikeTexture(color, spikeLen, size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const half = size / 2;
    const glow = ctx.createRadialGradient(half, half, 0, half, half, size * 2 / 3);
    glow.addColorStop(0, color);
    glow.addColorStop(0.25, color);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let a = 0; a < 4; a++) {
        ctx.save();
        ctx.translate(half, half);
        ctx.rotate(a * Math.PI / 4);
        const spike = ctx.createLinearGradient(0, -spikeLen, 0, spikeLen);
        spike.addColorStop(0, 'transparent');
        spike.addColorStop(0.45, color);
        spike.addColorStop(0.5, color);
        spike.addColorStop(0.55, color);
        spike.addColorStop(1, 'transparent');
        ctx.fillStyle = spike;
        ctx.fillRect(-1.5, -spikeLen, 3, spikeLen * 2);
        ctx.restore();
    }
    ctx.restore();
    return new THREE.CanvasTexture(c);
}

// ========== 纹理池（全局复用） ==========
const tempColors = [
    { inner: '#ffffff', outer: '#7799cc' },
    { inner: '#fafaff', outer: '#5577bb' },
    { inner: '#fff8e8', outer: '#998866' },
    { inner: '#ffe8d0', outer: '#775533' },
    { inner: '#e8f0ff', outer: '#4466aa' },
];
const sharedTextures = tempColors.map(tc => ({
    tiny:  createGlowTexture(tc.inner, tc.outer, 32, 0.45),
    small: createGlowTexture(tc.inner, tc.outer, 48, 0.35),
}));
const largeTextures = tempColors.map(tc => createGlowTexture(tc.inner, tc.outer, 64, 0.28));
const xlTextures = tempColors.map(tc => createGlowTexture(tc.inner, tc.outer, 80, 0.22));
// 银河带专用：冷蓝白 + 暖黄白
const milkyWayTextures = [
    createGlowTexture('#d8e8ff', 'rgba(140,170,220,0)', 256, 0.22),
    createGlowTexture('#e8e0ff', 'rgba(160,150,210,0)', 256, 0.20),
    createGlowTexture('#ffe8d0', 'rgba(200,160,120,0)', 256, 0.18),
    createGlowTexture('#e8f4ff', 'rgba(130,170,220,0)', 256, 0.22),
    createGlowTexture('#f0e8ff', 'rgba(150,140,200,0)', 256, 0.20),
];

// ==========================================
//  主星空系统
// ==========================================
(function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 120);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const IS_HOMEPAGE = !!document.getElementById('typewriter');

    // ===== Sprite 工厂 =====
    function createStarSprite(glowTex, size) {
        const mat = new THREE.SpriteMaterial({
            map: glowTex, blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false, transparent: true,
            opacity: 0.75 + Math.random() * 0.25,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(size, size, 1);
        return sprite;
    }

    const allStars = [];

    function addStarLayer(count, dMin, dMax, phiMax, yOff, zOff, sMin, sMax, texKey) {
        for (let i = 0; i < count; i++) {
            let tex;
            if (texKey === 'xl') tex = xlTextures[Math.floor(Math.random() * xlTextures.length)];
            else if (texKey === 'large') tex = largeTextures[Math.floor(Math.random() * largeTextures.length)];
            else { const p = sharedTextures[Math.floor(Math.random() * sharedTextures.length)]; tex = p[texKey]; }
            const s = createStarSprite(tex, sMin + Math.random() * (sMax - sMin));
            const dist = dMin + Math.random() * (dMax - dMin);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * phiMax;
            s.position.set(dist * Math.cos(theta) * Math.sin(phi), dist * Math.cos(phi) + yOff, dist * Math.sin(theta) * Math.sin(phi) + zOff);
            s.userData = { layer: texKey === 'xl' ? 3 : texKey === 'large' ? 2 : texKey === 'small' ? 1 : 0, baseSize: s.scale.x, phase: Math.random() * Math.PI * 2 };
            scene.add(s); allStars.push(s);
        }
    }

    // 高密度星场（~5000 颗）
    addStarLayer(2000, 20, 58, 0.74, -5, -16, 0.06, 0.18, 'tiny');
    addStarLayer(1000, 12, 32, 0.70, -3, -11, 0.12, 0.30, 'small');
    addStarLayer(360,  6, 24, 0.64, -1, -7,  0.24, 0.56, 'large');
    addStarLayer(120,  4, 16, 0.56, 0,  -5,  0.36, 0.84, 'xl');

    // ===== 银河带（Milky Way） =====
    const milkyWaySprites = [];
    const MW_DIR = new THREE.Vector3(-0.62, -0.38, -0.68).normalize(); // 左上→右下对角线
    const MW_CENTER = new THREE.Vector3(2, 1, -12);
    // 垂直于银河方向的扩散向量
    const MW_WIDTH = new THREE.Vector3(-MW_DIR.z, 0, MW_DIR.x).normalize();

    for (let i = 0; i < 260; i++) {
        const tex = milkyWayTextures[Math.floor(Math.random() * milkyWayTextures.length)];
        const mat = new THREE.SpriteMaterial({
            map: tex, blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false, transparent: true,
            opacity: 0.03 + Math.random() * 0.08,
        });
        const sprite = new THREE.Sprite(mat);
        const along = (Math.random() - 0.5) * 35;
        const across = (Math.random() - 0.5) * 9;
        const pos = MW_CENTER.clone()
            .add(MW_DIR.clone().multiplyScalar(along))
            .add(MW_WIDTH.clone().multiplyScalar(across));
        sprite.position.copy(pos);
        const sz = 6 + Math.random() * 32;
        sprite.scale.set(sz, sz * (0.3 + Math.random() * 0.3), 1);
        sprite.userData = { phase: Math.random() * Math.PI * 2, speed: 0.04 + Math.random() * 0.15 };
        scene.add(sprite);
        milkyWaySprites.push(sprite);
    }

    // ===== 星团（3个分散的亮点聚集区） =====
    const clusters = [
        { center: new THREE.Vector3(-5, 3, -6), radius: 2.5, count: 20, color: '#ffe8d0' },
        { center: new THREE.Vector3(3, -2, -9), radius: 2.0, count: 18, color: '#ffffff' },
        { center: new THREE.Vector3(-2, 5, -7), radius: 2.2, count: 22, color: '#fafaff' },
        { center: new THREE.Vector3(6, 1, -10), radius: 1.8, count: 16, color: '#e8f0ff' },
    ];
    const clusterStars = [];

    clusters.forEach(cl => {
        for (let i = 0; i < cl.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * cl.radius;
            const tex = createGlowTexture(cl.color, 'rgba(150,170,220,0)', 64, 0.3);
            const s = createStarSprite(tex, 0.16 + Math.random() * 0.36);
            s.position.set(
                cl.center.x + r * Math.cos(angle),
                cl.center.y + r * Math.sin(angle) * 0.7 + (Math.random() - 0.5) * 0.8,
                cl.center.z + (Math.random() - 0.5) * 1.0
            );
            s.userData = { isCluster: true, clusterIdx: clusters.indexOf(cl), baseSize: s.scale.x, phase: Math.random() * Math.PI * 2 };
            scene.add(s);
            clusterStars.push(s);
        }
    });

    // ===== 星云微粒 =====
    const nebulaClouds = [];
    const nebulaHues = [215, 220, 225, 230, 235, 240, 245, 30, 25, 20, 340, 350];
    for (let i = 0; i < 100; i++) {
        const hue = nebulaHues[Math.floor(Math.random() * nebulaHues.length)];
        const tex = createGlowTexture(
            `hsla(${hue}, 60%, 65%, 0.45)`,
            `hsla(${hue}, 70%, 40%, 0)`,
            256, 0.28
        );
        const mat = new THREE.SpriteMaterial({
            map: tex, blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false, transparent: true,
            opacity: 0.03 + Math.random() * 0.08,
        });
        const sprite = new THREE.Sprite(mat);
        const size = 5 + Math.random() * 32;
        sprite.scale.set(size, size * 0.5, 1);
        const dist = 14 + Math.random() * 30;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.5;
        sprite.position.set(dist * Math.cos(theta) * Math.sin(phi), dist * Math.cos(phi) - 3, dist * Math.sin(theta) * Math.sin(phi) - 10);
        sprite.userData = { phase: Math.random() * Math.PI * 2, speed: 0.06 + Math.random() * 0.3 };
        scene.add(sprite);
        nebulaClouds.push(sprite);
    }

    // ===== 北斗七星（仅首页） =====
    const dipperStars = [], rayGroups = []; let dipperLine = null;
    if (IS_HOMEPAGE) {
        const DIPPER_BASE = { x: 4, y: 6, z: -8 };
        const layout = [
            { dx: 0, dy: 0, dz: 0, size: 1.0 }, { dx: -1.4, dy: -0.6, dz: -0.4, size: 0.95 },
            { dx: -2.8, dy: -1.0, dz: -0.8, size: 0.9 }, { dx: -4.0, dy: -0.8, dz: -0.6, size: 0.8 },
            { dx: -4.8, dy: 0.4, dz: -0.2, size: 1.05 }, { dx: -6.2, dy: 0.8, dz: 0, size: 0.9 },
            { dx: -7.6, dy: 1.5, dz: 0.2, size: 1.1 },
        ];
        layout.forEach(d => {
            const tex = createSpikeTexture('rgba(255,255,240,0.95)', 50 + d.size * 20, 128);
            const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0.95 });
            const sprite = new THREE.Sprite(mat);
            const s = 0.56 * d.size;
            sprite.scale.set(s, s, 1);
            sprite.position.set(DIPPER_BASE.x + d.dx, DIPPER_BASE.y + d.dy, DIPPER_BASE.z + d.dz);
            sprite.userData = { isDipper: true, baseScale: s, pulseTimer: 0, pulseInterval: 3 + Math.random() * 4, isPulsing: false, pulseProgress: 0 };
            scene.add(sprite); dipperStars.push(sprite);
        });
        const pts = dipperStars.map(s => s.position.clone());
        dipperLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6], pts[3], pts[0], pts[0], pts[1]]),
            new THREE.LineBasicMaterial({ color: 0x8899cc, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        scene.add(dipperLine);
        const rayAngles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
        dipperStars.forEach(ds => {
            const g = new THREE.Group(); g.position.copy(ds.position);
            rayAngles.forEach(a => {
                const rt = createGlowTexture('rgba(255,255,240,0.9)', 'rgba(200,220,255,0)', 64, 0.35);
                const rm = new THREE.SpriteMaterial({ map: rt, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0 });
                const ray = new THREE.Sprite(rm);
                const len = 0.5 + Math.random() * 0.9;
                ray.scale.set(len, 0.04, 1);
                ray.position.set(Math.cos(a)*len*0.5, Math.sin(a)*len*0.5, 0);
                ray.rotation.z = a;
                g.add(ray);
            });
            scene.add(g); rayGroups.push({ group: g, dipperStar: ds });
        });
    }

    // ===== 流星 =====
    const shootingStars = [];
    const MAX_SHOOTERS = 5;
    function createShootingStar() {
        const sx = 5 + Math.random() * 22, sy = 3 + Math.random() * 14, sz = -5 + Math.random() * 10;
        const ex = sx - 10 - Math.random() * 28, ey = sy - 7 - Math.random() * 20, ez = sz - 4;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([sx,sy,sz,ex,ey,ez]), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1,1,1,0.3,0.7,1]), 3));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 1 }));
        const dg = new THREE.BufferGeometry();
        dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([ex,ey,ez]), 3));
        const dot = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.24, color: 0x00d2ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
        const g = new THREE.Group(); g.add(line); g.add(dot);
        return { mesh: g, life: 0, maxLife: 50 + Math.random() * 100, speed: 0.06 + Math.random() * 0.18, dir: new THREE.Vector3(ex-sx,ey-sy,ez-sz).normalize() };
    }
    function updateShootingStars() {
        if (shootingStars.length < MAX_SHOOTERS && Math.random() < 0.006) { const s = createShootingStar(); shootingStars.push(s); scene.add(s.mesh); }
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i]; s.life++;
            s.mesh.position.x += s.dir.x * s.speed;
            s.mesh.position.y += s.dir.y * s.speed;
            s.mesh.position.z += s.dir.z * s.speed;
            const p = s.life / s.maxLife;
            s.mesh.children.forEach(c => { if (c.material && c.material.opacity !== undefined) c.material.opacity = 1 - p; });
            if (s.life >= s.maxLife) { scene.remove(s.mesh); shootingStars.splice(i, 1); }
        }
    }

    // ===== 动画循环 =====
    camera.position.z = 5;
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', e => { mouseX = (e.clientX / window.innerWidth) * 2 - 1; mouseY = -(e.clientY / window.innerHeight) * 2 + 1; });
    let time = 0, clusterTime = 0;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.016; clusterTime += 0.016;

        const baseRot = 0.0002;
        allStars.forEach(s => {
            s.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), baseRot * (1 + s.userData.layer * 0.6));
            if (s.userData.layer >= 1) {
                s.scale.setScalar(s.userData.baseSize * (1 + Math.sin(time * (1.5 + s.userData.layer) + s.userData.phase) * (0.08 + s.userData.layer * 0.06)));
            }
        });

        // 银河带缓慢呼吸
        milkyWaySprites.forEach(mw => {
            mw.material.opacity = 0.025 + Math.sin(time * mw.userData.speed + mw.userData.phase) * 0.015 + 0.03;
        });

        // 星团同步脉冲（同簇星星一起呼吸）
        clusters.forEach((cl, idx) => {
            const pulse = 1 + Math.sin(clusterTime * 0.3 + idx * 1.5) * 0.22;
            clusterStars.filter(s => s.userData.clusterIdx === idx).forEach(s => {
                s.scale.setScalar(s.userData.baseSize * pulse);
            });
        });

        nebulaClouds.forEach(n => {
            n.material.opacity = 0.03 + Math.sin(time * n.userData.speed + n.userData.phase) * 0.02 + 0.03;
        });
        updateShootingStars();

        // 北斗脉冲
        if (IS_HOMEPAGE) {
            dipperStars.forEach(ds => {
                const ud = ds.userData;
                if (!ud.isPulsing) { ud.pulseTimer += 0.016; if (ud.pulseTimer >= ud.pulseInterval) { ud.isPulsing = true; ud.pulseProgress = 0; ud.pulseTimer = 0; ud.pulseInterval = 3 + Math.random() * 5; } }
                if (ud.isPulsing) {
                    ud.pulseProgress += 0.02; const t = ud.pulseProgress;
                    const intensity = t < 0.3 ? Math.sin(t/0.3*Math.PI/2) : Math.cos((t-0.3)/0.7*Math.PI/2);
                    ds.scale.setScalar(ud.baseScale * (1 + intensity * 2.5));
                    ds.material.opacity = 0.9 + intensity * 0.1;
                    if (t >= 1) { ud.isPulsing = false; ds.scale.setScalar(ud.baseScale); ds.material.opacity = 0.95; }
                }
            });
            rayGroups.forEach(({ group, dipperStar: ds }) => {
                const ud = ds.userData;
                if (ud.isPulsing) {
                    const t = ud.pulseProgress, intensity = t < 0.3 ? Math.sin(t/0.3*Math.PI/2) : Math.cos((t-0.3)/0.7*Math.PI/2);
                    group.position.copy(ds.position);
                    group.children.forEach(ray => { ray.material.opacity = intensity * 0.8; ray.scale.set(ray.scale.x*(1+intensity*2), 0.04*(1+intensity), 1); });
                } else { group.children.forEach(ray => { ray.material.opacity = 0; }); }
            });
            if (dipperLine) dipperLine.material.opacity = 0.18 + Math.sin(time * 0.8) * 0.04;
        }

        camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.015;
        camera.position.y += (mouseY * 0.8 - camera.position.y) * 0.015;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
})();

// ========== 打字机效果（仅首页） ==========
(function typewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const words = ['正在探索 LLM 应用开发...', '学习 FastAPI & Python 后端...', '折腾 Docker & 云部署...', '热爱 AI & 开源项目...'];
    let wordIndex = 0, charIndex = 0, isDeleting = false, isWaiting = false;
    function tick() {
        const word = words[wordIndex];
        if (isWaiting) { isWaiting = false; isDeleting = true; setTimeout(tick, 50); return; }
        el.textContent = isDeleting ? word.substring(0, charIndex - 1) : word.substring(0, charIndex + 1);
        charIndex += isDeleting ? -1 : 1;
        let speed = isDeleting ? 30 : 60 + Math.random() * 40;
        if (!isDeleting && charIndex === word.length) { speed = 2000; isWaiting = true; }
        else if (isDeleting && charIndex === 0) { isDeleting = false; wordIndex = (wordIndex + 1) % words.length; speed = 300; }
        setTimeout(tick, speed);
    }
    setTimeout(tick, 1000);
})();

// ========== 鼠标光晕（仅首页） ==========
(function mouseGlow() {
    const glow = document.getElementById('mouseGlow');
    if (!glow) return;
    document.addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });
})();
