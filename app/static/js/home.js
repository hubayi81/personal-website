/**
 * 首页特效：Three.js 星空粒子（大小不一 + 流星划过）、打字机效果、鼠标光晕
 */

// === 星空粒子系统 ===
(function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const colorPurple = new THREE.Color(0x6c5ce7);
    const colorCyan = new THREE.Color(0x00d2ff);
    const colorWhite = new THREE.Color(0xffffff);
    const colorGold = new THREE.Color(0xffd700);

    // ===== 小星星（远处，0.03~0.06） =====
    function createSmallStars() {
        const count = 600;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 20 + Math.random() * 35;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.7;

            positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
            positions[i * 3 + 1] = radius * Math.cos(phi) - 5;
            positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi) - 10;

            const r = Math.random();
            let color;
            if (r < 0.5) color = colorWhite;
            else if (r < 0.75) color = colorPurple;
            else if (r < 0.9) color = colorCyan;
            else color = colorGold;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.7,
        });

        return new THREE.Points(geo, mat);
    }

    // ===== 中等星星（0.06~0.12） =====
    function createMediumStars() {
        const count = 300;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 12 + Math.random() * 25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.7;

            positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
            positions[i * 3 + 1] = radius * Math.cos(phi) - 3;
            positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi) - 8;

            const r = Math.random();
            let color;
            if (r < 0.3) color = colorWhite;
            else if (r < 0.55) color = colorPurple;
            else if (r < 0.8) color = colorCyan;
            else color = colorGold;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.12,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.85,
        });

        return new THREE.Points(geo, mat);
    }

    // ===== 大亮星（少量，0.15~0.35，闪烁） =====
    function createBigStars() {
        const count = 50;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 8 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.6;

            positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
            positions[i * 3 + 1] = radius * Math.cos(phi) - 2;
            positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi) - 6;

            const r = Math.random();
            let color;
            if (r < 0.3) color = colorWhite;
            else if (r < 0.5) color = colorGold;
            else if (r < 0.75) color = colorCyan;
            else color = colorPurple;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.95,
        });

        return new THREE.Points(geo, mat);
    }

    const smallStars = createSmallStars();
    const mediumStars = createMediumStars();
    const bigStars = createBigStars();
    scene.add(smallStars);
    scene.add(mediumStars);
    scene.add(bigStars);

    // 连线
    const linesGeometry = new THREE.BufferGeometry();
    const linesCount = 150;
    const linePositions = new Float32Array(linesCount * 6);

    for (let i = 0; i < linesCount; i++) {
        const r1 = 12 + Math.random() * 28;
        const t1 = Math.random() * Math.PI * 2;
        const p1 = Math.random() * Math.PI * 0.7;
        const x1 = r1 * Math.cos(t1) * Math.sin(p1);
        const y1 = r1 * Math.cos(p1) - 5;
        const z1 = r1 * Math.sin(t1) * Math.sin(p1) - 10;

        const r2 = r1 + (Math.random() - 0.5) * 2.5;
        const t2 = t1 + (Math.random() - 0.5) * 0.25;
        const p2 = p1 + (Math.random() - 0.5) * 0.25;
        const x2 = r2 * Math.cos(t2) * Math.sin(p2);
        const y2 = r2 * Math.cos(p2) - 5;
        const z2 = r2 * Math.sin(t2) * Math.sin(p2) - 10;

        linePositions[i * 6] = x1;
        linePositions[i * 6 + 1] = y1;
        linePositions[i * 6 + 2] = z1;
        linePositions[i * 6 + 3] = x2;
        linePositions[i * 6 + 4] = y2;
        linePositions[i * 6 + 5] = z2;
    }

    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(linesGeometry, new THREE.LineBasicMaterial({
        color: 0x6c5ce7,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }));
    scene.add(lines);

    // ===== 流星系统 =====
    const shootingStars = [];
    const MAX_SHOOTERS = 3;

    function createShootingStar() {
        const startX = 8 + Math.random() * 15;    // 右上
        const startY = 5 + Math.random() * 10;
        const startZ = -5 + Math.random() * 10;

        const length = 1.5 + Math.random() * 3;
        const endX = startX - 15 - Math.random() * 20;  // 左下
        const endY = startY - 10 - Math.random() * 15;
        const endZ = startZ - 5;

        // 流星主体线段
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            startX, startY, startZ,
            endX, endY, endZ,
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        // 头部亮色
        const headColors = new Float32Array([
            1, 1, 1,
            0.4, 0.8, 1,
        ]);
        geometry.setAttribute('color', new THREE.BufferAttribute(headColors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 1,
        });

        const line = new THREE.Line(geometry, material);

        // 尾部光点
        const dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute('position', new THREE.BufferAttribute(
            new Float32Array([endX, endY, endZ]), 3
        ));
        const dotMat = new THREE.PointsMaterial({
            size: 0.15,
            color: 0x00d2ff,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.6,
        });
        const dot = new THREE.Points(dotGeo, dotMat);

        const group = new THREE.Group();
        group.add(line);
        group.add(dot);

        // 流星数据
        return {
            mesh: group,
            life: 0,
            maxLife: 60 + Math.random() * 80,  // 持续帧数
            speed: 0.08 + Math.random() * 0.15,
            direction: new THREE.Vector3(endX - startX, endY - startY, endZ - startZ).normalize(),
            startX, startY, startZ,
            endX, endY, endZ,
        };
    }

    function updateShootingStars() {
        // 随机生成新流星
        if (shootingStars.length < MAX_SHOOTERS && Math.random() < 0.008) {
            const star = createShootingStar();
            shootingStars.push(star);
            scene.add(star.mesh);
        }

        // 更新现有流星
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const star = shootingStars[i];
            star.life++;

            const progress = star.life / star.maxLife;
            star.mesh.position.x += star.direction.x * star.speed;
            star.mesh.position.y += star.direction.y * star.speed;
            star.mesh.position.z += star.direction.z * star.speed;

            // 渐隐
            star.mesh.children.forEach(c => {
                if (c.material) c.material.opacity = 1 - progress;
            });

            // 移除已消失的流星
            if (star.life >= star.maxLife) {
                scene.remove(star.mesh);
                shootingStars.splice(i, 1);
            }
        }
    }

    camera.position.z = 5;

    // 动画循环
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // 大星星闪烁
    let twinklePhase = 0;

    function animate() {
        requestAnimationFrame(animate);

        smallStars.rotation.y += 0.0002;
        smallStars.rotation.x += 0.00008;
        mediumStars.rotation.y += 0.00035;
        mediumStars.rotation.x += 0.00012;
        bigStars.rotation.y += 0.0005;
        bigStars.rotation.x += 0.00015;
        lines.rotation.y += 0.0003;
        lines.rotation.x += 0.0001;

        // 大星星呼吸闪烁
        twinklePhase += 0.02;
        bigStars.material.opacity = 0.6 + Math.sin(twinklePhase) * 0.35;
        bigStars.material.size = 0.25 + Math.sin(twinklePhase * 1.3) * 0.1;

        // 流星更新
        updateShootingStars();

        camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 1.5 - camera.position.y) * 0.02;
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

// === 打字机效果 ===
(function typewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;

    const words = [
        '正在探索 LLM 应用开发...',
        '学习 FastAPI & Python 后端...',
        '折腾 Docker & 云部署...',
        '热爱 AI & 开源项目...',
    ];

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isWaiting = false;

    function tick() {
        const currentWord = words[wordIndex];

        if (isWaiting) {
            isWaiting = false;
            isDeleting = true;
            setTimeout(tick, 50);
            return;
        }

        if (isDeleting) {
            el.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            el.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let speed = isDeleting ? 30 : 60 + Math.random() * 40;

        if (!isDeleting && charIndex === currentWord.length) {
            speed = 2000;
            isWaiting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            speed = 300;
        }

        setTimeout(tick, speed);
    }

    setTimeout(tick, 1000);
})();

// === 鼠标光晕 ===
(function mouseGlow() {
    const glow = document.getElementById('mouseGlow');
    if (!glow) return;

    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
})();
