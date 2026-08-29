// ==============================================================
// 1. BASE DE DATOS DE CONCEPTOS (Textos y Colores para la etiqueta)
// ==============================================================
const conceptsData = {
    'canvas-memoria': {
        title: 'Memoria',
        sub: 'Subsistema 1 - Registro',
        //desc: 'Un juego de memoria estilo "Simón dice". La grilla ilumina uno o más círculos a la vez: hay que tocarlos todos en simultáneo (con multitouch) antes de que el sistema avance de ronda. Un error devuelve todo al estado inicial.',
        color: '#708090' 
    },
    'canvas-herencia': {
        title: 'Herencia',
        sub: 'Subsistema 1 - Legado',
        //desc: 'Capas acumulativas que se transmiten. Con el gesto de expandir (pellizcar con dos dedos) la aurora del círculo crece de forma fluida y progresiva, dejando algo del estado anterior detrás.',
        color: '#708090'
    },
    'canvas-caducidad': {
        title: 'Caducidad',
        sub: 'Subsistema 1 - Lo perdido',
        //desc: 'Elementos que se encogen y desaparecen en el tránsito. Al acercarse, las formas revelan su fragilidad alterando su escala.',
        color: '#708090'
    },
    'canvas-identidad': {
        title: 'Identidad',
        sub: 'Subsistema 2 - Afirmación',
        //desc: 'Afirmación de sí frente al entorno. Arrastrá para girar los cuadrados alrededor del centro: cuanto más rápido gires, más crece y se rellena de color. Al soltar, vuelve a su posición inicial.',
        color: '#849c8b' 
    },
    'canvas-empatia': {
        title: 'Empatía',
        sub: 'Subsistema 2 - Comprensión',
        //desc: 'La capacidad de acercarse al otro. Al detectar proximidad, la forma en movimiento pierde su dureza y ambas figuras vacías adquieren densidad llenándose de color.',
        color: '#849c8b'
    },
    'canvas-colaboracion': {
        title: 'Colaboración',
        sub: 'Subsistema 2 - Coexistencia',
        //desc: 'Nodos que tejen redes temporales. La interacción atrae los elementos individuales para forjar conexiones efímeras.',
        color: '#849c8b'
    },
    'canvas-incertidumbre': {
        title: 'Incertidumbre',
        sub: 'Subsistema 3 - Desconocimiento',
        //desc: 'Al tocar la figura central, ésta se fragmenta en pequeños triángulos de línea que flotan a la deriva. Hay que ir tocando cada uno para que regrese al centro y reconstruya la figura original.',
        color: '#8d849c' 
    },
    'canvas-expectativa': {
        title: 'Expectativa',
        sub: 'Subsistema 3 - Anticipación',
        //desc: 'Tensión acumulada que proyecta energía. Tocá la pantalla fuera del triángulo central, mantené presionado, jalá y soltá: cada gesto dispara una línea hacia el centro y lo hace crecer.',
        color: '#8d849c'
    },
    'canvas-ansiedad': {
        title: 'Ansiedad',
        sub: 'Subsistema 3 - Pre-ocupación',
        //desc: 'Movimiento constante y caótico. Arrastrá el pequeño indicador dibujando un triángulo por el espacio, esquivando a los nodos errantes: si te tocan, el trazo vuelve a empezar.',
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

        // Reseteamos la fatiga de caducidad al salir para que al volver a entrar empiece rápido
        cadRespawnCount = 0; 
    });
});

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
       
        // 2. Fase final: Enciende TODOS los 9 círculos con su iluminación original (sin verde)
        if (frame > 210 && frame < 290) {
            let lit = 0;
            if (frame < 230) lit = (frame - 210) / 20;
            else if (frame > 270) lit = 1 - ((frame - 270) / 20);
            else lit = 1;
           
            for (let i = 0; i < 9; i++) {
                litOpacity[i] = Math.max(litOpacity[i] || 0, lit);
                // Al no tocar colorMixTarget[i], mantienen el color azulado/grisáceo base
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
let herenciaLayersCount = 1; 
let herenciaLayerProgress = 0; 
let herenciaBaseDist = null;
let herenciaGestureLocked = false; 

initCanvas('canvas-herencia', (ctx, size, mouse, time) => {
    const maxLayers = 6;
    const baseRadius = 28;
    const spreadStep = 24;

    const isInDetailView = overlay.classList.contains('active') && currentCanvas && currentCanvas.id === 'canvas-herencia';

    let drawSettled = herenciaLayersCount;
    let drawProgress = herenciaLayerProgress;
    let baseFadeOut = 1; 

    if (!isInDetailView) {
        // --- ESTADO BASE (EN LA GRILLA): Sincronizado a 260 frames con Memoria ---
        const frame = Math.floor(time * 60) % 260;

        if (frame < 15) {
            // Reposo inicial
            drawSettled = 1; drawProgress = 0;
        } else if (frame < 55) { 
            // Nace la capa 2 (sincronizado con el 1er círculo de Memoria)
            drawSettled = 1; drawProgress = (frame - 15) / 40; 
        } else if (frame < 65) {
            // Pausa
            drawSettled = 2; drawProgress = 0;
        } else if (frame < 105) { 
            // Nace la capa 3 (sincronizado con el 2do círculo de Memoria)
            drawSettled = 2; drawProgress = (frame - 65) / 40; 
        } else if (frame < 115) {
            // Pausa
            drawSettled = 3; drawProgress = 0;
        } else if (frame < 155) { 
            // Nace la capa 4 (sincronizado con el 3er círculo de Memoria)
            drawSettled = 3; drawProgress = (frame - 115) / 40; 
        } else if (frame < 170) {
            // Pausa antes del final
            drawSettled = 4; drawProgress = 0;
        } else if (frame < 250) { 
            // Desvanecimiento de las capas 2, 3 y 4 (mientras Memoria se ilumina por completo)
            drawSettled = 4; drawProgress = 0;
            baseFadeOut = 1 - ((frame - 170) / 80); 
        } else {
            // Reinicio limpio para volver al frame 0
            drawSettled = 1; drawProgress = 0;
        }
    } else {
        // --- ESTADO INTERACTIVO (EN DETALLE): Control bidireccional intacto ---
        const isInteracting = (mouse
