/**
 * 全站星空背景 + 首页独占：北斗七星脉冲 + 打字机 + 鼠标光晕
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

// ==========================================
//  全站星空背景
// ==========================================
(function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 120);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 完全透明背景

    const IS_HOMEPAGE = !!document.getElementById('typewriter');

    // ===== 1. 星空粒子（2x 密度，5种色温纹理池） =====
    function createStarSprite(glowTex, size) {
        const mat = new THREE.SpriteMaterial({
            map: glowTex,
            blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false,
            transparent: true,
            opacity: 0.75 + Math.random() * 0.25,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(size, size, 1);
        return sprite;
    }

    const tempColors = [
        { inner: '#ffffff', outer: '#7799cc' },
        { inner: '#fafaff', outer: '#5577bb' },
        { inner: '#fff8e8', outer: '#998866' },
        { inner: '#ffe8d0', outer: '#775533' },
        { inner: '#e8f0ff', outer: '#4466aa' },
    ];
    const sharedTextures = tempColors.map(tc => ({
        tiny:  createGlowTexture(tc.inner, tc.outer, 32, 0.5),
        small: createGlowTexture(tc.inner, tc.outer, 48, 0.4),
    }));
    // 额外大纹理池
    const largeTextures = tempColors.map(tc =>
        createGlowTexture(tc.inner, tc.outer, 64, 0.3)
    );
    const xlTextures = tempColors.map(tc =>
        createGlowTexture(tc.inner, tc.outer, 80, 0.25)
    );

    const allStars = [];

    function addStarLayer(count, distMin, distMax, phiMax, yOff, zOff, sizeMin, sizeMax, texKey) {
        for (let i = 0; i < count; i++) {
            let tex;
            if (texKey === 'xl') {
                tex = xlTextures[Math.floor(Math.random() * xlTextures.length)];
            } else if (texKey === 'large') {
                tex = largeTextures[Math.floor(Math.random() * largeTextures.length)];
            } else {
                const pool = sharedTextures[Math.floor(Math.random() * sharedTextures.length)];
                tex = pool[texKey];
            }
            const s = createStarSprite(tex, sizeMin + Math.random() * (sizeMax - sizeMin));
            const dist = distMin + Math.random() * (distMax - distMin);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * phiMax;
            s.position.set(
                dist * Math.cos(theta) * Math.sin(phi),
                dist * Math.cos(phi) + yOff,
                dist * Math.sin(theta) * Math.sin(phi) + zOff
            );
            s.userData = {
                layer: texKey === 'xl' ? 3 : texKey === 'large' ? 2 : texKey === 'small' ? 1 : 0,
                baseSize: s.scale.x,
                phase: Math.random() * Math.PI * 2,
            };
            scene.add(s);
            allStars.push(s);
        }
    }

    // 2x 密度：原 480→960, 220→440, 80→160, 25→50
    addStarLayer(1000, 22, 55, 0.72, -5, -15, 0.04, 0.10, 'tiny');
    addStarLayer(500, 13, 30, 0.68, -3, -10, 0.07, 0.16, 'small');
    addStarLayer(180, 6, 22, 0.62, -1, -6, 0.13, 0.30, 'large');
    addStarLayer(60, 4, 15, 0.55, 0, -4, 0.20, 0.42, 'xl');

    // ===== 2. 星云微粒（更多） =====
    const nebulaClouds = [];
    for (let i = 0; i < 70; i++) {
        const hue = 215 + Math.random() * 45;
        const tex = createGlowTexture(
            `hsla(${hue}, 65%, 65%, 0.5)`,
            `hsla(${hue}, 75%, 40%, 0)`,
            256, 0.3
        );
        const mat = new THREE.SpriteMaterial({
            map: tex,
            blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false,
            transparent: true,
            opacity: 0.04 + Math.random() * 0.09,
        });
        const sprite = new THREE.Sprite(mat);
        const size = 3 + Math.random() * 14;
        sprite.scale.set(size, size * 0.55, 1);
        const dist = 16 + Math.random() * 28;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.5;
        sprite.position.set(
            dist * Math.cos(theta) * Math.sin(phi),
            dist * Math.cos(phi) - 3,
            dist * Math.sin(theta) * Math.sin(phi) - 10
        );
        sprite.userData = { phase: Math.random() * Math.PI * 2, speed: 0.08 + Math.random() * 0.3 };
        scene.add(sprite);
        nebulaClouds.push(sprite);
    }

    // ===== 3. 北斗七星（仅首页） =====
    const dipperStars = [];
    const rayGroups = [];
    let dipperLine = null;

    if (IS_HOMEPAGE) {
        const DIPPER_BASE = { x: 4, y: 6, z: -8 };

        const dipperLayout = [
            { dx: 0,    dy: 0,    dz: 0,   size: 1.0 },
            { dx: -1.4, dy: -0.6, dz: -0.4, size: 0.95 },
            { dx: -2.8, dy: -1.0, dz: -0.8, size: 0.9 },
            { dx: -4.0, dy: -0.8, dz: -0.6, size: 0.8 },
            { dx: -4.8, dy: 0.4,  dz: -0.2, size: 1.05 },
            { dx: -6.2, dy: 0.8,  dz: 0,    size: 0.9 },
            { dx: -7.6, dy: 1.5,  dz: 0.2,  size: 1.1 },
        ];

        dipperLayout.forEach(d => {
            const tex = createSpikeTexture('rgba(255,255,240,0.95)', 50 + d.size * 20, 128);
            const mat = new THREE.SpriteMaterial({
                map: tex,
                blending: THREE.AdditiveBlending,
                depthWrite: false, depthTest: false,
                transparent: true,
                opacity: 0.95,
            });
            const sprite = new THREE.Sprite(mat);
            const s = 0.28 * d.size;
            sprite.scale.set(s, s, 1);
            sprite.position.set(
                DIPPER_BASE.x + d.dx,
                DIPPER_BASE.y + d.dy,
                DIPPER_BASE.z + d.dz
            );
            sprite.userData = {
                isDipper: true,
                baseScale: s,
                pulseTimer: 0,
                pulseInterval: 3 + Math.random() * 4,
                isPulsing: false,
                pulseProgress: 0,
            };
            scene.add(sprite);
            dipperStars.push(sprite);
        });

        // 北斗连线
        const allPts = dipperStars.map(s => s.position.clone());
        const dipperLineGeo = new THREE.BufferGeometry().setFromPoints([
            allPts[0], allPts[1], allPts[2], allPts[3],
            allPts[4], allPts[5], allPts[6],
            allPts[3], allPts[0], allPts[0], allPts[1],
        ]);
        dipperLine = new THREE.Line(dipperLineGeo, new THREE.LineBasicMaterial({
            color: 0x8899cc, transparent: true, opacity: 0.2,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        scene.add(dipperLine);

        // 光芒射线
        const rayAngles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
        dipperStars.forEach(dipperStar => {
            const group = new THREE.Group();
            group.position.copy(dipperStar.position);
            rayAngles.forEach(angle => {
                const rayTex = createGlowTexture('rgba(255,255,240,0.9)', 'rgba(200,220,255,0)', 64, 0.35);
                const rayMat = new THREE.SpriteMaterial({
                    map: rayTex, blending: THREE.AdditiveBlending,
                    depthWrite: false, depthTest: false,
                    transparent: true, opacity: 0,
                });
                const ray = new THREE.Sprite(rayMat);
                const len = 0.5 + Math.random() * 0.9;
                ray.scale.set(len, 0.04, 1);
                ray.position.set(Math.cos(angle)*len*0.5, Math.sin(angle)*len*0.5, 0);
                ray.rotation.z = angle;
                group.add(ray);
            });
            scene.add(group);
            rayGroups.push({ group, dipperStar });
        });
    }

    // ===== 4. 流星系统（全站） =====
    const shootingStars = [];
    const MAX_SHOOTERS = 4;

    function createShootingStar() {
        const startX = 5 + Math.random() * 22;
        const startY = 3 + Math.random() * 14;
        const startZ = -5 + Math.random() * 10;
        const endX = startX - 10 - Math.random() * 28;
        const endY = startY - 7 - Math.random() * 20;
        const endZ = startZ - 4;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(
            new Float32Array([startX, startY, startZ, endX, endY, endZ]), 3
        ));
        geo.setAttribute('color', new THREE.BufferAttribute(
            new Float32Array([1,1,1, 0.3,0.7,1]), 3
        ));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            vertexColors: true, blending: THREE.AdditiveBlending,
            depthWrite: false, transparent: true, opacity: 1,
        }));
        const dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([endX,endY,endZ]), 3));
        const dot = new THREE.Points(dotGeo, new THREE.PointsMaterial({
            size: 0.12, color: 0x00d2ff, blending: THREE.AdditiveBlending,
            depthWrite: false, transparent: true, opacity: 0.7,
        }));
        const group = new THREE.Group();
        group.add(line); group.add(dot);
        return {
            mesh: group, life: 0,
            maxLife: 50 + Math.random() * 100,
            speed: 0.06 + Math.random() * 0.18,
            dir: new THREE.Vector3(endX-startX, endY-startY, endZ-startZ).normalize(),
        };
    }

    function updateShootingStars() {
        if (shootingStars.length < MAX_SHOOTERS && Math.random() < 0.005) {
            const s = createShootingStar();
            shootingStars.push(s);
            scene.add(s.mesh);
        }
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];
            s.life++;
            s.mesh.position.x += s.dir.x * s.speed;
            s.mesh.position.y += s.dir.y * s.speed;
            s.mesh.position.z += s.dir.z * s.speed;
            const prog = s.life / s.maxLife;
            s.mesh.children.forEach(c => {
                if (c.material && c.material.opacity !== undefined) c.material.opacity = 1 - prog;
            });
            if (s.life >= s.maxLife) {
                scene.remove(s.mesh);
                shootingStars.splice(i, 1);
            }
        }
    }

    // ===== 动画循环 =====
    camera.position.z = 5;
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;

        const baseRot = 0.0002;
        allStars.forEach(s => {
            s.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), baseRot * (1 + s.userData.layer * 0.6));
            if (s.userData.layer >= 2) {
                const twinkle = 1 + Math.sin(time * 2.5 + s.userData.phase) * 0.18;
                s.scale.setScalar(s.userData.baseSize * twinkle);
            }
        });

        nebulaClouds.forEach(n => {
            n.material.opacity = 0.04 + Math.sin(time * n.userData.speed + n.userData.phase) * 0.025 + 0.03;
        });

        updateShootingStars();

        // 北斗脉冲（仅首页）
        if (IS_HOMEPAGE) {
            dipperStars.forEach(dipperStar => {
                const ud = dipperStar.userData;
                if (!ud.isPulsing) {
                    ud.pulseTimer += 0.016;
                    if (ud.pulseTimer >= ud.pulseInterval) {
                        ud.isPulsing = true;
                        ud.pulseProgress = 0;
                        ud.pulseTimer = 0;
                        ud.pulseInterval = 3 + Math.random() * 5;
                    }
                }
                if (ud.isPulsing) {
                    ud.pulseProgress += 0.02;
                    const t = ud.pulseProgress;
                    const intensity = t < 0.3
                        ? Math.sin(t / 0.3 * Math.PI / 2)
                        : Math.cos((t - 0.3) / 0.7 * Math.PI / 2);
                    dipperStar.scale.setScalar(ud.baseScale * (1 + intensity * 2.5));
                    dipperStar.material.opacity = 0.9 + intensity * 0.1;
                    if (t >= 1) { ud.isPulsing = false; dipperStar.scale.setScalar(ud.baseScale); dipperStar.material.opacity = 0.95; }
                }
            });
            rayGroups.forEach(({ group, dipperStar }) => {
                const ud = dipperStar.userData;
                if (ud.isPulsing) {
                    const t = ud.pulseProgress;
                    const intensity = t < 0.3 ? Math.sin(t/0.3*Math.PI/2) : Math.cos((t-0.3)/0.7*Math.PI/2);
                    group.position.copy(dipperStar.position);
                    group.children.forEach(ray => {
                        ray.material.opacity = intensity * 0.8;
                        ray.scale.set(ray.scale.x*(1+intensity*2), 0.04*(1+intensity), 1);
                    });
                } else {
                    group.children.forEach(ray => { ray.material.opacity = 0; });
                }
            });
            if (dipperLine) dipperLine.material.opacity = 0.18 + Math.sin(time * 0.8) * 0.04;
        }

        camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.015;
        camera.position.y += (mouseY * 0.8 - camera.position.y) * 0.015;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

// ========== 打字机效果（仅首页） ==========
(function typewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const words = [
        '正在探索 LLM 应用开发...',
        '学习 FastAPI & Python 后端...',
        '折腾 Docker & 云部署...',
        '热爱 AI & 开源项目...',
    ];
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
    document.addEventListener('mousemove', e => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
})();
