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
        const isInteracting = (mouse.touches.length >= 2) || mouse.isDown;

        if (isInteracting) {
            let currentDist = 0;
            if (mouse.touches.length >= 2) {
                const [a, b] = mouse.touches;
                currentDist = Math.hypot(a.x - b.x, a.y - b.y);
            } else {
                currentDist = Math.hypot(mouse.targetX - size / 2, mouse.targetY - size / 2);
            }

            if (herenciaBaseDist === null) {
                herenciaBaseDist = currentDist;
            } else if (!herenciaGestureLocked) {
                let dragAmount = currentDist - herenciaBaseDist;
                
                // 1. GESTO DE EXPANDIR (Agrandar)
                if (dragAmount > 0 && herenciaLayersCount < maxLayers) {
                    herenciaLayerProgress = Math.min(1, dragAmount / 45);

                    if (herenciaLayerProgress >= 1) {
                        herenciaLayersCount++;
                        herenciaLayerProgress = 0; 
                        herenciaGestureLocked = true; 
                    }
                } 
                // 2. GESTO DE ENCOGER (Achicar)
                else if (dragAmount < 0 && herenciaLayersCount > 1) {
                    herenciaLayerProgress = Math.max(-1, dragAmount / 45); 

                    if (herenciaLayerProgress <= -1) {
                        herenciaLayersCount--; 
                        herenciaLayerProgress = 0; 
                        herenciaGestureLocked = true; 
                    }
                }
            }
        } else {
            if (herenciaLayerProgress !== 0 && !herenciaGestureLocked) {
                herenciaLayerProgress = lerp(herenciaLayerProgress, 0, 0.2);
                if (Math.abs(herenciaLayerProgress) < 0.01) herenciaLayerProgress = 0;
            }
            herenciaGestureLocked = false;
            herenciaBaseDist = null;
        }

        if (herenciaLayerProgress < 0) {
            drawSettled = herenciaLayersCount - 1;
            drawProgress = 1.0 + herenciaLayerProgress; 
        } else {
            drawSettled = herenciaLayersCount;
            drawProgress = herenciaLayerProgress;
        }
    }

    // --- RENDERIZADO ---

    // 1. DIBUJAMOS LA CAPA NUEVA AL FONDO
    if (drawProgress > 0.001 && drawSettled < maxLayers) {
        const nextLayer = drawSettled + 1;
        const wave = Math.sin(time * 1.2 + nextLayer) * 3;
        const prevRadius = baseRadius + (drawSettled - 1) * spreadStep;
        const targetRadius = baseRadius + (nextLayer - 1) * spreadStep;
        
        const radius = prevRadius + (targetRadius - prevRadius) * drawProgress + wave;
        
        let opacity = 0.55 - (nextLayer - 1) * 0.08; 
        let finalOpacity = Math.max(0.08, opacity);
        
        if (!isInDetailView && nextLayer > 1) finalOpacity *= baseFadeOut;
        
        if (finalOpacity > 0.01) {
            ctx.fillStyle = `rgba(112, 128, 144, ${finalOpacity})`;
            ctx.beginPath(); 
            ctx.arc(size / 2, size / 2, Math.max(0, radius), 0, Math.PI * 2); 
            ctx.fill();
        }
    }

    // 2. DIBUJAMOS LAS CAPAS FIJAS AL FRENTE
    for (let i = drawSettled; i >= 1; i--) {
        const wave = Math.sin(time * 1.2 + i) * 3;
        const radius = baseRadius + (i - 1) * spreadStep + wave;
        
        let opacity = 0.55 - (i - 1) * 0.08; 
        let finalOpacity = Math.max(0.08, opacity);
        
        if (!isInDetailView && i > 1) {
            finalOpacity *= baseFadeOut;
        }
        
        if (finalOpacity > 0.01) {
            ctx.fillStyle = `rgba(112, 128, 144, ${finalOpacity})`;
            ctx.beginPath(); 
            ctx.arc(size / 2, size / 2, Math.max(0, radius), 0, Math.PI * 2); 
            ctx.fill();
        }
    }
});

// --- CADUCIDAD ---
let cadNodes = [];
let cadRespawnCount = 0; // Contador global de desapariciones

initCanvas('canvas-caducidad', (ctx, size, mouse, time) => {
    if (cadNodes.length === 0) {
        const cy = size / 2;
        // 6 círculos ordenados en línea horizontal con sutiles desfasajes en Y
        const layout = [
            { x: size * 0.20, y: cy + 4,  r: 14, baseAlpha: 0.50 },
            { x: size * 0.32, y: cy - 8,  r: 18, baseAlpha: 0.70 },
            { x: size * 0.44, y: cy + 6,  r: 12, baseAlpha: 0.45 },
            { x: size * 0.56, y: cy - 4,  r: 20, baseAlpha: 0.85 },
            { x: size * 0.68, y: cy + 10, r: 15, baseAlpha: 0.60 },
            { x: size * 0.80, y: cy - 6,  r: 10, baseAlpha: 0.35 }
        ];

        layout.forEach((pos, idx) => {
            cadNodes.push({
                ox: pos.x, oy: pos.y,
                baseSize: pos.r,
                baseAlpha: pos.baseAlpha,
                state: 'idle',  // Estados: 'idle', 'vanishing', 'growing'
                progress: 1,    // 1 = tamaño completo, 0 = invisible
                seed: Math.random() * 100,
                // Parpadeo leve constante en 2 círculos
                isFlickering: idx === 1 || idx === 3,
                flickerSpeed: 1.2 + Math.random() * 0.8,
                flickerOffset: Math.random() * Math.PI * 2,
                // Parámetros para respiración gradual de tamaño
                pulseSpeed: 1.0 + Math.random() * 0.5,
                pulseOffset: Math.random() * Math.PI * 2
            });
        });
    }

    const points = getActivePoints(mouse);
    const pointer = points.length > 0 ? points[0] : null;

    cadNodes.forEach((node, idx) => {
        if (node.state === 'idle') {
            if (pointer) {
                let dist = Math.hypot(pointer.x - node.ox, pointer.y - node.oy);
                if (dist < node.baseSize + 25) {
                    node.state = 'vanishing';
                }
            }
        } 
        else if (node.state === 'vanishing') {
            node.progress -= 0.08; 
            if (node.progress <= 0) {
                node.progress = 0;
                node.state = 'growing';
                cadRespawnCount++; // Sumamos 1 al contador global
                
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

        // 1. Movimiento leve en su propio lugar (flotación en X e Y)
        let floatX = Math.cos(time * 0.8 + node.seed) * 2.5;
        let floatY = Math.sin(time * 0.8 + node.seed * 1.5) * 2.5;

        // 2. Achicamiento más pronunciado (oscila de 50% hasta 100% de su tamaño base)
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

    let nodes = [];
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + idRotation;
        const nx = cx + Math.cos(angle) * 100;
        const ny = cy + Math.sin(angle) * 100;
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

    // Orbitantes SIEMPRE rellenos 
    ctx.fillStyle = 'rgba(186, 196, 191, 0.9)';
    nodes.forEach(node => { 
        ctx.fillRect(node.x - node.size / 2, node.y - node.size / 2, node.size, node.size); 
    });

    // Cuadrado Central: empieza como línea, se rellena de color al interactuar
    ctx.strokeStyle = '#7a9282';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - idCenterSize / 2, cy - idCenterSize / 2, idCenterSize, idCenterSize);

    const fillIntensity = Math.min(idRotSpeed / 1.5, 1);
    if (fillIntensity > 0.01) {
        ctx.fillStyle = `rgba(122, 146, 130, ${fillIntensity})`;
        ctx.fillRect(cx - idCenterSize / 2, cy - idCenterSize / 2, idCenterSize, idCenterSize);
    }

    if (!pointer) {
        const target = Math.round(idRotation / (Math.PI * 2)) * Math.PI * 2;
        idRotation = lerp(idRotation, target, 0.02);
    }
});

// --- EMPATÍA ---
let empFillLevel = 0; // Para que el color aparezca y desaparezca suavemente

initCanvas('canvas-empatia', (ctx, size, mouse, time) => {
    let p1 = { x: 150, y: 200 + Math.sin(time)*15 }; // Elemento central/fijo
    let p2 = mouse.inside ? { x: mouse.x, y: mouse.y } : { x: 260, y: 200 + Math.cos(time)*15 }; // Elemento móvil
    
    let d = Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2); 
    let closeness = Math.max(0, 1 - d / 150); // 0 = lejos, 1 = súper cerca
    
    // Línea de conexión
    ctx.fillStyle = `rgba(132, 156, 139, ${0.25 + closeness * 0.2})`; 
    ctx.save(); ctx.translate(p1.x, p1.y); ctx.rotate(Math.atan2(p2.y - p1.y, p2.x - p1.x)); ctx.fillRect(0, -2, d, 4); ctx.restore();
    
    let sizeP1 = 35 + closeness * 10; 
    let sizeP2 = 16 + closeness * 4;

    // CUADRADO GRANDE (P1): Siempre relleno, se intensifica al acercarse
    ctx.fillStyle = `rgba(132, 156, 139, ${0.6 + closeness * 0.4})`;
    ctx.fillRect(p1.x - sizeP1, p1.y - sizeP1, sizeP1 * 2, sizeP1 * 2);
    
    // CUADRADO CHICO (P2): Base dibujada solo con líneas
    ctx.strokeStyle = '#a6bda9';
    ctx.lineWidth = 3;
    ctx.strokeRect(p2.x - sizeP2, p2.y - sizeP2, sizeP2 * 2, sizeP2 * 2);

    // LÓGICA DE CONTACTO: Verificamos si los dos cuadrados se están superponiendo (colisión)
    let isTouching = Math.abs(p1.x - p2.x) < (sizeP1 + sizeP2) && 
                     Math.abs(p1.y - p2.y) < (sizeP1 + sizeP2);

    // Si se tocan, el objetivo es rellenar al 90% de opacidad, sino queda en 0 (vacío)
    let targetFill = isTouching ? 0.9 : 0;
    empFillLevel = lerp(empFillLevel, targetFill, 0.15); // Transición suave para que no parpadee de golpe

    // Rellenamos el cuadrado chico solo si hay nivel de relleno
    if (empFillLevel > 0.01) {
        ctx.fillStyle = `rgba(166, 189, 169, ${empFillLevel})`;
        ctx.fillRect(p2.x - sizeP2, p2.y - sizeP2, sizeP2 * 2, sizeP2 * 2);
    }
});

// --- COLABORACIÓN ---
let cNodes = Array.from({length: 16}, (_, i) => {
    let isCore = (i % 3 === 0); // Selecciona 6 nodos clave
    return {
        x: 100 + (i % 4) * 65, y: 100 + Math.floor(i / 4) * 65,
        ox: 100 + (i % 4) * 65, oy: 100 + Math.floor(i / 4) * 65,
        fillLevel: isCore ? 0.4 : 0,   
        currentSize: isCore ? 14 : 10, 
        isCore: isCore
    };
});

initCanvas('canvas-colaboracion', (ctx, size, mouse, time) => {
    // 1. Movimiento de los nodos y reseteo del peso
    cNodes.forEach((p, i) => {
        let autoX = p.ox + Math.sin(time + i) * 8; 
        let autoY = p.oy + Math.cos(time + i) * 8;
        
        if (mouse.inside) {
            let d = Math.sqrt((mouse.x - p.x)**2 + (mouse.y - p.y)**2);
            if(d < 80) { 
                p.x = lerp(p.x, mouse.x, 0.07); 
                p.y = lerp(p.y, mouse.y, 0.07); 
            } else { 
                p.x = lerp(p.x, autoX, 0.1); 
                p.y = lerp(p.y, autoY, 0.1); 
            }
        } else { 
            p.x = lerp(p.x, autoX, 0.1); 
            p.y = lerp(p.y, autoY, 0.1); 
        }
        
        p.weight = 0; 
    });

    // 2. Dibujamos líneas y calculamos la fuerza de las conexiones
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

    // 3. Dibujamos los cuadrados aplicando el crecimiento y relleno
    cNodes.forEach(p => { 
        // Límite ajustado a 12.0 para que alcance el 100% al agrupar los 16
        let targetBonus = Math.min(1, p.weight / 12.0); 
        
        let baseFill = p.isCore ? 0.4 : 0;
        let baseSize = p.isCore ? 14 : 10;
        
        let finalFill = baseFill + targetBonus * (1 - baseFill);
        
        // CRECIMIENTO: Le sumamos 1.5 veces su tamaño base, 
        // lo que hace que llegue a MÁS del doble (14px -> 35px)
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
const UNCERT_COUNT = 19;
const UNCERT_SMALL_R = 18;   
const UNCERT_TAP_R = 34;     
const UNCERT_ARM_DIST = 45;  
let centerPos = { x: 200, y: 200, rot: 0, opacity: 0 }; 
let uncertState = 'fragmented'; 
let uncertResetTimer = 0;
let uncertLastPointer = null;   
const UNCERT_DRAG_THRESHOLD = 2.5; 
const UNCERT_FLEE_RADIUS = 75;     // Ajustado para que el área de repulsión acompañe al nuevo radio
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
            // CAMBIO AQUÍ: Bajamos el radio base de 125 a 75 para acercarlos al centro
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
                    const v = triangleVertices(c.x, c.y, UNCERT_SMALL_R, c.selfRot);
                    c.edges = [
                        { sx: v[0].x, sy: v[0].y, ex: v[1].x, ey: v[1].y },
                        { sx: v[1].x, sy: v[1].y, ex: v[2].x, ey: v[2].y },
                        { sx: v[2].x, sy: v[2].y, ex: v[0].x, ey: v[0].y }
                    ];
                }
            }
        } else if (c.group === 'left') {
            c.travel = Math.min(1, c.travel + 0.035);
            const lineOpacity = c.travel < 0.85 ? 0.6 : lerp(0.6, 0, (c.travel - 0.85) / 0.15);

            if (c.edges && lineOpacity > 0.01) {
                ctx.strokeStyle = `rgba(141, 132, 156, ${lineOpacity})`;
                ctx.lineWidth = 2;
                c.edges.forEach((e, i) => {
                    const targetStart = bigVerts[i];
                    const targetEnd = bigVerts[(i + 1) % 3];
                    e.sx = lerp(e.sx, targetStart.x, 0.1);
                    e.sy = lerp(e.sy, targetStart.y, 0.1);
                    e.ex = lerp(e.ex, targetEnd.x, 0.1);
                    e.ey = lerp(e.ey, targetEnd.y, 0.1);
                    ctx.beginPath();
                    ctx.moveTo(e.sx, e.sy);
                    ctx.lineTo(e.ex, e.ey);
                    ctx.stroke();
                });
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

    const leftClones = clones.filter(c => c.group === 'left');
    const leftCollected = leftClones.filter(c => c.collected).length;
    const frac = leftCollected / leftClones.length;

    let morphPhase = 0;
    if (allCollected) {
        uncertState = 'reforming';
        uncertResetTimer++;
        morphPhase = Math.max(0, Math.min(1, (uncertResetTimer - 20) / 20));
    } else {
        uncertState = 'fragmented';
        uncertResetTimer = 0;
    }

    const outlineOpacity = frac * 0.9 * (1 - morphPhase);
    if (outlineOpacity > 0.01) {
        ctx.strokeStyle = `rgba(141, 132, 156, ${outlineOpacity})`;
        ctx.lineWidth = 3;
        drawTriangleOutline(ctx, size / 2, size / 2, 55, centerPos.rot);
    }

    centerPos.opacity = 0.85 * morphPhase;
    if (centerPos.opacity > 0.01) {
        ctx.fillStyle = `rgba(141, 132, 156, ${centerPos.opacity})`;
        drawSolidTriangle(ctx, size / 2, size / 2, 55, centerPos.rot);
    }

    if (uncertState === 'reforming' && uncertResetTimer > 45) {
        makeUncertClones(size); 
        uncertResetTimer = 0;
        centerPos.opacity = 0;
    }
});

// --- ANSIEDAD ---
// 9 triángulos grandes con gran amplitud de parpadeo (de muy claro a casi sólido)
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

    // Reducción de tamaño instantánea
    ansState.targetSizeMult = 0.5;

    // Cooldown de 0.5 segundos (500 ms) entre clics
    if (now - ansState.lastClickTime >= 500) {
        ansState.lastClickTime = now;
       
        if (ansState.clickCount < 5) {
            ansState.clickCount++;
            ansState.targetSpeedMult = 1.0 + (ansState.clickCount * 2.2);
        }
    }

    // Reiniciar temporizador de 5 segundos de inactividad
    if (ansState.inactivityTimer) clearTimeout(ansState.inactivityTimer);
    ansState.inactivityTimer = setTimeout(() => {
        ansState.clickCount = 0;
        ansState.targetSpeedMult = 1.0;
        ansState.targetSizeMult = 1.0;
    }, 5000);
};

initCanvas('canvas-ansiedad', (ctx, size, mouse, time) => {
    // Transición ultra suave de velocidad y tamaño
    ansState.currentSpeedMult = lerp(ansState.currentSpeedMult, ansState.targetSpeedMult, 0.015);
    ansState.currentSizeMult = lerp(ansState.currentSizeMult, ansState.targetSizeMult, 0.03);

    const points = getActivePoints(mouse);
    const pointer = points.length > 0 ? points[0] : (mouse.inside ? { x: mouse.x, y: mouse.y } : null);

    // Margen delimitador
    const padding = lerp(85, 35, (ansState.currentSpeedMult - 1) / 10);

    // Nivel de interacción de 0 a 1 (alcanza el 100% al 5to clic)
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

        // 5. Parpadeo amplio: desciende a opacidad muy baja (0.08) y sube hasta alta opacidad (0.90)
        const pulse = (Math.sin(time * p.flickerSpeed + p.flickerOffset) + 1) / 2;
        const baseFillAlpha = lerp(0.0, 0.60, pulse);
       
        // Al interactuar (alcanzando el 5to clic), el relleno se vuelve totalmente sólido (0.98)
        const fillAlpha = Math.min(0.98, lerp(baseFillAlpha, 0.98, interactionRatio));

        // Geometría del triángulo
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

        // Relleno oscilante entre casi transparente y muy oscuro
        ctx.fillStyle = `rgba(141, 132, 156, ${fillAlpha})`;
        ctx.fill();

        // Líneas fijas
        ctx.strokeStyle = 'rgba(141, 132, 156, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'rgba(141, 132, 156, 0.4)';
        ctx.shadowBlur = 4;
        ctx.stroke();

        ctx.restore();
    });
}, null, triggerAnsiedadInteraction);

// --- EXPECTATIVA ---
let expAmbientLines = [];

initCanvas('canvas-expectativa', (ctx, size, mouse, time) => {
    const cx = size / 2;
    const cy = size / 2;

    // 1. Detectar número de dedos táctiles o click activo
    let activeTouchesCount = mouse.touches.length > 0
        ? mouse.touches.length
        : (mouse.isDown ? 1 : 0);

    // 2. Si estás presionando teclas en la PC, sobreescribimos el contador de touches
    if (activeKeys.size > 0) {
        activeTouchesCount = activeKeys.size;
    }

    // Mínimo 3 líneas base (0 contactos = 3 líneas, 1 contacto = 6 líneas, 2 contactos = 9 líneas, etc.)
    const totalLinesNeeded = 3 + (activeTouchesCount * 3);

    // Ajustar dinámicamente el pool de líneas según la interacción táctil
    while (expAmbientLines.length < totalLinesNeeded) {
        expAmbientLines.push({
            angle: Math.random() * Math.PI * 2,
            dist: 140 + Math.random() * 50,
            speed: 2.8 + Math.random() * 1.2
        });
    }

    const linesToDraw = expAmbientLines.slice(0, totalLinesNeeded);
    const isInteracting = activeTouchesCount > 0;
    const currentSpeed = isInteracting ? 4.2 : 2.5;

    // --- 1. RENDERIZADO DE LÍNEAS ---
    ctx.strokeStyle = isInteracting ? 'rgba(141, 132, 156, 0.8)' : 'rgba(141, 132, 156, 0.45)';
    ctx.lineWidth = isInteracting ? 2.2 : 1.8;

    linesToDraw.forEach((line) => {
        line.dist -= (line.speed * (currentSpeed / 2.5));

        // Reinicio progresivo al acercarse al centro
        if (line.dist < 18) {
            line.dist = 180 + Math.random() * 30;
            line.angle = Math.random() * Math.PI * 2;
        }

        const headX = cx + Math.cos(line.angle) * line.dist;
        const headY = cy + Math.sin(line.angle) * line.dist;
        const tailX = cx + Math.cos(line.angle) * (line.dist + 30);
        const tailY = cy + Math.sin(line.angle) * (line.dist + 30);

        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
    });

    // --- 2. MOVIMIENTO TIPO RESPIRACIÓN ---
    // Usamos ondas senoidales suaves para simular la inhalación y exhalación
    const breathSpeed = isInteracting ? 2.2 : 1.2;
    const breathCycle = Math.sin(time * breathSpeed);
   
    // Escala del radio base e intensidad según la respiración
    const breathDepth = isInteracting ? 8 : 5;
    const baseRadius = 48 + (activeTouchesCount * 3);
    const finalRadius = baseRadius + (breathCycle * breathDepth);

    /*ctx.fillStyle = '#6f667d';
    drawSolidTriangle(ctx, cx, cy, finalRadius, 0);*/

// --- 3. DIBUJO DEL CONTORNO Y PARPADEO INTERIOR ---

  // 1. El triángulo base (solo contorno, siempre visible)
  ctx.strokeStyle = '#7a718c';
  ctx.lineWidth = 3;
  drawTriangleOutline(ctx, cx, cy, finalRadius, 0);

  // 2. Lógica del parpadeo frenético
  const blinkSpeed = isInteracting ? 4.5 : 1.5;
  const rawSin = Math.sin(time * blinkSpeed);
  const fillIntensity = Math.max(0, Math.min(1, rawSin * 2.0 + 0.5));

  // 3. Relleno del triangulo con opacidad tope (similar incertidumbre)
  if (fillIntensity > 0.01) {
     // Multiplicamos por 0.45 para que se mantenga translúcido y deje ver el contorno
      ctx.fillStyle = `rgba(141, 132, 156, ${fillIntensity * 0.45})`;
      drawSolidTriangle(ctx, cx, cy, finalRadius, 0);
  }
});