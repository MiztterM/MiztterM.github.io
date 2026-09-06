// ==============================================================
// 1. BASE DE DATOS DE CONCEPTOS (Textos y Colores para la etiqueta)
// ==============================================================
const conceptsData = {
    'canvas-memoria': {
        title: 'Memoria',
        sub: 'Subsistema 1 - Registro',
        color: '#708090' 
    },
    'canvas-herencia': {
        title: 'Herencia',
        sub: 'Subsistema 1 - Legado',
        color: '#708090'
    },
    'canvas-caducidad': {
        title: 'Caducidad',
        sub: 'Subsistema 1 - Lo perdido en el tránsito',
        color: '#708090'
    },
    'canvas-identidad': {
        title: 'Identidad',
        sub: 'Subsistema 2 - Afirmación de si',
        color: '#849c8b' 
    },
    'canvas-empatia': {
        title: 'Empatía',
        sub: 'Subsistema 2 - Comprensión del otro',
        color: '#849c8b'
    },
    'canvas-colaboracion': {
        title: 'Colaboración',
        sub: 'Subsistema 2 - Coexistencia de lo diverso',
        color: '#849c8b'
    },
    'canvas-incertidumbre': {
        title: 'Incertidumbre',
        sub: 'Subsistema 3 - Desconocimiento del devenir',
        color: '#8d849c' 
    },
    'canvas-expectativa': {
        title: 'Expectativa',
        sub: 'Subsistema 3 - Anticipación',
        color: '#8d849c'
    },
    'canvas-ansiedad': {
        title: 'Ansiedad',
        sub: 'Subsistema 3 - Pre-ocupación sobre el futuro',
        color: '#8d849c'
    }
};

// ==============================================================
// 2. LÓGICA DE INTERFAZ (Abrir / Cerrar Detalle)
// ==============================================================
const overlay = document.getElementById('detail-overlay');
const containerRight = document.getElementById('detail-canvas-container');
let currentCard = null;
let currentCanvas = null;

document.querySelectorAll('.interface-card').forEach(card => {
    card.addEventListener('click', () => {
        currentCard = card;
        currentCanvas = card.querySelector('canvas');
        const canvasId = currentCanvas.id;
        const data = conceptsData[canvasId];

        document.getElementById('detail-title').innerText = data?.title || 'Sin Título';
        document.getElementById('detail-subsystem').innerText = data?.sub || 'Subsistema';
        document.getElementById('detail-desc').innerText = data?.desc || '';

        const tagElement = document.getElementById('detail-subsystem');
        if (tagElement) {
            tagElement.style.backgroundColor = data?.color || '#000';
        }

        containerRight.appendChild(currentCanvas);
        overlay.classList.add('active'); 
        document.body.style.overflow = 'hidden';
    });
});

document.querySelectorAll('.btn-volver').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentCard && currentCanvas) {
            currentCard.querySelector('.canvas-container').appendChild(currentCanvas);
        }
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto'; 

        // Reseteamos la fatiga de caducidad al salir
        cadRespawnCount = 0; 
    });
});

// Lógica del botón de Modo Lámina
const btnFullscreenGrid = document.getElementById('btn-fullscreen-grid');
if (btnFullscreenGrid) {
    btnFullscreenGrid.addEventListener('click', () => {
        document.body.classList.toggle('fullscreen-grid-mode');
        
        if (document.body.classList.contains('fullscreen-grid-mode')) {
            btnFullscreenGrid.innerText = 'VER NORMAL';
        } else {
            btnFullscreenGrid.innerText = 'VER TODOS';
        }
    });
}

// ==============================================================
// 3. MOTOR DE RENDERIZADO Y UTILIDADES
// ==============================================================
const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

// --- SIMULADOR MULTITOUCH EN PC (RESTRINGIDO A EXPECTATIVA) ---
const activeKeys = new Set();

window.addEventListener('keydown', (e) => {
    // Solo registra las teclas si el panel abierto es exactamente la Expectativa
    if (currentCanvas && currentCanvas.id === 'canvas-expectativa') {
        activeKeys.add(e.code);
    }
});

window.addEventListener('keyup', (e) => {
    activeKeys.delete(e.code);
});

// Limpieza de seguridad: suelta las teclas virtuales si el usuario cambia de ventana
window.addEventListener('blur', () => activeKeys.clear());

const initCanvas = (id, drawFn, setupFn = null, customClickFn = null) => {
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    let mouse = {
        x: size/2, y: size/2, targetX: size/2, targetY: size/2,
        isDown: false, inside: false, touches: [] 
    };

    const updateCoordinates = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = (clientX - rect.left) * (size / rect.width);
        mouse.targetY = (clientY - rect.top) * (size / rect.height);
    };

    const touchesToPoints = (touchList) => {
        const rect = canvas.getBoundingClientRect();
        return Array.from(touchList).map(t => ({
            id: t.identifier,
            x: (t.clientX - rect.left) * (size / rect.width),
            y: (t.clientY - rect.top) * (size / rect.height)
        }));
    };

    canvas.addEventListener('mousemove', (e) => { updateCoordinates(e.clientX, e.clientY); mouse.inside = true; });
    canvas.addEventListener('mouseenter', () => mouse.inside = true);
    canvas.addEventListener('mouseleave', () => { mouse.inside = false; mouse.isDown = false; });
    canvas.addEventListener('mousedown', () => { mouse.isDown = true; if (customClickFn) customClickFn(); });
    canvas.addEventListener('mouseup', () => mouse.isDown = false);

    canvas.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0) {
            updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
            mouse.inside = true;
            mouse.touches = touchesToPoints(e.touches);
        }
        if (e.cancelable) e.preventDefault();
    }, {passive: false});

    canvas.addEventListener('touchstart', (e) => {
        mouse.isDown = true; mouse.inside = true;
        if(e.touches.length > 0) updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
        mouse.touches = touchesToPoints(e.touches);
        if (customClickFn) customClickFn();
        if (e.cancelable) e.preventDefault();
    }, {passive: false});

    canvas.addEventListener('touchend', (e) => {
        mouse.touches = touchesToPoints(e.touches);
        if (e.touches.length === 0) { mouse.isDown = false; mouse.inside = false; }
    });
    canvas.addEventListener('touchcancel', (e) => {
        mouse.touches = touchesToPoints(e.touches);
        if (e.touches.length === 0) { mouse.isDown = false; mouse.inside = false; }
    });

    if (setupFn) setupFn();

    let time = 0;
    function tick() {
        time += 0.02;
        mouse.x = lerp(mouse.x, mouse.targetX, 0.1);
        mouse.y = lerp(mouse.y, mouse.targetY, 0.1);

        ctx.clearRect(0, 0, size, size);

        drawFn(ctx, size, mouse, time);
        requestAnimationFrame(tick);
    }
    tick();
};

const drawSolidTriangle = (ctx, x, y, r, rotation, scaleW = 1, scaleH = 1) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.beginPath();
    ctx.moveTo(0, -r * scaleH); ctx.lineTo(r * 0.866 * scaleW, r * 0.5 * scaleH); ctx.lineTo(-r * 0.866 * scaleW, r * 0.5 * scaleH);
    ctx.closePath(); ctx.fill(); ctx.restore();
};

const drawTriangleOutline = (ctx, x, y, r, rotation) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.866, r * 0.5); ctx.lineTo(-r * 0.866, r * 0.5);
    ctx.closePath(); ctx.stroke(); ctx.restore();
};

const triangleVertices = (cx, cy, r, rot) => {
    const raw = [[0, -r], [r * 0.866, r * 0.5], [-r * 0.866, r * 0.5]];
    const cos = Math.cos(rot), sin = Math.sin(rot);
    return raw.map(([px, py]) => ({
        x: cx + (px * cos - py * sin),
        y: cy + (px * sin + py * cos)
    }));
};

const getActivePoints = (mouse) => {
    if (mouse.touches.length > 0) return mouse.touches;
    if (mouse.isDown) return [{ x: mouse.targetX, y: mouse.targetY }];
    return [];
};

// ==============================================================
// 4. LÓGICAS DE LOS 9 INTERACTIVOS
// ==============================================================

// --- MEMORIA ---
let memGrid = [];
const MEM_FADE_IN = 22, MEM_HOLD = 26, MEM_FADE_OUT = 22, MEM_GAP = 18;
const memSmoothstep = (x) => x * x * (3 - 2 * x);

let memRound = 1;
let memSequence = [];
let memPhase = 'idle';
let memShowIdx = 0;
let memShowTimer = 0;
let memShowSub = 'in';
let memFlashTimer = 0;
let memFlashHold = 30;
let memFlashOk = true;

let memInputIdx = 0;
let memEpisodeOpen = false;
let memEpisodeHits = new Set();
let memFlashIds = [];

const MEM_BASE_RGB = [112, 128, 144];
const MEM_OK_RGB = [132, 156, 139];
const MEM_FAIL_RGB = [176, 110, 103];

let memCircleLit = new Array(9).fill(0);    
let memCircleColorMix = new Array(9).fill(0);

function memGenerateSequence(round) {
    const length = Math.min(3 + Math.floor((round - 1) / 3), 6);
    const doubleChance = Math.min(0.65, 0.12 + round * 0.06);
    const seq = [];
    for (let i = 0; i < length; i++) {
        const count = Math.random() < doubleChance ? 2 : 1;
        const ids = new Set();
        while (ids.size < count) ids.add(Math.floor(Math.random() * 9));
        seq.push([...ids]);
    }
    return seq;
}
memSequence = memGenerateSequence(memRound);

initCanvas('canvas-memoria', (ctx, size, mouse, time) => {
    if (memGrid.length === 0) {
        const constellation = [
            { x: 150, y: 120, r: 18 },
            { x: 230, y: 100, r: 24 },
            { x: 300, y: 150, r: 14 },
            { x: 100, y: 200, r: 15 },
            { x: 200, y: 190, r: 20 },
            { x: 270, y: 230, r: 18 },
            { x: 130, y: 280, r: 22 },
            { x: 210, y: 270, r: 14 },
            { x: 280, y: 310, r: 16 }  
        ];

        constellation.forEach((pos, i) => {
            memGrid.push({
                x: pos.x, y: pos.y,
                r: pos.r,
                id: i,
                seedX: Math.random() * 100, seedY: Math.random() * 100
            });
        });
    }

    const isInDetailView = overlay.classList.contains('active') && currentCanvas && currentCanvas.id === 'canvas-memoria';
    const points = getActivePoints(mouse);
   
    let litOpacity = new Array(9).fill(0);
    let colorMixTarget = new Array(9).fill(0);
    let flashRgb = MEM_OK_RGB;

    if (!isInDetailView) {
        // --- ESTADO BASE (EN LA GRILLA) ---
        const frame = Math.floor(time * 60) % 320;
       
        // 1. Ilumina secuencialmente
        if (frame > 20 && frame < 70) litOpacity[1] = Math.sin((frame - 20) / 50 * Math.PI);
        if (frame > 80 && frame < 130) litOpacity[4] = Math.sin((frame - 80) / 50 * Math.PI);
        if (frame > 140 && frame < 190) litOpacity[6] = Math.sin((frame - 140) / 50 * Math.PI);
       
        // 2. Fase final: Enciende TODOS los 9 círculos con su iluminación original
        if (frame > 210 && frame < 290) {
            let lit = 0;
            if (frame < 230) lit = (frame - 210) / 20;
            else if (frame > 270) lit = 1 - ((frame - 270) / 20);
            else lit = 1;
           
            for (let i = 0; i < 9; i++) {
                litOpacity[i] = Math.max(litOpacity[i] || 0, lit);
            }
        }

        if (memPhase !== 'idle') {
            memPhase = 'idle';
            memShowIdx = 0;
            memInputIdx = 0;
            memFlashTimer = 0;
        }

    } else {
        // --- ESTADO INTERACTIVO (EN DETALLE) ---
        if (memPhase === 'idle') {
            if (points.length > 0) {
                const touchedAny = points.some(pt => memGrid.some(g => Math.hypot(g.x - pt.x, g.y - pt.y) < g.r + 20));
                if (touchedAny) {
                    memPhase = 'showing';
                    memShowIdx = 0; memShowTimer = 0; memShowSub = 'in';
                }
            }
        } else if (memPhase === 'showing') {
            const frameIds = memSequence[memShowIdx];
            memShowTimer++;

            let frac = 0;
            if (memShowSub === 'in') {
                frac = memSmoothstep(Math.min(1, memShowTimer / MEM_FADE_IN));
                if (memShowTimer >= MEM_FADE_IN) { memShowSub = 'hold'; memShowTimer = 0; }
            } else if (memShowSub === 'hold') {
                frac = 1;
                if (memShowTimer >= MEM_HOLD) { memShowSub = 'out'; memShowTimer = 0; }
            } else if (memShowSub === 'out') {
                frac = 1 - memSmoothstep(Math.min(1, memShowTimer / MEM_FADE_OUT));
                if (memShowTimer >= MEM_FADE_OUT) { memShowSub = 'gap'; memShowTimer = 0; }
            } else {
                frac = 0;
                if (memShowTimer >= MEM_GAP) {
                    memShowTimer = 0;
                    memShowSub = 'in';
                    memShowIdx++;
                    if (memShowIdx >= memSequence.length) {
                        memShowIdx = 0;
                        memPhase = 'input';
                        memInputIdx = 0;
                        memEpisodeOpen = false;
                        memEpisodeHits = new Set();
                    }
                }
            }
            frameIds.forEach(id => { litOpacity[id] = frac; });

        } else if (memPhase === 'input') {
            if (points.length > 0) {
                if (!memEpisodeOpen) { memEpisodeOpen = true; memEpisodeHits = new Set(); }
                points.forEach(pt => {
                    const found = memGrid.find(g => Math.hypot(g.x - pt.x, g.y - pt.y) < g.r + 16);
                    if (found) memEpisodeHits.add(found.id);
                });
                memEpisodeHits.forEach(id => { litOpacity[id] = 1; });
            } else if (memEpisodeOpen) {
                memEpisodeOpen = false;
                const expected = new Set(memSequence[memInputIdx]);
                const same = expected.size === memEpisodeHits.size &&
                    [...expected].every(id => memEpisodeHits.has(id));

                if (!same) {
                    memFlashIds = [...memSequence[memInputIdx]];
                    memPhase = 'flash'; memFlashTimer = 0; memFlashOk = false;
                } else {
                    memInputIdx++;
                    if (memInputIdx >= memSequence.length) {
                        memFlashIds = memGrid.map(g => g.id);
                        memPhase = 'flash'; memFlashTimer = 0; memFlashOk = true;
                    }
                }
            }
        } else if (memPhase === 'flash') {
            memFlashTimer++;
            memFlashIds.forEach(id => { litOpacity[id] = 1; });
            if (memFlashTimer >= memFlashHold) {
                if (memFlashOk) { memRound++; memSequence = memGenerateSequence(memRound); }
                memShowIdx = 0; memShowTimer = 0; memShowSub = 'in';
                memPhase = 'showing';
            }
        }

        const globalMixTarget = memPhase === 'flash' ? 1 : 0;
        flashRgb = memFlashOk ? MEM_OK_RGB : MEM_FAIL_RGB;
        memGrid.forEach(g => {
            if (memPhase === 'flash' && memFlashIds.includes(g.id)) {
                colorMixTarget[g.id] = globalMixTarget;
            }
        });
    }

    // --- RENDERIZADO COMPARTIDO ---
    memGrid.forEach(g => {
        const orbitR = 9;
        const orbitAngle = time * 0.9 + g.seedX;
        const floatX = Math.cos(orbitAngle) * orbitR;
        const floatY = Math.sin(orbitAngle) * orbitR;
        const rx = g.x + floatX, ry = g.y + floatY;

        memCircleLit[g.id] = lerp(memCircleLit[g.id], litOpacity[g.id], 0.09);
        memCircleColorMix[g.id] = lerp(memCircleColorMix[g.id], colorMixTarget[g.id], 0.05);

        const lit = memCircleLit[g.id];
        const mix = memCircleColorMix[g.id];
        const pulse = 1 + lit * 0.1;

        const rC = lerp(MEM_BASE_RGB[0], flashRgb[0], mix);
        const gC = lerp(MEM_BASE_RGB[1], flashRgb[1], mix);
        const bC = lerp(MEM_BASE_RGB[2], flashRgb[2], mix);
        const opa = 0.28 + lit * 0.67;

        ctx.fillStyle = `rgba(${rC.toFixed(1)}, ${gC.toFixed(1)}, ${bC.toFixed(1)}, ${opa})`;
        ctx.beginPath(); ctx.arc(rx, ry, g.r * pulse, 0, Math.PI * 2); ctx.fill();
    });
});

// --- HERENCIA ---
let herenciaNodes = [];
let herenciaActiveNode = null; 

initCanvas('canvas-herencia', (ctx, size, mouse, time) => {
    const baseRadius = 26; 
    const spreadStep = 11; 

    if (herenciaNodes.length === 0) {
        herenciaNodes = [
            { id: 0, x: 130, y: 115, maxLayers: 5, layers: 1, progress: 0, baseDist: null, locked: false, scale: 0.77, sizeMod: 0.75 }, 
            { id: 1, x: 275, y: 195, maxLayers: 2, layers: 1, progress: 0, baseDist: null, locked: false, scale: 0.77, sizeMod: 1.7 }, 
            { id: 2, x: 155, y: 275, maxLayers: 3, layers: 1, progress: 0, baseDist: null, locked: false, scale: 0.77, sizeMod: 1.25 }  
        ];
    }

    const isInDetailView = overlay.classList.contains('active') && currentCanvas && currentCanvas.id === 'canvas-herencia';

    // --- VARIABLES GLOBALES DEL ESTADO BASE ---
    let baseSettled = 1;
    let baseProgress = 0;
    let baseFadeOut = 1; 
    let activeBaseIndex = 0;

    if (!isInDetailView) {
        const frameTotal = Math.floor(time * 60);
        const frame = frameTotal % 260; 
        
        activeBaseIndex = Math.floor(frameTotal / 260) % 3;
        
        const currentActiveMax = herenciaNodes[activeBaseIndex].maxLayers;
        const extraLayers = currentActiveMax - 1;

        const animStart = 15;
        const animEnd = 170;
        const fadeStart = 170;
        const fadeEnd = 250;

        if (frame < animStart) {
            baseSettled = 1;
            baseProgress = 0;
            baseFadeOut = 1;
        } else if (frame < animEnd) {
            baseFadeOut = 1;
            const animDuration = animEnd - animStart;
            const layerSlot = animDuration / extraLayers;
            const progressInAnim = frame - animStart;
            const currentStep = Math.min(extraLayers - 1, Math.floor(progressInAnim / layerSlot));
            const frameInSlot = progressInAnim - currentStep * layerSlot;

            const growWindow = layerSlot * 0.75;
            baseSettled = 1 + currentStep;

            if (frameInSlot < growWindow) {
                baseProgress = frameInSlot / growWindow;
            } else {
                baseSettled = 1 + currentStep + 1;
                baseProgress = 0;
            }
        } else if (frame < fadeEnd) {
            baseSettled = currentActiveMax;
            baseProgress = 0;
            baseFadeOut = 1 - ((frame - fadeStart) / (fadeEnd - fadeStart));
        } else {
            baseSettled = 1;
            baseProgress = 0;
            baseFadeOut = 1;
        }
    } else {
        // --- ESTADO INTERACTIVO ---
        const isInteracting = mouse.touches.length >= 2;

        if (isInteracting) {
            const [a, b] = mouse.touches;
            let currentDist = Math.hypot(a.x - b.x, a.y - b.y);
            
            let midX = (a.x + b.x) / 2;
            let midY = (a.y + b.y) / 2;

            if (herenciaActiveNode === null) {
                let closest = null;
                let minDist = Infinity;
                herenciaNodes.forEach(node => {
                    let d = Math.hypot(node.x - midX, node.y - midY);
                    if (d < minDist) { 
                        minDist = d; 
                        closest = node; 
                    }
                });
                herenciaActiveNode = closest;
                closest.baseDist = currentDist;
            } else {
                let node = herenciaActiveNode;
                if (!node.locked) {
                    let dragAmount = currentDist - node.baseDist;
                    
                    if (dragAmount > 0 && node.layers < node.maxLayers) {
                        node.progress = Math.min(1, dragAmount / 45);
                        if (node.progress >= 1) {
                            node.layers++;
                            node.progress = 0; 
                            node.locked = true; 
                        }
                    } 
                    else if (dragAmount < 0 && node.layers > 1) {
                        node.progress = Math.max(-1, dragAmount / 45); 
                        if (node.progress <= -1) {
                            node.layers--; 
                            node.progress = 0; 
                            node.locked = true; 
                        }
                    }
                }
            }
        } else {
            herenciaActiveNode = null;
            herenciaNodes.forEach(node => {
                if (node.progress !== 0 && !node.locked) {
                    node.progress = lerp(node.progress, 0, 0.2);
                    if (Math.abs(node.progress) < 0.01) node.progress = 0;
                }
                node.locked = false;
                node.baseDist = null;
            });
        }
    }

    // --- RENDERIZADO INDEPENDIENTE PARA CADA NODO ---
    herenciaNodes.forEach((node, index) => {
        let drawSettled = 1;
        let drawProgress = 0;
        let fade = 1;
        let targetScale = 1;

        if (isInDetailView) {
            drawSettled = node.layers;
            drawProgress = node.progress;
            if (drawProgress < 0) {
                drawSettled = node.layers - 1;
                drawProgress = 1.0 + drawProgress; 
            }
            targetScale = (herenciaActiveNode === node) ? 1 : 0.77;
        } else {
            if (index === activeBaseIndex) {
                drawSettled = baseSettled;
                drawProgress = baseProgress;
                fade = baseFadeOut;
                targetScale = 1;
            } else {
                drawSettled = 1;
                drawProgress = 0;
                fade = 1;
                targetScale = 0.77; 
            }
        }

        node.scale = lerp(node.scale, targetScale, 0.08);

        let localBaseRadius = baseRadius * node.scale * node.sizeMod;
        let localSpreadStep = spreadStep * node.scale * node.sizeMod;

        let activeLevel = (drawSettled - 1 + Math.max(0, drawProgress)) / (node.maxLayers - 1);
        let coreOpacity = 0.25 + (activeLevel * 0.50);

        // 1. CAPA NUEVA AL FONDO
        if (drawProgress > 0.001 && drawSettled < node.maxLayers) {
            const nextLayer = drawSettled + 1;
            const wave = Math.sin(time * 1.2 + nextLayer + node.id) * 3 * node.scale * node.sizeMod; 
            const prevRadius = localBaseRadius + (drawSettled - 1) * localSpreadStep;
            const targetRadius = localBaseRadius + (nextLayer - 1) * localSpreadStep;
            
            const radius = prevRadius + (targetRadius - prevRadius) * drawProgress + wave;
            
            let layerOpacity = coreOpacity - (nextLayer - 1) * 0.12; 
            let finalOpacity = Math.max(0.05, layerOpacity);
            
            if (nextLayer > 1) {
                finalOpacity *= fade;
            }
            
            if (finalOpacity > 0.01) {
                ctx.fillStyle = `rgba(112, 128, 144, ${finalOpacity})`;
                ctx.beginPath(); 
                ctx.arc(node.x, node.y, Math.max(0, radius), 0, Math.PI * 2); 
                ctx.fill();
            }
        }

        // 2. CAPAS FIJAS AL FRENTE
        for (let i = drawSettled; i >= 1; i--) {
            const wave = Math.sin(time * 1.2 + i + node.id) * 3 * node.scale * node.sizeMod;
            const radius = localBaseRadius + (i - 1) * localSpreadStep + wave;
            
            let layerOpacity = coreOpacity - (i - 1) * 0.12; 
            let finalOpacity = Math.max(0.05, layerOpacity);
            
            if (i > 1) {
                finalOpacity *= fade; 
            } else if (fade < 1) {
                finalOpacity = 0.25 + (finalOpacity - 0.25) * fade; 
            }
            
            if (finalOpacity > 0.01) {
                ctx.fillStyle = `rgba(112, 128, 144, ${finalOpacity})`;
                ctx.beginPath(); 
                ctx.arc(node.x, node.y, Math.max(0, radius), 0, Math.PI * 2); 
                ctx.fill();
            }
        }
    });
});

// --- CADUCIDAD ---
let cadNodes = [];
let cadRespawnCount = 0; 
let cadWasInDetailView = false; 

initCanvas('canvas-caducidad', (ctx, size, mouse, time) => {
    const isInDetailView = overlay.classList.contains('active') && currentCanvas && currentCanvas.id === 'canvas-caducidad';

    if (cadNodes.length === 0) {
        const layout = [
            { x: 90,  y: 205, r: 12, baseAlpha: 0.50 }, 
            { x: 125, y: 165, r: 18, baseAlpha: 0.70 }, 
            { x: 140, y: 250, r: 34, baseAlpha: 0.85 }, 
            { x: 190, y: 200, r: 26, baseAlpha: 0.80 }, 
            { x: 220, y: 255, r: 9,  baseAlpha: 0.40 }, 
            { x: 245, y: 145, r: 31, baseAlpha: 0.85 }, 
            { x: 280, y: 225, r: 18, baseAlpha: 0.65 }, 
            { x: 310, y: 185, r: 12, baseAlpha: 0.40 }  
        ];

        layout.forEach((pos, idx) => {
            cadNodes.push({
                ox: pos.x, oy: pos.y,
                baseOx: pos.x, baseOy: pos.y, 
                baseSize: pos.r,
                baseAlpha: pos.baseAlpha,
                state: 'idle',  
                progress: 1,    
                seed: Math.random() * 100,
                isFlickering: idx === 2 || idx === 5 || idx === 7,
                flickerSpeed: 1.2 + Math.random() * 0.8,
                flickerOffset: Math.random() * Math.PI * 2,
                pulseSpeed: 1.0 + Math.random() * 0.5,
                pulseOffset: Math.random() * Math.PI * 2
            });
        });
    }

    if (cadWasInDetailView && !isInDetailView) {
        cadNodes.forEach(node => {
            node.state = 'reset_vanishing';
        });
        cadRespawnCount = 0; 
    }
    cadWasInDetailView = isInDetailView;

    const points = getActivePoints(mouse);
    const pointer = points.length > 0 ? points[0] : null;

    cadNodes.forEach((node, idx) => {
        
        if (pointer && (node.state === 'idle' || node.state === 'growing')) {
            let dist = Math.hypot(pointer.x - node.ox, pointer.y - node.oy);
            if (dist < node.baseSize + 25) {
                node.state = 'vanishing';
            }
        }

        // --- MÁQUINA DE ESTADOS ---
        if (node.state === 'vanishing') {
            node.progress -= 0.08; 
            if (node.progress <= 0) {
                node.progress = 0;
                node.state = 'growing';
                cadRespawnCount++; 
                
                const margin = 40;
                node.ox = margin + Math.random() * (size - margin * 2);
                node.oy = margin + Math.random() * (size - margin * 2);
            }
        } 
        else if (node.state === 'growing') {
            let growRate = (cadRespawnCount >= 10) ? (1 / 600) : 0.04;
            node.progress += growRate;
            if (node.progress >= 1) {
                node.progress = 1;
                node.state = 'idle';
            }
        }
        else if (node.state === 'reset_vanishing') {
            node.progress -= 0.025; 
            if (node.progress <= 0) {
                node.progress = 0;
                node.state = 'reset_growing';
                node.ox = node.baseOx; 
                node.oy = node.baseOy;
            }
        }
        else if (node.state === 'reset_growing') {
            node.progress += 0.015; 
            if (node.progress >= 1) {
                node.progress = 1;
                node.state = 'idle';
            }
        }

        // 1. Movimiento leve en su propio lugar
        let floatX = Math.cos(time * 0.8 + node.seed) * 2.5;
        let floatY = Math.sin(time * 0.8 + node.seed * 1.5) * 2.5;
        
        // 2. Achicamiento pronunciado (respiración)
        let sizePulse = 0.75 + Math.sin(time * node.pulseSpeed + node.pulseOffset) * 0.25;
        
        // 3. Parpadeo leve de opacidad
        let alphaMult = 1.0;
        if (node.isFlickering) {
            let pulse = (Math.sin(time * node.flickerSpeed + node.flickerOffset) + 1) / 2;
            alphaMult = 0.55 + pulse * 0.45;
        }

        let currentAlpha = node.baseAlpha * node.progress * alphaMult;
        let currentR = node.baseSize * node.progress * sizePulse;

        if (currentAlpha > 0.01 && currentR > 0.5) {
            ctx.fillStyle = `rgba(112, 128, 144, ${currentAlpha})`;
            ctx.beginPath();
            ctx.arc(node.ox + floatX, node.oy + floatY, currentR, 0, Math.PI * 2);
            ctx.fill();
        }
    });
});

// --- IDENTIDAD ---
let idRotation = 0;
let idRotSpeed = 0;
let idDragPrevAngle = null;
let idCenterSize = 18; 
let currentSquareSizes = [32, 32, 32, 32, 32, 32, 32, 32];
let idOuterBobAmp = 0; 
let idCenterBobAmp = 0;

initCanvas('canvas-identidad', (ctx, size, mouse, time) => {
    const cx = size / 2, cy = size / 2;
    const points = getActivePoints(mouse);
    const pointer = points.length > 0 ? points[0] : null;

    if (pointer) {
        const angle = Math.atan2(pointer.y - cy, pointer.x - cx);
        if (idDragPrevAngle !== null) {
            let delta = angle - idDragPrevAngle;
            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;
            idRotation += delta;
            idRotSpeed = lerp(idRotSpeed, Math.abs(delta) * 60, 0.3);
        }
        idDragPrevAngle = angle;
    } else {
        idDragPrevAngle = null;
        idRotSpeed = lerp(idRotSpeed, 0, 0.08);
    }

    const targetCenterSize = 18 + Math.min(idRotSpeed, 3) * 26;
    idCenterSize = lerp(idCenterSize, targetCenterSize, 0.1);

    const OUTER_BOB_AMPLITUDE = 8;
    const CENTER_BOB_AMPLITUDE = 8;
    idOuterBobAmp = lerp(idOuterBobAmp, pointer ? 0 : OUTER_BOB_AMPLITUDE, 0.06);
    idCenterBobAmp = lerp(idCenterBobAmp, pointer ? CENTER_BOB_AMPLITUDE : 0, 0.06);

    let nodes = [];
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + idRotation;
        const nx = cx + Math.cos(angle) * 100;
        const bobY = Math.sin(time * 0.9 + i * 0.85) * idOuterBobAmp; 
        const ny = cy + Math.sin(angle) * 100 + bobY;
        let baseSize;
        if (i === 2 || i === 6) baseSize = 60;
        else if (i === 0 || i === 4) baseSize = 20;
        else baseSize = 40;
        const targetSize = pointer ? Math.max(16, baseSize * 0.6) : baseSize;
        currentSquareSizes[i] = lerp(currentSquareSizes[i], targetSize, 0.08);
        nodes.push({ x: nx, y: ny, size: currentSquareSizes[i] });
    }

    const lineAlpha = pointer ? 0.15 : 0.35;
    ctx.strokeStyle = `rgba(132, 156, 139, ${lineAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(186, 196, 191, 0.9)';
    nodes.forEach(node => { 
        ctx.fillRect(node.x - node.size / 2, node.y - node.size / 2, node.size, node.size); 
    });

    const centerY = cy + Math.sin(time * 0.9) * idCenterBobAmp;
    ctx.strokeStyle = '#7a9282';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - idCenterSize / 2, centerY - idCenterSize / 2, idCenterSize, idCenterSize);

    const fillIntensity = Math.min(idRotSpeed / 1.5, 1);
    if (fillIntensity > 0.01) {
        ctx.fillStyle = `rgba(122, 146, 130, ${fillIntensity})`;
        ctx.fillRect(cx - idCenterSize / 2, centerY - idCenterSize / 2, idCenterSize, idCenterSize);
    }

    if (!pointer) {
        const target = Math.round(idRotation / (Math.PI * 2)) * Math.PI * 2;
        idRotation = lerp(idRotation, target, 0.02);
    }
});

// --- EMPATÍA ---
let empBig = { pos: null, dragging: false };
let empSmalls = [
    { pos: null, dragging: false, phase: 0, fillLevel: 0.08 },
    { pos: null, dragging: false, phase: Math.PI, fillLevel: 0.08 }
];
let empDragMap = new Map(); 
let empBigOutlineMode = 0; 

initCanvas('canvas-empatia', (ctx, size, mouse, time) => {
    const verdeIdentidad = '152, 167, 158'; 
    const colorLineaIdentidad = '132, 156, 139';
    const colorBordeIdentidad = '#a6bda9'; 

    const points = getActivePoints(mouse);
    const activeIds = new Set();
    const pointForId = new Map();
    points.forEach(pt => {
        const id = pt.id !== undefined ? pt.id : 'mouse';
        activeIds.add(id);
        pointForId.set(id, pt);
    });
    
    const naturalBig = { x: size / 2, y: size / 2 + Math.sin(time) * 15 };
    if (!empBig.pos) empBig.pos = { x: naturalBig.x, y: naturalBig.y };
    empSmalls.forEach(s => {
        if (!s.pos) s.pos = { x: naturalBig.x + 115, y: naturalBig.y };
    });

    for (const id of empDragMap.keys()) {
        if (!activeIds.has(id)) empDragMap.delete(id);
    }
    const takenTargets = new Set(empDragMap.values());

    points.forEach(pt => {
        const id = pt.id !== undefined ? pt.id : 'mouse';
        if (empDragMap.has(id)) return; 

        let picked = null;
        empSmalls.forEach((s, idx) => {
            if (picked !== null || takenTargets.has(idx)) return;
            if (Math.hypot(pt.x - s.pos.x, pt.y - s.pos.y) < 36) picked = idx;
        });
        if (picked === null && !takenTargets.has('big') &&
            Math.hypot(pt.x - empBig.pos.x, pt.y - empBig.pos.y) < 56) {
            picked = 'big';
        }
        if (picked !== null) {
            empDragMap.set(id, picked);
            takenTargets.add(picked);
        }
    });

    let bigPointerId = null;
    for (const [id, target] of empDragMap) if (target === 'big') bigPointerId = id;

    if (bigPointerId !== null) {
        const pt = pointForId.get(bigPointerId);
        empBig.pos.x = pt.x;
        empBig.pos.y = pt.y;
        empBig.dragging = true;
    } else {
        empBig.pos.x = lerp(empBig.pos.x, naturalBig.x, 0.12);
        empBig.pos.y = lerp(empBig.pos.y, naturalBig.y, 0.12);
        empBig.dragging = false;
    }
    const p1 = empBig.pos;

    const orbitRadius = 115 + Math.sin(time * 0.37) * 15;
    const orbitAngle = time * 0.15 + Math.sin(time * 0.1) * 0.5;

    empSmalls.forEach((s, idx) => {
        let ptrId = null;
        for (const [id, target] of empDragMap) if (target === idx) ptrId = id;
        s.dragging = ptrId !== null;
        if (s.dragging) {
            const pt = pointForId.get(ptrId);
            s.pos = { x: pt.x, y: pt.y };
        } else {
            const a = orbitAngle + s.phase;
            s.pos = { x: naturalBig.x + Math.cos(a) * orbitRadius, y: naturalBig.y + Math.sin(a) * orbitRadius };
        }
    });

    // 1. CALCULAMOS TAMAÑOS Y OPACIDADES PRIMERO
    const closenessOf = (s) => Math.max(0, 1 - Math.hypot(s.pos.x - p1.x, s.pos.y - p1.y) / 150);
    const closenessA = closenessOf(empSmalls[0]);
    const closenessB = closenessOf(empSmalls[1]);
    const overallCloseness = Math.max(closenessA, closenessB);

    const sizeP1 = 42 + overallCloseness * 10;

    let bigNearSmall = false;
    empSmalls.forEach((s) => {
        const closeness = closenessOf(s);
        const sizeP2 = 22 + closeness * 5;
        s.sizeP2 = sizeP2; 

        const isTouching = Math.abs(p1.x - s.pos.x) < (sizeP1 + sizeP2) &&
                           Math.abs(p1.y - s.pos.y) < (sizeP1 + sizeP2);
        if (isTouching) bigNearSmall = true;

        const targetFill = (isTouching && !empBig.dragging) ? 0.9 : 0.08;
        s.fillLevel = lerp(s.fillLevel, targetFill, 0.15);
    });

    const outlineTarget = (empBig.dragging && bigNearSmall) ? 1 : 0;
    empBigOutlineMode = lerp(empBigOutlineMode, outlineTarget, 0.15);

    const bigFillAlpha = (0.6 + overallCloseness * 0.4) * (1 - empBigOutlineMode);

    // 2. DIBUJAMOS LÍNEAS
    const lineAlpha = empBig.dragging ? 0.15 : 0.35; 

    empSmalls.forEach((s) => {
        const dx = s.pos.x - p1.x;
        const dy = s.pos.y - p1.y;
        const dLine = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        const maxCosSin = Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
        
        const startOffset = (sizeP1 / maxCosSin) - 1.5; 
        const lineLength = Math.max(0, dLine - startOffset);

        if (lineLength > 0 && dLine > startOffset) {
            ctx.strokeStyle = `rgba(${colorLineaIdentidad}, ${lineAlpha})`;
            ctx.lineWidth = 2;
            
            ctx.save();
            ctx.translate(p1.x, p1.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(startOffset, 0);
            ctx.lineTo(startOffset + lineLength, 0);
            ctx.stroke();
            ctx.restore();
        }
    });

    // 3. DIBUJAMOS CUADRADO GRANDE
    if (bigFillAlpha > 0.01) {
        ctx.fillStyle = `rgba(${verdeIdentidad}, ${bigFillAlpha})`;
        ctx.fillRect(p1.x - sizeP1, p1.y - sizeP1, sizeP1 * 2, sizeP1 * 2);
    }

    const bigStrokeWidth = empBigOutlineMode * 3;
    if (bigStrokeWidth > 0.05) {
        ctx.strokeStyle = colorBordeIdentidad;
        ctx.lineWidth = bigStrokeWidth;
        ctx.strokeRect(p1.x - sizeP1, p1.y - sizeP1, sizeP1 * 2, sizeP1 * 2);
    }

    // 4. DIBUJAMOS CUADRADOS CHICOS
    empSmalls.forEach((s) => {
        const sizeP2 = s.sizeP2;
        ctx.strokeStyle = colorBordeIdentidad;
        ctx.lineWidth = 3;
        ctx.strokeRect(s.pos.x - sizeP2, s.pos.y - sizeP2, sizeP2 * 2, sizeP2 * 2);

        ctx.fillStyle = `rgba(${verdeIdentidad}, ${s.fillLevel})`;
        ctx.fillRect(s.pos.x - sizeP2, s.pos.y - sizeP2, sizeP2 * 2, sizeP2 * 2);
    });
});

// --- COLABORACIÓN ---
let cNodes = Array.from({length: 16}, (_, i) => {
    let isCore = (i % 3 === 0); 
    return {
        x: 100 + (i % 4) * 65, y: 100 + Math.floor(i / 4) * 65,
        ox: 100 + (i % 4) * 65, oy: 100 + Math.floor(i / 4) * 65,
        fillLevel: isCore ? 0.4 : 0,   
        currentSize: isCore ? 14 : 10, 
        isCore: isCore
    };
});

// Variables para la "Memoria Magnética"
let collabCapacity = 6; 
let collabMaxConnections = 0;

initCanvas('canvas-colaboracion', (ctx, size, mouse, time) => {
    let points = [];
    if (mouse.touches.length > 0) {
        points = mouse.touches;
    } else if (mouse.inside) {
        points = [{ x: mouse.x, y: mouse.y }];
    }

    // --- LÓGICA DE FUSIÓN PERSISTENTE ---
    if (points.length === 0) {
        collabCapacity = 6;
        collabMaxConnections = 0;
    } else {
        let currentConnections = 0;
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                if (Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) < 140) {
                    currentConnections++;
                }
            }
        }

        if (currentConnections > collabMaxConnections) {
            let newMerges = currentConnections - collabMaxConnections;
            collabCapacity = Math.min(18, collabCapacity + (newMerges * 6));
            collabMaxConnections = currentConnections;
        } 
        else if (currentConnections < collabMaxConnections) {
            collabMaxConnections = currentConnections; 
        }
    }

    // 1. Asignación de cupos 
    let targets = points.map(pt => ({ x: pt.x, y: pt.y, count: 0, max: collabCapacity }));
    let nodeTargets = new Array(cNodes.length).fill(null);
    let pairings = [];

    cNodes.forEach((node, nIdx) => {
        targets.forEach((target, tIdx) => {
            let dist = Math.hypot(target.x - node.x, target.y - node.y);
            if (dist < 220) { 
                pairings.push({ nIdx, tIdx, dist });
            }
        });
    });

    pairings.sort((a, b) => a.dist - b.dist);

    pairings.forEach(pair => {
        if (!nodeTargets[pair.nIdx] && targets[pair.tIdx].count < targets[pair.tIdx].max) {
            nodeTargets[pair.nIdx] = targets[pair.tIdx];
            targets[pair.tIdx].count++;
        }
    });

    // 2. Movimiento de los nodos hacia su objetivo
    cNodes.forEach((p, i) => {
        let autoX = p.ox + Math.sin(time + i) * 8; 
        let autoY = p.oy + Math.cos(time + i) * 8;
        
        let target = nodeTargets[i];

        if (target) { 
            p.x = lerp(p.x, target.x, 0.08); 
            p.y = lerp(p.y, target.y, 0.08); 
        } else { 
            p.x = lerp(p.x, autoX, 0.1); 
            p.y = lerp(p.y, autoY, 0.1); 
        }
        
        p.weight = 0; 
    });

    // 3. Dibujamos líneas y calculamos la fuerza de las conexiones
    ctx.fillStyle = 'rgba(132, 156, 139, 0.2)';
    for(let i=0; i<cNodes.length; i++) {
        for(let j=i+1; j<cNodes.length; j++) {
            let dx = cNodes[j].x - cNodes[i].x; 
            let dy = cNodes[j].y - cNodes[i].y;
            let d = Math.sqrt(dx*dx + dy*dy);
            
            if(d < 80) {
                ctx.save(); 
                ctx.translate(cNodes[i].x, cNodes[i].y); 
                ctx.rotate(Math.atan2(dy, dx));
                ctx.fillRect(0, -1.5, d, 3); 
                ctx.restore();

                let baseStrength = 1 - (d / 80);
                let multiplier = (cNodes[i].isCore || cNodes[j].isCore) ? 3.0 : 1.0;
                let finalStrength = baseStrength * multiplier;

                cNodes[i].weight += finalStrength;
                cNodes[j].weight += finalStrength;
            }
        }
    }

    // 4. Dibujamos los cuadrados aplicando el crecimiento y relleno
    cNodes.forEach(p => { 
        let targetBonus = Math.min(1, p.weight / 18.0); 
        
        let baseFill = p.isCore ? 0.4 : 0;
        let baseSize = p.isCore ? 14 : 10;
        
        let finalFill = baseFill + targetBonus * (1 - baseFill);
        let finalSize = baseSize + (targetBonus * baseSize * 1.5); 
        
        p.fillLevel = lerp(p.fillLevel, finalFill, 0.15);
        p.currentSize = lerp(p.currentSize, finalSize, 0.15);

        let s = p.currentSize;
        
        ctx.strokeStyle = '#a6bda9';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - s / 2, p.y - s / 2, s, s);

        if (p.fillLevel > 0.01) {
            ctx.fillStyle = `rgba(132, 156, 139, ${p.fillLevel})`;
            ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        }
    });
});

// --- INCERTIDUMBRE ---
let clones = [];
const UNCERT_COUNT = 18; 
const UNCERT_SMALL_R = 18;   
const UNCERT_TAP_R = 34;     
const UNCERT_ARM_DIST = 45;  
let centerPos = { x: 200, y: 200, rot: 0, opacity: 0 }; 
let uncertState = 'fragmented'; 
let uncertResetTimer = 0;
let uncertLastPointer = null;   
const UNCERT_DRAG_THRESHOLD = 2.5; 

// --- Sistema de líneas-vectores (se arma al clickear los 9 triángulos antihorarios) ---
let uncertLeftClickCount = 0;      
let uncertLineOpacityCurrent = 0;  
let uncertFillOpacityCurrent = 0;  
const UNCERT_FLEE_RADIUS = 75;     
const UNCERT_FLEE_STRENGTH = 2.4;  

const makeUncertClones = (size) => {
    clones = [];
    for (let i = 0; i < UNCERT_COUNT; i++) {
        const group = i % 2 === 0 ? 'left' : 'right'; 
        clones.push({
            group,
            angle: (i / UNCERT_COUNT) * Math.PI * 2, 
            orbitProgress: 0,
            orbitDir: group === 'right' ? 1 : -1,           
            orbitSpeed: group === 'right' ? 0.018 : 0.0035,  
            radius: 75 + (i % 3) * 14,               
            jitter: 5 + Math.random() * 5,
            driftOffset: Math.random() * Math.PI * 2,
            spinSpeed: 0.3 + Math.random() * 0.3,      
            spinDir: i % 2 === 0 ? 1 : -1,
            x: size / 2, y: size / 2,
            armed: true, 
            selfRot: Math.random() * Math.PI * 2,
            opacity: 0.55, 
            collected: false,
            travel: 0,
            edges: null,
            fillOffset: Math.random() * Math.PI * 2, 
            fillSpeed: 0.5 + Math.random() * 0.8       
        });
    }
};

initCanvas('canvas-incertidumbre', (ctx, size, mouse, time) => {
    if (clones.length === 0) makeUncertClones(size);

    const points = getActivePoints(mouse);
    const tapPoint = points.length > 0 ? points[0] : null;

    centerPos.rot = lerp(centerPos.rot, time * 0.12, 0.1);
    const bigVerts = triangleVertices(size / 2, size / 2, 55, centerPos.rot);

    let isDragging = false;
    if (tapPoint) {
        if (uncertLastPointer) {
            const moveDist = Math.hypot(tapPoint.x - uncertLastPointer.x, tapPoint.y - uncertLastPointer.y);
            if (moveDist > UNCERT_DRAG_THRESHOLD) isDragging = true;
        }
        uncertLastPointer = { x: tapPoint.x, y: tapPoint.y };
    } else {
        uncertLastPointer = null;
    }

    let allCollected = true;
    clones.forEach((c) => {
        if (!c.collected) {
            allCollected = false;

            c.orbitProgress += c.orbitDir * c.orbitSpeed;
            const orbitA = c.angle + c.orbitProgress;
            const wobble = Math.sin(time * 0.6 + c.driftOffset) * c.jitter;
            const tx = size / 2 + Math.cos(orbitA) * (c.radius + wobble);
            const ty = size / 2 + Math.sin(orbitA) * (c.radius + wobble);
            c.x = lerp(c.x, tx, 0.05);
            c.y = lerp(c.y, ty, 0.05);
            c.selfRot += 0.02 * c.spinDir * c.spinSpeed;
            c.opacity = lerp(c.opacity, 0.55, 0.08);

            if (isDragging && tapPoint) {
                const dx = c.x - tapPoint.x, dy = c.y - tapPoint.y;
                const d = Math.hypot(dx, dy);
                if (d < UNCERT_FLEE_RADIUS && d > 0.001) {
                    const push = (1 - d / UNCERT_FLEE_RADIUS) * UNCERT_FLEE_STRENGTH;
                    c.x += (dx / d) * push;
                    c.y += (dy / d) * push;
                }
            }
            c.x = Math.min(Math.max(c.x, 25), size - 25);
            c.y = Math.min(Math.max(c.y, 25), size - 25);

            if (c.opacity > 0.01) {
                ctx.strokeStyle = `rgba(141, 132, 156, ${c.opacity})`;
                ctx.lineWidth = 2;
                drawTriangleOutline(ctx, c.x, c.y, UNCERT_SMALL_R, c.selfRot);
                
                let rawSin = Math.sin(time * c.fillSpeed + c.fillOffset);
                let fillIntensity = Math.max(0, Math.min(1, rawSin * 2.0 + 0.5));
                
                if (fillIntensity > 0.01) {
                    ctx.fillStyle = `rgba(141, 132, 156, ${fillIntensity * c.opacity * 0.75})`;
                    drawSolidTriangle(ctx, c.x, c.y, UNCERT_SMALL_R, c.selfRot);
                }
            }

            if (!isDragging && tapPoint && Math.hypot(tapPoint.x - c.x, tapPoint.y - c.y) < UNCERT_TAP_R) {
                c.collected = true;
                c.travel = 0;
                if (c.group === 'left') {
                    uncertLeftClickCount = Math.min(9, uncertLeftClickCount + 1);
                }
            }
        } else {
            c.opacity = lerp(c.opacity, 0, 0.15);
            if (c.opacity > 0.01) {
                ctx.strokeStyle = `rgba(141, 132, 156, ${c.opacity})`;
                ctx.lineWidth = 2;
                drawTriangleOutline(ctx, c.x, c.y, UNCERT_SMALL_R, c.selfRot);
                
                let rawSin = Math.sin(time * c.fillSpeed + c.fillOffset);
                let fillIntensity = Math.max(0, Math.min(1, rawSin * 2.0 + 0.5));
                
                if (fillIntensity > 0.01) {
                    ctx.fillStyle = `rgba(141, 132, 156, ${fillIntensity * c.opacity * 0.75})`;
                    drawSolidTriangle(ctx, c.x, c.y, UNCERT_SMALL_R, c.selfRot);
                }
            }
        }
    });

    if (allCollected) {
        uncertState = 'reforming';
        uncertResetTimer++;
    } else {
        uncertState = 'fragmented';
        uncertResetTimer = 0;
    }

    const UNCERT_BORDER_OPACITY_STEPS = [0, 0.10, 0.10, 0.10, 0.20, 0.40, 0.60, 0.80, 1.00, 1.00];
    const UNCERT_FILL_OPACITY_STEPS   = [0, 0,    0,    0,    0,    0,    0,    0.30, 0.60, 1.00];

    // --- CAPA 1: TRIÁNGULO GRANDE ---
    const uncertFillTarget = UNCERT_FILL_OPACITY_STEPS[uncertLeftClickCount];
    uncertFillOpacityCurrent = lerp(uncertFillOpacityCurrent, uncertFillTarget, 0.08);
    if (uncertFillOpacityCurrent > 0.01) {
        ctx.fillStyle = `rgba(141, 132, 156, ${uncertFillOpacityCurrent})`;
        drawSolidTriangle(ctx, size / 2, size / 2, 55, centerPos.rot);
    }

    // --- CAPA 2: LÍNEAS-VECTOR ---
    const uncertLinesToShow = Math.min(3, uncertLeftClickCount);
    const uncertLineOpacityTarget = UNCERT_BORDER_OPACITY_STEPS[uncertLeftClickCount];
    uncertLineOpacityCurrent = lerp(uncertLineOpacityCurrent, uncertLineOpacityTarget, 0.08);

    if (uncertLinesToShow > 0 && uncertLineOpacityCurrent > 0.005) {
        ctx.strokeStyle = `rgba(141, 132, 156, ${uncertLineOpacityCurrent})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < uncertLinesToShow; i++) {
            const start = bigVerts[i];
            const end = bigVerts[(i + 1) % 3];
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }

    if (uncertState === 'reforming' && uncertResetTimer > 45) {
        makeUncertClones(size); 
        uncertResetTimer = 0;
        centerPos.opacity = 0;
        uncertLeftClickCount = 0;
        uncertLineOpacityCurrent = 0;
        uncertFillOpacityCurrent = 0;
    }
});

// --- EXPECTATIVA ---
let expAmbientTriangles = [];

initCanvas('canvas-expectativa', (ctx, size, mouse, time) => {
    const cx = size / 2;
    const cy = size / 2;

    const isInDetailView = overlay.classList.contains('active') && currentCanvas && currentCanvas.id === 'canvas-expectativa';

    // 1. Detectar número de dedos táctiles o click activo
    let activeTouchesCount = mouse.touches.length > 0
        ? mouse.touches.length
        : (mouse.isDown ? 1 : 0);

    // 2. Si estás presionando teclas en la PC, sobreescribimos el contador de touches
    if (activeKeys.size > 0) {
        activeTouchesCount = activeKeys.size;
    }

    const totalTrianglesNeeded = 6 + (activeTouchesCount * 6);

    while (expAmbientTriangles.length < totalTrianglesNeeded) {
        expAmbientTriangles.push({
            angle: Math.random() * Math.PI * 2,
            dist: 180 + Math.random() * 60,
            speed: 2.2 + Math.random() * 1.2,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 2,
            size: 11 + Math.random() * 5,
            seed: Math.random() * 100,
            alphaSpeed: 1.0 + Math.random() * 1.5
        });
    }

    const trianglesToDraw = expAmbientTriangles.slice(0, totalTrianglesNeeded);
    const isInteracting = activeTouchesCount > 0;
    const currentSpeed = isInteracting ? 4.2 : 2.5;

    const resetDist = isInDetailView ? 45 : 60;

    // --- CAPA 1 (FONDO): RENDERIZADO DE TRIÁNGULOS PEQUEÑOS (SOLO BORDE) ---
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    trianglesToDraw.forEach((tri) => {
        tri.dist -= (tri.speed * (currentSpeed / 2.5));
        tri.rotation += tri.rotSpeed * 0.03;

        if (tri.dist < resetDist) {
            tri.dist = 210 + Math.random() * 40;
            tri.angle = Math.random() * Math.PI * 2;
        }

        const x = cx + Math.cos(tri.angle) * tri.dist;
        const y = cy + Math.sin(tri.angle) * tri.dist;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tri.rotation);

        ctx.globalAlpha = 0.90;

        ctx.strokeStyle = `rgb(122, 113, 140)`;
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
            const a = (k * 2 * Math.PI) / 3 - Math.PI / 2;
            const tx = Math.cos(a) * tri.size;
            const ty = Math.sin(a) * tri.size;
            if (k === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
        }
        ctx.closePath();

        ctx.stroke(); 

        ctx.restore();
    });

    // --- CAPA INTERMEDIA: RECORTAR / BORRAR LO QUE QUEDA DETRÁS ---
    const breathSpeed = isInteracting ? 2.8 : 1.5;
    const breathCycle = Math.sin(time * breathSpeed);
    
    const breathDepth = isInDetailView 
        ? (isInteracting ? 16 : 6) 
        : (isInteracting ? 20 : 12);
    
    const baseRadius = isInDetailView 
        ? (60 + activeTouchesCount * 10) 
        : (size * 0.22 + activeTouchesCount * 10);

    const finalRadius = baseRadius + (breathCycle * breathDepth);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    drawSolidTriangle(ctx, cx, cy, finalRadius, 0);
    ctx.restore();

    // --- CAPA 2 (FRENTE): TRIÁNGULO PRINCIPAL ---
    const blinkSpeed = isInteracting ? 4.5 : 1.5;
    const rawSin = Math.sin(time * blinkSpeed);
    const fillIntensity = Math.max(0, Math.min(1, rawSin * 2.0 + 0.5));

    if (fillIntensity > 0.01) {
        ctx.fillStyle = `rgba(122, 113, 140, ${fillIntensity * 0.45})`;
        drawSolidTriangle(ctx, cx, cy, finalRadius, 0);
    }

    ctx.strokeStyle = '#7a718c';
    ctx.lineWidth = isInDetailView ? 3 : 3.5;
    drawTriangleOutline(ctx, cx, cy, finalRadius, 0);
});

// --- ANSIEDAD ---
let ansNodes = Array.from({length: 9}, (_, i) => ({
    x: 120 + (i % 3) * 80 + Math.random() * 20,
    y: 120 + Math.floor(i / 3) * 80 + Math.random() * 20,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    angle: Math.random() * Math.PI * 2,
    baseRadius: 22,
    flickerOffset: Math.random() * Math.PI * 2,
    flickerSpeed: 0.8 + Math.random() * 0.6
}));

let ansState = {
    inactivityTimer: null,
    lastClickTime: 0,
    clickCount: 0,
    targetSpeedMult: 1.0,
    currentSpeedMult: 1.0,
    targetSizeMult: 1.0,
    currentSizeMult: 1.0
};

const triggerAnsiedadInteraction = () => {
    const now = Date.now();

    ansState.targetSizeMult = 0.5;

    if (now - ansState.lastClickTime >= 500) {
        ansState.lastClickTime = now;
       
        if (ansState.clickCount < 5) {
            ansState.clickCount++;
            ansState.targetSpeedMult = 1.0 + (ansState.clickCount * 2.2);
        }
    }

    if (ansState.inactivityTimer) clearTimeout(ansState.inactivityTimer);
    ansState.inactivityTimer = setTimeout(() => {
        ansState.clickCount = 0;
        ansState.targetSpeedMult = 1.0;
        ansState.targetSizeMult = 1.0;
    }, 5000);
};

initCanvas('canvas-ansiedad', (ctx, size, mouse, time) => {
    ansState.currentSpeedMult = lerp(ansState.currentSpeedMult, ansState.targetSpeedMult, 0.015);
    ansState.currentSizeMult = lerp(ansState.currentSizeMult, ansState.targetSizeMult, 0.03);

    const points = getActivePoints(mouse);
    const pointer = points.length > 0 ? points[0] : (mouse.inside ? { x: mouse.x, y: mouse.y } : null);

    const padding = lerp(85, 35, (ansState.currentSpeedMult - 1) / 10);
    const interactionRatio = ansState.clickCount / 5;

    ansNodes.forEach((p, i) => {
        // 1. Repulsión entre los propios triángulos
        for (let j = i + 1; j < ansNodes.length; j++) {
            const other = ansNodes[j];
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.hypot(dx, dy);
            const minDist = (p.baseRadius + other.baseRadius) * ansState.currentSizeMult * 1.8;

            if (dist < minDist && dist > 0.001) {
                const force = (minDist - dist) * 0.02;
                p.vx -= (dx / dist) * force;
                p.vy -= (dy / dist) * force;
                other.vx += (dx / dist) * force;
                other.vy += (dy / dist) * force;
            }
        }

        // 2. Repulsión respecto al puntero/mouse
        if (pointer) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            const fleeRadius = 120;

            if (dist < fleeRadius && dist > 0.001) {
                const force = (1 - dist / fleeRadius) * 2.5 * ansState.currentSpeedMult;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }
        }

        // 3. Movimiento caótico base
        p.vx += (Math.random() - 0.5) * 0.7 * ansState.currentSpeedMult;
        p.vy += (Math.random() - 0.5) * 0.7 * ansState.currentSpeedMult;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += Math.hypot(p.vx, p.vy) * 0.02;

        // 4. Paredes delimitadoras
        if (p.x < padding) { p.x = padding; p.vx *= -0.8; }
        if (p.x > size - padding) { p.x = size - padding; p.vx *= -0.8; }
        if (p.y < padding) { p.y = padding; p.vy *= -0.8; }
        if (p.y > size - padding) { p.y = size - padding; p.vy *= -0.8; }

        // 5. Parpadeo amplio
        const pulse = (Math.sin(time * p.flickerSpeed + p.flickerOffset) + 1) / 2;
        const baseFillAlpha = lerp(0.0, 0.60, pulse);
       
        const fillAlpha = Math.min(0.98, lerp(baseFillAlpha, 0.98, interactionRatio));

        const r = p.baseRadius * ansState.currentSizeMult;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
            const a = (k * 2 * Math.PI) / 3;
            const tx = Math.cos(a) * r;
            const ty = Math.sin(a) * r;
            if (k === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
        }
        ctx.closePath();

        ctx.fillStyle = `rgba(141, 132, 156, ${fillAlpha})`;
        ctx.fill();

        ctx.strokeStyle = 'rgba(141, 132, 156, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'rgba(141, 132, 156, 0.4)';
        ctx.shadowBlur = 4;
        ctx.stroke();

        ctx.restore();
    });
}, null, triggerAnsiedadInteraction);
