const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- CONFIGURACIÓN ---
canvas.width = 800;
canvas.height = 600;

const introScreen = document.getElementById('intro-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');

let gameRunning = false;
let sawAngle = 0;

// 1. CARGA DE IMÁGENES
const playerImg = new Image(); playerImg.src = 'assets/bat.png'; 
const goalImg = new Image();   goalImg.src = 'assets/goal.png'; 

// 2. OBJETOS
const player = { x: 30, y: 30, size: 50, speed: 5, startX: 30, startY: 30 }; 
const goal = { x: 700, y: 500, size: 70 };
const keyItem = { x: 700, y: 50, size: 50, collected: false };

// 3. PAREDES
const walls = [
    { x: 260, y: 0, w: 20, h: 480 },
    { x: 530, y: 120, w: 20, h: 480 }
];

// 4. SIERRAS
const saws = [
    { x: 130, y: 300, size: 60 },
    { x: 400, y: 300, size: 60 },
    { x: 650, y: 300, size: 60 }
];

let trail = []; 
class MusicalNote {
    constructor(x, y) {
        this.x = x + 20; this.y = y + 20;
        this.life = 1.0; this.floatSpeed = Math.random() * 1 - 0.5;
        this.symbol = ['♪', '♫', '♩'][Math.floor(Math.random() * 3)];
        this.color = Math.random() > 0.5 ? '#ff3b3b' : '#000000';
    }
    update() { this.life -= 0.02; this.y -= 1; this.x += this.floatSpeed; }
    draw(context) {
        context.globalAlpha = this.life; context.fillStyle = this.color;
        context.font = "20px Arial"; context.fillText(this.symbol, this.x, this.y);
        context.globalAlpha = 1.0;
    }
}

// 5. CONTROLES (TECLADO + TÁCTIL)
const keys = {};

// Teclado
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// TÁCTIL (NUEVO CÓDIGO)
const touchKeys = { up: false, down: false, left: false, right: false };

function setupTouch(btnId, direction) {
    const btn = document.getElementById(btnId);
    // Eventos para celular (Touch) y PC (Mouse)
    const start = (e) => { e.preventDefault(); touchKeys[direction] = true; };
    const end = (e) => { e.preventDefault(); touchKeys[direction] = false; };

    btn.addEventListener('touchstart', start);
    btn.addEventListener('touchend', end);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
}

setupTouch('btn-up', 'up');
setupTouch('btn-down', 'down');
setupTouch('btn-left', 'left');
setupTouch('btn-right', 'right');


// INICIO DEL JUEGO
startBtn.addEventListener('click', () => {
    introScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameRunning = true;
    loop();
});

// 6. LÓGICA (UPDATE ACTUALIZADO)
function update() {
    if (!gameRunning) return;

    let nx = player.x; let ny = player.y;
    let moved = false;

    // A. Movimiento (Teclado O Táctil)
    if (keys['ArrowRight'] || keys['d'] || touchKeys.right) { nx += player.speed; moved = true; }
    if (keys['ArrowLeft'] || keys['a'] || touchKeys.left) { nx -= player.speed; moved = true; }
    if (keys['ArrowUp'] || keys['w'] || touchKeys.up) { ny -= player.speed; moved = true; }
    if (keys['ArrowDown'] || keys['s'] || touchKeys.down) { ny += player.speed; moved = true; }

    // Estela
    if (moved && Math.random() > 0.7) trail.push(new MusicalNote(player.x, player.y));
    for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].update();
        if (trail[i].life <= 0) trail.splice(i, 1);
    }

    sawAngle += 0.1;

    // Colisiones
    nx = Math.max(0, Math.min(canvas.width - player.size, nx));
    ny = Math.max(0, Math.min(canvas.height - player.size, ny));
    const wallCollision = walls.some(w => 
        nx < w.x + w.w && nx + player.size > w.x &&
        ny < w.y + w.h && ny + player.size > w.y
    );
    if (!wallCollision) { player.x = nx; player.y = ny; }

    // Guitarra
    if (!keyItem.collected) {
        if (
            player.x < keyItem.x + keyItem.size && player.x + player.size > keyItem.x &&
            player.y < keyItem.y + keyItem.size && player.y + player.size > keyItem.y
        ) {
            keyItem.collected = true; 
        }
    }

    // Sierras
    const hitSaw = saws.some(saw => {
        const dist = Math.hypot(
            (player.x + player.size/2) - (saw.x + saw.size/2),
            (player.y + player.size/2) - (saw.y + saw.size/2)
        );
        return dist < (player.size/2 + saw.size/3); 
    });

    if (hitSaw) {
        player.x = player.startX; 
        player.y = player.startY;
    }

    // Victoria
    if (
        player.x < goal.x + goal.size && player.x + player.size > goal.x &&
        player.y < goal.y + goal.size && player.y + player.size > goal.y
    ) {
        if (keyItem.collected) {
            gameWin();
        }
    }
}

// 7. DIBUJAR
function draw() {
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    trail.forEach(note => note.draw(ctx));

    ctx.fillStyle = "#000000";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

    if (!keyItem.collected) ctx.globalAlpha = 0.3; 
    ctx.drawImage(goalImg, goal.x, goal.y, goal.size, goal.size);
    ctx.globalAlpha = 1.0;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (!keyItem.collected) {
        let floatY = Math.sin(Date.now() / 200) * 5; 
        ctx.font = "50px Arial"; 
        ctx.fillText("🎸", keyItem.x + keyItem.size/2, keyItem.y + keyItem.size/2 + floatY);
    }

    ctx.font = "60px Arial"; 
    saws.forEach(saw => {
        ctx.save();
        ctx.translate(saw.x + saw.size/2, saw.y + saw.size/2); 
        ctx.rotate(sawAngle); 
        ctx.fillText("⚙️", 0, 0); 
        ctx.restore();
    });

    try {
        ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
    } catch (e) {
        ctx.fillStyle = "black";
        ctx.fillRect(player.x, player.y, player.size, player.size);
    }
    
    if (!keyItem.collected && Math.hypot(player.x - goal.x, player.y - goal.y) < 150) {
        ctx.fillStyle = "red";
        ctx.font = "bold 20px Montserrat";
        ctx.fillText("¡FALTA LA GUITARRA! 🎸", goal.x + 35, goal.y - 20);
    }
}

function loop() { if (gameRunning) { update(); draw(); requestAnimationFrame(loop); } }
function gameWin() { gameRunning = false; window.location.href = "invitacion.html"; }